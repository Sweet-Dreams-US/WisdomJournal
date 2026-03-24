import { createClient } from "@/lib/supabase/server";

export interface CategoryTrend {
  category_id: string;
  recent_count: number;  // last 30 days
  previous_count: number; // 30-60 days ago
}

export async function getCategoryTrends(): Promise<CategoryTrend[]> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch responses from last 60 days with their categories
    const { data: responses } = await supabase
      .from("responses")
      .select(`
        id,
        created_at,
        categories:response_categories(category_id)
      `)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", sixtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!responses || responses.length === 0) return [];

    // Count per category for recent (0-30 days) vs previous (30-60 days)
    const trendMap = new Map<string, { recent: number; previous: number }>();

    for (const response of responses) {
      const createdAt = new Date(response.created_at);
      const isRecent = createdAt >= thirtyDaysAgo;
      const cats = (response as any).categories ?? [];

      for (const cat of cats) {
        const catId = cat.category_id;
        if (!trendMap.has(catId)) {
          trendMap.set(catId, { recent: 0, previous: 0 });
        }
        const entry = trendMap.get(catId)!;
        if (isRecent) {
          entry.recent++;
        } else {
          entry.previous++;
        }
      }
    }

    return Array.from(trendMap.entries()).map(([category_id, counts]) => ({
      category_id,
      recent_count: counts.recent,
      previous_count: counts.previous,
    }));
  } catch (error) {
    console.error("getCategoryTrends error:", error);
    return [];
  }
}
