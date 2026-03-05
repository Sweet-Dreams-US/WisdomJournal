-- 020: Trigger functions for automated updates

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at to all tables that have the column
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'questions', 'responses', 'groups', 'group_members',
      'group_category_access', 'group_access_summary', 'daily_question_sets',
      'legacy_contacts', 'notification_preferences', 'voice_style_profiles',
      'user_streaks', 'user_category_stats'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- Auto-compute word_count on response insert/update
CREATE OR REPLACE FUNCTION compute_word_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.response_text IS NOT NULL THEN
    NEW.word_count = array_length(string_to_array(trim(NEW.response_text), ' '), 1);
  ELSE
    NEW.word_count = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_response_word_count
  BEFORE INSERT OR UPDATE OF response_text ON responses
  FOR EACH ROW
  EXECUTE FUNCTION compute_word_count();

-- Update streak stats when a response is inserted
CREATE OR REPLACE FUNCTION update_streak_on_response()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
  streak_rec RECORD;
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_rec FROM user_streaks WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_response_date, streak_started_at)
    VALUES (NEW.user_id, 1, 1, today, today);
  ELSE
    IF streak_rec.last_response_date = today THEN
      -- Already responded today, no change
      NULL;
    ELSIF streak_rec.last_response_date = today - 1 THEN
      -- Consecutive day: extend streak
      UPDATE user_streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_response_date = today
      WHERE user_id = NEW.user_id;
    ELSE
      -- Streak broken: archive old streak if > 1, start new one
      IF streak_rec.current_streak > 1 AND streak_rec.streak_started_at IS NOT NULL THEN
        INSERT INTO streak_history (user_id, streak_length, started_at, ended_at)
        VALUES (NEW.user_id, streak_rec.current_streak, streak_rec.streak_started_at, streak_rec.last_response_date);
      END IF;

      UPDATE user_streaks
      SET current_streak = 1,
          last_response_date = today,
          streak_started_at = today
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  -- Update denormalized counts on profiles
  UPDATE profiles
  SET current_streak = (SELECT current_streak FROM user_streaks WHERE user_id = NEW.user_id),
      longest_streak = (SELECT longest_streak FROM user_streaks WHERE user_id = NEW.user_id),
      total_responses = total_responses + 1,
      total_word_count = total_word_count + COALESCE(NEW.word_count, 0)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_response_insert_update_streak
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_response();

-- Update category stats when a response_category is inserted
CREATE OR REPLACE FUNCTION update_category_stats()
RETURNS TRIGGER AS $$
DECLARE
  resp RECORD;
BEGIN
  SELECT user_id, word_count, created_at INTO resp FROM responses WHERE id = NEW.response_id;

  INSERT INTO user_category_stats (user_id, category_id, response_count, word_count, last_response_at)
  VALUES (resp.user_id, NEW.category_id, 1, COALESCE(resp.word_count, 0), resp.created_at)
  ON CONFLICT (user_id, category_id)
  DO UPDATE SET
    response_count = user_category_stats.response_count + 1,
    word_count = user_category_stats.word_count + COALESCE(resp.word_count, 0),
    last_response_at = GREATEST(user_category_stats.last_response_at, resp.created_at);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_response_category_insert_update_stats
  AFTER INSERT ON response_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_stats();

-- Update group member_count on membership changes
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
DECLARE
  target_group_id UUID;
BEGIN
  target_group_id := COALESCE(NEW.group_id, OLD.group_id);

  UPDATE groups
  SET member_count = (
    SELECT count(*) FROM group_members
    WHERE group_id = target_group_id AND status = 'active'
  )
  WHERE id = target_group_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_member_change
  AFTER INSERT OR UPDATE OF status OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Initialize category access rows when a user joins a group
CREATE OR REPLACE FUNCTION init_category_access_on_join()
RETURNS TRIGGER AS $$
DECLARE
  default_access BOOLEAN;
BEGIN
  -- Only fire when status changes to 'active'
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    SELECT default_category_access INTO default_access FROM groups WHERE id = NEW.group_id;

    INSERT INTO group_category_access (group_member_id, category_id, is_enabled)
    SELECT NEW.id, c.id, COALESCE(default_access, true)
    FROM categories c
    ON CONFLICT (group_member_id, category_id) DO NOTHING;

    -- Initialize access summary
    INSERT INTO group_access_summary (group_member_id, enabled_count, total_count, access_percentage, trust_color)
    SELECT
      NEW.id,
      count(*) FILTER (WHERE COALESCE(default_access, true)),
      count(*),
      CASE WHEN count(*) > 0
        THEN (count(*) FILTER (WHERE COALESCE(default_access, true)))::numeric / count(*) * 100
        ELSE 0
      END,
      CASE
        WHEN COALESCE(default_access, true) THEN 'green'
        ELSE 'red'
      END
    FROM categories
    ON CONFLICT (group_member_id) DO NOTHING;

    -- Set joined_at
    NEW.joined_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_member_activated
  BEFORE INSERT OR UPDATE OF status ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION init_category_access_on_join();

-- Recompute trust color when category access toggles change
CREATE OR REPLACE FUNCTION recompute_trust_color()
RETURNS TRIGGER AS $$
DECLARE
  enabled INTEGER;
  total INTEGER;
  pct NUMERIC(5,2);
  color trust_color;
BEGIN
  SELECT
    count(*) FILTER (WHERE is_enabled),
    count(*)
  INTO enabled, total
  FROM group_category_access
  WHERE group_member_id = NEW.group_member_id;

  pct := CASE WHEN total > 0 THEN (enabled::numeric / total * 100) ELSE 0 END;
  color := CASE
    WHEN pct >= 70 THEN 'green'
    WHEN pct >= 30 THEN 'yellow'
    ELSE 'red'
  END;

  INSERT INTO group_access_summary (group_member_id, enabled_count, total_count, access_percentage, trust_color)
  VALUES (NEW.group_member_id, enabled, total, pct, color)
  ON CONFLICT (group_member_id)
  DO UPDATE SET
    enabled_count = EXCLUDED.enabled_count,
    total_count = EXCLUDED.total_count,
    access_percentage = EXCLUDED.access_percentage,
    trust_color = EXCLUDED.trust_color;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_category_access_change
  AFTER INSERT OR UPDATE OF is_enabled ON group_category_access
  FOR EACH ROW
  EXECUTE FUNCTION recompute_trust_color();
