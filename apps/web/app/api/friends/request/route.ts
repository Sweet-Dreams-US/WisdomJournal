import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { friendRequestEmail } from "@/lib/email/templates";

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

    // Send notification to target user
    await sendFriendRequestNotification(admin, user.id, targetUserId, updated.id, message);

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

  // Send notification to target user
  await sendFriendRequestNotification(admin, user.id, targetUserId, friendship.id, message);

  return NextResponse.json({ friendship }, { status: 201 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendFriendRequestNotification(
  admin: any,
  fromUserId: string,
  toUserId: string,
  friendshipId: string,
  message?: string
) {
  try {
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", fromUserId)
      .single();

    const senderName = senderProfile?.full_name ?? "Someone";

    await admin.from("notifications").insert({
      user_id: toUserId,
      type: "friend_request",
      title: `${senderName} sent you a friend request`,
      body: message || null,
      data: { friendship_id: friendshipId, from_user_id: fromUserId },
    });

    // Send email notification
    const { data: recipientProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", toUserId)
      .single();
    const { data: authUser } = await admin.auth.admin.getUserById(toUserId);
    if (authUser?.user?.email) {
      const template = friendRequestEmail(
        recipientProfile?.full_name?.split(" ")[0] ?? "there",
        senderName,
        message
      );
      await sendEmail({ to: authUser.user.email, ...template });
    }
  } catch {
    // Non-critical, don't fail the request
    console.error("Failed to send friend request notification");
  }
}
