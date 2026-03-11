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

  const { name, description, group_type, default_category_access } =
    await request.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Group name is required" },
      { status: 400 }
    );
  }

  // Use service role to bypass RLS for group creation + first member insert
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create group
  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      group_type: group_type || "private",
      default_category_access: default_category_access ?? true,
      created_by: user.id,
      member_count: 1,
    })
    .select()
    .single();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  // Auto-add creator as owner with active status
  const { error: memberError } = await admin
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
      status: "active",
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ group }, { status: 201 });
}
