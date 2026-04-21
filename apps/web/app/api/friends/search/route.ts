import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Search discoverable profiles by first name, last name, email, or username.
 *
 * We run one ilike query per column and merge, because Supabase-js's
 * `.or("a.ilike.X,b.ilike.Y")` string uses both `,` and `.` as grammar,
 * so values with dots (emails, usernames with underscores and dots) get
 * parsed wrong and match nothing.
 *
 * Results are deduped by id, with username-exact matches bubbled to the top.
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

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const SELECT_COLUMNS =
    "id, full_name, username, avatar_url, bio, current_streak, total_responses, email";

  const runIlike = (column: "full_name" | "email" | "username") =>
    admin
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

  // Bubble exact username match to the top
  const profiles = [...merged.values()].sort((a, b) => {
    const aExact = a.username && a.username.toLowerCase() === q.toLowerCase() ? 1 : 0;
    const bExact = b.username && b.username.toLowerCase() === q.toLowerCase() ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    // then by match-tier: username > name > email
    const tier = (m: string) => (m === "username" ? 0 : m === "name" ? 1 : 2);
    return tier(a._match) - tier(b._match);
  });

  // Strip email from response (privacy — we only use it for searching)
  const publicProfiles = profiles.map(({ email: _e, _match, ...rest }) => rest).slice(0, 20);

  // Existing friendships to mark status
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

  const results = publicProfiles.map((p: any) => ({
    ...p,
    friendship: friendshipMap.get(p.id) ?? null,
  }));

  return NextResponse.json({ users: results });
}
