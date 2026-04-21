import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Postgrest's `.or("a.ilike.X,b.ilike.Y")` uses both `,` and `.` as
  // grammar characters, so values containing dots (e.g. "cole@sweetdreams.us")
  // get parsed incorrectly and match nothing. Run two separate ilike queries
  // and merge the results instead.
  const pattern = `%${q}%`;

  const [byName, byEmail] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, avatar_url, bio, current_streak, total_responses")
      .eq("is_discoverable", true)
      .neq("id", user.id)
      .ilike("full_name", pattern)
      .limit(20),
    admin
      .from("profiles")
      .select("id, full_name, avatar_url, bio, current_streak, total_responses")
      .eq("is_discoverable", true)
      .neq("id", user.id)
      .ilike("email", pattern)
      .limit(20),
  ]);

  const merged = new Map<string, any>();
  for (const row of byName.data ?? []) merged.set(row.id, row);
  for (const row of byEmail.data ?? []) if (!merged.has(row.id)) merged.set(row.id, row);
  const profiles = [...merged.values()].slice(0, 20);

  // Get existing friendships to mark status
  const { data: existingFriendships } = await admin
    .from("friendships")
    .select("id, user_a, user_b, status, requested_by")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .in("status", ["pending", "accepted"]);

  const friendshipMap = new Map<string, { id: string; status: string }>();
  for (const f of existingFriendships ?? []) {
    const otherId = f.user_a === user.id ? f.user_b : f.user_a;
    friendshipMap.set(otherId, { id: f.id, status: f.status });
  }

  const results = profiles.map((p: any) => ({
    ...p,
    friendship: friendshipMap.get(p.id) ?? null,
  }));

  return NextResponse.json({ users: results });
}
