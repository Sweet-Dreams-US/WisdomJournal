import { createClient } from "@/lib/supabase/server";

/**
 * Pick a contextual one-liner to show during the reflection ritual.
 * Pulled from the user's own recent activity so it always feels personal.
 * Returns null when we don't have enough context — better silence than filler.
 */
export async function getContextLine(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, total_responses, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const firstName = profile.full_name?.split(" ")[0];

  // Try category that's been trending recently
  const { data: recent } = await supabase
    .from("responses")
    .select("created_at, categories:response_categories(category:categories(name, slug))")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(7);

  const categoryCounts = new Map<string, number>();
  for (const r of recent ?? []) {
    const cat = (r as any).categories?.[0]?.category?.name;
    if (cat) categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  const topRecent = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const streak = profile.current_streak ?? 0;

  // Priority of lines — pick first that matches
  const candidates: Array<string | null> = [
    streak >= 100 ? `Day ${streak}. You've kept coming back.` : null,
    streak >= 30 ? `Day ${streak}. A month of showing up.` : null,
    streak >= 7 && streak < 30 ? `Day ${streak}. The habit is forming.` : null,
    topRecent && topRecent[1] >= 3 ? `You've been circling ${topRecent[0].toLowerCase()} lately.` : null,
    profile.total_responses >= 1 && profile.total_responses <= 3 ? "This is still new. That's okay." : null,
    profile.total_responses === 0 ? `Welcome${firstName ? `, ${firstName}` : ""}. Begin gently.` : null,
  ];

  const chosen = candidates.find((c) => c !== null);
  return chosen ?? null;
}
