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

  const { token } = await request.json();

  if (!token?.trim()) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  // Service role: invitee is not yet a member, so RLS would hide the invite
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invitation } = await admin
    .from("organization_invitations")
    .select(
      "id, organization_id, email, role, job_title, department_id, expires_at, accepted_at"
    )
    .eq("token", token.trim())
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json(
      { error: "Invalid invitation" },
      { status: 404 }
    );
  }

  if (invitation.accepted_at) {
    return NextResponse.json(
      { error: "This invitation has already been used" },
      { status: 410 }
    );
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This invitation has expired" },
      { status: 410 }
    );
  }

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("id", invitation.organization_id)
    .single();

  if (!org) {
    return NextResponse.json(
      { error: "Invalid invitation" },
      { status: 404 }
    );
  }

  // Existing membership? Active blocks; departed rows are reactivated
  // (UNIQUE(organization_id, user_id) forbids a second insert).
  const { data: existing } = await admin
    .from("organization_members")
    .select("id, status")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.status === "active") {
    return NextResponse.json(
      { error: "You are already a member of this organization" },
      { status: 409 }
    );
  }

  if (existing) {
    const { error: rejoinError } = await admin
      .from("organization_members")
      .update({
        status: "active",
        role: invitation.role,
        job_title: invitation.job_title,
        department_id: invitation.department_id,
        joined_at: new Date().toISOString(),
        departed_at: null,
      })
      .eq("id", existing.id);

    if (rejoinError) {
      return NextResponse.json(
        { error: rejoinError.message },
        { status: 500 }
      );
    }
  } else {
    const { error: insertError } = await admin
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: invitation.role,
        job_title: invitation.job_title,
        department_id: invitation.department_id,
        status: "active",
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
  }

  await admin
    .from("organization_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return NextResponse.json({
    organization: { slug: org.slug, name: org.name },
  });
}
