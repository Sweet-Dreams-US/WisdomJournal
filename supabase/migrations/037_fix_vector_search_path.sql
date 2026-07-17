-- 037: Fix semantic search — pgvector operators were unreachable
--
-- search_accessible_responses had `SET search_path = public, pg_temp`
-- (a security-lint remediation), but pgvector's `<=>` operator lives in
-- the `extensions` schema on Supabase. Every call failed with
--   operator does not exist: extensions.vector <=> extensions.vector
-- and Ask quietly fell back to non-semantic retrieval. Adding
-- `extensions` to the search_path restores true vector search while
-- keeping the path pinned (still safe for SECURITY DEFINER).

ALTER FUNCTION public.search_accessible_responses(
  uuid, uuid, vector, double precision, integer
) SET search_path = public, extensions, pg_temp;
