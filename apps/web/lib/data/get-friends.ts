import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { FriendWithProfile, FriendshipStatus } from "@wisdom-journal/shared";

export interface FriendsResult {
  accepted: FriendWithProfile[];
  pending_sent: FriendWithProfile[];
  pending_received: FriendWithProfile[];
}

export async function getFriends(): Promise<FriendsResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { accepted: [], pending_sent: [], pending_received: [] };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all friendships where user is involved
  const { data: friendships } = await admin
    .from("friendships")
    .select("*")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  if (!friendships || friendships.length === 0) {
    return { accepted: [], pending_sent: [], pending_received: [] };
  }

  // Collect all friend user IDs
  const friendUserIds = friendships.map((f) =>
    f.user_a === user.id ? f.user_b : f.user_a
  );

  // Fetch profiles for all friends
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, bio, current_streak, total_responses, created_at")
    .in("id", friendUserIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: any) => [p.id, p])
  );

  // Fetch access summaries for accepted friendships
  const acceptedIds = friendships
    .filter((f) => f.status === "accepted")
    .map((f) => f.id);

  let summaryMap = new Map<string, any[]>();
  if (acceptedIds.length > 0) {
    const { data: summaries } = await admin
      .from("friend_access_summary")
      .select("*")
      .in("friendship_id", acceptedIds);

    for (const s of summaries ?? []) {
      const arr = summaryMap.get(s.friendship_id) ?? [];
      arr.push(s);
      summaryMap.set(s.friendship_id, arr);
    }
  }

  // Build FriendWithProfile objects
  const result: FriendsResult = {
    accepted: [],
    pending_sent: [],
    pending_received: [],
  };

  for (const f of friendships) {
    const friendId = f.user_a === user.id ? f.user_b : f.user_a;
    const profile = profileMap.get(friendId);
    if (!profile) continue;

    const summaries = summaryMap.get(f.id) ?? [];
    const mySummary = summaries.find((s: any) => s.user_id === user.id) ?? null;
    const theirSummary = summaries.find((s: any) => s.user_id === friendId) ?? null;

    const friendWithProfile: FriendWithProfile = {
      ...f,
      friend_profile: profile,
      my_access_summary: mySummary,
      their_access_summary: theirSummary,
    };

    if (f.status === "accepted") {
      result.accepted.push(friendWithProfile);
    } else if (f.status === "pending") {
      if (f.requested_by === user.id) {
        result.pending_sent.push(friendWithProfile);
      } else {
        result.pending_received.push(friendWithProfile);
      }
    }
  }

  return result;
}
