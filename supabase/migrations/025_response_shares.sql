-- Response sharing: allow users to share individual responses via link or with specific users

CREATE TABLE IF NOT EXISTS response_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  share_type TEXT NOT NULL CHECK (share_type IN ('link', 'user', 'group')),
  share_token TEXT UNIQUE, -- for link-based sharing
  shared_with_user_id UUID REFERENCES auth.users(id), -- for user-based sharing
  shared_with_group_id UUID REFERENCES groups(id), -- for group-based sharing
  message TEXT, -- optional message from sharer
  expires_at TIMESTAMPTZ, -- optional expiration
  viewed_at TIMESTAMPTZ, -- when recipient first viewed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_response_shares_token ON response_shares(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_response_shares_response ON response_shares(response_id);
CREATE INDEX idx_response_shares_recipient ON response_shares(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;

-- RLS
ALTER TABLE response_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "Users can create shares for their responses"
  ON response_shares FOR INSERT
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can view shares they created or received"
  ON response_shares FOR SELECT
  USING (shared_by = auth.uid() OR shared_with_user_id = auth.uid());

CREATE POLICY "Users can delete their own shares"
  ON response_shares FOR DELETE
  USING (shared_by = auth.uid());
