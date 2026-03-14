import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user_id: targetUserId, message } = await request.json();

  if (!targetUserId) {
    return NextResponse.json(
      { error: "user_id is required" },
      { status: 400 }
    );
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: "Cannot send friend request to yourself" },
      { status: 400 }
    );
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify target user exists
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Sort UUIDs to satisfy user_a < user_b constraint
  const [user_a, user_b] =
    user.id < targetUserId
      ? [user.id, targetUserId]
      : [targetUserId, user.id];

  // Check for existing friendship
  const { data: existing } = await admin
    .from("friendships")
    .select("id, status")
    .eq("user_a", user_a)
    .eq("user_b", user_b)
    .single();

  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json(
        { error: "Already friends" },
        { status: 409 }
      );
    }
    if (existing.status === "pending") {
      return NextResponse.json(
        { error: "Friend request already pending" },
        { status: 409 }
      );
    }
    if (existing.status === "blocked") {
      return NextResponse.json(
        { error: "Cannot send request" },
        { status: 403 }
      );
    }
    // If declined, allow re-sending by updating the existing row
    const { data: updated, error } = await admin
      .from("friendships")
      .update({
        status: "pending",
        requested_by: user.id,
        message: message || null,
        requested_at: new Date().toISOString(),
        responded_at: null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ friendship: updated });
  }

  // Create new friendship request
  const { data: friendship, error } = await admin
    .from("friendships")
    .insert({
      user_a,
      user_b,
      status: "pending",
      requested_by: user.id,
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ friendship }, { status: 201 });
}
