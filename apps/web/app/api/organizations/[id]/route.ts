import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const SIZE_RANGES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

function createAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

  const admin = createAdmin();

  // Admin gate: verified server-side via service role, never trusted from client
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
      { error: "Only organization admins can update the organization" },
      { status: 403 }
    );
  }

  const { name, industry, logo_url, size_range } = await request.json();

  const updates: Record<string, unknown> = {};

  if (name !== undefined) {
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Organization name cannot be empty" },
        { status: 400 }
      );
    }
    updates.name = name.trim();
  }
  if (industry !== undefined) updates.industry = industry?.trim() || null;
  if (logo_url !== undefined) updates.logo_url = logo_url || null;
  if (size_range !== undefined) {
    if (size_range != null && !SIZE_RANGES.includes(size_range)) {
      return NextResponse.json(
        { error: "Invalid size range" },
        { status: 400 }
      );
    }
    updates.size_range = size_range ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await admin
    .from("organizations")
    .update(updates)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
