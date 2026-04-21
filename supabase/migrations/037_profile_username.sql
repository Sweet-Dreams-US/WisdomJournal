-- 037: Add a public, searchable username to profiles.
--
-- Constraints:
--   - Lowercase only (enforced by CHECK), 3-32 chars, [a-z0-9_]
--   - Unique across all profiles (case-insensitive via LOWER index)
--   - Nullable so existing users aren't broken; we'll backfill below

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Normalize on insert/update: lowercase + trim
CREATE OR REPLACE FUNCTION normalize_profile_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username := LOWER(TRIM(NEW.username));
    IF NEW.username = '' THEN
      NEW.username := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_profile_username_normalize ON profiles;
CREATE TRIGGER on_profile_username_normalize
  BEFORE INSERT OR UPDATE OF username ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION normalize_profile_username();

-- Character-class / length constraint (enforced at DB level)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (
    username IS NULL
    OR (username ~ '^[a-z0-9_]{3,32}$')
  );

-- Unique index (case-insensitive because we normalize to lowercase)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key
  ON profiles (username)
  WHERE username IS NOT NULL;

-- Backfill existing rows from email local-part, deduping as needed
DO $backfill$
DECLARE
  r RECORD;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR r IN SELECT id, email FROM profiles WHERE username IS NULL LOOP
    candidate := LOWER(REGEXP_REPLACE(SPLIT_PART(r.email, '@', 1), '[^a-z0-9_]', '_', 'g'));
    candidate := SUBSTRING(candidate FROM 1 FOR 24);
    IF LENGTH(candidate) < 3 THEN
      candidate := candidate || '_user';
    END IF;

    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = CASE WHEN suffix = 0 THEN candidate ELSE candidate || suffix::TEXT END) LOOP
      suffix := suffix + 1;
    END LOOP;

    UPDATE profiles
    SET username = CASE WHEN suffix = 0 THEN candidate ELSE candidate || suffix::TEXT END
    WHERE id = r.id;
  END LOOP;
END;
$backfill$;
