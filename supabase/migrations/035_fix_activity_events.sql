-- 035: Make the activity feed work for everyone
--
-- Problems fixed:
-- 1) The old trigger fired AFTER INSERT ON responses, but response_categories
--    rows are inserted in a separate request right after — so category_slug/
--    category_name in event_data were always NULL.
-- 2) Events were only created per active group membership. Users with no
--    groups (the common case for new users) generated NO events at all, so
--    the personal/friends Activity feed stayed empty forever.
-- 3) Nothing ever wrote 'friend_added' events even though the feed and the
--    event_type CHECK support them.

-- ============================================================
-- 1+2) Response events: fire on the primary category link, and always
--      write one personal event (group_id NULL) plus one per active group.
-- ============================================================

DROP TRIGGER IF EXISTS on_response_create_activity ON responses;
DROP FUNCTION IF EXISTS create_activity_on_response();

CREATE OR REPLACE FUNCTION create_activity_on_primary_category()
RETURNS TRIGGER AS $$
DECLARE
  resp RECORD;
  cat RECORD;
  payload JSONB;
BEGIN
  SELECT id, user_id, word_count INTO resp
  FROM responses WHERE id = NEW.response_id;

  IF resp.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT slug, name INTO cat FROM categories WHERE id = NEW.category_id;

  payload := jsonb_build_object(
    'response_id', resp.id,
    'word_count', resp.word_count,
    'category_slug', cat.slug,
    'category_name', cat.name
  );

  -- Personal event: powers the personal + friends feed
  INSERT INTO activity_events (user_id, event_type, event_data, group_id)
  VALUES (resp.user_id, 'response_created', payload, NULL);

  -- Group events: power each group's feed
  INSERT INTO activity_events (user_id, event_type, event_data, group_id)
  SELECT resp.user_id, 'response_created', payload, gm.group_id
  FROM group_members gm
  WHERE gm.user_id = resp.user_id AND gm.status = 'active';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_primary_category_create_activity
  AFTER INSERT ON response_categories
  FOR EACH ROW
  WHEN (NEW.source = 'primary')
  EXECUTE FUNCTION create_activity_on_primary_category();

-- ============================================================
-- 3) Friend accepted -> one event per side
-- ============================================================

CREATE OR REPLACE FUNCTION create_activity_on_friend_accept()
RETURNS TRIGGER AS $$
DECLARE
  name_a TEXT;
  name_b TEXT;
BEGIN
  SELECT full_name INTO name_a FROM profiles WHERE id = NEW.user_a;
  SELECT full_name INTO name_b FROM profiles WHERE id = NEW.user_b;

  INSERT INTO activity_events (user_id, event_type, event_data, group_id)
  VALUES
    (NEW.user_a, 'friend_added',
     jsonb_build_object('friend_id', NEW.user_b, 'friend_name', name_b), NULL),
    (NEW.user_b, 'friend_added',
     jsonb_build_object('friend_id', NEW.user_a, 'friend_name', name_a), NULL);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friendship_accept_activity ON friendships;
CREATE TRIGGER on_friendship_accept_activity
  AFTER UPDATE ON friendships
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted')
  EXECUTE FUNCTION create_activity_on_friend_accept();

-- ============================================================
-- Backfill: personal events for existing responses that lack one
-- ============================================================

INSERT INTO activity_events (user_id, event_type, event_data, group_id, created_at)
SELECT
  r.user_id,
  'response_created',
  jsonb_build_object(
    'response_id', r.id,
    'word_count', r.word_count,
    'category_slug', c.slug,
    'category_name', c.name
  ),
  NULL,
  r.created_at
FROM responses r
LEFT JOIN response_categories rc
  ON rc.response_id = r.id AND rc.source = 'primary'
LEFT JOIN categories c ON c.id = rc.category_id
WHERE r.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM activity_events ae
    WHERE ae.event_type = 'response_created'
      AND ae.group_id IS NULL
      AND ae.event_data->>'response_id' = r.id::text
  );
