-- 034: Fix infinite recursion in group RLS policies
--
-- Root cause: the SELECT/UPDATE/INSERT policies on group_members subquery
-- group_members itself, which re-invokes the same policy -> infinite
-- recursion. Every other policy that subqueries group_members (profiles,
-- groups, activity_events, group_category_access, group_access_summary,
-- shared_group_prompts, shared_prompt_responses) inherits the failure,
-- which is why even a simple `SELECT * FROM profiles WHERE id = auth.uid()`
-- returned 500 for authenticated users.
--
-- Fix mirrors migration 030's friend-RLS fix: SECURITY DEFINER helper
-- functions read group_members without invoking RLS, breaking the cycle.
-- Each recreated policy preserves the original predicate semantics exactly.

-- ============================================================
-- Helper functions (SECURITY DEFINER bypasses RLS inside policies)
-- ============================================================

-- Groups where the current user is an invited or active member
CREATE OR REPLACE FUNCTION public.my_group_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM group_members
  WHERE user_id = auth.uid()
    AND status IN ('invited'::group_member_status, 'active'::group_member_status);
$$;

-- Groups where the current user is an active member
CREATE OR REPLACE FUNCTION public.my_active_group_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM group_members
  WHERE user_id = auth.uid()
    AND status = 'active'::group_member_status;
$$;

-- Groups where the current user is an active owner or admin
CREATE OR REPLACE FUNCTION public.my_admin_group_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM group_members
  WHERE user_id = auth.uid()
    AND role IN ('owner'::group_role, 'admin'::group_role)
    AND status = 'active'::group_member_status;
$$;

-- Groups where the current user is an active owner
CREATE OR REPLACE FUNCTION public.my_owned_group_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM group_members
  WHERE user_id = auth.uid()
    AND role = 'owner'::group_role
    AND status = 'active'::group_member_status;
$$;

-- The current user's own group_members row ids (any status)
CREATE OR REPLACE FUNCTION public.my_member_row_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM group_members WHERE user_id = auth.uid();
$$;

-- User ids of ACTIVE members that share an ACTIVE group with the current user
CREATE OR REPLACE FUNCTION public.fellow_active_member_user_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm2.user_id
  FROM group_members gm1
  JOIN group_members gm2 ON gm1.group_id = gm2.group_id
  WHERE gm1.user_id = auth.uid()
    AND gm1.status = 'active'::group_member_status
    AND gm2.status = 'active'::group_member_status;
$$;

-- group_members row ids (any status) in groups where the current user is active
CREATE OR REPLACE FUNCTION public.member_row_ids_in_my_active_groups()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.id FROM group_members gm
  WHERE gm.group_id IN (SELECT public.my_active_group_ids());
$$;

-- group_members row ids (any status) in groups the current user owns
CREATE OR REPLACE FUNCTION public.member_row_ids_in_my_owned_groups()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.id FROM group_members gm
  WHERE gm.group_id IN (SELECT public.my_owned_group_ids());
$$;

-- ============================================================
-- group_members (the recursive core)
-- ============================================================

DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (group_id IN (SELECT public.my_group_ids()));

DROP POLICY IF EXISTS "Group owners/admins can manage members" ON group_members;
CREATE POLICY "Group owners/admins can manage members"
  ON group_members FOR INSERT
  WITH CHECK (group_id IN (SELECT public.my_admin_group_ids()));

DROP POLICY IF EXISTS "Group owners/admins can update members" ON group_members;
CREATE POLICY "Group owners/admins can update members"
  ON group_members FOR UPDATE
  USING (
    group_id IN (SELECT public.my_admin_group_ids())
    OR user_id = auth.uid()
  );

-- ============================================================
-- groups
-- ============================================================

DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
CREATE POLICY "Users can view groups they belong to"
  ON groups FOR SELECT
  USING (id IN (SELECT public.my_group_ids()));

DROP POLICY IF EXISTS "Group owners and admins can update their group" ON groups;
CREATE POLICY "Group owners and admins can update their group"
  ON groups FOR UPDATE
  USING (id IN (SELECT public.my_admin_group_ids()));

-- ============================================================
-- profiles
-- ============================================================

DROP POLICY IF EXISTS "Users can view profiles of fellow group members" ON profiles;
CREATE POLICY "Users can view profiles of fellow group members"
  ON profiles FOR SELECT
  USING (id IN (SELECT public.fellow_active_member_user_ids()));

-- ============================================================
-- activity_events
-- ============================================================

DROP POLICY IF EXISTS "Users can view group activity" ON activity_events;
CREATE POLICY "Users can view group activity"
  ON activity_events FOR SELECT
  USING (
    group_id IN (SELECT public.my_active_group_ids())
    OR user_id = auth.uid()
  );

-- ============================================================
-- group_access_summary
-- ============================================================

DROP POLICY IF EXISTS "Users can view access summaries for their groups" ON group_access_summary;
CREATE POLICY "Users can view access summaries for their groups"
  ON group_access_summary FOR SELECT
  USING (group_member_id IN (SELECT public.member_row_ids_in_my_active_groups()));

-- ============================================================
-- group_category_access
-- ============================================================

DROP POLICY IF EXISTS "Group owners can view member access" ON group_category_access;
CREATE POLICY "Group owners can view member access"
  ON group_category_access FOR SELECT
  USING (group_member_id IN (SELECT public.member_row_ids_in_my_owned_groups()));

DROP POLICY IF EXISTS "Users can view their own category access" ON group_category_access;
CREATE POLICY "Users can view their own category access"
  ON group_category_access FOR SELECT
  USING (group_member_id IN (SELECT public.my_member_row_ids()));

DROP POLICY IF EXISTS "Users can toggle their own category access" ON group_category_access;
CREATE POLICY "Users can toggle their own category access"
  ON group_category_access FOR UPDATE
  USING (group_member_id IN (SELECT public.my_member_row_ids()))
  WITH CHECK (group_member_id IN (SELECT public.my_member_row_ids()));

-- ============================================================
-- shared_group_prompts
-- ============================================================

DROP POLICY IF EXISTS "Group members see shared prompts" ON shared_group_prompts;
CREATE POLICY "Group members see shared prompts"
  ON shared_group_prompts FOR SELECT
  USING (group_id IN (SELECT public.my_active_group_ids()));

DROP POLICY IF EXISTS "Group admins create shared prompts" ON shared_group_prompts;
CREATE POLICY "Group admins create shared prompts"
  ON shared_group_prompts FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND group_id IN (SELECT public.my_admin_group_ids())
  );

-- ============================================================
-- shared_prompt_responses
-- ============================================================

DROP POLICY IF EXISTS "Members see linked shared-prompt responses" ON shared_prompt_responses;
CREATE POLICY "Members see linked shared-prompt responses"
  ON shared_prompt_responses FOR SELECT
  USING (
    shared_prompt_id IN (
      SELECT id FROM shared_group_prompts
      WHERE group_id IN (SELECT public.my_active_group_ids())
    )
  );
