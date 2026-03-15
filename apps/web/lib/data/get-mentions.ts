import { createClient } from "@/lib/supabase/server";

export interface MentionSummary {
  normalized_name: string;
  display_name: string;
  relationship: string | null;
  mention_count: number;
  latest_mention: string;
}

/**
 * Get all unique people mentioned across user's journal entries,
 * grouped by normalized name with counts.
 */
export async function getMentionsSummary(): Promise<MentionSummary[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: mentions } = await supabase
    .from("people_mentions")
    .select("mentioned_name, normalized_name, relationship, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!mentions || mentions.length === 0) return [];

  // Group by normalized name
  const grouped = new Map<string, MentionSummary>();
  for (const m of mentions) {
    const existing = grouped.get(m.normalized_name);
    if (existing) {
      existing.mention_count++;
      if (m.created_at > existing.latest_mention) {
        existing.latest_mention = m.created_at;
      }
      if (!existing.relationship && m.relationship) {
        existing.relationship = m.relationship;
      }
    } else {
      grouped.set(m.normalized_name, {
        normalized_name: m.normalized_name,
        display_name: m.mentioned_name,
        relationship: m.relationship,
        mention_count: 1,
        latest_mention: m.created_at,
      });
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => b.mention_count - a.mention_count
  );
}
