import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/access-grants/[id] — Accept, revoke, or update a grant
 * DELETE /api/access-grants/[id] — Permanently delete a grant
 */
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
  const { action } = body;

  // Get the grant
  const { data: grant } = await supabase
    .from("access_grants")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!grant) {
    return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  }

  // Handle different actions
  if (action === "accept") {
    // Only grantee can accept
    if (grant.grantee_user_id !== user.id) {
      return NextResponse.json({ error: "Only the grantee can accept" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("access_grants")
      .update({ status: "active", accepted_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ grant: updated });
  }

  if (action === "revoke") {
    // Grantor or grantee can revoke
    if (grant.grantor_user_id !== user.id && grant.grantee_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("access_grants")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ grant: updated });
  }

  // General update (grantor only)
  if (grant.grantor_user_id !== user.id) {
    return NextResponse.json({ error: "Only the grantor can update" }, { status: 403 });
  }

  const allowedFields = [
    "access_level",
    "category_filter",
    "allow_personality_mode",
    "relationship_label",
    "expires_at",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("access_grants")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ grant: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("access_grants")
    .delete()
    .eq("id", params.id)
    .eq("grantor_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
