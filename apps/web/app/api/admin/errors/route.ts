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
  const severity = searchParams.get("severity") || null;
  const limit = parseInt(searchParams.get("limit") || "100");

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = admin
    .from("error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (severity) {
    query = query.eq("severity", severity);
  }

  const { data: errors, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with user info
  const userIds = [...new Set((errors || []).map((e: any) => e.user_id).filter(Boolean))];
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

  // Errors per day (last 7 days)
  const errorsPerDay: Record<string, number> = {};
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  (errors || []).forEach((e: any) => {
    if (new Date(e.created_at).getTime() > sevenDaysAgo) {
      const day = e.created_at.slice(0, 10);
      errorsPerDay[day] = (errorsPerDay[day] || 0) + 1;
    }
  });

  const enriched = (errors || []).map((e: any) => ({
    ...e,
    user_name: userMap[e.user_id]?.full_name || null,
    user_email: userMap[e.user_id]?.email || null,
  }));

  return NextResponse.json({
    errors: enriched,
    errors_per_day: errorsPerDay,
  });
}
