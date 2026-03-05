export interface StreakStats {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_response_date: string | null;
  streak_started_at: string | null;
  updated_at: string;
}

export interface CategoryStats {
  id: string;
  user_id: string;
  category_id: string;
  response_count: number;
  word_count: number;
  last_response_at: string | null;
  updated_at: string;
}

export interface StreakHistory {
  id: string;
  user_id: string;
  streak_length: number;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export interface EncyclopediaStats {
  total_responses: number;
  total_word_count: number;
  categories_covered: number;
  total_categories: number;
  current_streak: number;
  longest_streak: number;
  total_queries_received: number;
  avg_query_rating: number | null;
  category_breakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category_id: string;
  slug: string;
  name: string;
  response_count: number;
  word_count: number;
}

export type AchievementType = "streak" | "category" | "milestone" | "special";

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  achievement_type: AchievementType;
  requirement_value: number;
  sort_order: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}
