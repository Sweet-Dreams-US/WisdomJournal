-- 021: Row Level Security policies

-- Helper: get current user's ID from Supabase auth
-- (auth.uid() is built-in to Supabase)

-- ===================
-- PROFILES
-- ===================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow viewing profiles of group members (for querying their encyclopedia)
CREATE POLICY "Users can view profiles of fellow group members"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT gm2.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm1.status = 'active'
        AND gm2.status = 'active'
    )
  );

-- ===================
-- CATEGORIES / SUBCATEGORIES (public read)
-- ===================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by all authenticated users"
  ON categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Subcategories are viewable by all authenticated users"
  ON subcategories FOR SELECT
  USING (auth.role() = 'authenticated');

-- ===================
-- QUESTIONS (public read)
-- ===================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active questions are viewable by authenticated users"
  ON questions FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- ===================
-- RESPONSES
-- ===================
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own responses"
  ON responses FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can create their own responses"
  ON responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON responses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete their own responses"
  ON responses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===================
-- RESPONSE_CATEGORIES
-- ===================
ALTER TABLE response_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories of their own responses"
  ON response_categories FOR SELECT
  USING (
    response_id IN (SELECT id FROM responses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can tag their own responses"
  ON response_categories FOR INSERT
  WITH CHECK (
    response_id IN (SELECT id FROM responses WHERE user_id = auth.uid())
  );

-- ===================
-- RESPONSE_EMBEDDINGS
-- ===================
ALTER TABLE response_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings of their own responses"
  ON response_embeddings FOR SELECT
  USING (
    response_id IN (SELECT id FROM responses WHERE user_id = auth.uid())
  );

-- ===================
-- GROUPS
-- ===================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they belong to"
  ON groups FOR SELECT
  USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status IN ('invited', 'active'))
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group owners and admins can update their group"
  ON groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- ===================
-- GROUP_MEMBERS
-- ===================
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status IN ('invited', 'active'))
  );

CREATE POLICY "Group owners/admins can manage members"
  ON group_members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Group owners/admins can update members"
  ON group_members FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
    OR user_id = auth.uid()  -- users can update their own membership (e.g., accept invite)
  );

-- ===================
-- GROUP_CATEGORY_ACCESS
-- ===================
ALTER TABLE group_category_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own category access"
  ON group_category_access FOR SELECT
  USING (
    group_member_id IN (SELECT id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can toggle their own category access"
  ON group_category_access FOR UPDATE
  USING (
    group_member_id IN (SELECT id FROM group_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    group_member_id IN (SELECT id FROM group_members WHERE user_id = auth.uid())
  );

-- Group owners can view access settings of their members
CREATE POLICY "Group owners can view member access"
  ON group_category_access FOR SELECT
  USING (
    group_member_id IN (
      SELECT gm.id FROM group_members gm
      JOIN group_members gm_owner ON gm.group_id = gm_owner.group_id
      WHERE gm_owner.user_id = auth.uid() AND gm_owner.role = 'owner' AND gm_owner.status = 'active'
    )
  );

-- ===================
-- GROUP_ACCESS_SUMMARY
-- ===================
ALTER TABLE group_access_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access summaries for their groups"
  ON group_access_summary FOR SELECT
  USING (
    group_member_id IN (
      SELECT gm2.id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm1.status = 'active'
    )
  );

-- ===================
-- DAILY QUESTION SETS & ITEMS
-- ===================
ALTER TABLE daily_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_question_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily sets"
  ON daily_question_sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own daily sets"
  ON daily_question_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily sets"
  ON daily_question_sets FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own daily items"
  ON daily_question_items FOR SELECT
  USING (set_id IN (SELECT id FROM daily_question_sets WHERE user_id = auth.uid()));
CREATE POLICY "Users can create their own daily items"
  ON daily_question_items FOR INSERT
  WITH CHECK (set_id IN (SELECT id FROM daily_question_sets WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own daily items"
  ON daily_question_items FOR UPDATE
  USING (set_id IN (SELECT id FROM daily_question_sets WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own question history"
  ON user_question_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own question history"
  ON user_question_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own question history"
  ON user_question_history FOR UPDATE USING (auth.uid() = user_id);

-- ===================
-- PEOPLE_MENTIONS
-- ===================
ALTER TABLE people_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own people mentions"
  ON people_mentions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own people mentions"
  ON people_mentions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===================
-- WISDOM_QUERIES
-- ===================
ALTER TABLE wisdom_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view queries they made"
  ON wisdom_queries FOR SELECT USING (auth.uid() = querier_id);
CREATE POLICY "Users can view queries about them"
  ON wisdom_queries FOR SELECT USING (auth.uid() = target_user_id);
CREATE POLICY "Users can create queries"
  ON wisdom_queries FOR INSERT WITH CHECK (auth.uid() = querier_id);
CREATE POLICY "Users can rate queries they made"
  ON wisdom_queries FOR UPDATE USING (auth.uid() = querier_id);

-- ===================
-- STATS
-- ===================
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own category stats"
  ON user_category_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own streak history"
  ON streak_history FOR SELECT USING (auth.uid() = user_id);

-- ===================
-- ACHIEVEMENTS
-- ===================
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by all authenticated users"
  ON achievements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view their own earned achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- ===================
-- LEGACY_CONTACTS
-- ===================
ALTER TABLE legacy_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own legacy contacts"
  ON legacy_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create legacy contacts"
  ON legacy_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own legacy contacts"
  ON legacy_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own legacy contacts"
  ON legacy_contacts FOR DELETE USING (auth.uid() = user_id);

-- ===================
-- NOTIFICATIONS
-- ===================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark their notifications as read"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create notification preferences"
  ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update notification preferences"
  ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their device tokens"
  ON device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register device tokens"
  ON device_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their device tokens"
  ON device_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove their device tokens"
  ON device_tokens FOR DELETE USING (auth.uid() = user_id);

-- ===================
-- BILLING_EVENTS
-- ===================
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing events"
  ON billing_events FOR SELECT USING (auth.uid() = user_id);

-- ===================
-- VOICE_STYLE_PROFILES
-- ===================
ALTER TABLE voice_style_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice profile"
  ON voice_style_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their voice profile"
  ON voice_style_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their voice profile"
  ON voice_style_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ===================
-- AUDIT_LOG (read-only for users, system-insert only)
-- ===================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit entries"
  ON audit_log FOR SELECT USING (auth.uid() = user_id);

-- ===================
-- QUESTION_FEEDBACK
-- ===================
ALTER TABLE question_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON question_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit feedback"
  ON question_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their feedback"
  ON question_feedback FOR UPDATE USING (auth.uid() = user_id);
