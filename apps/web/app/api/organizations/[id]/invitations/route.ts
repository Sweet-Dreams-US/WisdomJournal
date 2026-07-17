import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { orgInviteEmail } from "@/lib/email/templates";

function createAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

  const admin = createAdmin();

  const { data: membership } = await admin
    .from("organization_members")
    .select("id, role")
    .eq("organization_id", params.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "Only organization admins can invite members" },
      { status: 403 }
    );
  }

  const { email, role, job_title, department_id } = await request.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!role || !["admin", "member"].includes(role)) {
    return NextResponse.json(
      { error: "Role must be 'admin' or 'member'" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Fetch org for seat limit + email content
  const { data: org } = await admin
    .from("organizations")
    .select("id, name, max_seats")
    .eq("id", params.id)
    .single();

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  // If department specified, it must belong to this org
  if (department_id) {
    const { data: dept } = await admin
      .from("departments")
      .select("id")
      .eq("id", department_id)
      .eq("organization_id", params.id)
      .maybeSingle();

    if (!dept) {
      return NextResponse.json(
        { error: "Department not found in this organization" },
        { status: 400 }
      );
    }
  }

  // Seat check: active members only
  const { count: activeCount } = await admin
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", params.id)
    .eq("status", "active");

  if ((activeCount ?? 0) >= org.max_seats) {
    return NextResponse.json(
      { error: "This organization has reached its seat limit" },
      { status: 403 }
    );
  }

  // Already a member? (match by profile email)
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    const { data: existingMember } = await admin
      .from("organization_members")
      .select("id, status")
      .eq("organization_id", params.id)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (existingMember && existingMember.status === "active") {
      return NextResponse.json(
        { error: "That person is already a member of this organization" },
        { status: 409 }
      );
    }
  }

  // Already invited? Pending (unaccepted, unexpired) invites block; stale
  // ones are replaced so UNIQUE(organization_id, email) doesn't wedge.
  const { data: existingInvite } = await admin
    .from("organization_invitations")
    .select("id, accepted_at, expires_at")
    .eq("organization_id", params.id)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingInvite) {
    const pending =
      !existingInvite.accepted_at &&
      new Date(existingInvite.expires_at).getTime() > Date.now();

    if (pending) {
      return NextResponse.json(
        { error: "An invitation is already pending for that email" },
        { status: 409 }
      );
    }

    await admin
      .from("organization_invitations")
      .delete()
      .eq("id", existingInvite.id);
  }

  const { data: invitation, error } = await admin
    .from("organization_invitations")
    .insert({
      organization_id: params.id,
      email: normalizedEmail,
      role,
      job_title: job_title?.trim() || null,
      department_id: department_id || null,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error || !invitation) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create invitation" },
      { status: 500 }
    );
  }

  // Fire-and-forget invite email — failures must never fail the request
  void (async () => {
    try {
      const { data: inviter } = await admin
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      const inviterName =
        inviter?.full_name || inviter?.email || "A teammate";
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "https://wisdomjournal.app";
      const joinUrl = `${appUrl}/org/join/${invitation.token}`;

      const { subject, html } = orgInviteEmail(
        org.name,
        inviterName,
        joinUrl,
        invitation.role
      );
      await sendEmail({ to: normalizedEmail, subject, html });
    } catch (err) {
      console.error("Failed to send org invite email:", err);
    }
  })();

  return NextResponse.json({ invitation }, { status: 201 });
}
