-- 041: profiles.last_response_at
--
-- The admin Command Center selects this column (useful "last active"
-- signal) but it never existed — the select would 500. Add it, backfill,
-- and keep it fresh on every response insert.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ;

UPDATE profiles p
SET last_response_at = r.latest
FROM (
  SELECT user_id, MAX(created_at) AS latest
  FROM responses
  WHERE deleted_at IS NULL
  GROUP BY user_id
) r
WHERE r.user_id = p.id;

CREATE OR REPLACE FUNCTION public.trg_touch_last_response_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET last_response_at = NEW.created_at WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_response_touch_last_at ON responses;
CREATE TRIGGER on_response_touch_last_at
  AFTER INSERT ON responses
  FOR EACH ROW EXECUTE FUNCTION trg_touch_last_response_at();
