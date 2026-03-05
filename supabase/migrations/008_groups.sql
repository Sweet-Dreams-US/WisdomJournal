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
