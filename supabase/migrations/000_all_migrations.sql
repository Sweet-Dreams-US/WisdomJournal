-- ============================================================
-- WISDOM JOURNAL — Combined Database Migrations (001–023)
-- Generated: 2026-02-26
-- ============================================================


-- ============================================================
-- 001: Extensions
-- ============================================================

-- 001: Enable required PostgreSQL extensions
-- pgvector: Semantic similarity search for response embeddings
-- pg_trgm: Trigram-based fuzzy text search
-- uuid-ossp: UUID generation (used by Supabase auth, available for manual use)

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


-- ============================================================
-- 002: Enum Types
-- ============================================================

-- 002: Custom enum types used across the schema

CREATE TYPE subscription_tier AS ENUM ('free', 'standard', 'premium', 'enterprise');
CREATE TYPE group_type AS ENUM ('private', 'organization', 'public');
CREATE TYPE group_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE group_member_status AS ENUM ('invited', 'active', 'suspended', 'departed');
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'deep', 'challenging');
CREATE TYPE emotional_weight AS ENUM ('light', 'neutral', 'reflective', 'heavy');
CREATE TYPE expected_response_length AS ENUM ('brief', 'medium', 'detailed');
CREATE TYPE input_method AS ENUM ('text', 'voice', 'mixed');
CREATE TYPE response_context AS ENUM ('personal', 'organization');
CREATE TYPE ai_sentiment AS ENUM ('positive', 'neutral', 'reflective', 'negative', 'mixed');
CREATE TYPE trust_color AS ENUM ('green', 'yellow', 'red');
CREATE TYPE achievement_type AS ENUM ('streak', 'category', 'milestone', 'special');
CREATE TYPE daily_set_status AS ENUM ('pending', 'partial', 'completed', 'skipped');
CREATE TYPE notification_type AS ENUM ('daily_reminder', 'streak_warning', 'group_invite', 'query_received', 'achievement', 'system');
CREATE TYPE category_tag_source AS ENUM ('primary', 'ai_suggested', 'user_override');
CREATE TYPE billing_event_type AS ENUM ('subscription_created', 'subscription_updated', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'refund');


-- ============================================================
-- 003: Profiles
-- ============================================================

-- 003: User profiles (extends auth.users)

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'America/New_York',

  -- Subscription
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,

  -- Streaks (denormalized for fast dashboard reads)
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_responses INTEGER NOT NULL DEFAULT 0,
  total_word_count INTEGER NOT NULL DEFAULT 0,

  -- Voice & AI
  voice_response_enabled BOOLEAN NOT NULL DEFAULT false,
  voice_capture_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_personality_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Posthumous / legacy
  is_deceased BOOLEAN NOT NULL DEFAULT false,
  deceased_at TIMESTAMPTZ,

  -- Onboarding
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,

  -- Notification prefs (quick-access JSON; detailed prefs in notification_preferences table)
  notification_preferences JSONB NOT NULL DEFAULT '{"daily_reminder": true, "email_digest": false}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);

-- Auto-create a profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- 004: Categories
-- ============================================================

-- 004: Encyclopedia categories and subcategories

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,            -- icon identifier for frontend
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(category_id, slug)
);

CREATE INDEX idx_subcategories_category ON subcategories(category_id);


-- ============================================================
-- 005: Seed Categories
-- ============================================================

-- 005: Seed 10 categories + ~54 subcategories

-- 1. Medical & Health
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('medical_health', 'Medical & Health', 'Health history, conditions, medications, and wellness practices', 'heart-pulse', 1);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('conditions', 'Conditions & Diagnoses', 1),
  ('medications', 'Medications & Treatments', 2),
  ('family_medical', 'Family Medical History', 3),
  ('wellness', 'Wellness & Prevention', 4),
  ('mental_health', 'Mental Health', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'medical_health';

-- 2. Financial
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('financial', 'Financial', 'Financial wisdom, lessons learned, and practical money advice', 'banknote', 2);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('money_lessons', 'Money Lessons', 1),
  ('career_financial', 'Career & Earnings', 2),
  ('investing', 'Investing & Savings', 3),
  ('big_purchases', 'Big Purchases & Decisions', 4),
  ('generosity', 'Generosity & Giving', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'financial';

-- 3. Relationships
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('relationships', 'Relationships', 'Friendships, partnerships, and interpersonal wisdom', 'users', 3);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('romantic', 'Romantic Relationships', 1),
  ('friendships', 'Friendships', 2),
  ('family_dynamics', 'Family Dynamics', 3),
  ('conflict', 'Conflict & Resolution', 4),
  ('community', 'Community & Belonging', 5),
  ('mentorship', 'Mentorship', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'relationships';

-- 4. Deeply Personal
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('deeply_personal', 'Deeply Personal', 'Private reflections, fears, regrets, and innermost thoughts', 'lock', 4);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('fears_anxieties', 'Fears & Anxieties', 1),
  ('regrets', 'Regrets & What-Ifs', 2),
  ('secrets', 'Secrets & Confessions', 3),
  ('dreams_aspirations', 'Dreams & Aspirations', 4),
  ('self_reflection', 'Self-Reflection', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'deeply_personal';

-- 5. Life Lessons
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('life_lessons', 'Life Lessons', 'Hard-won wisdom, advice, and things you wish you knew sooner', 'lightbulb', 5);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('mistakes', 'Mistakes & Growth', 1),
  ('turning_points', 'Turning Points', 2),
  ('advice_self', 'Advice to Younger Self', 3),
  ('principles', 'Guiding Principles', 4),
  ('resilience', 'Resilience & Overcoming', 5),
  ('gratitude', 'Gratitude & Appreciation', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'life_lessons';

-- 6. Family & Traditions
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('family_traditions', 'Family & Traditions', 'Family stories, recipes, customs, and cultural heritage', 'home', 6);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('family_stories', 'Family Stories', 1),
  ('recipes', 'Recipes & Food', 2),
  ('customs', 'Customs & Rituals', 3),
  ('heritage', 'Cultural Heritage', 4),
  ('holidays', 'Holidays & Celebrations', 5),
  ('heirlooms', 'Heirlooms & Objects', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'family_traditions';

-- 7. Career & Work
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('career_work', 'Career & Work', 'Professional experiences, industry knowledge, and career advice', 'briefcase', 7);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('career_path', 'Career Path & Decisions', 1),
  ('skills', 'Skills & Expertise', 2),
  ('leadership', 'Leadership & Management', 3),
  ('workplace', 'Workplace Experiences', 4),
  ('entrepreneurship', 'Entrepreneurship', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'career_work';

-- 8. Hobbies & Interests
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('hobbies_interests', 'Hobbies & Interests', 'Passions, creative pursuits, and things that bring joy', 'palette', 8);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('creative', 'Creative Pursuits', 1),
  ('sports_fitness', 'Sports & Fitness', 2),
  ('travel', 'Travel & Adventure', 3),
  ('learning', 'Learning & Education', 4),
  ('collections', 'Collections & Hobbies', 5),
  ('nature', 'Nature & Outdoors', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'hobbies_interests';

-- 9. Values & Beliefs
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('values_beliefs', 'Values & Beliefs', 'Moral compass, faith, philosophy, and what matters most', 'compass', 9);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('core_values', 'Core Values', 1),
  ('faith_spirituality', 'Faith & Spirituality', 2),
  ('philosophy', 'Philosophy & Worldview', 3),
  ('ethics', 'Ethics & Morals', 4),
  ('purpose', 'Purpose & Meaning', 5)
) AS s(slug, name, sort_order)
WHERE c.slug = 'values_beliefs';

-- 10. Memories & Stories
INSERT INTO categories (slug, name, description, icon, sort_order)
VALUES ('memories_stories', 'Memories & Stories', 'Cherished memories, funny moments, and stories worth preserving', 'book-open', 10);

INSERT INTO subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order
FROM categories c,
(VALUES
  ('childhood', 'Childhood Memories', 1),
  ('milestones', 'Milestones & Firsts', 2),
  ('funny_moments', 'Funny Moments', 3),
  ('pivotal_events', 'Pivotal Events', 4),
  ('places', 'Places & Settings', 5),
  ('people_met', 'People Who Shaped Me', 6)
) AS s(slug, name, sort_order)
WHERE c.slug = 'memories_stories';


-- ============================================================
-- 006: Questions
-- ============================================================

-- 006: Question bank

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  difficulty question_difficulty NOT NULL DEFAULT 'medium',
  emotional_weight emotional_weight NOT NULL DEFAULT 'neutral',
  expected_length expected_response_length NOT NULL DEFAULT 'medium',

  -- Quality metrics (updated via feedback + admin)
  times_shown INTEGER NOT NULL DEFAULT 0,
  times_answered INTEGER NOT NULL DEFAULT 0,
  times_skipped INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3,2),          -- 1.00-5.00
  skip_rate NUMERIC(5,4) DEFAULT 0, -- 0.0000-1.0000

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_subcategory ON questions(subcategory_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;


-- ============================================================
-- 007: Responses
-- ============================================================

-- 007: Journal responses (sacred data -- never modified), category join table, embeddings

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  group_id UUID,  -- FK added after groups table is created (008)

  -- Content (sacred -- never modified after save)
  response_text TEXT,
  input_method input_method NOT NULL DEFAULT 'text',
  response_context response_context NOT NULL DEFAULT 'personal',

  -- Audio/Video
  audio_file_url TEXT,
  audio_duration_seconds INTEGER,
  audio_transcription_raw TEXT,
  video_file_url TEXT,

  -- AI processing (post-save only, never touches response_text)
  ai_summary TEXT,
  ai_topics TEXT[],
  ai_sentiment ai_sentiment,
  ai_key_themes TEXT[],
  ai_processed_at TIMESTAMPTZ,

  -- Metadata
  word_count INTEGER NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  mood TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_responses_user ON responses(user_id);
CREATE INDEX idx_responses_question ON responses(question_id);
CREATE INDEX idx_responses_group ON responses(group_id);
CREATE INDEX idx_responses_context ON responses(response_context);
CREATE INDEX idx_responses_created ON responses(created_at DESC);
CREATE INDEX idx_responses_not_deleted ON responses(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- Many-to-many: response <-> category tagging
CREATE TABLE response_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  source category_tag_source NOT NULL DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(response_id, category_id, subcategory_id)
);

CREATE INDEX idx_response_categories_response ON response_categories(response_id);
CREATE INDEX idx_response_categories_category ON response_categories(category_id);

-- Embeddings table (pgvector 1536-dim for text-embedding-3-small)
CREATE TABLE response_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,  -- 0 = whole response, 1+ = chunks for long responses
  content_text TEXT NOT NULL,               -- the text that was embedded
  embedding vector(1536) NOT NULL,
  model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(response_id, chunk_index)
);

CREATE INDEX idx_response_embeddings_response ON response_embeddings(response_id);

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX idx_response_embeddings_hnsw ON response_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);


-- ============================================================
-- 008: Groups
-- ============================================================

-- 008: Groups, members, category access, access summary

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  group_type group_type NOT NULL DEFAULT 'private',
  avatar_url TEXT,

  -- Billing (for organization groups)
  stripe_customer_id TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',

  -- Defaults for new members
  default_category_access BOOLEAN NOT NULL DEFAULT true,  -- new members start with all categories on or off

  -- Denormalized
  member_count INTEGER NOT NULL DEFAULT 0,

  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_type ON groups(group_type);
CREATE INDEX idx_groups_created_by ON groups(created_by);

-- Group membership
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  status group_member_status NOT NULL DEFAULT 'invited',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_status ON group_members(status);

-- Per-user per-group per-category access toggle
-- One row per user+group+category. Auto-initialized when user joins group.
CREATE TABLE group_category_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(group_member_id, category_id)
);

CREATE INDEX idx_group_category_access_member ON group_category_access(group_member_id);
CREATE INDEX idx_group_category_access_category ON group_category_access(category_id);

-- Auto-computed trust color summary per group member
CREATE TABLE group_access_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_member_id UUID NOT NULL UNIQUE REFERENCES group_members(id) ON DELETE CASCADE,
  enabled_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  access_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  trust_color trust_color NOT NULL DEFAULT 'green',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_access_summary_color ON group_access_summary(trust_color);

-- Now add the FK from responses.group_id -> groups.id
ALTER TABLE responses
  ADD CONSTRAINT fk_responses_group
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;


-- ============================================================
-- 009: Daily Questions
-- ============================================================

-- 009: Daily question sets and history

CREATE TABLE daily_question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status daily_set_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_sets_user_date ON daily_question_sets(user_id, date DESC);

CREATE TABLE daily_question_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES daily_question_sets(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  response_id UUID REFERENCES responses(id) ON DELETE SET NULL,
  skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(set_id, question_id)
);

CREATE INDEX idx_daily_items_set ON daily_question_items(set_id);

-- Track which questions a user has been shown (avoid repeats)
CREATE TABLE user_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered BOOLEAN NOT NULL DEFAULT false,
  skipped BOOLEAN NOT NULL DEFAULT false,

  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_question_history_user ON user_question_history(user_id);


-- ============================================================
-- 010: People Mentions
-- ============================================================

-- 010: People mentioned in responses (normalized names, optional link to WJ users)

CREATE TABLE people_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  mentioned_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,   -- lowercase, trimmed for dedup
  linked_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  relationship TEXT,               -- e.g. "mother", "coworker", "friend"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_people_mentions_user ON people_mentions(user_id);
CREATE INDEX idx_people_mentions_response ON people_mentions(response_id);
CREATE INDEX idx_people_mentions_normalized ON people_mentions(normalized_name);
CREATE INDEX idx_people_mentions_linked ON people_mentions(linked_user_id) WHERE linked_user_id IS NOT NULL;


-- ============================================================
-- 011: Wisdom Queries
-- ============================================================

-- 011: Wisdom queries -- when someone asks a question about a user's encyclopedia

CREATE TABLE wisdom_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  querier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,

  -- Query
  query_text TEXT NOT NULL,

  -- AI response
  ai_response TEXT,
  ai_model TEXT,
  ai_tokens_input INTEGER,
  ai_tokens_output INTEGER,
  ai_cost_cents NUMERIC(10,4),

  -- Source attribution
  source_response_ids UUID[] DEFAULT '{}',
  source_count INTEGER NOT NULL DEFAULT 0,

  -- User feedback
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wisdom_queries_querier ON wisdom_queries(querier_id);
CREATE INDEX idx_wisdom_queries_target ON wisdom_queries(target_user_id);
CREATE INDEX idx_wisdom_queries_created ON wisdom_queries(created_at DESC);


-- ============================================================
-- 012: Stats
-- ============================================================

-- 012: User streaks, category stats, streak history

CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_response_date DATE,
  streak_started_at DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_category_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  response_count INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  last_response_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, category_id)
);

CREATE INDEX idx_category_stats_user ON user_category_stats(user_id);

CREATE TABLE streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_length INTEGER NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_streak_history_user ON streak_history(user_id);


-- ============================================================
-- 013: Achievements
-- ============================================================

-- 013: Achievements system

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  achievement_type achievement_type NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,  -- e.g. streak of 7, 100 responses, etc.
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);


-- ============================================================
-- 014: Legacy Contacts
-- ============================================================

-- 014: Legacy contacts (digital executor / posthumous access management)

CREATE TABLE legacy_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  relationship TEXT,

  -- Permissions
  can_manage_access BOOLEAN NOT NULL DEFAULT false,
  can_download_archive BOOLEAN NOT NULL DEFAULT false,
  can_delete_account BOOLEAN NOT NULL DEFAULT false,

  -- Verification
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_legacy_contacts_user ON legacy_contacts(user_id);
CREATE INDEX idx_legacy_contacts_email ON legacy_contacts(contact_email);


-- ============================================================
-- 015: Notifications
-- ============================================================

-- 015: Notifications, per-user per-group preferences, device tokens

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,

  daily_reminder BOOLEAN NOT NULL DEFAULT true,
  streak_warning BOOLEAN NOT NULL DEFAULT true,
  group_invites BOOLEAN NOT NULL DEFAULT true,
  query_received BOOLEAN NOT NULL DEFAULT true,
  achievements BOOLEAN NOT NULL DEFAULT true,
  email_digest BOOLEAN NOT NULL DEFAULT false,

  reminder_time TIME NOT NULL DEFAULT '09:00',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, group_id)
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,  -- 'ios', 'android', 'web'
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);


-- ============================================================
-- 016: Billing
-- ============================================================

-- 016: Billing events (Stripe webhook log)

CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type billing_event_type NOT NULL,

  -- Can be individual or group billing
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'usd',

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_events_user ON billing_events(user_id);
CREATE INDEX idx_billing_events_group ON billing_events(group_id);
CREATE INDEX idx_billing_events_stripe ON billing_events(stripe_event_id);


-- ============================================================
-- 017: Voice Profiles
-- ============================================================

-- 017: Voice style profiles (vocabulary, tone, patterns for AI personality)

CREATE TABLE voice_style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Linguistic patterns extracted from responses
  vocabulary_level TEXT,          -- e.g. "conversational", "academic", "folksy"
  avg_sentence_length NUMERIC(5,1),
  common_phrases TEXT[],
  tone_descriptors TEXT[],       -- e.g. ["warm", "humorous", "direct"]
  speech_patterns JSONB,         -- filler words, cadence, structure

  -- Config
  personality_prompt TEXT,       -- generated system prompt for AI to mimic voice
  sample_response_ids UUID[],   -- responses used to build the profile

  last_rebuilt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 018: Audit
-- ============================================================

-- 018: Audit log

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,          -- e.g. "response.create", "group.join", "query.execute"
  resource_type TEXT,            -- e.g. "response", "group", "profile"
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);


-- ============================================================
-- 019: Feedback
-- ============================================================

-- 019: Question feedback from users

CREATE TABLE question_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  was_skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_question_feedback_question ON question_feedback(question_id);


-- ============================================================
-- 020: Triggers
-- ============================================================

-- 020: Trigger functions for automated updates

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at to all tables that have the column
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'questions', 'responses', 'groups', 'group_members',
      'group_category_access', 'group_access_summary', 'daily_question_sets',
      'legacy_contacts', 'notification_preferences', 'voice_style_profiles',
      'user_streaks', 'user_category_stats'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- Auto-compute word_count on response insert/update
CREATE OR REPLACE FUNCTION compute_word_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.response_text IS NOT NULL THEN
    NEW.word_count = array_length(string_to_array(trim(NEW.response_text), ' '), 1);
  ELSE
    NEW.word_count = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_response_word_count
  BEFORE INSERT OR UPDATE OF response_text ON responses
  FOR EACH ROW
  EXECUTE FUNCTION compute_word_count();

-- Update streak stats when a response is inserted
CREATE OR REPLACE FUNCTION update_streak_on_response()
RETURNS TRIGGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
  streak_rec RECORD;
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_rec FROM user_streaks WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_response_date, streak_started_at)
    VALUES (NEW.user_id, 1, 1, today, today);
  ELSE
    IF streak_rec.last_response_date = today THEN
      -- Already responded today, no change
      NULL;
    ELSIF streak_rec.last_response_date = today - 1 THEN
      -- Consecutive day: extend streak
      UPDATE user_streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_response_date = today
      WHERE user_id = NEW.user_id;
    ELSE
      -- Streak broken: archive old streak if > 1, start new one
      IF streak_rec.current_streak > 1 AND streak_rec.streak_started_at IS NOT NULL THEN
        INSERT INTO streak_history (user_id, streak_length, started_at, ended_at)
        VALUES (NEW.user_id, streak_rec.current_streak, streak_rec.streak_started_at, streak_rec.last_response_date);
      END IF;

      UPDATE user_streaks
      SET current_streak = 1,
          last_response_date = today,
          streak_started_at = today
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  -- Update denormalized counts on profiles
  UPDATE profiles
  SET current_streak = (SELECT current_streak FROM user_streaks WHERE user_id = NEW.user_id),
      longest_streak = (SELECT longest_streak FROM user_streaks WHERE user_id = NEW.user_id),
      total_responses = total_responses + 1,
      total_word_count = total_word_count + COALESCE(NEW.word_count, 0)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_response_insert_update_streak
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_response();

-- Update category stats when a response_category is inserted
CREATE OR REPLACE FUNCTION update_category_stats()
RETURNS TRIGGER AS $$
DECLARE
  resp RECORD;
BEGIN
  SELECT user_id, word_count, created_at INTO resp FROM responses WHERE id = NEW.response_id;

  INSERT INTO user_category_stats (user_id, category_id, response_count, word_count, last_response_at)
  VALUES (resp.user_id, NEW.category_id, 1, COALESCE(resp.word_count, 0), resp.created_at)
  ON CONFLICT (user_id, category_id)
  DO UPDATE SET
    response_count = user_category_stats.response_count + 1,
    word_count = user_category_stats.word_count + COALESCE(resp.word_count, 0),
    last_response_at = GREATEST(user_category_stats.last_response_at, resp.created_at);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_response_category_insert_update_stats
  AFTER INSERT ON response_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_stats();

-- Update group member_count on membership changes
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
DECLARE
  target_group_id UUID;
BEGIN
  target_group_id := COALESCE(NEW.group_id, OLD.group_id);

  UPDATE groups
  SET member_count = (
    SELECT count(*) FROM group_members
    WHERE group_id = target_group_id AND status = 'active'
  )
  WHERE id = target_group_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_member_change
  AFTER INSERT OR UPDATE OF status OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Initialize category access rows when a user joins a group
CREATE OR REPLACE FUNCTION init_category_access_on_join()
RETURNS TRIGGER AS $$
DECLARE
  default_access BOOLEAN;
BEGIN
  -- Only fire when status changes to 'active'
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    SELECT default_category_access INTO default_access FROM groups WHERE id = NEW.group_id;

    INSERT INTO group_category_access (group_member_id, category_id, is_enabled)
    SELECT NEW.id, c.id, COALESCE(default_access, true)
    FROM categories c
    ON CONFLICT (group_member_id, category_id) DO NOTHING;

    -- Initialize access summary
    INSERT INTO group_access_summary (group_member_id, enabled_count, total_count, access_percentage, trust_color)
    SELECT
      NEW.id,
      count(*) FILTER (WHERE COALESCE(default_access, true)),
      count(*),
      CASE WHEN count(*) > 0
        THEN (count(*) FILTER (WHERE COALESCE(default_access, true)))::numeric / count(*) * 100
        ELSE 0
      END,
      CASE
        WHEN COALESCE(default_access, true) THEN 'green'
        ELSE 'red'
      END
    FROM categories
    ON CONFLICT (group_member_id) DO NOTHING;

    -- Set joined_at
    NEW.joined_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_member_activated
  BEFORE INSERT OR UPDATE OF status ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION init_category_access_on_join();

-- Recompute trust color when category access toggles change
CREATE OR REPLACE FUNCTION recompute_trust_color()
RETURNS TRIGGER AS $$
DECLARE
  enabled INTEGER;
  total INTEGER;
  pct NUMERIC(5,2);
  color trust_color;
BEGIN
  SELECT
    count(*) FILTER (WHERE is_enabled),
    count(*)
  INTO enabled, total
  FROM group_category_access
  WHERE group_member_id = NEW.group_member_id;

  pct := CASE WHEN total > 0 THEN (enabled::numeric / total * 100) ELSE 0 END;
  color := CASE
    WHEN pct >= 70 THEN 'green'
    WHEN pct >= 30 THEN 'yellow'
    ELSE 'red'
  END;

  INSERT INTO group_access_summary (group_member_id, enabled_count, total_count, access_percentage, trust_color)
  VALUES (NEW.group_member_id, enabled, total, pct, color)
  ON CONFLICT (group_member_id)
  DO UPDATE SET
    enabled_count = EXCLUDED.enabled_count,
    total_count = EXCLUDED.total_count,
    access_percentage = EXCLUDED.access_percentage,
    trust_color = EXCLUDED.trust_color;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_category_access_change
  AFTER INSERT OR UPDATE OF is_enabled ON group_category_access
  FOR EACH ROW
  EXECUTE FUNCTION recompute_trust_color();


-- ============================================================
-- 021: RLS Policies
-- ============================================================

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


-- ============================================================
-- 022: Functions
-- ============================================================

-- 022: Database functions

-- RAG query function: search accessible responses with group membership + category toggle filtering
CREATE OR REPLACE FUNCTION search_accessible_responses(
  p_querier_id UUID,
  p_target_user_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  response_id UUID,
  response_text TEXT,
  similarity FLOAT,
  category_slug TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS response_id,
    r.response_text,
    (1 - (re.embedding <=> p_query_embedding))::FLOAT AS similarity,
    cat.slug AS category_slug,
    r.created_at
  FROM response_embeddings re
  JOIN responses r ON re.response_id = r.id
  -- Get the primary category of the response
  LEFT JOIN response_categories rc ON rc.response_id = r.id AND rc.source = 'primary'
  LEFT JOIN categories cat ON rc.category_id = cat.id
  WHERE
    -- Response belongs to the target user
    r.user_id = p_target_user_id
    AND r.deleted_at IS NULL
    -- Similarity threshold
    AND (1 - (re.embedding <=> p_query_embedding)) > p_match_threshold
    -- Access check: querier must be in a group with target where the category is enabled
    AND (
      -- If querier IS the target, they can see everything
      p_querier_id = p_target_user_id
      OR
      -- Otherwise, check group membership + category toggles
      EXISTS (
        SELECT 1
        FROM group_members gm_querier
        JOIN group_members gm_target ON gm_querier.group_id = gm_target.group_id
        JOIN group_category_access gca ON gca.group_member_id = gm_target.id
        WHERE gm_querier.user_id = p_querier_id
          AND gm_querier.status = 'active'
          AND gm_target.user_id = p_target_user_id
          AND gm_target.status = 'active'
          AND gca.category_id = rc.category_id
          AND gca.is_enabled = true
      )
    )
  ORDER BY similarity DESC
  LIMIT p_match_count;
END;
$$;

-- Encyclopedia stats for a user's dashboard
CREATE OR REPLACE FUNCTION get_encyclopedia_stats(p_user_id UUID)
RETURNS TABLE (
  total_responses BIGINT,
  total_word_count BIGINT,
  categories_covered BIGINT,
  total_categories BIGINT,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_queries_received BIGINT,
  avg_query_rating NUMERIC,
  category_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM responses WHERE user_id = p_user_id AND deleted_at IS NULL)::BIGINT AS total_responses,
    (SELECT COALESCE(sum(word_count), 0) FROM responses WHERE user_id = p_user_id AND deleted_at IS NULL)::BIGINT AS total_word_count,
    (SELECT count(DISTINCT ucs.category_id) FROM user_category_stats ucs WHERE ucs.user_id = p_user_id AND ucs.response_count > 0)::BIGINT AS categories_covered,
    (SELECT count(*) FROM categories)::BIGINT AS total_categories,
    COALESCE((SELECT us.current_streak FROM user_streaks us WHERE us.user_id = p_user_id), 0) AS current_streak,
    COALESCE((SELECT us.longest_streak FROM user_streaks us WHERE us.user_id = p_user_id), 0) AS longest_streak,
    (SELECT count(*) FROM wisdom_queries wq WHERE wq.target_user_id = p_user_id)::BIGINT AS total_queries_received,
    (SELECT avg(wq.rating) FROM wisdom_queries wq WHERE wq.target_user_id = p_user_id AND wq.rating IS NOT NULL) AS avg_query_rating,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'category_id', cat.id,
        'slug', cat.slug,
        'name', cat.name,
        'response_count', COALESCE(ucs.response_count, 0),
        'word_count', COALESCE(ucs.word_count, 0)
      ) ORDER BY cat.sort_order), '[]'::jsonb)
      FROM categories cat
      LEFT JOIN user_category_stats ucs ON ucs.category_id = cat.id AND ucs.user_id = p_user_id
    ) AS category_breakdown;
END;
$$;


-- ============================================================
-- 023: Seed Achievements
-- ============================================================

-- 023: Seed achievement definitions

INSERT INTO achievements (slug, name, description, icon, achievement_type, requirement_value, sort_order) VALUES
-- Streak achievements
('streak_3', 'Getting Started', 'Respond 3 days in a row', 'flame', 'streak', 3, 1),
('streak_7', 'Week Warrior', 'Respond 7 days in a row', 'flame', 'streak', 7, 2),
('streak_14', 'Fortnight Focus', 'Respond 14 days in a row', 'flame', 'streak', 14, 3),
('streak_30', 'Monthly Master', 'Respond 30 days in a row', 'flame', 'streak', 30, 4),
('streak_60', 'Two-Month Titan', 'Respond 60 days in a row', 'flame', 'streak', 60, 5),
('streak_90', 'Quarter Champion', 'Respond 90 days in a row', 'flame', 'streak', 90, 6),
('streak_180', 'Half-Year Hero', 'Respond 180 days in a row', 'flame', 'streak', 180, 7),
('streak_365', 'Year of Wisdom', 'Respond every day for a full year', 'trophy', 'streak', 365, 8),

-- Milestone achievements (total responses)
('responses_1', 'First Words', 'Write your first journal response', 'pencil', 'milestone', 1, 10),
('responses_10', 'Finding Your Voice', 'Write 10 journal responses', 'pencil', 'milestone', 10, 11),
('responses_50', 'Storyteller', 'Write 50 journal responses', 'book', 'milestone', 50, 12),
('responses_100', 'Century of Wisdom', 'Write 100 journal responses', 'book', 'milestone', 100, 13),
('responses_250', 'Prolific Writer', 'Write 250 journal responses', 'book-open', 'milestone', 250, 14),
('responses_500', 'Wisdom Keeper', 'Write 500 journal responses', 'library', 'milestone', 500, 15),
('responses_1000', 'Legacy Builder', 'Write 1,000 journal responses', 'landmark', 'milestone', 1000, 16),

-- Category achievements
('cat_1', 'First Category', 'Respond to a question in 1 category', 'folder', 'category', 1, 20),
('cat_5', 'Well-Rounded', 'Respond to questions in 5 categories', 'folders', 'category', 5, 21),
('cat_10', 'Encyclopedia', 'Respond to questions in all 10 categories', 'globe', 'category', 10, 22),

-- Special achievements
('first_query', 'Wisdom Shared', 'Someone queried your encyclopedia for the first time', 'message-circle', 'special', 1, 30),
('first_group', 'Connected', 'Join or create your first group', 'users', 'special', 1, 31),
('first_voice', 'Voice Captured', 'Record your first voice response', 'mic', 'special', 1, 32),
('legacy_setup', 'Future Proof', 'Set up your first legacy contact', 'shield', 'special', 1, 33);
