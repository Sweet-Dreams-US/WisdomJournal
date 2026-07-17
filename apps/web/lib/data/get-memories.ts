import { createClient } from "@/lib/supabase/server";

export type MemoryLabel = "One year ago" | "One month ago" | "One week ago";

export interface Memory {
  label: MemoryLabel;
  response_id: string;
  response_text: string;
  question_text: string | null;
  category_slug: string | null;
  category_name: string | null;
  created_at: string;
}

interface MemoryBucket {
  label: MemoryLabel;
  daysAgo: number;
  /** How many days on either side of the target date to accept. */
  windowDays: number;
}

// Ordered nearest-first so dedupe favors the closer bucket; display order
// (year -> month -> week) is restored at the end.
const BUCKETS: MemoryBucket[] = [
  { label: "One week ago", daysAgo: 7, windowDays: 0 },
  { label: "One month ago", daysAgo: 30, windowDays: 1 },
  { label: "One year ago", daysAgo: 365, windowDays: 2 },
];

const DISPLAY_ORDER: MemoryLabel[] = [
  "One year ago",
  "One month ago",
  "One week ago",
];

function bucketRange(bucket: MemoryBucket): {
  start: Date;
  end: Date;
  target: Date;
} {
  const target = new Date();
  target.setDate(target.getDate() - bucket.daysAgo);

  const start = new Date(target);
  start.setDate(start.getDate() - bucket.windowDays);
  start.setHours(0, 0, 0, 0);

  const end = new Date(target);
  end.setDate(end.getDate() + bucket.windowDays);
  end.setHours(23, 59, 59, 999);

  return { start, end, target };
}

/**
 * Up to 3 "on this day" memories for the current user: one entry from
 * roughly a year ago, a month ago, and a week ago. At most one per
 * bucket; empty buckets are skipped and a response never appears twice.
 */
export async function getMemories(): Promise<Memory[]> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const results = await Promise.all(
      BUCKETS.map(async (bucket) => {
        const { start, end, target } = bucketRange(bucket);

        const { data, error } = await supabase
          .from("responses")
          .select(
            `
            id,
            response_text,
            created_at,
            question:questions(question_text:text),
            categories:response_categories(category:categories(slug, name))
            `
          )
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error(`getMemories (${bucket.label}) error:`, error);
          return { bucket, rows: [] as any[], target };
        }

        return { bucket, rows: (data ?? []) as any[], target };
      })
    );

    const usedIds = new Set<string>();
    const byLabel = new Map<MemoryLabel, Memory>();

    // Nearest bucket first: a response already claimed by a nearer bucket
    // is skipped by farther ones.
    for (const { bucket, rows, target } of results) {
      const candidates = rows.filter(
        (row) => !usedIds.has(row.id) && row.response_text
      );
      if (candidates.length === 0) continue;

      // Pick the entry closest to the target date within the window.
      const pick = candidates.reduce((best, row) => {
        const bestDiff = Math.abs(
          new Date(best.created_at).getTime() - target.getTime()
        );
        const rowDiff = Math.abs(
          new Date(row.created_at).getTime() - target.getTime()
        );
        return rowDiff < bestDiff ? row : best;
      });

      const question = Array.isArray(pick.question)
        ? pick.question[0]
        : pick.question;

      const firstCategoryRow = Array.isArray(pick.categories)
        ? pick.categories[0]
        : null;
      const category =
        firstCategoryRow && Array.isArray(firstCategoryRow.category)
          ? firstCategoryRow.category[0]
          : firstCategoryRow?.category;

      usedIds.add(pick.id);
      byLabel.set(bucket.label, {
        label: bucket.label,
        response_id: pick.id,
        response_text: pick.response_text,
        question_text: question?.question_text ?? null,
        category_slug: category?.slug ?? null,
        category_name: category?.name ?? null,
        created_at: pick.created_at,
      });
    }

    return DISPLAY_ORDER.map((label) => byLabel.get(label)).filter(
      (m): m is Memory => Boolean(m)
    );
  } catch (error) {
    console.error("getMemories error:", error);
    return [];
  }
}
