import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import AchievementsClient from "./AchievementsClient";

export default async function AchievementsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createServiceClient(supabaseUrl, serviceKey);

  // Fetch all achievements
  const { data: allAchievements } = await admin
    .from("achievements")
    .select("*")
    .order("sort_order");

  // Fetch user's earned achievements
  const { data: userAchievements } = await admin
    .from("user_achievements")
    .select("achievement_id, earned_at")
    .eq("user_id", user.id);

  // Fetch user stats for progress bars
  const [{ data: profile }, { data: streakData }, { count: categoryCount }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("total_responses")
        .eq("id", user.id)
        .single(),
      admin
        .from("user_streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", user.id)
        .single(),
      admin
        .from("user_category_stats")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const earnedMap: Record<string, string> = {};
  (userAchievements || []).forEach((ua) => {
    earnedMap[ua.achievement_id] = ua.earned_at;
  });

  return (
    <AchievementsClient
      achievements={allAchievements || []}
      earnedMap={earnedMap}
      stats={{
        totalResponses: profile?.total_responses ?? 0,
        currentStreak: streakData?.current_streak ?? 0,
        longestStreak: streakData?.longest_streak ?? 0,
        categoryCount: categoryCount ?? 0,
      }}
    />
  );
}
