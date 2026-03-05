import { createClient } from "@/lib/supabase/server";
import type { EncyclopediaStats } from "@wisdom-journal/shared";

export async function getEncyclopediaStats(): Promise<EncyclopediaStats | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase.rpc("get_encyclopedia_stats", {
    p_user_id: user.id,
  });

  if (!data || data.length === 0) return null;

  const row = data[0];
  return {
    total_responses: Number(row.total_responses),
    total_word_count: Number(row.total_word_count),
    categories_covered: Number(row.categories_covered),
    total_categories: Number(row.total_categories),
    current_streak: row.current_streak,
    longest_streak: row.longest_streak,
    total_queries_received: Number(row.total_queries_received),
    avg_query_rating: row.avg_query_rating ? Number(row.avg_query_rating) : null,
    category_breakdown: row.category_breakdown ?? [],
  } as EncyclopediaStats;
}
