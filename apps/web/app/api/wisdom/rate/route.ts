import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query_id, rating } = await request.json();

  if (!query_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Valid query_id and rating (1-5) required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("wisdom_queries")
    .update({ rating })
    .eq("id", query_id)
    .eq("querier_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
