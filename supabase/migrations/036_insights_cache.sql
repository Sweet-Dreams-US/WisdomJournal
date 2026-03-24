-- 036: Add insights cache columns to user_category_stats
-- Caches AI-generated insights per category to avoid regenerating every time.

ALTER TABLE user_category_stats
  ADD COLUMN IF NOT EXISTS ai_insights_json JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_insights_generated_at TIMESTAMPTZ DEFAULT NULL;
