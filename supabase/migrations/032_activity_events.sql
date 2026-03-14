-- 032: Activity events for group feeds

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('response_created', 'streak_milestone', 'achievement_earned', 'joined_group', 'friend_added')),
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_events_user ON activity_events(user_id, created_at DESC);
CREATE INDEX idx_activity_events_group ON activity_events(group_id, created_at DESC) WHERE group_id IS NOT NULL;
CREATE INDEX idx_activity_events_type ON activity_events(event_type);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Users can view activity in their own groups
CREATE POLICY "Users can view group activity"
  ON activity_events FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR user_id = auth.uid()
  );

-- Trigger: create activity event when a response is created
CREATE OR REPLACE FUNCTION create_activity_on_response()
RETURNS TRIGGER AS $$
DECLARE
  cat_slug TEXT;
  cat_name TEXT;
BEGIN
  -- Get primary category
  SELECT c.slug, c.name INTO cat_slug, cat_name
  FROM response_categories rc
  JOIN categories c ON rc.category_id = c.id
  WHERE rc.response_id = NEW.id AND rc.source = 'primary'
  LIMIT 1;

  -- Create event for each group the user is in
  INSERT INTO activity_events (user_id, event_type, event_data, group_id)
  SELECT
    NEW.user_id,
    'response_created',
    jsonb_build_object(
      'response_id', NEW.id,
      'word_count', NEW.word_count,
      'category_slug', cat_slug,
      'category_name', cat_name
    ),
    gm.group_id
  FROM group_members gm
  WHERE gm.user_id = NEW.user_id AND gm.status = 'active';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use AFTER INSERT trigger (response_categories may not exist yet at INSERT time,
-- so we need to handle this carefully)
CREATE TRIGGER on_response_create_activity
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_on_response();
