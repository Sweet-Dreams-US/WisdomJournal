import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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

  const body = await request.json();
  const { response_text, tags, mood } = body;

  // Verify ownership
  const { data: existing } = await supabase
    .from("responses")
    .select("id, user_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  // Build update object
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (response_text !== undefined) {
    if (!response_text?.trim()) {
      return NextResponse.json({ error: "Response text cannot be empty" }, { status: 400 });
    }
    updates.response_text = response_text.trim();
    updates.word_count = response_text.trim().split(/\s+/).filter(Boolean).length;
  }
  if (tags !== undefined) updates.tags = tags;
  if (mood !== undefined) updates.mood = mood;

  const { data: updated, error } = await supabase
    .from("responses")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ response: updated });
}

export async function DELETE(
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

  // Soft delete - verify ownership
  const { error } = await supabase
    .from("responses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
