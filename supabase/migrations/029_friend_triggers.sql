-- 029: Friend triggers — init category access on acceptance, recompute trust color

-- Add friend-related notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'friend_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'friend_accepted';

-- Initialize friend_category_access rows when a friendship is accepted
CREATE OR REPLACE FUNCTION init_friend_category_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD IS NULL OR OLD.status != 'accepted') THEN
    -- Create category access rows for BOTH users (all categories, all OFF — privacy-first)
    INSERT INTO friend_category_access (friendship_id, user_id, category_id, is_enabled)
    SELECT NEW.id, NEW.user_a, c.id, false
    FROM categories c
    ON CONFLICT (friendship_id, user_id, category_id) DO NOTHING;

    INSERT INTO friend_category_access (friendship_id, user_id, category_id, is_enabled)
    SELECT NEW.id, NEW.user_b, c.id, false
    FROM categories c
    ON CONFLICT (friendship_id, user_id, category_id) DO NOTHING;

    -- Initialize access summaries for both users (all red — nothing shared)
    INSERT INTO friend_access_summary (friendship_id, user_id, enabled_count, total_count, access_percentage, trust_color)
    SELECT NEW.id, u.uid, 0, (SELECT count(*) FROM categories), 0, 'red'
    FROM (VALUES (NEW.user_a), (NEW.user_b)) AS u(uid)
    ON CONFLICT (friendship_id, user_id) DO NOTHING;

    -- Set responded_at
    NEW.responded_at = now();

    -- Create notification for the requester that their request was accepted
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.requested_by,
      'friend_accepted',
      'Friend request accepted',
      (SELECT full_name FROM profiles WHERE id = CASE WHEN NEW.requested_by = NEW.user_a THEN NEW.user_b ELSE NEW.user_a END) || ' accepted your friend request',
      jsonb_build_object('friendship_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friendship_accepted
  BEFORE UPDATE OF status ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION init_friend_category_access();

-- Recompute friend trust color when category access toggles change
CREATE OR REPLACE FUNCTION recompute_friend_trust_color()
RETURNS TRIGGER AS $$
DECLARE
  v_enabled INTEGER;
  v_total INTEGER;
  v_pct NUMERIC(5,2);
  v_color trust_color;
BEGIN
  SELECT
    count(*) FILTER (WHERE is_enabled),
    count(*)
  INTO v_enabled, v_total
  FROM friend_category_access
  WHERE friendship_id = NEW.friendship_id AND user_id = NEW.user_id;

  v_pct := CASE WHEN v_total > 0 THEN (v_enabled::numeric / v_total * 100) ELSE 0 END;
  v_color := CASE
    WHEN v_pct >= 70 THEN 'green'
    WHEN v_pct >= 30 THEN 'yellow'
    ELSE 'red'
  END;

  INSERT INTO friend_access_summary (friendship_id, user_id, enabled_count, total_count, access_percentage, trust_color)
  VALUES (NEW.friendship_id, NEW.user_id, v_enabled, v_total, v_pct, v_color)
  ON CONFLICT (friendship_id, user_id)
  DO UPDATE SET
    enabled_count = EXCLUDED.enabled_count,
    total_count = EXCLUDED.total_count,
    access_percentage = EXCLUDED.access_percentage,
    trust_color = EXCLUDED.trust_color;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friend_category_access_change
  AFTER INSERT OR UPDATE OF is_enabled ON friend_category_access
  FOR EACH ROW
  EXECUTE FUNCTION recompute_friend_trust_color();

-- Create notification when a friend request is sent
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
DECLARE
  target_user UUID;
  requester_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    -- Determine who the request is for (the non-requester)
    target_user := CASE WHEN NEW.requested_by = NEW.user_a THEN NEW.user_b ELSE NEW.user_a END;

    SELECT full_name INTO requester_name FROM profiles WHERE id = NEW.requested_by;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      target_user,
      'friend_request',
      'New friend request',
      COALESCE(requester_name, 'Someone') || ' wants to be your friend',
      jsonb_build_object('friendship_id', NEW.id, 'requested_by', NEW.requested_by, 'message', NEW.message)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();
