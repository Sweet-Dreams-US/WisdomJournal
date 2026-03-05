import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Get membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("id, role")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this group" },
      { status: 404 }
    );
  }

  if (membership.role === "owner") {
    return NextResponse.json(
      { error: "Group owners cannot leave. Transfer ownership or delete the group." },
      { status: 403 }
    );
  }

  // Set status to departed
  const { error } = await supabase
    .from("group_members")
    .update({
      status: "departed",
      departed_at: new Date().toISOString(),
    })
    .eq("id", membership.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
