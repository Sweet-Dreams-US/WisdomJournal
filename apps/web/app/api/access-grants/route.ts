import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";

/**
 * GET /api/access-grants — List all grants I've given + received
 * POST /api/access-grants — Create a new access grant
 */
export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Grants I've given
  const { data: given } = await supabase
    .from("access_grants")
    .select("*, grantee:profiles!grantee_user_id(id, full_name, avatar_url)")
    .eq("grantor_user_id", user.id)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  // Grants I've received
  const { data: received } = await supabase
    .from("access_grants")
    .select("*, grantor:profiles!grantor_user_id(id, full_name, avatar_url)")
    .eq("grantee_user_id", user.id)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  return NextResponse.json({
    given: given ?? [],
    received: received ?? [],
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    grantee_email,
    grantee_user_id,
    access_level = "query",
    category_filter,
    allow_personality_mode = true,
    relationship_label,
    personal_message,
    expires_at,
  } = body;

  if (!grantee_email && !grantee_user_id) {
    return NextResponse.json(
      { error: "grantee_email or grantee_user_id required" },
      { status: 400 }
    );
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // If email provided, try to find existing user
  let resolvedUserId = grantee_user_id;
  if (grantee_email && !resolvedUserId) {
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const found = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === grantee_email.toLowerCase()
    );
    if (found) {
      resolvedUserId = found.id;
    }
  }

  // Determine initial status
  const status = resolvedUserId ? "pending" : "pending"; // Both start as pending

  const { data: grant, error } = await supabase
    .from("access_grants")
    .insert({
      grantor_user_id: user.id,
      grantee_user_id: resolvedUserId || null,
      grantee_email: grantee_email || null,
      access_level,
      category_filter: category_filter || null,
      allow_personality_mode,
      relationship_label: relationship_label || null,
      personal_message: personal_message || null,
      status,
      expires_at: expires_at || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send email notification if we have an email
  if (grantee_email) {
    const { data: grantorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const grantorName = grantorProfile?.full_name ?? "Someone";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wisdomjournal.app";

    await sendEmail({
      to: grantee_email,
      subject: `${grantorName} wants to share their wisdom with you`,
      html: `<p>${grantorName} has granted you ${access_level} access to their Wisdom Journal.</p>
${personal_message ? `<p>"${personal_message}"</p>` : ""}
<p><a href="${appUrl}/settings">View and accept the invitation</a></p>`,
    }).catch(console.error);
  }

  return NextResponse.json({ grant }, { status: 201 });
}
