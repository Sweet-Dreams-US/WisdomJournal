import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function createAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
      { error: "Only organization admins can manage members" },
      { status: 403 }
    );
  }

  const { role, job_title, department_id, status } = await request.json();

  if (role !== undefined && !["owner", "admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (status !== undefined && !["active", "departed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Target member must belong to this organization
  const { data: target } = await admin
    .from("organization_members")
    .select("id, role, status")
    .eq("id", params.memberId)
    .eq("organization_id", params.id)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
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

  // Last-owner protection: cannot demote or depart the only active owner
  const isDemotion =
    role !== undefined && role !== "owner" && target.role === "owner";
  const isDeparture =
    status === "departed" &&
    target.role === "owner" &&
    target.status === "active";

  if (isDemotion || isDeparture) {
    const { count: ownerCount } = await admin
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", params.id)
      .eq("role", "owner")
      .eq("status", "active");

    if ((ownerCount ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Cannot demote or remove the last owner" },
        { status: 400 }
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (job_title !== undefined) updates.job_title = job_title?.trim() || null;
  if (department_id !== undefined) updates.department_id = department_id || null;
  if (status !== undefined) {
    updates.status = status;
    updates.departed_at =
      status === "departed" ? new Date().toISOString() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("organization_members")
    .update(updates)
    .eq("id", params.memberId)
    .eq("organization_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
