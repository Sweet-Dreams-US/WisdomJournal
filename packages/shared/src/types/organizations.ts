// Organizations — business tier (migration 042)

export type OrganizationSizeRange =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-1000"
  | "1000+";

export type OrganizationRole = "owner" | "admin" | "member";
export type OrganizationMemberStatus = "active" | "departed";
export type OrganizationInvitationRole = "admin" | "member";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  size_range: OrganizationSizeRange | null;
  max_seats: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  job_title: string | null;
  department_id: string | null;
  status: OrganizationMemberStatus;
  joined_at: string;
  departed_at: string | null;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationInvitationRole;
  job_title: string | null;
  department_id: string | null;
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}
