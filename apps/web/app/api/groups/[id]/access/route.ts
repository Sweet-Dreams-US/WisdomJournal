import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { toggles } = await request.json();
  // toggles: { category_id: string, is_enabled: boolean }[]

  if (!Array.isArray(toggles) || toggles.length === 0) {
    return NextResponse.json(
      { error: "toggles array is required" },
      { status: 400 }
    );
  }

  // Get the user's membership for this group
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this group" },
      { status: 404 }
    );
  }

  // Update each category toggle
  for (const toggle of toggles) {
    await supabase
      .from("group_category_access")
      .update({ is_enabled: toggle.is_enabled })
      .eq("group_member_id", membership.id)
      .eq("category_id", toggle.category_id);
  }

  // The DB trigger will auto-recompute trust_color in group_access_summary

  return NextResponse.json({ success: true });
}
