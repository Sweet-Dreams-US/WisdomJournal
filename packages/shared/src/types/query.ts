export interface WisdomQuery {
  id: string;
  querier_id: string;
  target_user_id: string;
  group_id: string | null;

  // Query
  query_text: string;

  // AI response
  ai_response: string | null;
  ai_model: string | null;
  ai_tokens_input: number | null;
  ai_tokens_output: number | null;
  ai_cost_cents: number | null;

  // Source attribution
  source_response_ids: string[];
  source_count: number;

  // User feedback
  rating: number | null;
  feedback_text: string | null;

  created_at: string;
}
