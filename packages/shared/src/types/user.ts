export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "standard" | "premium";
  streak_count: number;
  total_responses: number;
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
