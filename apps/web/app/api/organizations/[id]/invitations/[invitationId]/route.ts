import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function createAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
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
      { error: "Only organization admins can revoke invitations" },
      { status: 403 }
    );
  }

  const { data: deleted, error } = await admin
    .from("organization_invitations")
    .delete()
    .eq("id", params.invitationId)
    .eq("organization_id", params.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!deleted || deleted.length === 0) {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
