export type NotificationType =
  | "daily_reminder"
  | "streak_warning"
  | "group_invite"
  | "query_received"
  | "achievement"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  group_id: string | null;

  daily_reminder: boolean;
  streak_warning: boolean;
  group_invites: boolean;
  query_received: boolean;
  achievements: boolean;
  email_digest: boolean;

  reminder_time: string; // HH:MM format

  created_at: string;
  updated_at: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: "ios" | "android" | "web";
  is_active: boolean;
  last_used_at: string;
  created_at: string;
}
