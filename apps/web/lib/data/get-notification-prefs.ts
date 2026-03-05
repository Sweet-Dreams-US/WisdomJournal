import { createClient } from "@/lib/supabase/server";
import type { NotificationPreferences } from "@wisdom-journal/shared";

export async function getNotificationPrefs(): Promise<NotificationPreferences | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .is("group_id", null)
    .single();

  return (data as NotificationPreferences) ?? null;
}
