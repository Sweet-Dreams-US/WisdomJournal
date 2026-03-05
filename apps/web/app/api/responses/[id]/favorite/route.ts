import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current favorite status
  const { data: response } = await supabase
    .from("responses")
    .select("is_favorite")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!response) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Toggle
  const { error } = await supabase
    .from("responses")
    .update({ is_favorite: !response.is_favorite })
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ is_favorite: !response.is_favorite });
}
