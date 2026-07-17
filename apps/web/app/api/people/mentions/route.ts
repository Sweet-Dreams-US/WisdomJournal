import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = request.nextUrl.searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Name parameter is required" },
      { status: 400 }
    );
  }

  const { data: mentions } = await supabase
    .from("people_mentions")
    .select(
      `
      id,
      response_id,
      mentioned_name,
      relationship,
      created_at,
      response:responses(id, response_text, created_at)
    `
    )
    .eq("user_id", user.id)
    .eq("normalized_name", name.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ mentions: mentions ?? [] });
}
