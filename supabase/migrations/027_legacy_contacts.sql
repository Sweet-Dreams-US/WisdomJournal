-- Legacy contacts: who inherits access to a user's wisdom

CREATE TABLE IF NOT EXISTS legacy_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  relationship TEXT, -- 'spouse', 'child', 'parent', 'sibling', 'grandchild', 'friend', 'other'
  contact_user_id UUID REFERENCES profiles(id),
  access_level TEXT NOT NULL DEFAULT 'full',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  message TEXT, -- personal message shown when legacy is activated
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_email)
);

CREATE INDEX idx_legacy_contacts_user ON legacy_contacts(user_id);
CREATE INDEX idx_legacy_contacts_email ON legacy_contacts(contact_email);
CREATE INDEX idx_legacy_contacts_contact_user ON legacy_contacts(contact_user_id) WHERE contact_user_id IS NOT NULL;

ALTER TABLE legacy_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own legacy contacts"
  ON legacy_contacts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Legacy contacts can view their entries"
  ON legacy_contacts FOR SELECT
  USING (contact_user_id = auth.uid() OR contact_email = (SELECT email FROM profiles WHERE id = auth.uid()));
