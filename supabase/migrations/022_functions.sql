-- 022: Database functions

-- RAG query function: search accessible responses with group membership + category toggle filtering
CREATE OR REPLACE FUNCTION search_accessible_responses(
  p_querier_id UUID,
  p_target_user_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  response_id UUID,
  response_text TEXT,
  similarity FLOAT,
  category_slug TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS response_id,
    r.response_text,
    (1 - (re.embedding <=> p_query_embedding))::FLOAT AS similarity,
    cat.slug AS category_slug,
    r.created_at
  FROM response_embeddings re
  JOIN responses r ON re.response_id = r.id
  -- Get the primary category of the response
  LEFT JOIN response_categories rc ON rc.response_id = r.id AND rc.source = 'primary'
  LEFT JOIN categories cat ON rc.category_id = cat.id
  WHERE
    -- Response belongs to the target user
    r.user_id = p_target_user_id
    AND r.deleted_at IS NULL
    -- Similarity threshold
    AND (1 - (re.embedding <=> p_query_embedding)) > p_match_threshold
    -- Access check: querier must be in a group with target where the category is enabled
    AND (
      -- If querier IS the target, they can see everything
      p_querier_id = p_target_user_id
      OR
      -- Otherwise, check group membership + category toggles
      EXISTS (
        SELECT 1
        FROM group_members gm_querier
        JOIN group_members gm_target ON gm_querier.group_id = gm_target.group_id
        JOIN group_category_access gca ON gca.group_member_id = gm_target.id
        WHERE gm_querier.user_id = p_querier_id
          AND gm_querier.status = 'active'
          AND gm_target.user_id = p_target_user_id
          AND gm_target.status = 'active'
          AND gca.category_id = rc.category_id
          AND gca.is_enabled = true
      )
    )
  ORDER BY similarity DESC
  LIMIT p_match_count;
END;
$$;

-- Encyclopedia stats for a user's dashboard
CREATE OR REPLACE FUNCTION get_encyclopedia_stats(p_user_id UUID)
RETURNS TABLE (
  total_responses BIGINT,
  total_word_count BIGINT,
  categories_covered BIGINT,
  total_categories BIGINT,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_queries_received BIGINT,
  avg_query_rating NUMERIC,
  category_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM responses WHERE user_id = p_user_id AND deleted_at IS NULL)::BIGINT AS total_responses,
    (SELECT COALESCE(sum(word_count), 0) FROM responses WHERE user_id = p_user_id AND deleted_at IS NULL)::BIGINT AS total_word_count,
    (SELECT count(DISTINCT ucs.category_id) FROM user_category_stats ucs WHERE ucs.user_id = p_user_id AND ucs.response_count > 0)::BIGINT AS categories_covered,
    (SELECT count(*) FROM categories)::BIGINT AS total_categories,
    COALESCE((SELECT us.current_streak FROM user_streaks us WHERE us.user_id = p_user_id), 0) AS current_streak,
    COALESCE((SELECT us.longest_streak FROM user_streaks us WHERE us.user_id = p_user_id), 0) AS longest_streak,
    (SELECT count(*) FROM wisdom_queries wq WHERE wq.target_user_id = p_user_id)::BIGINT AS total_queries_received,
    (SELECT avg(wq.rating) FROM wisdom_queries wq WHERE wq.target_user_id = p_user_id AND wq.rating IS NOT NULL) AS avg_query_rating,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'category_id', cat.id,
        'slug', cat.slug,
        'name', cat.name,
        'response_count', COALESCE(ucs.response_count, 0),
        'word_count', COALESCE(ucs.word_count, 0)
      ) ORDER BY cat.sort_order), '[]'::jsonb)
      FROM categories cat
      LEFT JOIN user_category_stats ucs ON ucs.category_id = cat.id AND ucs.user_id = p_user_id
    ) AS category_breakdown;
END;
$$;
