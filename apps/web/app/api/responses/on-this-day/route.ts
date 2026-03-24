import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface OnThisDayItem {
  response: Record<string, any>;
  time_ago_label: string;
}

/**
 * GET /api/responses/on-this-day
 * Fetches user's responses from the same date in previous years,
 * as well as 1 month, 3 months, and 6 months ago.
 */
export async function GET(_request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: OnThisDayItem[] = [];

  // Define the lookback points
  const lookbackPoints: { label: string; date: Date }[] = [];

  // Previous years (up to 5 years back)
  for (let yearsAgo = 1; yearsAgo <= 5; yearsAgo++) {
    const pastDate = new Date(now);
    pastDate.setFullYear(pastDate.getFullYear() - yearsAgo);
    lookbackPoints.push({
      label: `${yearsAgo} year${yearsAgo === 1 ? "" : "s"} ago`,
      date: pastDate,
    });
  }

  // Fixed interval lookbacks
  const intervals: { months: number; label: string }[] = [
    { months: 6, label: "6 months ago" },
    { months: 3, label: "3 months ago" },
    { months: 1, label: "1 month ago" },
  ];

  for (const interval of intervals) {
    const pastDate = new Date(now);
    pastDate.setMonth(pastDate.getMonth() - interval.months);
    lookbackPoints.push({ label: interval.label, date: pastDate });
  }

  // For each lookback point, find responses within +/- 3 days
  for (const point of lookbackPoints) {
    const windowStart = new Date(point.date);
    windowStart.setDate(windowStart.getDate() - 3);
    const windowEnd = new Date(point.date);
    windowEnd.setDate(windowEnd.getDate() + 3);
    windowEnd.setHours(23, 59, 59, 999);

    // Skip if the window extends into the future or is too recent (less than 25 days ago)
    const daysAgo = (now.getTime() - point.date.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 25) continue;

    const { data: responses } = await supabase
      .from("responses")
      .select(
        `
        id,
        response_text,
        word_count,
        created_at,
        question:questions(question_text),
        categories:response_categories(
          category:categories(name, slug, icon)
        )
      `
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", windowStart.toISOString())
      .lte("created_at", windowEnd.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (responses && responses.length > 0) {
      results.push({
        response: responses[0],
        time_ago_label: point.label,
      });
    }
  }

  // Sort by oldest first (most distant memory first)
  results.sort((a, b) => {
    const aDate = new Date(a.response.created_at).getTime();
    const bDate = new Date(b.response.created_at).getTime();
    return aDate - bDate;
  });

  return NextResponse.json({ items: results });
}
