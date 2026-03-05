import { createClient } from "@/lib/supabase/server";
import type {
  Group,
  GroupMember,
  GroupAccessSummary,
} from "@wisdom-journal/shared";

export interface GroupMemberWithProfile extends GroupMember {
  profile: { full_name: string | null; avatar_url: string | null };
  access_summary: GroupAccessSummary | null;
}

export interface GroupDetail extends Group {
  members: GroupMemberWithProfile[];
  my_membership: GroupMember | null;
  my_category_access: { category_id: string; slug: string; name: string; is_enabled: boolean }[];
}

export async function getGroup(
  groupId: string
): Promise<GroupDetail | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch group
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) return null;

  // Fetch all members with profiles and access summaries
  const { data: members } = await supabase
    .from("group_members")
    .select(
      `
      *,
      profile:profiles(full_name, avatar_url),
      access_summary:group_access_summary(*)
      `
    )
    .eq("group_id", groupId)
    .neq("status", "departed");

  const formattedMembers: GroupMemberWithProfile[] = (members ?? []).map(
    (m: any) => ({
      ...m,
      profile: m.profile ?? { full_name: null, avatar_url: null },
      access_summary: m.access_summary?.[0] ?? null,
    })
  );

  // Find current user's membership
  const myMembership =
    formattedMembers.find((m) => m.user_id === user.id) ?? null;

  // Get current user's category access for this group
  let myCategoryAccess: GroupDetail["my_category_access"] = [];
  if (myMembership) {
    const { data: access } = await supabase
      .from("group_category_access")
      .select(
        `
        category_id,
        is_enabled,
        category:categories(slug, name)
        `
      )
      .eq("group_member_id", myMembership.id);

    myCategoryAccess = (access ?? []).map((a: any) => ({
      category_id: a.category_id,
      slug: a.category?.slug ?? "",
      name: a.category?.name ?? "",
      is_enabled: a.is_enabled,
    }));
  }

  return {
    ...group,
    members: formattedMembers,
    my_membership: myMembership,
    my_category_access: myCategoryAccess,
  } as GroupDetail;
}
