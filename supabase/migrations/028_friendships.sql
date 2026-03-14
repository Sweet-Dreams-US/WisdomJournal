-- 028: Friendships, friend category access, friend access summary
-- Mirrors the group pattern from 008_groups.sql but with privacy-first defaults (categories OFF)

-- Friendship status enum
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');

-- Add discoverability toggle to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_profiles_discoverable ON profiles(is_discoverable) WHERE is_discoverable = true;

-- Friendships table: single row per pair, user_a < user_b for uniqueness
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,  -- optional message with friend request
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure each pair stored exactly once (lower UUID always user_a)
  CONSTRAINT friendships_user_order CHECK (user_a < user_b),
  CONSTRAINT friendships_unique_pair UNIQUE (user_a, user_b),
  CONSTRAINT friendships_requester_valid CHECK (requested_by IN (user_a, user_b)),
  CONSTRAINT friendships_no_self CHECK (user_a != user_b)
);

CREATE INDEX idx_friendships_user_a ON friendships(user_a, status);
CREATE INDEX idx_friendships_user_b ON friendships(user_b, status);
CREATE INDEX idx_friendships_requested_by ON friendships(requested_by);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Per-user per-friendship per-category access toggle
-- Each user independently controls which categories they share with their friend
-- Default is OFF (privacy-first) — opposite of groups which default ON
CREATE TABLE friend_category_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id UUID NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,  -- privacy-first: default OFF
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(friendship_id, user_id, category_id)
);

CREATE INDEX idx_friend_cat_access_friendship ON friend_category_access(friendship_id);
CREATE INDEX idx_friend_cat_access_user ON friend_category_access(user_id);
CREATE INDEX idx_friend_cat_access_enabled ON friend_category_access(friendship_id, user_id) WHERE is_enabled = true;

-- Auto-computed trust color summary per user per friendship
CREATE TABLE friend_access_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id UUID NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enabled_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  access_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  trust_color trust_color NOT NULL DEFAULT 'red',  -- default red since nothing shared
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(friendship_id, user_id)
);

CREATE INDEX idx_friend_access_summary_trust ON friend_access_summary(trust_color);

-- Add updated_at triggers for new tables
CREATE TRIGGER set_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_friend_category_access_updated_at
  BEFORE UPDATE ON friend_category_access
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_friend_access_summary_updated_at
  BEFORE UPDATE ON friend_access_summary
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
