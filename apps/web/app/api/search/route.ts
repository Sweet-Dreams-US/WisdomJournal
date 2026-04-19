import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category");
  const mood = url.searchParams.get("mood");
  const limit = Math.min(50, Math.max(5, Number(url.searchParams.get("limit") ?? 25)));

  const { data, error } = await supabase.rpc("search_user_responses", {
    p_user_id: user.id,
    p_query: q,
    p_category_slug: category ?? null,
    p_mood: mood ?? null,
    p_limit: limit,
  });

  if (error) {
    // Fallback to simple ilike if RPC not yet applied
    let query = supabase
      .from("responses")
      .select(
        "id, response_text, created_at, mood, response_categories:response_categories(category:categories(slug,name))"
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (q) query = query.ilike("response_text", `%${q}%`);
    if (mood) query = query.eq("mood", mood);
    const { data: fallback } = await query;
    return NextResponse.json({
      results: (fallback ?? []).map((r: any) => ({
        response_id: r.id,
        excerpt: (r.response_text ?? "").slice(0, 220),
        created_at: r.created_at,
        category_slug: r.response_categories?.[0]?.category?.slug,
        category_name: r.response_categories?.[0]?.category?.name,
        mood: r.mood,
        rank: 0,
      })),
      fallback: true,
    });
  }

  return NextResponse.json({ results: data ?? [] });
}
