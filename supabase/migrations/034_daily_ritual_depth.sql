-- 034: Daily ritual, serendipity, reactions, capsules, shared prompts, mood, smart-time

-- =========================================================================
-- Streak grace tokens — soft forgiveness for missed days
-- =========================================================================
CREATE TABLE streak_grace_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_for_date DATE, -- null until used
  applied_at TIMESTAMPTZ,
  reason TEXT NOT NULL DEFAULT 'weekly_grace', -- weekly_grace | milestone_bonus | admin_gift
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_grace_user_active ON streak_grace_tokens(user_id) WHERE applied_at IS NULL;
CREATE INDEX idx_grace_user_applied ON streak_grace_tokens(user_id, applied_for_date) WHERE applied_for_date IS NOT NULL;

ALTER TABLE streak_grace_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their grace tokens" ON streak_grace_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- =========================================================================
-- Ritual preferences — per-user config for the pre-question breath/frame
-- =========================================================================
CREATE TABLE ritual_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  ritual_enabled BOOLEAN NOT NULL DEFAULT true,
  ritual_style TEXT NOT NULL DEFAULT 'breath' CHECK (ritual_style IN ('breath', 'quote', 'silence', 'context')),
  ritual_duration_seconds INTEGER NOT NULL DEFAULT 7,
  ambient_sound_enabled BOOLEAN NOT NULL DEFAULT false,
  show_context_line BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ritual_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their ritual prefs" ON ritual_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- Notification schedule — smart-time learning
-- =========================================================================
CREATE TABLE notification_schedules (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_hour_local INTEGER CHECK (preferred_hour_local BETWEEN 0 AND 23), -- user-chosen
  learned_hour_local INTEGER CHECK (learned_hour_local BETWEEN 0 AND 23),      -- from response history
  learned_from_count INTEGER NOT NULL DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  quiet_hours_start INTEGER CHECK (quiet_hours_start BETWEEN 0 AND 23),
  quiet_hours_end INTEGER CHECK (quiet_hours_end BETWEEN 0 AND 23),
  web_push_subscription JSONB, -- stored VAPID push subscription
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage notification schedule" ON notification_schedules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- Response reactions — emoji reactions from friends/group members
-- =========================================================================
CREATE TABLE response_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- single emoji (heart, spark, tear, smile, pray, thought)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(response_id, user_id, emoji)
);

CREATE INDEX idx_reactions_response ON response_reactions(response_id);
CREATE INDEX idx_reactions_user ON response_reactions(user_id);

ALTER TABLE response_reactions ENABLE ROW LEVEL SECURITY;

-- You can react to: your own responses, responses shared with you, or friend's/group entries you can see
CREATE POLICY "Users can react to accessible responses" ON response_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM responses r WHERE r.id = response_id AND r.user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM friendships f
        JOIN responses r ON r.user_id = f.user_a OR r.user_id = f.user_b
        WHERE r.id = response_id AND f.status = 'accepted' AND (f.user_a = auth.uid() OR f.user_b = auth.uid())
      )
    )
  );

CREATE POLICY "Users see reactions on accessible responses" ON response_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      WHERE r.id = response_id
      AND (r.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.status = 'accepted'
        AND ((f.user_a = auth.uid() AND f.user_b = r.user_id)
          OR (f.user_b = auth.uid() AND f.user_a = r.user_id))
      ))
    )
  );

CREATE POLICY "Users delete their own reactions" ON response_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================================
-- Time capsules — entries revealed at future date/event
-- =========================================================================
CREATE TABLE time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audio_url TEXT,
  photo_url TEXT,
  recipient_email TEXT, -- optional — open it to someone else
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  open_on_date DATE, -- fixed date unlock
  open_on_event TEXT, -- description of event ("my grandson's 18th birthday")
  is_opened BOOLEAN NOT NULL DEFAULT false,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_capsules_user ON time_capsules(user_id);
CREATE INDEX idx_capsules_open_date ON time_capsules(open_on_date) WHERE is_opened = false AND open_on_date IS NOT NULL;
CREATE INDEX idx_capsules_recipient ON time_capsules(recipient_user_id) WHERE recipient_user_id IS NOT NULL;

ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own capsules" ON time_capsules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recipients view opened capsules" ON time_capsules
  FOR SELECT USING (
    recipient_user_id = auth.uid() AND is_opened = true
  );

-- =========================================================================
-- Shared group prompts — weekly question all members answer
-- =========================================================================
CREATE TABLE shared_group_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  custom_question_text TEXT, -- admin can write their own
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  active_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (question_id IS NOT NULL OR custom_question_text IS NOT NULL)
);

CREATE INDEX idx_shared_prompts_group ON shared_group_prompts(group_id, active_from DESC);
CREATE INDEX idx_shared_prompts_active_until ON shared_group_prompts(group_id, active_until);

ALTER TABLE shared_group_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members see shared prompts" ON shared_group_prompts
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Group admins create shared prompts" ON shared_group_prompts
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = shared_group_prompts.group_id AND user_id = auth.uid()
      AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- Answers to a shared prompt live as responses with a tag; join table:
CREATE TABLE shared_prompt_responses (
  shared_prompt_id UUID NOT NULL REFERENCES shared_group_prompts(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  PRIMARY KEY(shared_prompt_id, response_id)
);

CREATE INDEX idx_shared_prompt_responses_prompt ON shared_prompt_responses(shared_prompt_id);
CREATE INDEX idx_shared_prompt_responses_response ON shared_prompt_responses(response_id);

ALTER TABLE shared_prompt_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see linked shared-prompt responses" ON shared_prompt_responses
  FOR SELECT USING (
    shared_prompt_id IN (
      SELECT id FROM shared_group_prompts
      WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status = 'active')
    )
  );

CREATE POLICY "Users link their own responses" ON shared_prompt_responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM responses r WHERE r.id = response_id AND r.user_id = auth.uid())
  );

-- =========================================================================
-- Serendipity surfaces — tracks resurfaced entries so we don't spam
-- =========================================================================
CREATE TABLE serendipity_surfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  surface_type TEXT NOT NULL CHECK (surface_type IN ('on_this_day', 'related_to_recent', 'category_dormant', 'anniversary', 'random_spark')),
  surfaced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ -- user wrote a follow-up
);

CREATE INDEX idx_serendipity_user ON serendipity_surfaces(user_id, surfaced_at DESC);
CREATE INDEX idx_serendipity_response ON serendipity_surfaces(response_id);

ALTER TABLE serendipity_surfaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own surfaces" ON serendipity_surfaces
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- Response links — explicit connections between entries
-- =========================================================================
CREATE TABLE response_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  to_response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'related' CHECK (link_type IN ('related', 'continues', 'contradicts', 'echoes')),
  similarity_score REAL, -- cosine similarity if auto-detected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_response_id, to_response_id, link_type)
);

CREATE INDEX idx_response_links_from ON response_links(from_response_id);
CREATE INDEX idx_response_links_to ON response_links(to_response_id);
CREATE INDEX idx_response_links_user ON response_links(user_id);

ALTER TABLE response_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own links" ON response_links
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- Response media — photos/audio attached to an entry (beyond the raw audio)
-- =========================================================================
CREATE TABLE response_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'audio', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_response_media_response ON response_media(response_id);

ALTER TABLE response_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their response media" ON response_media
  FOR ALL USING (
    EXISTS (SELECT 1 FROM responses r WHERE r.id = response_id AND r.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM responses r WHERE r.id = response_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Viewers of a response see its media" ON response_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      WHERE r.id = response_id
      AND (
        r.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
          AND ((f.requester_id = auth.uid() AND f.addressee_id = r.user_id)
            OR (f.addressee_id = auth.uid() AND f.requester_id = r.user_id))
        )
      )
    )
  );

-- =========================================================================
-- Add columns to profiles for theme + learned notification time
-- =========================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'auto' CHECK (theme_preference IN ('light', 'dark', 'auto')),
  ADD COLUMN IF NOT EXISTS mood_baseline TEXT,
  ADD COLUMN IF NOT EXISTS last_ritual_at TIMESTAMPTZ;

-- =========================================================================
-- Weekly grace token grant function — called by a cron-able edge function or client
-- =========================================================================
CREATE OR REPLACE FUNCTION ensure_weekly_grace_token(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  existing_id UUID;
  new_id UUID;
  week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  -- Check if user has an unused token granted this week
  SELECT id INTO existing_id
  FROM streak_grace_tokens
  WHERE user_id = p_user_id
    AND reason = 'weekly_grace'
    AND applied_at IS NULL
    AND granted_at >= week_start
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO streak_grace_tokens (user_id, reason, expires_at)
  VALUES (p_user_id, 'weekly_grace', (week_start + INTERVAL '7 days')::TIMESTAMPTZ)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
