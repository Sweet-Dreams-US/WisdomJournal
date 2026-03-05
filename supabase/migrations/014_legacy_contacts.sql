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
