-- 036: Lock search_path on pre-existing SECURITY DEFINER and trigger functions.
-- Clears 10 Supabase linter warnings under 'function_search_path_mutable'.
-- Functions run as their owner; leaving search_path mutable lets a caller
-- with CREATE on a schema shadow built-in objects. Pinning to 'public, pg_temp'
-- closes that vector without changing behavior.

ALTER FUNCTION public.create_activity_on_response()                                                                             SET search_path = public, pg_temp;
ALTER FUNCTION public.get_encyclopedia_stats(p_user_id uuid)                                                                    SET search_path = public, pg_temp;
ALTER FUNCTION public.get_friend_shared_responses_fallback(p_querier_id uuid, p_target_user_id uuid, p_limit integer)           SET search_path = public, pg_temp;
ALTER FUNCTION public.get_users_needing_daily_reminder()                                                                        SET search_path = public, pg_temp;
ALTER FUNCTION public.get_users_with_streak_at_risk()                                                                           SET search_path = public, pg_temp;
ALTER FUNCTION public.init_friend_category_access()                                                                             SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_friend_request()                                                                                   SET search_path = public, pg_temp;
ALTER FUNCTION public.recompute_friend_trust_color()                                                                            SET search_path = public, pg_temp;
ALTER FUNCTION public.search_accessible_responses(p_querier_id uuid, p_target_user_id uuid, p_query_embedding vector, p_match_threshold double precision, p_match_count integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at()                                                                                          SET search_path = public, pg_temp;
