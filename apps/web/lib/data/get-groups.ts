import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Group, GroupMember, GroupAccessSummary } from "@wisdom-journal/shared";

export interface GroupWithMembership extends Group {
  membership: GroupMember;
  access_summary: GroupAccessSummary | null;
}

export async function getGroups(): Promise<GroupWithMembership[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Use service role to avoid self-referencing RLS issues on group_members
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all groups where the user is a member (not departed)
  const { data: memberships } = await admin
    .from("group_members")
    .select(
      `
      *,
      group:groups(*),
      access_summary:group_access_summary(*)
      `
    )
    .eq("user_id", user.id)
    .neq("status", "departed");

  if (!memberships) return [];

  return memberships.map((m: any) => ({
    ...m.group,
    membership: {
      id: m.id,
      group_id: m.group_id,
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      invited_by: m.invited_by,
      joined_at: m.joined_at,
      departed_at: m.departed_at,
      created_at: m.created_at,
      updated_at: m.updated_at,
    },
    access_summary: m.access_summary?.[0] ?? null,
  }));
}
