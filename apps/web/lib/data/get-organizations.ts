import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  member_count: number;
  my_role: "owner" | "admin" | "member";
}

/**
 * Organizations where the current user is an active member.
 */
export async function getOrganizations(): Promise<OrganizationSummary[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: memberships } = await admin
    .from("organization_members")
    .select(
      `
      role,
      organization_id,
      organization:organizations(id, name, slug, logo_url, industry)
      `
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) return [];

  const orgIds = memberships.map((m: any) => m.organization_id);

  // Active member counts per org (counts only)
  const { data: memberRows } = await admin
    .from("organization_members")
    .select("organization_id")
    .in("organization_id", orgIds)
    .eq("status", "active");

  const countByOrg = new Map<string, number>();
  for (const row of memberRows ?? []) {
    countByOrg.set(
      row.organization_id,
      (countByOrg.get(row.organization_id) ?? 0) + 1
    );
  }

  return memberships
    .filter((m: any) => m.organization)
    .map((m: any) => {
      const org = Array.isArray(m.organization)
        ? m.organization[0]
        : m.organization;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url ?? null,
        industry: org.industry ?? null,
        member_count: countByOrg.get(m.organization_id) ?? 0,
        my_role: m.role,
      };
    });
}
