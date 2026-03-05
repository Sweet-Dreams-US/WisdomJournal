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
