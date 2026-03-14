-- 030: RLS policies for friendship tables + friend access to responses

-- ===================
-- FRIENDSHIPS
-- ===================
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() IN (user_a, user_b));

CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can respond to friend requests"
  ON friendships FOR UPDATE
  USING (auth.uid() IN (user_a, user_b));

CREATE POLICY "Users can unfriend"
  ON friendships FOR DELETE
  USING (auth.uid() IN (user_a, user_b));

-- ===================
-- FRIEND_CATEGORY_ACCESS
-- ===================
ALTER TABLE friend_category_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own sharing settings
CREATE POLICY "Users can view own friend category access"
  ON friend_category_access FOR SELECT
  USING (user_id = auth.uid());

-- Users can see what a friend shares with them (both sides of the friendship)
CREATE POLICY "Users can view friend shared categories"
  ON friend_category_access FOR SELECT
  USING (
    friendship_id IN (
      SELECT id FROM friendships
      WHERE auth.uid() IN (user_a, user_b) AND status = 'accepted'
    )
  );

-- Users can only toggle their OWN sharing (not their friend's)
CREATE POLICY "Users can toggle own friend category access"
  ON friend_category_access FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===================
-- FRIEND_ACCESS_SUMMARY
-- ===================
ALTER TABLE friend_access_summary ENABLE ROW LEVEL SECURITY;

-- Both parties can see each other's access summaries
CREATE POLICY "Users can view friend access summaries"
  ON friend_access_summary FOR SELECT
  USING (
    friendship_id IN (
      SELECT id FROM friendships
      WHERE auth.uid() IN (user_a, user_b) AND status = 'accepted'
    )
  );

-- ===================
-- EXTEND PROFILES: friends can view each other's profiles
-- ===================
CREATE POLICY "Users can view profiles of friends"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT CASE WHEN user_a = auth.uid() THEN user_b ELSE user_a END
      FROM friendships
      WHERE auth.uid() IN (user_a, user_b) AND status = 'accepted'
    )
  );

-- Allow searching discoverable profiles (for friend search)
CREATE POLICY "Users can search discoverable profiles"
  ON profiles FOR SELECT
  USING (
    is_discoverable = true AND auth.role() = 'authenticated'
  );

-- ===================
-- EXTEND RESPONSES: friends can view shared category responses
-- ===================
CREATE POLICY "Friends can view shared category responses"
  ON responses FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM friendships f
      JOIN friend_category_access fca ON fca.friendship_id = f.id
      JOIN response_categories rc ON rc.response_id = responses.id AND rc.category_id = fca.category_id
      WHERE f.status = 'accepted'
        AND auth.uid() IN (f.user_a, f.user_b)
        AND responses.user_id IN (f.user_a, f.user_b)
        AND responses.user_id != auth.uid()
        AND fca.user_id = responses.user_id  -- the OWNER controls sharing
        AND fca.is_enabled = true
    )
  );

-- Friends can also view response_categories for shared responses
CREATE POLICY "Friends can view categories of shared responses"
  ON response_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM responses r
      JOIN friendships f ON r.user_id IN (f.user_a, f.user_b)
      JOIN friend_category_access fca ON fca.friendship_id = f.id
        AND fca.category_id = response_categories.category_id
      WHERE r.id = response_categories.response_id
        AND r.deleted_at IS NULL
        AND f.status = 'accepted'
        AND auth.uid() IN (f.user_a, f.user_b)
        AND r.user_id != auth.uid()
        AND fca.user_id = r.user_id
        AND fca.is_enabled = true
    )
  );
