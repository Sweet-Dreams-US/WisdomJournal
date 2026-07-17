import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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
      { error: "Only organization admins can create departments" },
      { status: 403 }
    );
  }

  const { name, description } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Department name is required" },
      { status: 400 }
    );
  }

  const { data: department, error } = await admin
    .from("departments")
    .insert({
      organization_id: params.id,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique violation on (organization_id, name)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A department with that name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ department }, { status: 201 });
}
