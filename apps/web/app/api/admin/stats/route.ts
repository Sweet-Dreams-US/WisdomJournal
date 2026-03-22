import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createServiceClient(supabaseUrl, serviceKey);

  // Use service role to check admin status (bypasses RLS)
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    usersRes,
    responsesRes,
    activeRes24h,
    activeRes7d,
    activeRes30d,
    codesRes,
    allUsersRes,
    responsesLast30d,
    wisdomQueriesRes,
    wisdomQueriesLast7d,
    friendshipsRes,
    groupsRes,
    errorLogs24h,
    errorLogs7d,
    feedbackByStatus,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("responses").select("id", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("responses")
      .select("user_id")
      .gte("created_at", twentyFourHoursAgo)
      .is("deleted_at", null),
    admin.from("responses")
      .select("user_id")
      .gte("created_at", sevenDaysAgo)
      .is("deleted_at", null),
    admin.from("responses")
      .select("user_id")
      .gte("created_at", thirtyDaysAgo)
      .is("deleted_at", null),
    admin.from("beta_invite_codes").select("*").order("created_at", { ascending: false }),
    admin.from("profiles")
      .select("id, email, full_name, total_responses, total_word_count, current_streak, longest_streak, created_at, beta_code_used, is_admin, subscription_tier, onboarding_completed, last_response_at")
      .order("created_at", { ascending: false }),
    admin.from("responses")
      .select("id, user_id, created_at, word_count, ai_processed_at")
      .gte("created_at", thirtyDaysAgo)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    admin.from("wisdom_queries")
      .select("id, ai_cost_cents, ai_tokens_input, ai_tokens_output", { count: "exact" }),
    admin.from("wisdom_queries")
      .select("id, querier_id, created_at, ai_cost_cents, ai_tokens_input, ai_tokens_output")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false }),
    admin.from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted"),
    admin.from("groups")
      .select("id", { count: "exact", head: true }),
    // Error logs - last 24h
    admin.from("error_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo),
    // Error logs - last 7d
    admin.from("error_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    // Feedback counts - get all feedback to count by status
    admin.from("feedback")
      .select("id, status"),
  ]);

  const activeUserIds24h = new Set((activeRes24h.data || []).map((r: any) => r.user_id));
  const activeUserIds7d = new Set((activeRes7d.data || []).map((r: any) => r.user_id));
  const activeUserIds30d = new Set((activeRes30d.data || []).map((r: any) => r.user_id));

  // AI cost tracking
  const totalAiCostCents = (wisdomQueriesRes.data || []).reduce((sum: number, q: any) => sum + (q.ai_cost_cents || 0), 0);
  const totalAiTokensIn = (wisdomQueriesRes.data || []).reduce((sum: number, q: any) => sum + (q.ai_tokens_input || 0), 0);
  const totalAiTokensOut = (wisdomQueriesRes.data || []).reduce((sum: number, q: any) => sum + (q.ai_tokens_output || 0), 0);

  const weekAiCostCents = (wisdomQueriesLast7d.data || []).reduce((sum: number, q: any) => sum + (q.ai_cost_cents || 0), 0);
  const weekAiQueries = wisdomQueriesLast7d.data?.length || 0;

  // Response activity by day (last 30 days)
  const dailyActivity: Record<string, number> = {};
  (responsesLast30d.data || []).forEach((r: any) => {
    const day = r.created_at.slice(0, 10);
    dailyActivity[day] = (dailyActivity[day] || 0) + 1;
  });

  // Build 30-day arrays
  const responsesByDay: { date: string; count: number }[] = [];
  const signupsByDay: { date: string; count: number }[] = [];
  const allUsers = allUsersRes.data || [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    responsesByDay.push({ date: key, count: dailyActivity[key] || 0 });

    const daySignups = allUsers.filter((u: any) => u.created_at?.slice(0, 10) === key).length;
    signupsByDay.push({ date: key, count: daySignups });
  }

  // Signups by day (legacy format)
  const dailySignups: Record<string, number> = {};
  allUsers.forEach((u: any) => {
    if (u.created_at >= thirtyDaysAgo) {
      const day = u.created_at.slice(0, 10);
      dailySignups[day] = (dailySignups[day] || 0) + 1;
    }
  });

  // Top users by responses
  const topUsers = [...allUsers]
    .sort((a: any, b: any) => (b.total_responses || 0) - (a.total_responses || 0))
    .slice(0, 10);

  // Onboarding funnel
  const onboardedCount = allUsers.filter((u: any) => u.onboarding_completed).length;
  const usersWithFirstResponse = allUsers.filter((u: any) => (u.total_responses || 0) >= 1).length;
  const usersWith5Responses = allUsers.filter((u: any) => (u.total_responses || 0) >= 5).length;

  // Total word count
  const totalWordCount = allUsers.reduce((sum: number, u: any) => sum + (u.total_word_count || 0), 0);

  // Feedback counts by status
  const feedbackCounts: Record<string, number> = { new: 0, reviewed: 0, in_progress: 0, resolved: 0, wont_fix: 0 };
  (feedbackByStatus.data || []).forEach((f: any) => {
    const status = f.status || "new";
    feedbackCounts[status] = (feedbackCounts[status] || 0) + 1;
  });
  const totalFeedback = (feedbackByStatus.data || []).length;

  return NextResponse.json({
    total_users: usersRes.count || 0,
    total_responses: responsesRes.count || 0,
    active_users_24h: activeUserIds24h.size,
    active_users_7d: activeUserIds7d.size,
    active_users_30d: activeUserIds30d.size,
    onboarded_users: onboardedCount,
    total_word_count: totalWordCount,
    total_friendships: friendshipsRes.count || 0,
    total_groups: groupsRes.count || 0,

    // Onboarding funnel
    funnel: {
      signed_up: usersRes.count || 0,
      onboarded: onboardedCount,
      first_response: usersWithFirstResponse,
      five_plus_responses: usersWith5Responses,
    },

    // AI usage
    ai: {
      total_queries: wisdomQueriesRes.count || 0,
      total_cost_cents: totalAiCostCents,
      total_tokens_in: totalAiTokensIn,
      total_tokens_out: totalAiTokensOut,
      week_queries: weekAiQueries,
      week_cost_cents: weekAiCostCents,
    },

    // Error counts
    errors: {
      last_24h: errorLogs24h.count || 0,
      last_7d: errorLogs7d.count || 0,
    },

    // Feedback
    feedback: {
      total: totalFeedback,
      by_status: feedbackCounts,
    },

    // Time series (30 days)
    daily_activity: dailyActivity,
    daily_signups: dailySignups,
    responses_by_day: responsesByDay,
    signups_by_day: signupsByDay,

    // Lists
    beta_codes: codesRes.data || [],
    all_users: allUsers,
    top_users: topUsers,
  });
}
