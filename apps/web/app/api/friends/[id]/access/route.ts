import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// PATCH /api/friends/[id]/access — Toggle category sharing for a friendship
// Mirrors /api/groups/[id]/access pattern
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

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the friendship exists and is accepted
  const { data: friendship } = await admin
    .from("friendships")
    .select("id, user_a, user_b, status")
    .eq("id", params.id)
    .eq("status", "accepted")
    .single();

  if (!friendship) {
    return NextResponse.json(
      { error: "Friendship not found or not accepted" },
      { status: 404 }
    );
  }

  if (friendship.user_a !== user.id && friendship.user_b !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update each category toggle (only for the current user — they control their OWN sharing)
  for (const toggle of toggles) {
    await admin
      .from("friend_category_access")
      .update({ is_enabled: toggle.is_enabled })
      .eq("friendship_id", params.id)
      .eq("user_id", user.id)
      .eq("category_id", toggle.category_id);
  }

  // The DB trigger will auto-recompute trust_color in friend_access_summary

  return NextResponse.json({ success: true });
}
