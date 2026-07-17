import { createClient } from "@/lib/supabase/server";
import { getEncyclopediaStats } from "@/lib/data/get-encyclopedia-stats";
import type { Achievement } from "@wisdom-journal/shared";

export interface AchievementProgressStats {
  current_streak: number;
  longest_streak: number;
  total_responses: number;
  categories_covered: number;
}

export interface AchievementsData {
  achievements: Achievement[];
  /** achievement_id -> earned_at ISO timestamp */
  earnedById: Record<string, string>;
  stats: AchievementProgressStats;
}

export async function getAchievements(): Promise<AchievementsData | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const [achievementsRes, earnedRes, profileRes, encyclopediaStats] =
      await Promise.all([
        supabase
          .from("achievements")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("user_achievements")
          .select("achievement_id, earned_at")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("current_streak, longest_streak, total_responses")
          .eq("id", user.id)
          .maybeSingle(),
        getEncyclopediaStats(),
      ]);

    if (achievementsRes.error) {
      console.error("getAchievements query error:", achievementsRes.error);
      return null;
    }

    const achievements = (achievementsRes.data ?? []) as Achievement[];

    const earnedById: Record<string, string> = {};
    for (const row of earnedRes.data ?? []) {
      earnedById[row.achievement_id as string] = row.earned_at as string;
    }

    const profile = profileRes.data;

    return {
      achievements,
      earnedById,
      stats: {
        current_streak: profile?.current_streak ?? 0,
        longest_streak: profile?.longest_streak ?? 0,
        total_responses: profile?.total_responses ?? 0,
        categories_covered: encyclopediaStats?.categories_covered ?? 0,
      },
    };
  } catch (error) {
    console.error("getAchievements error:", error);
    return null;
  }
}
