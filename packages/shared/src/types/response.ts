export interface JournalResponse {
  id: string;
  user_id: string;
  question_id: string;
  text_content: string | null;
  audio_url: string | null;
  is_favorite: boolean;
  mood: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
