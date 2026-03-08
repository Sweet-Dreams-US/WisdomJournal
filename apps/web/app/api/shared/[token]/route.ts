import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  // Find the share by token
  const { data: share } = await supabase
    .from("response_shares")
    .select(`
      *,
      response:responses(
        id, response_text, word_count, input_method, created_at,
        question:questions(text),
        categories:response_categories(category:categories(name, slug))
      )
    `)
    .eq("share_token", params.token)
    .single();

  if (!share) {
    return NextResponse.json({ error: "Shared response not found" }, { status: 404 });
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
  }

  // Mark as viewed if first time
  if (!share.viewed_at) {
    await supabase
      .from("response_shares")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", share.id);
  }

  // Get sharer's name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", share.shared_by)
    .single();

  return NextResponse.json({
    response: share.response,
    shared_by_name: profile?.full_name || "Someone",
    message: share.message,
  });
}
