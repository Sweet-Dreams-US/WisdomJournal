import { createClient } from "@/lib/supabase/server";
import { toLocalDateKey, todayKey } from "@/lib/utils/dates";

export interface DayActivity {
  /** YYYY-MM-DD local date key (see lib/utils/dates). */
  dateKey: string;
  /** Number of non-deleted responses written that day. */
  count: number;
  isToday: boolean;
}

/**
 * Entry counts for the current user over the last 7 local days
 * (oldest -> newest, today last). Days with no entries are included
 * with count 0 so the strip always has 7 slots.
 *
 * Returns [] when unauthenticated or on query failure so callers can
 * simply hide the visualization.
 */
export async function getWeekActivity(): Promise<DayActivity[]> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // Start of the local day 6 days ago — covers 7 local days incl. today.
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("responses")
      .select("created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", start.toISOString());

    if (error) {
      console.error("getWeekActivity error:", error);
      return [];
    }

    // Group by LOCAL calendar day, never by UTC date substring.
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      if (!row?.created_at) continue;
      const key = toLocalDateKey(row.created_at);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const today = todayKey();
    const days: DayActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = toLocalDateKey(d);
      days.push({
        dateKey,
        count: counts.get(dateKey) ?? 0,
        isToday: dateKey === today,
      });
    }

    return days;
  } catch (error) {
    console.error("getWeekActivity error:", error);
    return [];
  }
}
