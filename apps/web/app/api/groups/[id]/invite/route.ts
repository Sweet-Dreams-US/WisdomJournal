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

  const { email, role } = await request.json();

  if (!email?.trim()) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  // Verify the current user is an owner or admin of this group
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (
    !myMembership ||
    !["owner", "admin"].includes(myMembership.role)
  ) {
    return NextResponse.json(
      { error: "Only owners and admins can invite members" },
      { status: 403 }
    );
  }

  // Look up user by email
  const { data: invitedProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (!invitedProfile) {
    return NextResponse.json(
      { error: "No user found with that email address" },
      { status: 404 }
    );
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id, status")
    .eq("group_id", params.id)
    .eq("user_id", invitedProfile.id)
    .single();

  if (existingMember && existingMember.status !== "departed") {
    return NextResponse.json(
      { error: "User is already a member of this group" },
      { status: 409 }
    );
  }

  // Insert or re-invite if departed
  if (existingMember && existingMember.status === "departed") {
    await supabase
      .from("group_members")
      .update({
        status: "invited",
        role: role || "member",
        invited_by: user.id,
        departed_at: null,
      })
      .eq("id", existingMember.id);
  } else {
    await supabase.from("group_members").insert({
      group_id: params.id,
      user_id: invitedProfile.id,
      role: role || "member",
      status: "invited",
      invited_by: user.id,
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
