import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createServiceClient(supabaseUrl, serviceKey);

  // Fetch stats in parallel
  const [usersRes, responsesRes, activeRes, codesRes, recentRes, feedbackRes] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("responses").select("id", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("responses")
      .select("user_id")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .is("deleted_at", null),
    admin.from("beta_invite_codes").select("*").order("created_at", { ascending: false }),
    admin.from("profiles")
      .select("id, email, full_name, total_responses, current_streak, created_at, beta_code_used, is_admin")
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("feedback")
      .select("id, type, message, page_url, status, created_at, profile:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const activeUserIds = new Set((activeRes.data || []).map((r: any) => r.user_id));

  return NextResponse.json({
    total_users: usersRes.count || 0,
    total_responses: responsesRes.count || 0,
    active_users_7d: activeUserIds.size,
    beta_codes: codesRes.data || [],
    recent_users: recentRes.data || [],
    feedback: feedbackRes.data || [],
  });
}
