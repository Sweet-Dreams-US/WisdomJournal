-- 042: Organizations — the business tier foundation
--
-- Personal and business coexist per the spec: any user can belong to
-- organizations while keeping a personal journal. Business-context
-- questions mix into org members' daily sets; their answers are tagged
-- with organization_id + response_context='organization'. Org admins see
-- coverage METRICS only — never raw entries (spec 12.3: "Cannot read
-- individual responses without explicit grant").
--
-- RLS uses SECURITY DEFINER helpers from the start — the group_members
-- self-referencing policies caused app-wide 500s (fixed in 034); we do
-- not repeat that here.

-- ============================================================
-- Core tables
-- ============================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT,
  size_range TEXT CHECK (size_range IN ('1-10', '11-50', '51-200', '201-1000', '1000+') OR size_range IS NULL),
  max_seats INTEGER NOT NULL DEFAULT 10,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  job_title TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'departed')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  departed_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  job_title TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '14 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_org_invites_token ON organization_invitations(token);

-- ============================================================
-- Context columns on existing tables
-- ============================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS context_type TEXT NOT NULL DEFAULT 'personal'
  CHECK (context_type IN ('personal', 'business'));

ALTER TABLE questions ADD COLUMN IF NOT EXISTS context_type TEXT NOT NULL DEFAULT 'personal'
  CHECK (context_type IN ('personal', 'business'));
CREATE INDEX IF NOT EXISTS idx_questions_context ON questions(context_type);

ALTER TABLE responses ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_responses_org ON responses(organization_id) WHERE organization_id IS NOT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_questions_enabled BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- RLS helpers (SECURITY DEFINER — no self-referencing policies)
-- ============================================================

CREATE OR REPLACE FUNCTION public.my_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.my_org_admin_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin');
$$;

-- ============================================================
-- RLS policies
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT public.my_org_ids()));

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (id IN (SELECT public.my_org_admin_ids()));

CREATE POLICY "Members can view departments"
  ON departments FOR SELECT
  USING (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "Admins manage departments"
  ON departments FOR ALL
  USING (organization_id IN (SELECT public.my_org_admin_ids()))
  WITH CHECK (organization_id IN (SELECT public.my_org_admin_ids()));

CREATE POLICY "Members can view fellow members"
  ON organization_members FOR SELECT
  USING (organization_id IN (SELECT public.my_org_ids()));

CREATE POLICY "Admins manage members"
  ON organization_members FOR UPDATE
  USING (organization_id IN (SELECT public.my_org_admin_ids()));

CREATE POLICY "Admins view invitations"
  ON organization_invitations FOR SELECT
  USING (organization_id IN (SELECT public.my_org_admin_ids()));

CREATE POLICY "Admins manage invitations"
  ON organization_invitations FOR ALL
  USING (organization_id IN (SELECT public.my_org_admin_ids()))
  WITH CHECK (organization_id IN (SELECT public.my_org_admin_ids()));

-- Org creation + first-owner insert + invite acceptance go through API
-- routes using the service role (same pattern as groups), so no INSERT
-- policies are needed on organizations/organization_members.

-- Fellow org members can see each other's profile basics
CREATE OR REPLACE FUNCTION public.fellow_org_member_user_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om2.user_id
  FROM organization_members om1
  JOIN organization_members om2 ON om1.organization_id = om2.organization_id
  WHERE om1.user_id = auth.uid()
    AND om1.status = 'active' AND om2.status = 'active';
$$;

CREATE POLICY "Users can view profiles of fellow org members"
  ON profiles FOR SELECT
  USING (id IN (SELECT public.fellow_org_member_user_ids()));

-- ============================================================
-- Business categories (hidden from personal category pickers via
-- context_type; surface once a user answers business questions)
-- ============================================================

INSERT INTO categories (slug, name, description, icon, sort_order, context_type) VALUES
  ('decision_making', 'Decision Making', 'How you weigh options, judge risk, and make the calls that matter', 'scale', 20, 'business'),
  ('process_systems', 'Process & Systems', 'How things actually get done — workflows, tools, and the why behind them', 'workflow', 21, 'business'),
  ('stakeholders', 'Relationships & Stakeholders', 'Clients, vendors, partners — histories, preferences, and how to work with them', 'handshake', 22, 'business'),
  ('crisis_challenges', 'Crisis & Challenges', 'Hard moments, what went wrong, and what got you through', 'shield-alert', 23, 'business'),
  ('institutional_knowledge', 'Institutional Knowledge', 'The history, context, and unwritten rules only experience teaches', 'landmark', 24, 'business'),
  ('leadership_management', 'Leadership & Management', 'Hiring, growing people, culture, and leading through change', 'users', 25, 'business')
ON CONFLICT (slug) DO NOTHING;
