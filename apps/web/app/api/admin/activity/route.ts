import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const eventType = searchParams.get("type") || null;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = admin
    .from("activity_events")
    .select("id, user_id, event_type, event_data, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get unique user IDs from events
  const userIds = [...new Set((events || []).map((e: any) => e.user_id).filter(Boolean))];

  let userMap: Record<string, { full_name: string | null; email: string }> = {};
  if (userIds.length > 0) {
    const { data: users } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    (users || []).forEach((u: any) => {
      userMap[u.id] = { full_name: u.full_name, email: u.email };
    });
  }

  const enrichedEvents = (events || []).map((e: any) => ({
    ...e,
    user_name: userMap[e.user_id]?.full_name || null,
    user_email: userMap[e.user_id]?.email || null,
  }));

  return NextResponse.json({
    events: enrichedEvents,
    has_more: (events || []).length === limit,
  });
}
