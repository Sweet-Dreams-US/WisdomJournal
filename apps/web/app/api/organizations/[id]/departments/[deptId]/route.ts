import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function createAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireOrgAdmin(
  admin: ReturnType<typeof createAdmin>,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const { data: membership } = await admin
    .from("organization_members")
    .select("id, role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .maybeSingle();

  return !!membership;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdmin();

  if (!(await requireOrgAdmin(admin, params.id, user.id))) {
    return NextResponse.json(
      { error: "Only organization admins can update departments" },
      { status: 403 }
    );
  }

  const { name, description } = await request.json();

  const updates: Record<string, unknown> = {};

  if (name !== undefined) {
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Department name cannot be empty" },
        { status: 400 }
      );
    }
    updates.name = name.trim();
  }
  if (description !== undefined) {
    updates.description = description?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const { data: updated, error } = await admin
    .from("departments")
    .update(updates)
    .eq("id", params.deptId)
    .eq("organization_id", params.id)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A department with that name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "Department not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; deptId: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdmin();

  if (!(await requireOrgAdmin(admin, params.id, user.id))) {
    return NextResponse.json(
      { error: "Only organization admins can delete departments" },
      { status: 403 }
    );
  }

  const { data: deleted, error } = await admin
    .from("departments")
    .delete()
    .eq("id", params.deptId)
    .eq("organization_id", params.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!deleted || deleted.length === 0) {
    return NextResponse.json(
      { error: "Department not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
