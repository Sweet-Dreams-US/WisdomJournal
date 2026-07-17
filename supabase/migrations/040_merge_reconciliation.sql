-- 040: Reconcile the two parallel development branches
--
-- Two lines of work merged: this machine's session (migrations
-- 034_fix_group_rls_recursion .. 039_achievement_awarding, applied via
-- MCP) and a remote branch (034_feedback_error_logging /
-- 035_seed_achievements / 036_insights_cache, applied manually via the
-- dashboard — hence the duplicate migration numbers in this directory).
--
-- After the code merge, the app uses the REMOTE feedback implementation
-- (type/title/description schema, statuses new..wont_fix), so the
-- feedback table created by 036_feedback.sql is replaced here. The
-- error_logs / api_request_logs tables and insights-cache columns from
-- the remote migrations already exist in the live DB.

-- ============================================================
-- 1) Feedback -> remote schema (table was empty except one test row)
-- ============================================================

DROP TABLE IF EXISTS feedback;

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'crash')),
  title TEXT NOT NULL,
  description TEXT,
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'wont_fix')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- (Admin routes use the service role; no admin RLS policies needed.)

-- ============================================================
-- 2) Achievement catalog dedupe
--    first_response duplicated responses_1 ('First Words', 1 response);
--    categories_5 duplicated cat_5 ('Well-Rounded', 5 categories).
-- ============================================================

DELETE FROM user_achievements
WHERE achievement_id IN (
  SELECT id FROM achievements WHERE slug IN ('first_response', 'categories_5')
);

DELETE FROM achievements WHERE slug IN ('first_response', 'categories_5');

-- ============================================================
-- 3) Awarding for the surviving new specials
--    streak_100 is streak-typed and already covered by
--    check_and_award_achievements(). first_friend and first_share need
--    event triggers.
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_award_first_friend()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM award_special_achievement(NEW.user_a, 'first_friend');
  PERFORM award_special_achievement(NEW.user_b, 'first_friend');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_friendship_accept_award ON friendships;
CREATE TRIGGER on_friendship_accept_award
  AFTER UPDATE ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted')
  EXECUTE FUNCTION trg_award_first_friend();

CREATE OR REPLACE FUNCTION public.trg_award_first_share()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM award_special_achievement(NEW.shared_by, 'first_share');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_response_share_award ON response_shares;
CREATE TRIGGER on_response_share_award
  AFTER INSERT ON response_shares
  FOR EACH ROW EXECUTE FUNCTION trg_award_first_share();

-- Backfill the two specials for existing data
SELECT award_special_achievement(u, 'first_friend')
FROM (
  SELECT user_a AS u FROM friendships WHERE status = 'accepted'
  UNION
  SELECT user_b FROM friendships WHERE status = 'accepted'
) x;

SELECT award_special_achievement(s.shared_by, 'first_share')
FROM (SELECT DISTINCT shared_by FROM response_shares) s;
