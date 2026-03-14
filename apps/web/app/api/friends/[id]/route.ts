import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// DELETE /api/friends/[id] — Unfriend (deletes friendship + cascades access)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the friendship exists and user is part of it
  const { data: friendship } = await admin
    .from("friendships")
    .select("id, user_a, user_b")
    .eq("id", params.id)
    .single();

  if (!friendship) {
    return NextResponse.json(
      { error: "Friendship not found" },
      { status: 404 }
    );
  }

  if (friendship.user_a !== user.id && friendship.user_b !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete the friendship (cascades to friend_category_access and friend_access_summary)
  const { error } = await admin
    .from("friendships")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
