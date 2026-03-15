import { createClient } from "@/lib/supabase/server";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResult {
  notifications: Notification[];
  unread_count: number;
}

export async function getNotifications(): Promise<NotificationsResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { notifications: [], unread_count: 0 };

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data ?? []) as Notification[];
  const unread_count = notifications.filter((n) => !n.read_at).length;

  return { notifications, unread_count };
}
