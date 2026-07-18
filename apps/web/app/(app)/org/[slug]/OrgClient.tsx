"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  BookOpen,
  Building2,
  Check,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StatsCard from "@/components/ui/StatsCard";
import EmptyState from "@/components/ui/EmptyState";
import Sparkline from "@/components/visualizations/Sparkline";
import { useToast } from "@/components/ui/Toast";
import { plural } from "@/lib/utils/plural";
import { getCategoryStyle } from "@/lib/category-utils";

export type OrgRole = "owner" | "admin" | "member";
export type MemberStatus = "active" | "departed";

export interface OrgMember {
  id: string;
  user_id: string;
  role: OrgRole;
  job_title: string | null;
  department_id: string | null;
  status: MemberStatus;
  joined_at: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

export interface OrgDepartment {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
}

export interface OrgInvitation {
  id: string;
  email: string;
  role: "admin" | "member";
  job_title: string | null;
  department_id: string | null;
  created_at: string;
  expires_at: string;
}

export interface OrgStats {
  total_members: number;
  entries_30d: number;
  active_members_30d: number;
  coverage: Array<{
    category_slug: string;
    category_name: string;
    response_count: number;
  }>;
  by_department: Array<{
    department_id: string;
    name: string;
    member_count: number;
    entries_30d: number;
  }>;
  daily30: Array<{ dateKey: string; count: number }>;
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
  my_role: OrgRole;
  members: OrgMember[];
  departments: OrgDepartment[];
  invitations: OrgInvitation[];
  stats: OrgStats;
}

type Tab = "overview" | "members" | "departments" | "settings";

const SIZE_RANGES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const rolePillClasses: Record<OrgRole, string> = {
  owner: "bg-golden-hour/10 text-golden-hour",
  admin: "bg-deep-sky/10 text-deep-sky",
  member: "bg-soft-gray text-charcoal/60",
};

const selectClasses =
  "w-full px-4 py-3 rounded-input border border-soft-gray bg-white font-body text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-deep-sky/50 focus:border-deep-sky/30 transition-all duration-200";

const smallSelectClasses =
  "w-full px-3 py-2 rounded-input border border-soft-gray bg-white font-body text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-deep-sky/50 focus:border-deep-sky/30 transition-all duration-200";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a YYYY-MM-DD dateKey as "Jun 19" without UTC drift. */
function shortDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function memberDisplayName(member: OrgMember): string {
  return member.profile?.full_name || member.profile?.email || "Unknown member";
}

interface OrgClientProps {
  data: OrganizationDetail;
}

export default function OrgClient({ data }: OrgClientProps) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { org, my_role, members, departments, invitations, stats } = data;
  const isAdmin = my_role === "owner" || my_role === "admin";

  const [tab, setTab] = useState<Tab>("overview");

  // ---- Members state ----
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as "admin" | "member",
    job_title: "",
    department_id: "",
  });
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState({
    role: "member" as OrgRole,
    job_title: "",
    department_id: "",
  });
  const [savingMember, setSavingMember] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // ---- Departments state ----
  const [newDept, setNewDept] = useState({ name: "", description: "" });
  const [creatingDept, setCreatingDept] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptDraft, setDeptDraft] = useState({ name: "", description: "" });
  const [savingDept, setSavingDept] = useState(false);

  // ---- Settings state ----
  const [settingsForm, setSettingsForm] = useState({
    name: org.name,
    industry: org.industry ?? "",
    logo_url: org.logo_url ?? "",
    size_range: org.size_range ?? "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
  const activeMembers = members.filter((m) => m.status === "active");
  const sortedMembers = [...members].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "active" ? -1 : 1
  );
  const maxCoverage = Math.max(
    1,
    ...stats.coverage.map((c) => c.response_count)
  );

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "members", label: "Members", icon: Users },
    { id: "departments", label: "Departments", icon: FolderKanban },
    ...(isAdmin
      ? [{ id: "settings" as Tab, label: "Settings", icon: Settings }]
      : []),
  ];

  // ---- Member handlers ----

  function startEditMember(member: OrgMember) {
    setEditingMemberId(member.id);
    setMemberDraft({
      role: member.role,
      job_title: member.job_title ?? "",
      department_id: member.department_id ?? "",
    });
  }

  async function saveMember() {
    if (!editingMemberId || savingMember) return;
    setSavingMember(true);
    try {
      const res = await fetch(
        `/api/organizations/${org.id}/members/${editingMemberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: memberDraft.role,
            job_title: memberDraft.job_title.trim() || null,
            department_id: memberDraft.department_id || null,
          }),
        }
      );
      if (res.ok) {
        toastSuccess("Member updated");
        setEditingMemberId(null);
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toastError(d.error || "Failed to update member");
      }
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setSavingMember(false);
    }
  }

  async function setMemberStatus(member: OrgMember, status: MemberStatus) {
    const name = memberDisplayName(member);
    if (
      status === "departed" &&
      !window.confirm(
        `Mark ${name} as departed? Their entries stay in the archive, but they will no longer count as an active member.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/organizations/${org.id}/members/${member.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) {
        toastSuccess(
          status === "departed"
            ? `${name} marked as departed`
            : `${name} reactivated`
        );
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toastError(d.error || "Failed to update member");
      }
    } catch {
      toastError("Network error. Please try again.");
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (inviting || !inviteForm.email.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/organizations/${org.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteForm.email.trim(),
          role: inviteForm.role,
          ...(inviteForm.job_title.trim()
            ? { job_title: inviteForm.job_title.trim() }
            : {}),
          ...(inviteForm.department_id
            ? { department_id: inviteForm.department_id }
            : {}),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toastSuccess(`Invitation sent to ${inviteForm.email.trim()}`);
        setShowInvite(false);
        setInviteForm({
          email: "",
          role: "member",
          job_title: "",
          department_id: "",
        });
        router.refresh();
      } else if (res.status === 409) {
        setInviteError(
          d.error || "This person is already a member or has a pending invitation."
        );
      } else if (res.status === 403) {
        setInviteError(
          d.error ||
            `Seat limit reached (${org.max_seats} seats). Remove a member or contact support to add more seats.`
        );
      } else {
        setInviteError(d.error || "Failed to send invitation");
      }
    } catch {
      setInviteError("Network error. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvitation(invitation: OrgInvitation) {
    if (
      !window.confirm(`Revoke the invitation for ${invitation.email}?`) ||
      revokingId
    ) {
      return;
    }
    setRevokingId(invitation.id);
    try {
      const res = await fetch(
        `/api/organizations/${org.id}/invitations/${invitation.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toastSuccess("Invitation revoked");
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toastError(d.error || "Failed to revoke invitation");
      }
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setRevokingId(null);
    }
  }

  // ---- Department handlers ----

  async function handleCreateDept(e: React.FormEvent) {
    e.preventDefault();
    if (creatingDept || !newDept.name.trim()) return;
    setCreatingDept(true);
    setDeptError(null);
    try {
      const res = await fetch(`/api/organizations/${org.id}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDept.name.trim(),
          ...(newDept.description.trim()
            ? { description: newDept.description.trim() }
            : {}),
        }),
      });
      if (res.ok) {
        toastSuccess("Department created");
        setNewDept({ name: "", description: "" });
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setDeptError(d.error || "Failed to create department");
      }
    } catch {
      setDeptError("Network error. Please try again.");
    } finally {
      setCreatingDept(false);
    }
  }

  function startEditDept(dept: OrgDepartment) {
    setEditingDeptId(dept.id);
    setDeptDraft({ name: dept.name, description: dept.description ?? "" });
  }

  async function saveDept() {
    if (!editingDeptId || savingDept || !deptDraft.name.trim()) return;
    setSavingDept(true);
    try {
      const res = await fetch(
        `/api/organizations/${org.id}/departments/${editingDeptId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: deptDraft.name.trim(),
            description: deptDraft.description.trim() || null,
          }),
        }
      );
      if (res.ok) {
        toastSuccess("Department updated");
        setEditingDeptId(null);
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toastError(d.error || "Failed to update department");
      }
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setSavingDept(false);
    }
  }

  async function deleteDept(dept: OrgDepartment) {
    if (
      !window.confirm(
        `Delete the ${dept.name} department? Members assigned to it will simply lose the department label.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/organizations/${org.id}/departments/${dept.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toastSuccess("Department deleted");
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toastError(d.error || "Failed to delete department");
      }
    } catch {
      toastError("Network error. Please try again.");
    }
  }

  // ---- Settings handlers ----

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (savingSettings || !settingsForm.name.trim()) return;
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsForm.name.trim(),
          industry: settingsForm.industry.trim() || null,
          logo_url: settingsForm.logo_url.trim() || null,
          ...(settingsForm.size_range
            ? { size_range: settingsForm.size_range }
            : {}),
        }),
      });
      if (res.ok) {
        toastSuccess("Organization updated");
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toastError(d.error || "Failed to update organization");
      }
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  }

  const seatsUsed = activeMembers.length;
  const seatPercent = Math.min(100, (seatsUsed / Math.max(1, org.max_seats)) * 100);

  return (
    <div className="max-w-4xl">
      {/* Shared bar draw-in (scaleX from the left; transform-only, covered
          by the global prefers-reduced-motion zeroing in globals.css) */}
      <style>{`
        @keyframes orgBarGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>

      {/* Back link */}
      <Link
        href="/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All organizations
      </Link>

      {/* Org header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-deep-sky/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-7 h-7 text-deep-sky" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-twilight truncate">
              {org.name}
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${rolePillClasses[my_role]}`}
            >
              {my_role}
            </span>
          </div>
          <p className="text-sm text-charcoal/50">
            {[org.industry, plural(stats.total_members, "member")]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-charcoal/[0.06] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-deep-sky text-deep-sky"
                : "border-transparent text-charcoal/50 hover:text-charcoal"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== OVERVIEW ==================== */}
      {tab === "overview" && (
        <div className="animate-fade-in">
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatsCard
              value={stats.total_members}
              label="Members"
              icon={Users}
              iconColor="text-deep-sky"
              iconBg="bg-deep-sky/10"
            />
            <StatsCard
              value={stats.entries_30d}
              label="Entries · 30 days"
              icon={BookOpen}
              iconColor="text-twilight"
              iconBg="bg-twilight/10"
            />
            <StatsCard
              value={stats.active_members_30d}
              label="Active · 30 days"
              icon={Activity}
              iconColor="text-golden-hour"
              iconBg="bg-golden-hour/10"
            />
          </div>

          {/* Solo-org invite CTA */}
          {stats.total_members === 1 && isAdmin && (
            <div className="mb-6 rounded-card shadow-card border border-golden-hour/30 bg-gradient-to-br from-golden-hour/[0.08] via-white to-white p-6 animate-fade-in-up">
              <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                <div className="w-11 h-11 rounded-xl bg-golden-hour/15 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-golden-hour" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-heading text-lg text-twilight mb-1">
                    It&apos;s quiet in here
                  </p>
                  <p className="text-sm text-charcoal/60">
                    Knowledge capture works best with your key people — invite
                    your first teammate and watch this dashboard come alive.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => {
                    setTab("members");
                    setShowInvite(true);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Invite a teammate
                </Button>
              </div>
            </div>
          )}

          {/* 30-day activity sparkline */}
          <Card padding="md" className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm font-semibold text-charcoal">
                30-day activity
              </span>
              <span className="text-right">
                <span className="font-heading text-2xl text-twilight leading-none">
                  {stats.entries_30d}
                </span>
                <span className="text-xs text-charcoal/40 ml-1.5">
                  {stats.entries_30d === 1 ? "entry" : "entries"}
                </span>
              </span>
            </div>
            <Sparkline
              data={stats.daily30.map((d) => d.count)}
              label={`Entries per day over the last 30 days: ${stats.entries_30d} total`}
            />
            {stats.daily30.length > 0 && (
              <div className="flex items-center justify-between text-[10px] text-charcoal/40 mt-1.5">
                <span>{shortDateLabel(stats.daily30[0].dateKey)}</span>
                <span>Today</span>
              </div>
            )}
          </Card>

          {/* Business category coverage */}
          <Card padding="md" className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-charcoal">
                Knowledge Coverage
              </span>
              <span className="text-xs text-charcoal/50">
                {plural(stats.coverage.length, "business category", "business categories")}
              </span>
            </div>
            {stats.coverage.length === 0 ? (
              <p className="text-sm text-charcoal/40 py-4 text-center">
                No business entries yet. Coverage fills in as your team starts
                answering work questions.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.coverage.map((cat, i) => {
                  const catStyle = getCategoryStyle(cat.category_slug);
                  const CatIcon = catStyle.icon;
                  return (
                    <div key={cat.category_slug}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 text-charcoal/70 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${catStyle.bgColor}`}
                          >
                            <CatIcon className={`w-3 h-3 ${catStyle.color}`} />
                          </span>
                          <span className="truncate">{cat.category_name}</span>
                        </span>
                        <span className="text-charcoal/40 flex-shrink-0 ml-2">
                          {plural(cat.response_count, "entry", "entries")}
                        </span>
                      </div>
                      <div className="h-2 bg-soft-gray rounded-full overflow-hidden">
                        <div
                          className="h-full bg-deep-sky rounded-full transition-all"
                          style={{
                            width: `${(cat.response_count / maxCoverage) * 100}%`,
                            transformOrigin: "left",
                            animation:
                              "orgBarGrow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
                            animationDelay: `${0.15 + Math.min(i, 8) * 0.07}s`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Departments summary */}
          {stats.by_department.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-twilight mb-3">Departments</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.by_department.map((dept, i) => (
                  <div
                    key={dept.department_id}
                    className="animate-stagger-in"
                    style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}
                  >
                    <Card padding="sm">
                      <p className="text-sm font-semibold text-twilight mb-1 truncate">
                        {dept.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-charcoal/50">
                        <span>{plural(dept.member_count, "member")}</span>
                        <span>
                          {plural(dept.entries_30d, "entry", "entries")} · 30d
                        </span>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="flex items-center gap-2 text-xs text-charcoal/40 mt-6">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            Admins see participation metrics only — entries stay private to
            their authors.
          </p>
        </div>
      )}

      {/* ==================== MEMBERS ==================== */}
      {tab === "members" && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-twilight">
              {plural(members.length, "Member")}
            </h3>
            {isAdmin && (
              <Button size="sm" onClick={() => setShowInvite(true)}>
                <UserPlus className="w-4 h-4 mr-1.5" />
                Invite
              </Button>
            )}
          </div>

          <div className="space-y-3 mb-8">
            {sortedMembers.map((member, i) => {
              const name = memberDisplayName(member);
              const isEditing = editingMemberId === member.id;
              return (
                <div
                  key={member.id}
                  className="animate-stagger-in"
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
                >
                  <Card
                    padding="sm"
                    className={member.status === "departed" ? "opacity-60" : ""}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-10 h-10 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-deep-sky">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-twilight truncate">
                            {name}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${rolePillClasses[member.role]}`}
                          >
                            {member.role}
                          </span>
                          {member.status === "departed" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-charcoal/10 text-charcoal/50">
                              Departed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal/50 truncate">
                          {[
                            member.job_title,
                            member.department_id
                              ? deptNameById.get(member.department_id)
                              : null,
                            `Joined ${formatDate(member.joined_at)}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      {isAdmin && !isEditing && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {member.status === "active" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditMember(member)}
                                className="p-2 rounded-lg text-charcoal/40 hover:text-deep-sky hover:bg-deep-sky/5 transition-colors"
                                aria-label={`Edit ${name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setMemberStatus(member, "departed")}
                                className="p-2 rounded-lg text-charcoal/40 hover:text-error hover:bg-error/5 transition-colors"
                                aria-label={`Mark ${name} as departed`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <Button
                              variant="outline-light"
                              size="sm"
                              onClick={() => setMemberStatus(member, "active")}
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-charcoal/[0.06] grid sm:grid-cols-3 gap-3 animate-fade-in">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wide text-charcoal/40 mb-1">
                            Role
                          </label>
                          <select
                            className={smallSelectClasses}
                            value={memberDraft.role}
                            onChange={(e) =>
                              setMemberDraft((prev) => ({
                                ...prev,
                                role: e.target.value as OrgRole,
                              }))
                            }
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wide text-charcoal/40 mb-1">
                            Job title
                          </label>
                          <input
                            className={smallSelectClasses}
                            placeholder="e.g., Studio Engineer"
                            value={memberDraft.job_title}
                            onChange={(e) =>
                              setMemberDraft((prev) => ({
                                ...prev,
                                job_title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wide text-charcoal/40 mb-1">
                            Department
                          </label>
                          <select
                            className={smallSelectClasses}
                            value={memberDraft.department_id}
                            onChange={(e) =>
                              setMemberDraft((prev) => ({
                                ...prev,
                                department_id: e.target.value,
                              }))
                            }
                          >
                            <option value="">No department</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-3 flex gap-2 justify-end">
                          <Button
                            variant="ghost-light"
                            size="sm"
                            type="button"
                            onClick={() => setEditingMemberId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            onClick={saveMember}
                            disabled={savingMember}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {savingMember ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Pending invitations */}
          {isAdmin && invitations.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-twilight mb-3">
                Pending Invitations
              </h3>
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <Card key={invitation.id} padding="sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-golden-hour/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-golden-hour" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-charcoal truncate">
                            {invitation.email}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${rolePillClasses[invitation.role]}`}
                          >
                            {invitation.role}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal/40">
                          Invited {formatDate(invitation.created_at)} · expires{" "}
                          {formatDate(invitation.expires_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => revokeInvitation(invitation)}
                        disabled={revokingId === invitation.id}
                        className="p-2 rounded-lg text-charcoal/40 hover:text-error hover:bg-error/5 transition-colors disabled:opacity-50"
                        aria-label={`Revoke invitation for ${invitation.email}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Invite modal */}
          {showInvite && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-twilight/30 backdrop-blur-sm animate-fade-in"
                onClick={() => setShowInvite(false)}
              />
              <Card
                padding="lg"
                className="relative w-full max-w-md animate-fade-in-up"
              >
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-charcoal/5 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-charcoal/40" />
                </button>
                <h3 className="text-lg font-bold text-twilight mb-1">
                  Invite a Teammate
                </h3>
                <p className="text-sm text-charcoal/50 mb-5">
                  They&apos;ll get an email with a link to join {org.name}.
                </p>
                <form onSubmit={handleInvite} className="space-y-4">
                  <Input
                    variant="light"
                    label="Email"
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                  <div>
                    <label
                      htmlFor="invite-role"
                      className="block text-xs font-body font-medium text-charcoal/60 mb-1.5 tracking-wide"
                    >
                      Role
                    </label>
                    <select
                      id="invite-role"
                      className={selectClasses}
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          role: e.target.value as "admin" | "member",
                        }))
                      }
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Input
                    variant="light"
                    label="Job title (optional)"
                    placeholder="e.g., Head of Production"
                    value={inviteForm.job_title}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        job_title: e.target.value,
                      }))
                    }
                  />
                  <div>
                    <label
                      htmlFor="invite-department"
                      className="block text-xs font-body font-medium text-charcoal/60 mb-1.5 tracking-wide"
                    >
                      Department (optional)
                    </label>
                    <select
                      id="invite-department"
                      className={selectClasses}
                      value={inviteForm.department_id}
                      onChange={(e) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          department_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">No department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {inviteError && (
                    <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">
                      {inviteError}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end pt-1">
                    <Button
                      variant="ghost-light"
                      size="sm"
                      type="button"
                      onClick={() => setShowInvite(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      type="submit"
                      disabled={!inviteForm.email.trim() || inviting}
                    >
                      {inviting ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ==================== DEPARTMENTS ==================== */}
      {tab === "departments" && (
        <div className="animate-fade-in">
          {isAdmin && (
            <Card padding="md" className="mb-6">
              <h3 className="text-sm font-semibold text-charcoal mb-3">
                Add a Department
              </h3>
              <form
                onSubmit={handleCreateDept}
                className="grid sm:grid-cols-[1fr_1.5fr_auto] gap-3 items-end"
              >
                <Input
                  variant="light"
                  label="Name"
                  placeholder="e.g., Engineering"
                  value={newDept.name}
                  onChange={(e) =>
                    setNewDept((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <Input
                  variant="light"
                  label="Description (optional)"
                  placeholder="What does this team own?"
                  value={newDept.description}
                  onChange={(e) =>
                    setNewDept((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
                <Button
                  size="md"
                  type="submit"
                  disabled={!newDept.name.trim() || creatingDept}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {creatingDept ? "Adding..." : "Add"}
                </Button>
              </form>
              {deptError && (
                <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg mt-3">
                  {deptError}
                </p>
              )}
            </Card>
          )}

          {departments.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No Departments Yet"
              description={
                isAdmin
                  ? "Add departments to organize members and see coverage by team."
                  : "Admins haven't set up any departments yet."
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {departments.map((dept, i) => {
                const isEditing = editingDeptId === dept.id;
                return (
                  <div
                    key={dept.id}
                    className="animate-stagger-in"
                    style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}
                  >
                    <Card padding="md" className="h-full">
                      {isEditing ? (
                        <div className="space-y-3 animate-fade-in">
                          <Input
                            variant="light"
                            label="Name"
                            value={deptDraft.name}
                            onChange={(e) =>
                              setDeptDraft((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                          <Input
                            variant="light"
                            label="Description"
                            value={deptDraft.description}
                            onChange={(e) =>
                              setDeptDraft((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost-light"
                              size="sm"
                              type="button"
                              onClick={() => setEditingDeptId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              onClick={saveDept}
                              disabled={!deptDraft.name.trim() || savingDept}
                            >
                              {savingDept ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="w-5 h-5 text-deep-sky" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-twilight truncate">
                              {dept.name}
                            </p>
                            {dept.description && (
                              <p className="text-xs text-charcoal/50 line-clamp-2 mt-0.5">
                                {dept.description}
                              </p>
                            )}
                            <p className="text-xs text-charcoal/40 mt-1.5">
                              {plural(dept.member_count, "member")}
                            </p>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditDept(dept)}
                                className="p-2 rounded-lg text-charcoal/40 hover:text-deep-sky hover:bg-deep-sky/5 transition-colors"
                                aria-label={`Edit ${dept.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteDept(dept)}
                                className="p-2 rounded-lg text-charcoal/40 hover:text-error hover:bg-error/5 transition-colors"
                                aria-label={`Delete ${dept.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== SETTINGS ==================== */}
      {tab === "settings" && isAdmin && (
        <div className="animate-fade-in max-w-xl">
          <Card padding="lg" className="mb-6">
            <h3 className="text-lg font-bold text-twilight mb-4">
              Organization Settings
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <Input
                variant="light"
                label="Name"
                value={settingsForm.name}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <Input
                variant="light"
                label="Industry"
                placeholder="e.g., Music production"
                value={settingsForm.industry}
                onChange={(e) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    industry: e.target.value,
                  }))
                }
              />
              <Input
                variant="light"
                label="Logo URL"
                placeholder="https://..."
                value={settingsForm.logo_url}
                onChange={(e) =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    logo_url: e.target.value,
                  }))
                }
              />
              <div>
                <label
                  htmlFor="settings-size-range"
                  className="block text-xs font-body font-medium text-charcoal/60 mb-1.5 tracking-wide"
                >
                  Company size
                </label>
                <select
                  id="settings-size-range"
                  className={selectClasses}
                  value={settingsForm.size_range}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      size_range: e.target.value,
                    }))
                  }
                >
                  <option value="">Not specified</option>
                  {SIZE_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range} people
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  type="submit"
                  disabled={!settingsForm.name.trim() || savingSettings}
                >
                  {savingSettings ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-charcoal">Seats</span>
              <span className="text-xs text-charcoal/50">
                {seatsUsed} of {org.max_seats} used
              </span>
            </div>
            <div className="h-2 bg-soft-gray rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  seatsUsed >= org.max_seats ? "bg-golden-hour" : "bg-deep-sky"
                }`}
                style={{
                  width: `${seatPercent}%`,
                  transformOrigin: "left",
                  animation:
                    "orgBarGrow 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
                  animationDelay: "0.1s",
                }}
              />
            </div>
            <p className="text-xs text-charcoal/40 mt-2">
              Active members count toward your seat limit. Departed members
              free up their seat.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
