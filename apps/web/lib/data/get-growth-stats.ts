import { createClient } from "@/lib/supabase/server";
import { toLocalDateKey } from "@/lib/utils/dates";

/** One point on the cumulative growth curve — one per active day. */
export interface GrowthPoint {
  /** Local YYYY-MM-DD key for the day. */
  dateKey: string;
  /** Running total of words written up to and including this day. */
  totalWords: number;
  /** Running total of entries written up to and including this day. */
  totalEntries: number;
}

export type WeekdayLabel = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export interface WeekdayCount {
  weekday: WeekdayLabel;
  count: number;
}

export interface GrowthStats {
  cumulative: GrowthPoint[];
  byWeekday: WeekdayCount[];
  /** Local YYYY-MM-DD of the very first entry, or null if none. */
  firstEntryDate: string | null;
}

const WEEKDAYS: WeekdayLabel[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function emptyStats(): GrowthStats {
  return {
    cumulative: [],
    byWeekday: WEEKDAYS.map((weekday) => ({ weekday, count: 0 })),
    firstEntryDate: null,
  };
}

interface RawRow {
  created_at: string;
  word_count: number | null;
}

const PAGE_SIZE = 1000;

/**
 * Growth data for the current user's archive: a cumulative
 * words/entries curve (one point per active day, local timezone) and
 * an entries-by-weekday rhythm. Safe by construction — any failure
 * returns an empty shape rather than throwing.
 */
export async function getGrowthStats(): Promise<GrowthStats> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return emptyStats();

    // Page through all non-deleted responses, oldest first. Supabase
    // caps a single select at 1000 rows, so loop until a short page.
    const rows: RawRow[] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from("responses")
        .select("created_at, word_count")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error("get-growth-stats.ts query error:", error.message);
        break;
      }

      const batch = (data as RawRow[] | null) ?? [];
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (rows.length === 0) return emptyStats();

    const cumulative: GrowthPoint[] = [];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    let totalWords = 0;
    let totalEntries = 0;

    for (const row of rows) {
      const created = new Date(row.created_at);
      if (Number.isNaN(created.getTime())) continue;

      weekdayCounts[created.getDay()] += 1;
      totalWords += row.word_count ?? 0;
      totalEntries += 1;

      const dateKey = toLocalDateKey(created);
      const last = cumulative[cumulative.length - 1];
      if (last && last.dateKey === dateKey) {
        // Same active day — advance the running totals in place.
        last.totalWords = totalWords;
        last.totalEntries = totalEntries;
      } else {
        cumulative.push({ dateKey, totalWords, totalEntries });
      }
    }

    return {
      cumulative,
      byWeekday: WEEKDAYS.map((weekday, i) => ({
        weekday,
        count: weekdayCounts[i],
      })),
      firstEntryDate: cumulative[0]?.dateKey ?? null,
    };
  } catch (error) {
    console.error("getGrowthStats error:", error);
    return emptyStats();
  }
}
