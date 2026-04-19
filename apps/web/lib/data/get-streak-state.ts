import { createClient } from "@/lib/supabase/server";
import { applyGraceIfNeeded, ensureWeeklyGrace, isoDateUTC, streakDisplay } from "@/lib/engine/streak-rules";

export interface StreakPayload {
  current_streak: number;
  longest_streak: number;
  unused_tokens: number;
  grace_active: boolean;
  applied_dates: string[];
  display: ReturnType<typeof streakDisplay>;
}

export async function getStreakState(): Promise<StreakPayload | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  await ensureWeeklyGrace(supabase as any, user.id);
  const appliedToday = await applyGraceIfNeeded(supabase as any, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak")
    .eq("id", user.id)
    .maybeSingle();

  const { data: tokens } = await supabase
    .from("streak_grace_tokens")
    .select("id, applied_for_date, applied_at")
    .eq("user_id", user.id);

  const all = tokens ?? [];
  const unused = all.filter((t) => !t.applied_at).length;
  const applied_dates = all.filter((t) => t.applied_for_date).map((t) => t.applied_for_date as string);

  const today = isoDateUTC(new Date());
  const grace_active = appliedToday === today || applied_dates.includes(today);

  const current_streak = profile?.current_streak ?? 0;
  const longest_streak = profile?.longest_streak ?? 0;

  return {
    current_streak,
    longest_streak,
    unused_tokens: unused,
    grace_active,
    applied_dates,
    display: streakDisplay({ current_streak, unused_tokens: unused, grace_active }),
  };
}
