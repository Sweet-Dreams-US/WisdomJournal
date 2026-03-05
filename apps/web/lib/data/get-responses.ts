import { createClient } from "@/lib/supabase/server";
import type { JournalResponse } from "@wisdom-journal/shared";

interface GetResponsesOptions {
  category?: string | null;
  search?: string | null;
  date?: string | null;
  limit?: number;
  offset?: number;
}

export async function getResponses(
  options: GetResponsesOptions = {}
): Promise<JournalResponse[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("responses")
    .select(
      `
      *,
      categories:response_categories(
        *,
        category:categories(*)
      )
      `
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Category filter
  if (options.category) {
    query = query.filter(
      "response_categories.category.slug",
      "eq",
      options.category
    );
  }

  // Text search
  if (options.search) {
    query = query.ilike("response_text", `%${options.search}%`);
  }

  // Pagination
  if (options.limit) {
    const start = options.offset ?? 0;
    query = query.range(start, start + options.limit - 1);
  }

  const { data } = await query;

  return (data as unknown as JournalResponse[]) ?? [];
}
