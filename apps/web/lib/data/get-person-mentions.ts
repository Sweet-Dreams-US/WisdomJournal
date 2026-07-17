import { createClient } from "@/lib/supabase/server";

export interface PersonEntry {
  response_id: string;
  response_text: string;
  created_at: string;
  word_count: number;
  question_text: string | null;
  category: { slug: string; name: string } | null;
}

export interface PersonDetail {
  normalized_name: string;
  display_name: string;
  relationship: string | null;
  first_mention: string;
  last_mention: string;
  total_count: number;
  entries: PersonEntry[];
}

interface MentionRow {
  id: string;
  mentioned_name: string;
  normalized_name: string;
  relationship: string | null;
  created_at: string;
  response: {
    id: string;
    response_text: string | null;
    created_at: string;
    word_count: number | null;
    deleted_at: string | null;
    question: { question_text: string } | null;
    categories: { category: { slug: string; name: string } | null }[] | null;
  } | null;
}

function mostCommon(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Get every mention of a person (by normalized name) for the current user,
 * joined to the journal entries they appear in, plus aggregate details.
 * Returns null when the user has no mentions of that name.
 */
export async function getPersonMentions(
  normalizedName: string
): Promise<PersonDetail | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("people_mentions")
    .select(
      `
      id,
      mentioned_name,
      normalized_name,
      relationship,
      created_at,
      response:responses(
        id,
        response_text,
        created_at,
        word_count,
        deleted_at,
        question:questions(question_text:text),
        categories:response_categories(category:categories(slug, name))
      )
      `
    )
    .eq("user_id", user.id)
    .eq("normalized_name", normalizedName)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("get-person-mentions.ts query error:", error.message);
  }

  const mentions = (data as unknown as MentionRow[] | null) ?? [];
  if (mentions.length === 0) return null;

  // Aggregates: most common display name, most common non-null relationship,
  // and first/latest mention timestamps.
  const nameCounts = new Map<string, number>();
  const relationshipCounts = new Map<string, number>();
  let first = mentions[0].created_at;
  let last = mentions[0].created_at;

  for (const m of mentions) {
    nameCounts.set(m.mentioned_name, (nameCounts.get(m.mentioned_name) ?? 0) + 1);
    if (m.relationship) {
      relationshipCounts.set(
        m.relationship,
        (relationshipCounts.get(m.relationship) ?? 0) + 1
      );
    }
    if (m.created_at < first) first = m.created_at;
    if (m.created_at > last) last = m.created_at;
  }

  // One entry per response; skip soft-deleted responses.
  const seen = new Set<string>();
  const entries: PersonEntry[] = [];
  for (const m of mentions) {
    const r = m.response;
    if (!r || r.deleted_at || seen.has(r.id)) continue;
    seen.add(r.id);
    entries.push({
      response_id: r.id,
      response_text: r.response_text ?? "",
      created_at: r.created_at,
      word_count: r.word_count ?? 0,
      question_text: r.question?.question_text ?? null,
      category: r.categories?.[0]?.category ?? null,
    });
  }

  // Newest first (ISO timestamps sort lexicographically).
  entries.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    normalized_name: normalizedName,
    display_name: mostCommon(nameCounts) ?? mentions[0].mentioned_name,
    relationship: mostCommon(relationshipCounts),
    first_mention: first,
    last_mention: last,
    total_count: mentions.length,
    entries,
  };
}
