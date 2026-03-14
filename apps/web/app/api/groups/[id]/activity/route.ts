import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(
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

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify user is member of this group
  const { data: membership } = await admin
    .from("group_members")
    .select("id")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Get activity events with user profiles
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "30");
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0");

  const { data: events } = await admin
    .from("activity_events")
    .select("*, profile:profiles(id, full_name, avatar_url)")
    .eq("group_id", params.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ events: events ?? [] });
}
