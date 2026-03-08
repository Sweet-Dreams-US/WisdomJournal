import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the response belongs to the user
  const { data: response } = await supabase
    .from("responses")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!response) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  const body = await request.json();
  const { share_type, shared_with_user_id, shared_with_group_id, message } = body;

  const shareToken = share_type === "link" ? randomBytes(16).toString("hex") : null;

  const { data: share, error } = await supabase
    .from("response_shares")
    .insert({
      response_id: params.id,
      shared_by: user.id,
      share_type: share_type || "link",
      share_token: shareToken,
      shared_with_user_id: shared_with_user_id || null,
      shared_with_group_id: shared_with_group_id || null,
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ share }, { status: 201 });
}

// Get shares for a response
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: shares } = await supabase
    .from("response_shares")
    .select("*")
    .eq("response_id", params.id)
    .eq("shared_by", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ shares: shares || [] });
}

// Delete a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { share_id } = await request.json();

  await supabase
    .from("response_shares")
    .delete()
    .eq("id", share_id)
    .eq("shared_by", user.id);

  return NextResponse.json({ success: true });
}
