-- Beta invite codes & admin system

CREATE TABLE IF NOT EXISTS beta_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 15,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE beta_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read codes to validate"
  ON beta_invite_codes FOR SELECT USING (true);

CREATE POLICY "Admins can manage codes"
  ON beta_invite_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Add admin and beta fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_code_used TEXT;

-- Set cole as admin
UPDATE profiles SET is_admin = true WHERE email = 'cole@marcuccilli.com';

-- Insert default beta code
INSERT INTO beta_invite_codes (code, max_uses)
VALUES ('WISDOM-BETA-2026', 15)
ON CONFLICT (code) DO NOTHING;
