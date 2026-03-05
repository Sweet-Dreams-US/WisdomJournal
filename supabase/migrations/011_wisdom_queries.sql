-- 011: Wisdom queries — when someone asks a question about a user's encyclopedia

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
