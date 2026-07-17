-- 039: Achievement awarding engine
--
-- The achievements catalog was seeded (013/023) and the UI now displays
-- it, but NOTHING ever inserted into user_achievements — badges were
-- unearnable. This migration adds the awarding logic:
--   * check_and_award_achievements(user): streak / milestone / category /
--     first_voice, fired after every response insert
--   * award_special_achievement(user, slug): one-shot specials, fired by
--     triggers on group_members, legacy_contacts, and wisdom_queries
--   * every award also emits an 'achievement_earned' activity event
--   * backfill for existing users
--
-- Trigger name starts with zzz_ so it fires after the streak/total
-- counters update (Postgres fires same-event triggers alphabetically).

CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_best_streak INTEGER;
  v_total INTEGER;
  v_categories INTEGER;
  v_has_voice BOOLEAN;
BEGIN
  SELECT GREATEST(COALESCE(current_streak, 0), COALESCE(longest_streak, 0)),
         COALESCE(total_responses, 0)
    INTO v_best_streak, v_total
  FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT rc.category_id) INTO v_categories
  FROM responses r
  JOIN response_categories rc ON rc.response_id = r.id
  WHERE r.user_id = p_user_id AND r.deleted_at IS NULL;

  SELECT EXISTS (
    SELECT 1 FROM responses
    WHERE user_id = p_user_id AND input_method = 'voice' AND deleted_at IS NULL
  ) INTO v_has_voice;

  WITH earned AS (
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, a.id
    FROM achievements a
    WHERE (
         (a.achievement_type = 'streak'    AND v_best_streak >= a.requirement_value)
      OR (a.achievement_type = 'milestone' AND v_total       >= a.requirement_value)
      OR (a.achievement_type = 'category'  AND v_categories  >= a.requirement_value)
      OR (a.achievement_type = 'special'   AND a.slug = 'first_voice' AND v_has_voice)
    )
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING achievement_id
  )
  INSERT INTO activity_events (user_id, event_type, event_data, group_id)
  SELECT p_user_id, 'achievement_earned',
         jsonb_build_object('achievement_id', a.id, 'slug', a.slug, 'name', a.name, 'icon', a.icon),
         NULL
  FROM earned e
  JOIN achievements a ON a.id = e.achievement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_special_achievement(p_user_id UUID, p_slug TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH earned AS (
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT p_user_id, a.id
    FROM achievements a
    WHERE a.slug = p_slug
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING achievement_id
  )
  INSERT INTO activity_events (user_id, event_type, event_data, group_id)
  SELECT p_user_id, 'achievement_earned',
         jsonb_build_object('achievement_id', a.id, 'slug', a.slug, 'name', a.name, 'icon', a.icon),
         NULL
  FROM earned e
  JOIN achievements a ON a.id = e.achievement_id;
END;
$$;

-- Fire after every response save (zzz_ so counters update first)
CREATE OR REPLACE FUNCTION public.trg_award_on_response()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM check_and_award_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzz_on_response_award_achievements ON responses;
CREATE TRIGGER zzz_on_response_award_achievements
  AFTER INSERT ON responses
  FOR EACH ROW EXECUTE FUNCTION trg_award_on_response();

-- Joining/creating a group
CREATE OR REPLACE FUNCTION public.trg_award_first_group()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM award_special_achievement(NEW.user_id, 'first_group');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_member_award ON group_members;
CREATE TRIGGER on_group_member_award
  AFTER INSERT ON group_members
  FOR EACH ROW EXECUTE FUNCTION trg_award_first_group();

-- Setting up a legacy contact
CREATE OR REPLACE FUNCTION public.trg_award_legacy_setup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM award_special_achievement(NEW.user_id, 'legacy_setup');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_legacy_contact_award ON legacy_contacts;
CREATE TRIGGER on_legacy_contact_award
  AFTER INSERT ON legacy_contacts
  FOR EACH ROW EXECUTE FUNCTION trg_award_legacy_setup();

-- Someone else queried your wisdom
CREATE OR REPLACE FUNCTION public.trg_award_first_query()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.target_user_id IS NOT NULL AND NEW.querier_id IS DISTINCT FROM NEW.target_user_id THEN
    PERFORM award_special_achievement(NEW.target_user_id, 'first_query');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wisdom_query_award ON wisdom_queries;
CREATE TRIGGER on_wisdom_query_award
  AFTER INSERT ON wisdom_queries
  FOR EACH ROW EXECUTE FUNCTION trg_award_first_query();

-- ============================================================
-- Backfill for existing users
-- ============================================================

SELECT check_and_award_achievements(id) FROM profiles;

SELECT award_special_achievement(gm.user_id, 'first_group')
FROM (SELECT DISTINCT user_id FROM group_members) gm;

SELECT award_special_achievement(lc.user_id, 'legacy_setup')
FROM (SELECT DISTINCT user_id FROM legacy_contacts) lc;

SELECT award_special_achievement(wq.target_user_id, 'first_query')
FROM (
  SELECT DISTINCT target_user_id FROM wisdom_queries
  WHERE target_user_id IS NOT NULL AND querier_id IS DISTINCT FROM target_user_id
) wq;
