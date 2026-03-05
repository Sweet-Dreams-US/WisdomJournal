export type QuestionCategory =
  | "medical_health"
  | "financial"
  | "relationships"
  | "deeply_personal"
  | "life_lessons"
  | "family_traditions"
  | "career_work"
  | "hobbies_interests"
  | "values_beliefs"
  | "memories_stories";

export type QuestionDifficulty = "easy" | "medium" | "deep" | "challenging";
export type EmotionalWeight = "light" | "neutral" | "reflective" | "heavy";
export type ExpectedResponseLength = "brief" | "medium" | "detailed";

export interface Question {
  id: string;
  text: string;
  category_id: string;
  subcategory_id: string | null;
  difficulty: QuestionDifficulty;
  emotional_weight: EmotionalWeight;
  expected_length: ExpectedResponseLength;

  // Quality metrics
  times_shown: number;
  times_answered: number;
  times_skipped: number;
  avg_rating: number | null;
  skip_rate: number;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyQuestionSet {
  id: string;
  user_id: string;
  date: string;
  status: "pending" | "partial" | "completed" | "skipped";
  items?: DailyQuestionItem[];
  created_at: string;
  updated_at: string;
}

export interface DailyQuestionItem {
  id: string;
  set_id: string;
  question_id: string;
  sort_order: number;
  response_id: string | null;
  skipped: boolean;
  question?: Question;
  created_at: string;
}

export interface QuestionFeedback {
  id: string;
  user_id: string;
  question_id: string;
  rating: number;
  feedback_text: string | null;
  was_skipped: boolean;
  created_at: string;
}
