import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(
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

  // Get all active members with their profiles
  const { data: members } = await admin
    .from("group_members")
    .select("user_id, profile:profiles(id, full_name, avatar_url)")
    .eq("group_id", params.id)
    .eq("status", "active");

  const memberIds = (members ?? []).map((m) => m.user_id);

  // Active members: those who responded in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentResponders } = await admin
    .from("responses")
    .select("user_id")
    .in("user_id", memberIds)
    .gte("created_at", sevenDaysAgo.toISOString());

  const activeUserIds = new Set(
    (recentResponders ?? []).map((r) => r.user_id)
  );

  // Top streaks: get profiles with streak info
  const { data: streakProfiles } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, current_streak, longest_streak")
    .in("id", memberIds)
    .order("current_streak", { ascending: false });

  // Category coverage: aggregate category stats across members
  const { data: categoryStats } = await admin
    .from("user_category_stats")
    .select("category_id, response_count, categories(name, slug)")
    .in("user_id", memberIds)
    .gt("response_count", 0);

  // Aggregate category coverage
  const categoryCoverage: Record<
    string,
    { name: string; slug: string; totalResponses: number; memberCount: number }
  > = {};

  for (const stat of categoryStats ?? []) {
    const cat = stat.categories as unknown as {
      name: string;
      slug: string;
    } | null;
    if (!cat) continue;

    const key = cat.slug;
    if (!categoryCoverage[key]) {
      categoryCoverage[key] = {
        name: cat.name,
        slug: cat.slug,
        totalResponses: 0,
        memberCount: 0,
      };
    }
    categoryCoverage[key].totalResponses += stat.response_count;
    categoryCoverage[key].memberCount += 1;
  }

  return NextResponse.json({
    totalMembers: memberIds.length,
    activeMembers: activeUserIds.size,
    topStreaks: (streakProfiles ?? []).slice(0, 10).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      current_streak: p.current_streak,
      longest_streak: p.longest_streak,
    })),
    categoryCoverage: Object.values(categoryCoverage).sort(
      (a, b) => b.totalResponses - a.totalResponses
    ),
  });
}
