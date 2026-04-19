import { createClient } from "@/lib/supabase/server";

export interface WeeklyDigest {
  week_start: string;
  week_end: string;
  response_count: number;
  word_count: number;
  streak_at_end: number;
  top_categories: Array<{ slug: string; name: string; count: number }>;
  top_moods: Array<{ mood: string; count: number }>;
  top_people: Array<{ name: string; count: number }>;
  longest_response: { id: string; excerpt: string; created_at: string } | null;
  highlighted_response: { id: string; excerpt: string; created_at: string } | null;
  streak_milestone: string | null;
}

function mondayOf(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function extractPeople(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  const stops = new Set(["I", "The", "A", "An", "My", "Your", "His", "Her", "Their", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
  const matches = text.matchAll(/\b([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,}){0,2})\b/g);
  for (const m of matches) {
    const name = m[1];
    if (stops.has(name) || name.length < 3) continue;
    out.push(name);
  }
  return out;
}

export async function getWeeklyDigest(opts: { weekOffset?: number } = {}): Promise<WeeklyDigest | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const thisMonday = mondayOf(now);
  const offset = opts.weekOffset ?? 0;
  const weekStart = new Date(thisMonday);
  weekStart.setDate(weekStart.getDate() + offset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak")
    .eq("id", user.id)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("responses")
    .select("id, response_text, created_at, mood, word_count, response_categories:response_categories(category:categories(slug, name))")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("created_at", weekStart.toISOString())
    .lt("created_at", weekEnd.toISOString())
    .order("created_at", { ascending: true });

  const responses = rows ?? [];
  if (responses.length === 0) {
    return {
      week_start: weekStart.toISOString().slice(0, 10),
      week_end: weekEnd.toISOString().slice(0, 10),
      response_count: 0,
      word_count: 0,
      streak_at_end: profile?.current_streak ?? 0,
      top_categories: [],
      top_moods: [],
      top_people: [],
      longest_response: null,
      highlighted_response: null,
      streak_milestone: null,
    };
  }

  const categoryCounts = new Map<string, { slug: string; name: string; count: number }>();
  const moodCounts = new Map<string, number>();
  const peopleCounts = new Map<string, number>();
  let totalWords = 0;
  let longest = responses[0];

  for (const r of responses) {
    totalWords += r.word_count ?? 0;
    const cat = (r as any).response_categories?.[0]?.category;
    if (cat) {
      const k = cat.slug;
      const existing = categoryCounts.get(k) ?? { slug: cat.slug, name: cat.name, count: 0 };
      existing.count += 1;
      categoryCounts.set(k, existing);
    }
    if (r.mood) moodCounts.set(r.mood, (moodCounts.get(r.mood) ?? 0) + 1);
    for (const p of extractPeople(r.response_text ?? "")) {
      peopleCounts.set(p, (peopleCounts.get(p) ?? 0) + 1);
    }
    if ((r.word_count ?? 0) > (longest.word_count ?? 0)) longest = r;
  }

  const top_categories = [...categoryCounts.values()].sort((a, b) => b.count - a.count).slice(0, 3);
  const top_moods = [...moodCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mood, count]) => ({ mood, count }));
  const top_people = [...peopleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const streak = profile?.current_streak ?? 0;
  const streak_milestone =
    streak === 7 ? "One week straight"
    : streak === 30 ? "One month streak"
    : streak === 100 ? "Triple digits"
    : streak === 365 ? "A full year"
    : null;

  // Highlighted: middle entry by length if nothing stands out
  const sorted = [...responses].sort((a, b) => (b.word_count ?? 0) - (a.word_count ?? 0));
  const highlight = sorted[Math.min(1, sorted.length - 1)];

  return {
    week_start: weekStart.toISOString().slice(0, 10),
    week_end: weekEnd.toISOString().slice(0, 10),
    response_count: responses.length,
    word_count: totalWords,
    streak_at_end: streak,
    top_categories,
    top_moods,
    top_people,
    longest_response: {
      id: longest.id,
      excerpt: (longest.response_text ?? "").slice(0, 260),
      created_at: longest.created_at,
    },
    highlighted_response: highlight
      ? { id: highlight.id, excerpt: (highlight.response_text ?? "").slice(0, 260), created_at: highlight.created_at }
      : null,
    streak_milestone,
  };
}
