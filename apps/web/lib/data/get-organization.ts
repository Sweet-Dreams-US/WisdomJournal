import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export interface OrgMemberEntry {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  job_title: string | null;
  department_id: string | null;
  status: "active" | "departed";
  joined_at: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

export interface OrgDepartmentEntry {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
}

export interface OrgInvitationEntry {
  id: string;
  email: string;
  role: "admin" | "member";
  job_title: string | null;
  department_id: string | null;
  created_at: string;
  expires_at: string;
}

export interface OrgCoverageEntry {
  category_slug: string;
  category_name: string;
  response_count: number;
}

export interface OrgDepartmentStats {
  department_id: string;
  name: string;
  member_count: number;
  entries_30d: number;
}

export interface OrgStats {
  total_members: number;
  entries_30d: number;
  active_members_30d: number;
  coverage: OrgCoverageEntry[];
  by_department: OrgDepartmentStats[];
}

export interface OrganizationDetail {
  org: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    industry: string | null;
    size_range: string | null;
    max_seats: number;
    created_at: string;
  };
  my_role: "owner" | "admin" | "member";
  members: OrgMemberEntry[];
  departments: OrgDepartmentEntry[];
  invitations: OrgInvitationEntry[];
  stats: OrgStats;
}

/**
 * Full organization detail for the org dashboard.
 *
 * PRIVACY: stats are AGGREGATE COUNTS only — no response text and no
 * per-entry listings ever leave this function (spec 12.3).
 */
export async function getOrganization(
  slug: string
): Promise<OrganizationDetail | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: org } = await admin
    .from("organizations")
    .select(
      "id, name, slug, logo_url, industry, size_range, max_seats, created_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!org) return null;

  // Caller must be an active member
  const { data: myMembership } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!myMembership) return null;

  const myRole = myMembership.role as "owner" | "admin" | "member";
  const isAdmin = myRole === "owner" || myRole === "admin";

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    membersResult,
    departmentsResult,
    invitationsResult,
    entriesCountResult,
    recentResponsesResult,
    coverageResult,
  ] = await Promise.all([
    admin
      .from("organization_members")
      .select(
        `
        id,
        user_id,
        role,
        job_title,
        department_id,
        status,
        joined_at,
        profile:profiles(full_name, avatar_url, email)
        `
      )
      .eq("organization_id", org.id)
      .order("joined_at", { ascending: true }),
    admin
      .from("departments")
      .select("id, name, description")
      .eq("organization_id", org.id)
      .order("name", { ascending: true }),
    isAdmin
      ? admin
          .from("organization_invitations")
          .select(
            "id, email, role, job_title, department_id, created_at, expires_at"
          )
          .eq("organization_id", org.id)
          .is("accepted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    // Aggregate count only — never selects response content
    admin
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .is("deleted_at", null)
      .gte("created_at", thirtyDaysAgo),
    // user_id only, for activity/department aggregation — no content
    admin
      .from("responses")
      .select("user_id")
      .eq("organization_id", org.id)
      .is("deleted_at", null)
      .gte("created_at", thirtyDaysAgo)
      .limit(5000),
    // Coverage: business-category tag rows, counted in memory — no content
    admin
      .from("response_categories")
      .select(
        `
        category_id,
        categories!inner(slug, name, context_type),
        responses!inner(organization_id, deleted_at)
        `
      )
      .eq("responses.organization_id", org.id)
      .is("responses.deleted_at", null)
      .eq("categories.context_type", "business"),
  ]);

  const members: OrgMemberEntry[] = (membersResult.data ?? []).map(
    (m: any) => {
      const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        job_title: m.job_title ?? null,
        department_id: m.department_id ?? null,
        status: m.status,
        joined_at: m.joined_at,
        profile: {
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          email: profile?.email ?? "",
        },
      };
    }
  );

  const activeMembers = members.filter((m) => m.status === "active");

  const departments: OrgDepartmentEntry[] = (
    departmentsResult.data ?? []
  ).map((d: any) => ({
    id: d.id,
    name: d.name,
    description: d.description ?? null,
    member_count: activeMembers.filter((m) => m.department_id === d.id)
      .length,
  }));

  const invitations: OrgInvitationEntry[] = (
    (invitationsResult.data ?? []) as any[]
  ).map((i: any) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    job_title: i.job_title ?? null,
    department_id: i.department_id ?? null,
    created_at: i.created_at,
    expires_at: i.expires_at,
  }));

  // Per-user 30d entry counts (counts only)
  const entriesByUser = new Map<string, number>();
  for (const row of recentResponsesResult.data ?? []) {
    entriesByUser.set(
      row.user_id,
      (entriesByUser.get(row.user_id) ?? 0) + 1
    );
  }

  // Coverage counts grouped by business category
  const coverageMap = new Map<
    string,
    { category_slug: string; category_name: string; response_count: number }
  >();
  for (const row of (coverageResult.data ?? []) as any[]) {
    const cat = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;
    if (!cat) continue;
    const existing = coverageMap.get(row.category_id);
    if (existing) {
      existing.response_count += 1;
    } else {
      coverageMap.set(row.category_id, {
        category_slug: cat.slug,
        category_name: cat.name,
        response_count: 1,
      });
    }
  }
  const coverage = Array.from(coverageMap.values()).sort(
    (a, b) => b.response_count - a.response_count
  );

  const byDepartment: OrgDepartmentStats[] = departments.map((d) => {
    const deptMembers = activeMembers.filter(
      (m) => m.department_id === d.id
    );
    return {
      department_id: d.id,
      name: d.name,
      member_count: deptMembers.length,
      entries_30d: deptMembers.reduce(
        (sum, m) => sum + (entriesByUser.get(m.user_id) ?? 0),
        0
      ),
    };
  });

  return {
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo_url: org.logo_url ?? null,
      industry: org.industry ?? null,
      size_range: org.size_range ?? null,
      max_seats: org.max_seats,
      created_at: org.created_at,
    },
    my_role: myRole,
    members,
    departments,
    invitations,
    stats: {
      total_members: activeMembers.length,
      entries_30d: entriesCountResult.count ?? 0,
      active_members_30d: entriesByUser.size,
      coverage,
      by_department: byDepartment,
    },
  };
}
