import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

interface Pattern {
  type: "frequency" | "category_trend" | "word_count_trend" | "consistency";
  message: string;
  data: Record<string, any>;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * GET /api/insights/patterns
 * Analyzes the current user's last 30 days of responses and returns detected patterns.
 * Pure SQL analysis — no AI calls.
 */
export async function GET(_request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 requests per hour
  const limit = rateLimit(user.id, "patterns", 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before checking patterns again." },
      { status: 429 }
    );
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  // Fetch responses from the last 30 days
  const { data: responses } = await supabase
    .from("responses")
    .select("id, word_count, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("created_at", thirtyDaysAgoISO)
    .order("created_at", { ascending: true });

  if (!responses || responses.length === 0) {
    return NextResponse.json({ patterns: [] });
  }

  const patterns: Pattern[] = [];

  // ─── Frequency patterns (day of week) ────────────────────────────────
  const dayOfWeekCounts: Record<number, number> = {};
  const hourCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  for (const r of responses) {
    const date = new Date(r.created_at);
    const dow = date.getUTCDay();
    dayOfWeekCounts[dow] = (dayOfWeekCounts[dow] || 0) + 1;

    const hour = date.getUTCHours();
    if (hour >= 5 && hour < 12) hourCounts.morning++;
    else if (hour >= 12 && hour < 17) hourCounts.afternoon++;
    else if (hour >= 17 && hour < 21) hourCounts.evening++;
    else hourCounts.night++;
  }

  // Find top day of week
  const topDow = Object.entries(dayOfWeekCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (topDow) {
    const dayName = DAY_NAMES[parseInt(topDow[0])];
    patterns.push({
      type: "frequency",
      message: `You journal most on ${dayName}s (${topDow[1]} responses this month).`,
      data: { day: dayName, count: parseInt(String(topDow[1])) },
    });
  }

  // Find top time of day
  const topTime = Object.entries(hourCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (topTime && topTime[1] > 0) {
    patterns.push({
      type: "frequency",
      message: `You tend to write more in the ${topTime[0]}.`,
      data: { timeOfDay: topTime[0], count: topTime[1] },
    });
  }

  // ─── Category trends ─────────────────────────────────────────────────
  const responseIds = responses.map((r: any) => r.id);

  if (responseIds.length > 0) {
    const { data: catData } = await supabase
      .from("response_categories")
      .select("category_id, response:responses!inner(created_at), category:categories(name)")
      .in("response_id", responseIds);

    if (catData && catData.length > 0) {
      // Split into first half / second half of the 30 days
      const midpoint = new Date();
      midpoint.setDate(midpoint.getDate() - 15);
      const midpointISO = midpoint.toISOString();

      const catCountFirst: Record<string, number> = {};
      const catCountSecond: Record<string, number> = {};
      const catNames: Record<string, string> = {};

      for (const rc of catData) {
        const catName = (rc as any).category?.name;
        const catId = rc.category_id;
        const createdAt = (rc as any).response?.created_at;
        if (!catName || !createdAt) continue;
        catNames[catId] = catName;

        if (createdAt < midpointISO) {
          catCountFirst[catId] = (catCountFirst[catId] || 0) + 1;
        } else {
          catCountSecond[catId] = (catCountSecond[catId] || 0) + 1;
        }
      }

      // Report categories with significant change
      for (const catId of Object.keys(catNames)) {
        const first = catCountFirst[catId] || 0;
        const second = catCountSecond[catId] || 0;
        if (first === 0 && second >= 3) {
          patterns.push({
            type: "category_trend",
            message: `${catNames[catId]} is a new focus this month with ${second} responses.`,
            data: { category: catNames[catId], firstHalf: first, secondHalf: second },
          });
        } else if (first > 0 && second > first) {
          const pctChange = Math.round(((second - first) / first) * 100);
          if (pctChange >= 50) {
            patterns.push({
              type: "category_trend",
              message: `${catNames[catId]} responses increased ${pctChange}% this month.`,
              data: { category: catNames[catId], percentChange: pctChange },
            });
          }
        }
      }
    }
  }

  // ─── Word count trends ────────────────────────────────────────────────
  if (responses.length >= 4) {
    const half = Math.floor(responses.length / 2);
    const firstHalf = responses.slice(0, half);
    const secondHalf = responses.slice(half);

    const avgFirst =
      firstHalf.reduce((s: number, r: any) => s + (r.word_count || 0), 0) /
      firstHalf.length;
    const avgSecond =
      secondHalf.reduce((s: number, r: any) => s + (r.word_count || 0), 0) /
      secondHalf.length;

    if (avgFirst > 0) {
      const change = ((avgSecond - avgFirst) / avgFirst) * 100;
      if (Math.abs(change) >= 20) {
        const direction = change > 0 ? "longer" : "shorter";
        patterns.push({
          type: "word_count_trend",
          message: `Your responses are getting ${direction} (${Math.round(avgFirst)} to ${Math.round(avgSecond)} avg words).`,
          data: {
            direction,
            avgFirst: Math.round(avgFirst),
            avgSecond: Math.round(avgSecond),
            percentChange: Math.round(change),
          },
        });
      }
    }
  }

  // ─── Consistency ──────────────────────────────────────────────────────
  // Check the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentResponses = responses.filter(
    (r: any) => new Date(r.created_at) >= sevenDaysAgo
  );

  // Count unique days with responses in the last 7 days
  const uniqueDays = new Set(
    recentResponses.map((r: any) =>
      new Date(r.created_at).toISOString().split("T")[0]
    )
  );

  if (uniqueDays.size === 7) {
    patterns.push({
      type: "consistency",
      message: "You have answered every day this week. Amazing consistency!",
      data: { daysActive: 7, daysInWindow: 7 },
    });
  } else if (uniqueDays.size >= 5) {
    patterns.push({
      type: "consistency",
      message: `You journaled ${uniqueDays.size} out of the last 7 days. Great consistency!`,
      data: { daysActive: uniqueDays.size, daysInWindow: 7 },
    });
  } else {
    const missed = 7 - uniqueDays.size;
    patterns.push({
      type: "consistency",
      message: `You missed ${missed} day${missed === 1 ? "" : "s"} this week. Try to build a daily habit.`,
      data: { daysActive: uniqueDays.size, daysMissed: missed, daysInWindow: 7 },
    });
  }

  return NextResponse.json({ patterns });
}
