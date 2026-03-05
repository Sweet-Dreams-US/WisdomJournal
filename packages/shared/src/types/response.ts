export type InputMethod = "text" | "voice" | "mixed";
export type ResponseContext = "personal" | "organization";
export type AiSentiment = "positive" | "neutral" | "reflective" | "negative" | "mixed";
export type CategoryTagSource = "primary" | "ai_suggested" | "user_override";

export interface JournalResponse {
  id: string;
  user_id: string;
  question_id: string | null;
  group_id: string | null;

  // Content (sacred — never modified after save)
  response_text: string | null;
  input_method: InputMethod;
  response_context: ResponseContext;

  // Audio/Video
  audio_file_url: string | null;
  audio_duration_seconds: number | null;
  audio_transcription_raw: string | null;
  video_file_url: string | null;

  // AI processing (post-save)
  ai_summary: string | null;
  ai_topics: string[] | null;
  ai_sentiment: AiSentiment | null;
  ai_key_themes: string[] | null;
  ai_processed_at: string | null;

  // Metadata
  word_count: number;
  is_favorite: boolean;
  mood: string | null;
  tags: string[];

  // Categories (populated via join)
  categories?: ResponseCategory[];

  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponseCategory {
  id: string;
  response_id: string;
  category_id: string;
  subcategory_id: string | null;
  source: CategoryTagSource;
  created_at: string;
}

export interface ResponseEmbedding {
  id: string;
  response_id: string;
  chunk_index: number;
  content_text: string;
  model: string;
  created_at: string;
}
