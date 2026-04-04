import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createServiceClient(supabaseUrl, serviceKey);

  // Fetch all achievements
  const { data: allAchievements } = await admin
    .from("achievements")
    .select("*")
    .order("sort_order");

  if (!allAchievements || allAchievements.length === 0) {
    return NextResponse.json({ newly_earned: [] });
  }

  // Fetch user's already-earned achievements
  const { data: earnedRows } = await admin
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  const earnedIds = new Set((earnedRows || []).map((r) => r.achievement_id));

  // Filter to unearned achievements
  const unearned = allAchievements.filter((a) => !earnedIds.has(a.id));
  if (unearned.length === 0) {
    return NextResponse.json({ newly_earned: [] });
  }

  // Gather user stats for condition checks
  const [
    { data: profile },
    { data: streakData },
    { count: wisdomQueryCount },
    { count: friendshipCount },
    { count: categoryStatCount },
    { count: shareCount },
  ] = await Promise.all([
    admin.from("profiles").select("total_responses").eq("id", user.id).single(),
    admin.from("user_streaks").select("longest_streak").eq("user_id", user.id).single(),
    admin
      .from("wisdom_queries")
      .select("*", { count: "exact", head: true })
      .eq("querier_id", user.id),
    admin
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq("status", "accepted"),
    admin
      .from("user_category_stats")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    admin
      .from("response_shares")
      .select("*", { count: "exact", head: true })
      .eq("shared_by", user.id),
  ]);

  const totalResponses = profile?.total_responses ?? 0;
  const longestStreak = streakData?.longest_streak ?? 0;

  // Check each unearned achievement
  const newlyEarned: any[] = [];

  for (const achievement of unearned) {
    let met = false;

    switch (achievement.slug) {
      // Response milestones
      case "first_response":
      case "responses_1":
        met = totalResponses >= 1;
        break;
      case "responses_10":
      case "responses_10_v2":
        met = totalResponses >= 10;
        break;
      case "responses_50":
      case "responses_50_v2":
        met = totalResponses >= 50;
        break;
      case "responses_100":
      case "responses_100_v2":
        met = totalResponses >= 100;
        break;
      case "responses_250":
        met = totalResponses >= 250;
        break;
      case "responses_500":
        met = totalResponses >= 500;
        break;
      case "responses_1000":
        met = totalResponses >= 1000;
        break;

      // Streak milestones
      case "streak_3":
        met = longestStreak >= 3;
        break;
      case "streak_7":
      case "streak_7_v2":
        met = longestStreak >= 7;
        break;
      case "streak_14":
        met = longestStreak >= 14;
        break;
      case "streak_30":
      case "streak_30_v2":
        met = longestStreak >= 30;
        break;
      case "streak_60":
        met = longestStreak >= 60;
        break;
      case "streak_90":
        met = longestStreak >= 90;
        break;
      case "streak_100":
        met = longestStreak >= 100;
        break;
      case "streak_180":
        met = longestStreak >= 180;
        break;
      case "streak_365":
        met = longestStreak >= 365;
        break;

      // Special achievements
      case "first_query":
      case "first_query_v2":
        met = (wisdomQueryCount ?? 0) >= 1;
        break;
      case "first_friend":
        met = (friendshipCount ?? 0) >= 1;
        break;
      case "first_share":
        met = (shareCount ?? 0) >= 1;
        break;

      // Category achievements
      case "cat_1":
        met = (categoryStatCount ?? 0) >= 1;
        break;
      case "cat_5":
      case "categories_5":
        met = (categoryStatCount ?? 0) >= 5;
        break;
      case "cat_10":
        met = (categoryStatCount ?? 0) >= 10;
        break;

      // Other special
      case "first_group":
        // Check group membership
        const { count: groupCount } = await admin
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        met = (groupCount ?? 0) >= 1;
        break;
      case "first_voice":
        // Check voice responses
        const { count: voiceCount } = await admin
          .from("responses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("input_method", "voice");
        met = (voiceCount ?? 0) >= 1;
        break;
      case "legacy_setup":
        const { count: legacyCount } = await admin
          .from("legacy_contacts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        met = (legacyCount ?? 0) >= 1;
        break;
    }

    if (met) {
      const { error } = await admin.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString(),
      });
      if (!error) {
        newlyEarned.push(achievement);
      }
    }
  }

  return NextResponse.json({ newly_earned: newlyEarned });
}
