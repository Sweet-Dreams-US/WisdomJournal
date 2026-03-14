import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type {
  Friendship,
  FriendProfile,
  FriendCategoryAccess,
  FriendAccessSummary,
} from "@wisdom-journal/shared";

export interface FriendDetail {
  friendship: Friendship;
  friend_profile: FriendProfile;
  my_category_access: FriendCategoryAccess[];
  their_category_access: FriendCategoryAccess[];
  my_access_summary: FriendAccessSummary | null;
  their_access_summary: FriendAccessSummary | null;
  categories: { id: string; name: string; slug: string; icon: string }[];
}

export async function getFriend(
  friendshipId: string
): Promise<FriendDetail | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the friendship
  const { data: friendship } = await admin
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .single();

  if (!friendship) return null;

  // Verify current user is part of this friendship
  if (friendship.user_a !== user.id && friendship.user_b !== user.id) {
    return null;
  }

  const friendId =
    friendship.user_a === user.id ? friendship.user_b : friendship.user_a;

  // Fetch friend profile, category access, summaries, and categories in parallel
  const [profileRes, categoryAccessRes, summaryRes, categoriesRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "id, full_name, avatar_url, bio, current_streak, total_responses, created_at"
        )
        .eq("id", friendId)
        .single(),
      admin
        .from("friend_category_access")
        .select("*")
        .eq("friendship_id", friendshipId),
      admin
        .from("friend_access_summary")
        .select("*")
        .eq("friendship_id", friendshipId),
      admin.from("categories").select("id, name, slug, icon").order("name"),
    ]);

  if (!profileRes.data) return null;

  const allAccess = categoryAccessRes.data ?? [];
  const allSummaries = summaryRes.data ?? [];

  return {
    friendship,
    friend_profile: profileRes.data,
    my_category_access: allAccess.filter((a: any) => a.user_id === user.id),
    their_category_access: allAccess.filter((a: any) => a.user_id === friendId),
    my_access_summary:
      allSummaries.find((s: any) => s.user_id === user.id) ?? null,
    their_access_summary:
      allSummaries.find((s: any) => s.user_id === friendId) ?? null,
    categories: categoriesRes.data ?? [],
  };
}
