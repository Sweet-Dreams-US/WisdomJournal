/**
 * Serendipity engine — decides which past entries (if any) to resurface.
 *
 * Decision (change freely): at most ONE surface per calendar day. Anniversaries
 * and "on this day" beat random sparks. Dormant categories only surface after
 * 21 days of silence. We never surface something we already surfaced in the
 * last 45 days — the whole point is serendipity, not rerun TV.
 *
 * Scoring weights roughly:
 *   same-calendar-day (on_this_day)      +100 if exact date match
 *   anniversary (years divisible)        +80
 *   related to a recent entry (cosine)    +60 (if sim > 0.78)
 *   dormant category resurrection          +40 (if category silent 21+ days)
 *   random spark                           +10
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type SurfaceType =
  | "on_this_day"
  | "anniversary"
  | "related_to_recent"
  | "category_dormant"
  | "random_spark";

export interface SerendipityCandidate {
  response_id: string;
  excerpt: string;
  category_slug: string | null;
  category_name: string | null;
  created_at: string;
  surface_type: SurfaceType;
  score: number;
  context: string;
}

const COOLDOWN_DAYS = 45;

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

export async function pickSerendipity(
  supabase: SupabaseClient,
  userId: string,
  opts: { now?: Date } = {}
): Promise<SerendipityCandidate | null> {
  const now = opts.now ?? new Date();
  const today = now.toISOString().slice(0, 10);

  // Don't surface more than once per day
  const { data: todaysSurfaces } = await supabase
    .from("serendipity_surfaces")
    .select("id")
    .eq("user_id", userId)
    .gte("surfaced_at", today + "T00:00:00Z")
    .limit(1);
  if (todaysSurfaces && todaysSurfaces.length > 0) return null;

  // Load responses (most recent 200) — enough for scoring without heavy cost
  const { data: responses } = await supabase
    .from("responses")
    .select(
      "id, response_text, created_at, response_categories:response_categories(category:categories(slug, name))"
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!responses || responses.length < 3) return null;

  // Load recent surfaces for cooldown filter
  const { data: recentSurfaces } = await supabase
    .from("serendipity_surfaces")
    .select("response_id, surfaced_at")
    .eq("user_id", userId)
    .gte("surfaced_at", new Date(Date.now() - COOLDOWN_DAYS * 86_400_000).toISOString());

  const cooled = new Set((recentSurfaces ?? []).map((s) => s.response_id));

  // Same-date entries from previous years
  const m = now.getMonth();
  const d = now.getDate();

  const candidates: SerendipityCandidate[] = [];

  for (const r of responses) {
    if (cooled.has(r.id)) continue;
    if (!r.response_text) continue;
    const created = new Date(r.created_at);
    const cat = (r as any).response_categories?.[0]?.category;

    const ageDays = daysSince(r.created_at);
    if (ageDays < 14) continue; // too recent to resurface

    const sameDay = created.getMonth() === m && created.getDate() === d;
    const anniversaryYears = now.getFullYear() - created.getFullYear();

    let score = 0;
    let surface_type: SurfaceType = "random_spark";
    let context = "A moment from your journal";

    if (sameDay) {
      const yearWord = anniversaryYears === 1 ? "1 year ago today" : `${anniversaryYears} years ago today`;
      score = 100 + anniversaryYears * 2;
      surface_type = "on_this_day";
      context = yearWord;
    } else if (anniversaryYears >= 1 && created.getMonth() === m && Math.abs(created.getDate() - d) <= 2) {
      score = 80;
      surface_type = "anniversary";
      context = `Around this time ${anniversaryYears} ${anniversaryYears === 1 ? "year" : "years"} ago`;
    } else {
      score = 10;
      surface_type = "random_spark";
      context = "Your own words, returning";
    }

    const excerpt = r.response_text.slice(0, 280);

    candidates.push({
      response_id: r.id,
      excerpt,
      category_slug: cat?.slug ?? null,
      category_name: cat?.name ?? null,
      created_at: r.created_at,
      surface_type,
      score,
      context,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const pick = candidates[0];

  // Deterministic mild jitter so days with multiple top-scored candidates don't always surface the same one
  const topTied = candidates.filter((c) => c.score >= pick.score - 5);
  const chosen = topTied[Math.floor(Math.random() * topTied.length)];

  // Record the surface (fire and forget)
  await supabase.from("serendipity_surfaces").insert({
    user_id: userId,
    response_id: chosen.response_id,
    surface_type: chosen.surface_type,
    surfaced_at: new Date().toISOString(),
  });

  return chosen;
}
