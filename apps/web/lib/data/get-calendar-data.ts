import { createClient } from "@/lib/supabase/server";

/** A single journal entry, flattened for the month-view calendar. */
export interface CalendarEntry {
  id: string;
  created_at: string;
  word_count: number;
  response_text: string | null;
  question_text: string | null;
  category: { slug: string; name: string } | null;
}

interface RawCategoryJoin {
  source: string | null;
  category:
    | { slug: string; name: string }
    | { slug: string; name: string }[]
    | null;
}

interface RawCalendarRow {
  id: string;
  created_at: string;
  word_count: number | null;
  response_text: string | null;
  question:
    | { question_text: string }
    | { question_text: string }[]
    | null;
  categories: RawCategoryJoin[] | null;
}

/** Supabase join results can be object or array depending on FK shape. */
function firstOf<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

/**
 * All of the current user's non-deleted responses with the fields the
 * calendar needs: question text and primary category via joins.
 */
export async function getCalendarData(): Promise<CalendarEntry[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("responses")
    .select(
      `
      id,
      created_at,
      word_count,
      response_text,
      question:questions(question_text:text),
      categories:response_categories(
        source,
        category:categories(slug, name)
      )
      `
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("get-calendar-data.ts query error:", error.message);
  }

  const rows = (data as unknown as RawCalendarRow[]) ?? [];

  return rows.map((row) => {
    const joins = row.categories ?? [];
    const primaryJoin =
      joins.find((j) => j.source === "primary") ?? joins[0] ?? null;
    const category = primaryJoin ? firstOf(primaryJoin.category) : null;
    const question = firstOf(row.question);

    return {
      id: row.id,
      created_at: row.created_at,
      word_count: row.word_count ?? 0,
      response_text: row.response_text,
      question_text: question?.question_text ?? null,
      category,
    };
  });
}
