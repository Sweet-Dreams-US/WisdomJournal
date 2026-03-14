import type { TrustColor } from "./group";

export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface Friendship {
  id: string;
  user_a: string;
  user_b: string;
  status: FriendshipStatus;
  requested_by: string;
  message: string | null;
  requested_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FriendCategoryAccess {
  id: string;
  friendship_id: string;
  user_id: string;
  category_id: string;
  is_enabled: boolean;
  updated_at: string;
}

export interface FriendAccessSummary {
  id: string;
  friendship_id: string;
  user_id: string;
  enabled_count: number;
  total_count: number;
  access_percentage: number;
  trust_color: TrustColor;
  updated_at: string;
}

export interface FriendProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  current_streak: number;
  total_responses: number;
  created_at: string;
}

export interface FriendWithProfile extends Friendship {
  friend_profile: FriendProfile;
  my_access_summary: FriendAccessSummary | null;
  their_access_summary: FriendAccessSummary | null;
}
