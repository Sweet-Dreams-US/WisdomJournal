import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(
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

  // Get the friendship
  const { data: friendship } = await admin
    .from("friendships")
    .select("*")
    .eq("id", params.id)
    .eq("status", "pending")
    .single();

  if (!friendship) {
    return NextResponse.json(
      { error: "Friend request not found" },
      { status: 404 }
    );
  }

  // Only the non-requester can accept
  if (friendship.requested_by === user.id) {
    return NextResponse.json(
      { error: "Cannot accept your own request" },
      { status: 400 }
    );
  }

  // Verify user is part of this friendship
  if (friendship.user_a !== user.id && friendship.user_b !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Accept the friendship (trigger will init category access)
  const { data: updated, error } = await admin
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ friendship: updated });
}
