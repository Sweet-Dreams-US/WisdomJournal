import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("legacy_contacts")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // If marking as primary, unset existing primary
  if (body.is_primary) {
    await supabase
      .from("legacy_contacts")
      .update({ is_primary: false })
      .eq("user_id", user.id)
      .eq("is_primary", true);
  }

  const { error } = await supabase
    .from("legacy_contacts")
    .update(body)
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
