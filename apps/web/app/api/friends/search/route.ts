import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Search discoverable profiles by first/last name, email, or username.
 *
 * We use the authenticated server client (NOT a service-role client) because
 * the RLS policy "Users can search discoverable profiles" already allows
 * any authed user to read rows where is_discoverable = true. This keeps the
 * endpoint working even if the service-role key is broken or rotated.
 *
 * Three separate ilike queries (name, email, username) are merged because
 * supabase-js's `.or("a.ilike.X,b.ilike.Y")` uses both `,` and `.` as grammar,
 * so values containing dots (emails, dotted domains) get parsed incorrectly
 * and match nothing.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (raw.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // Allow "@username" prefix as a convenience
  const q = raw.startsWith("@") ? raw.slice(1) : raw;
  const pattern = `%${q}%`;

  const SELECT_COLUMNS =
    "id, full_name, username, avatar_url, bio, current_streak, total_responses, email";

  const runIlike = (column: "full_name" | "email" | "username") =>
    supabase
      .from("profiles")
      .select(SELECT_COLUMNS)
      .eq("is_discoverable", true)
      .neq("id", user.id)
      .ilike(column, pattern)
      .limit(25);

  const [byName, byEmail, byUsername] = await Promise.all([
    runIlike("full_name"),
    runIlike("email"),
    runIlike("username"),
  ]);

  type ProfileRow = {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    current_streak: number;
    total_responses: number;
    email: string;
  };

  const merged = new Map<string, ProfileRow & { _match: "username" | "name" | "email" }>();
  for (const row of (byUsername.data ?? []) as ProfileRow[])
    merged.set(row.id, { ...row, _match: "username" });
  for (const row of (byName.data ?? []) as ProfileRow[])
    if (!merged.has(row.id)) merged.set(row.id, { ...row, _match: "name" });
  for (const row of (byEmail.data ?? []) as ProfileRow[])
    if (!merged.has(row.id)) merged.set(row.id, { ...row, _match: "email" });

  const profiles = [...merged.values()].sort((a, b) => {
    const aExact = a.username && a.username.toLowerCase() === q.toLowerCase() ? 1 : 0;
    const bExact = b.username && b.username.toLowerCase() === q.toLowerCase() ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    const tier = (m: string) => (m === "username" ? 0 : m === "name" ? 1 : 2);
    return tier(a._match) - tier(b._match);
  });

  const publicProfiles = profiles
    .map(({ email: _e, _match, ...rest }) => rest)
    .slice(0, 20);

  // Friendships — also via authed client. The friendships SELECT policy
  // allows users to see rows where they are user_a or user_b.
  const { data: existingFriendships } = await supabase
    .from("friendships")
    .select("id, user_a, user_b, status, requested_by")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .in("status", ["pending", "accepted"]);

  const friendshipMap = new Map<string, { id: string; status: string }>();
  for (const f of existingFriendships ?? []) {
    const otherId = f.user_a === user.id ? f.user_b : f.user_a;
    friendshipMap.set(otherId, { id: f.id, status: f.status });
  }

  const results = publicProfiles.map((p: any) => ({
    ...p,
    friendship: friendshipMap.get(p.id) ?? null,
  }));

  return NextResponse.json({ users: results });
}
