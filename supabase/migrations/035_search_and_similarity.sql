-- 035: Match-embeddings RPC for related responses, full-text search index.

-- Cosine-similarity match within a single user's encyclopedia
CREATE OR REPLACE FUNCTION match_response_embeddings(
  p_user_id UUID,
  p_embedding vector(1536),
  p_exclude_response_id UUID DEFAULT NULL,
  p_match_threshold REAL DEFAULT 0.7,
  p_match_count INT DEFAULT 8
)
RETURNS TABLE (
  response_id UUID,
  excerpt TEXT,
  created_at TIMESTAMPTZ,
  category_slug TEXT,
  category_name TEXT,
  similarity REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS response_id,
    LEFT(COALESCE(re.content_text, r.response_text), 220) AS excerpt,
    r.created_at,
    c.slug AS category_slug,
    c.name AS category_name,
    (1 - (re.embedding <=> p_embedding))::REAL AS similarity
  FROM response_embeddings re
  JOIN responses r ON r.id = re.response_id
  LEFT JOIN response_categories rc ON rc.response_id = r.id AND rc.source = 'primary'
  LEFT JOIN categories c ON c.id = rc.category_id
  WHERE r.user_id = p_user_id
    AND r.deleted_at IS NULL
    AND (p_exclude_response_id IS NULL OR r.id <> p_exclude_response_id)
    AND (1 - (re.embedding <=> p_embedding)) >= p_match_threshold
  ORDER BY re.embedding <=> p_embedding
  LIMIT p_match_count;
END;
$$;

-- Full-text search on responses — unaccented, English stemming
ALTER TABLE responses ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(response_text, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_responses_search_tsv ON responses USING gin(search_tsv);

-- Hybrid search RPC: full-text + (optional) semantic boost
CREATE OR REPLACE FUNCTION search_user_responses(
  p_user_id UUID,
  p_query TEXT,
  p_category_slug TEXT DEFAULT NULL,
  p_mood TEXT DEFAULT NULL,
  p_limit INT DEFAULT 25
)
RETURNS TABLE (
  response_id UUID,
  excerpt TEXT,
  created_at TIMESTAMPTZ,
  category_slug TEXT,
  category_name TEXT,
  mood TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  q tsquery;
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) = 0 THEN
    RETURN QUERY
    SELECT r.id, LEFT(COALESCE(r.response_text, ''), 220), r.created_at,
           c.slug, c.name, r.mood, 0::REAL
    FROM responses r
    LEFT JOIN response_categories rc ON rc.response_id = r.id AND rc.source = 'primary'
    LEFT JOIN categories c ON c.id = rc.category_id
    WHERE r.user_id = p_user_id
      AND r.deleted_at IS NULL
      AND (p_category_slug IS NULL OR c.slug = p_category_slug)
      AND (p_mood IS NULL OR r.mood = p_mood)
    ORDER BY r.created_at DESC
    LIMIT p_limit;
    RETURN;
  END IF;

  q := websearch_to_tsquery('english', p_query);

  RETURN QUERY
  SELECT r.id, ts_headline('english', r.response_text, q, 'MaxWords=30,MinWords=15'),
         r.created_at, c.slug, c.name, r.mood,
         ts_rank(r.search_tsv, q)::REAL AS rank
  FROM responses r
  LEFT JOIN response_categories rc ON rc.response_id = r.id AND rc.source = 'primary'
  LEFT JOIN categories c ON c.id = rc.category_id
  WHERE r.user_id = p_user_id
    AND r.deleted_at IS NULL
    AND r.search_tsv @@ q
    AND (p_category_slug IS NULL OR c.slug = p_category_slug)
    AND (p_mood IS NULL OR r.mood = p_mood)
  ORDER BY rank DESC, r.created_at DESC
  LIMIT p_limit;
END;
$$;
