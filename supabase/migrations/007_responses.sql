-- 007: Journal responses (sacred data — never modified), category join table, embeddings

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  group_id UUID,  -- FK added after groups table is created (008)

  -- Content (sacred — never modified after save)
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
