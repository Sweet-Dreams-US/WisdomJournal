import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Find semantically-related responses to a given response via pgvector.
 * Uses the response's own stored embedding (no new embedding call needed).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: root } = await supabase
    .from("responses")
    .select("id, user_id")
    .eq("id", params.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!root) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (root.user_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: embedRow } = await admin
    .from("response_embeddings")
    .select("embedding")
    .eq("response_id", params.id)
    .eq("chunk_index", 0)
    .maybeSingle();

  if (!embedRow?.embedding) {
    return NextResponse.json({ related: [] });
  }

  const { data, error } = await admin.rpc("match_response_embeddings", {
    p_user_id: user.id,
    p_embedding: embedRow.embedding,
    p_exclude_response_id: params.id,
    p_match_threshold: 0.72,
    p_match_count: 6,
  });

  if (error) {
    // Fallback: simple by-category nearest if RPC doesn't exist yet
    const { data: fallback } = await supabase
      .from("responses")
      .select("id, response_text, created_at, response_categories:response_categories(category:categories(slug,name))")
      .eq("user_id", user.id)
      .neq("id", params.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6);
    return NextResponse.json({
      related: (fallback ?? []).map((r: any) => ({
        response_id: r.id,
        excerpt: (r.response_text ?? "").slice(0, 200),
        created_at: r.created_at,
        category_name: r.response_categories?.[0]?.category?.name,
        similarity: null,
      })),
    });
  }

  return NextResponse.json({ related: data ?? [] });
}
