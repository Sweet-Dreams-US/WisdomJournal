import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  group_id: string | null;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Get personal activity feed: own activity + friends' activity.
 * Shows response_created, streak_milestone, achievement_earned, friend_added events.
 */
export async function getActivityFeed(
  limit = 30,
  offset = 0
): Promise<ActivityEvent[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get friend IDs
  const { data: friendships } = await admin
    .from("friendships")
    .select("user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .eq("status", "accepted");

  const friendIds = (friendships ?? []).map((f) =>
    f.user_a === user.id ? f.user_b : f.user_a
  );

  // Include self + friends
  const userIds = [user.id, ...friendIds];

  const { data: events } = await admin
    .from("activity_events")
    .select("*, profile:profiles(id, full_name, avatar_url)")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (events ?? []) as ActivityEvent[];
}
