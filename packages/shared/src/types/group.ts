export type GroupType = "private" | "organization" | "public";
export type GroupRole = "owner" | "admin" | "member" | "viewer";
export type GroupMemberStatus = "invited" | "active" | "suspended" | "departed";
export type TrustColor = "green" | "yellow" | "red";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  group_type: GroupType;
  avatar_url: string | null;

  // Billing
  stripe_customer_id: string | null;
  subscription_tier: "free" | "standard" | "premium" | "enterprise";

  default_category_access: boolean;
  member_count: number;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  status: GroupMemberStatus;
  invited_by: string | null;
  joined_at: string | null;
  departed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupCategoryAccess {
  id: string;
  group_member_id: string;
  category_id: string;
  is_enabled: boolean;
  updated_at: string;
}

export interface GroupAccessSummary {
  id: string;
  group_member_id: string;
  enabled_count: number;
  total_count: number;
  access_percentage: number;
  trust_color: TrustColor;
  updated_at: string;
}
