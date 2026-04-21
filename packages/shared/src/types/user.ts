export type SubscriptionTier = "free" | "standard" | "premium" | "enterprise";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;

  // Denormalized streak/response stats
  current_streak: number;
  longest_streak: number;
  total_responses: number;
  total_word_count: number;

  // Voice & AI
  voice_response_enabled: boolean;
  voice_capture_enabled: boolean;
  ai_personality_enabled: boolean;

  // Posthumous
  is_deceased: boolean;
  deceased_at: string | null;

  // Onboarding
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;

  // Admin & Beta
  is_admin: boolean;
  beta_code_used: string | null;

  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  bio: string | null;
  timezone: string | null;
  notification_preferences: {
    daily_reminder: boolean;
    email_digest: boolean;
  };
}
