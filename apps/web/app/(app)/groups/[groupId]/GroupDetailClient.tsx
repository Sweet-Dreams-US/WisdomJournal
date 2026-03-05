"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Globe, Lock, UserPlus, LogOut, Trash2, Crown, Shield } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TrustColorBadge from "@/components/ui/TrustColorBadge";
import CategoryAccessGrid from "@/components/ui/CategoryAccessGrid";
import type { GroupRole } from "@wisdom-journal/shared";
import type { GroupDetail } from "@/lib/data/get-group";

interface GroupDetailClientProps {
  group: GroupDetail;
}

const roleIcons: Record<GroupRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Users,
};

const roleBadgeColors: Record<GroupRole, string> = {
  owner: "bg-golden-hour/10 text-golden-hour",
  admin: "bg-deep-sky/10 text-deep-sky",
  member: "bg-soft-gray text-charcoal/60",
  viewer: "bg-soft-gray text-charcoal/40",
};

export default function GroupDetailClient({ group }: GroupDetailClientProps) {
  const router = useRouter();
  const isOwner = group.my_membership?.role === "owner";
  const isAdmin = group.my_membership?.role === "admin";

  // Category access state for current user
  const [categoryAccess, setCategoryAccess] = useState(() =>
    group.my_category_access.map((c) => ({
      slug: c.slug,
      name: c.name,
      enabled: c.is_enabled,
    }))
  );

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<GroupRole>("member");
  const [inviting, setInviting] = useState(false);

  async function handleCategoryToggle(slug: string, enabled: boolean) {
    setCategoryAccess((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, enabled } : c))
    );

    const toggle = group.my_category_access.find((c) => c.slug === slug);
    if (toggle) {
      await fetch(`/api/groups/${group.id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toggles: [{ category_id: toggle.category_id, is_enabled: enabled }],
        }),
      });
    }
  }

  async function handleInvite() {
    if (inviting || !inviteEmail.trim()) return;
    setInviting(true);

    try {
      const res = await fetch(`/api/groups/${group.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      if (res.ok) {
        setInviteEmail("");
        router.refresh();
      } else {
        const err = await res.json();
        console.error("Invite failed:", err.error);
      }
    } catch (error) {
      console.error("Invite error:", error);
    } finally {
      setInviting(false);
    }
  }

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this group?")) return;

    await fetch(`/api/groups/${group.id}/leave`, { method: "POST" });
    router.push("/groups");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this group? This cannot be undone.")) return;

    await fetch(`/api/groups/${group.id}`, { method: "DELETE" });
    router.push("/groups");
    router.refresh();
  }

  const TypeIcon = group.group_type === "private" ? Lock : group.group_type === "public" ? Globe : Users;

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </Link>

      {/* Group header */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-7 h-7 text-deep-sky" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-twilight">{group.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-soft-gray text-charcoal/60 capitalize">
                {group.group_type}
              </span>
            </div>
            {group.description && (
              <p className="text-sm text-charcoal/60 mt-1">{group.description}</p>
            )}
            <p className="text-xs text-charcoal/40 mt-2">
              {group.member_count} {group.member_count === 1 ? "member" : "members"}
            </p>
          </div>
        </div>
      </Card>

      {/* Members list */}
      <h3 className="text-lg font-bold text-twilight mb-3">Members</h3>
      <Card padding="md" className="mb-6">
        <div className="space-y-3">
          {group.members.map((member) => {
            const name = member.profile?.full_name ?? "Unknown";
            const RoleIcon = roleIcons[member.role];
            const initials = name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-deep-sky">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-charcoal truncate">{name}</p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${roleBadgeColors[member.role]}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {member.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-charcoal/40">
                    <span className="capitalize">{member.status}</span>
                    {member.access_summary && (
                      <TrustColorBadge color={member.access_summary.trust_color} showLabel />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Category access */}
      {categoryAccess.length > 0 && (
        <>
          <h3 className="text-lg font-bold text-twilight mb-2">Your Category Access</h3>
          <p className="text-sm text-charcoal/60 mb-3">
            Control which categories you share with this group.
          </p>
          <Card padding="md" className="mb-6">
            <CategoryAccessGrid
              categories={categoryAccess}
              onChange={handleCategoryToggle}
            />
          </Card>
        </>
      )}

      {/* Invite member */}
      {(isOwner || isAdmin) && (
        <>
          <h3 className="text-lg font-bold text-twilight mb-3">Invite Member</h3>
          <Card padding="md" className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  variant="light"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as GroupRole)}
                className="px-3 py-2.5 rounded-input border border-soft-gray bg-white text-sm text-charcoal font-body"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button size="md" disabled={!inviteEmail.trim() || inviting} onClick={handleInvite}>
                <UserPlus className="w-4 h-4 mr-1" />
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {!isOwner && group.my_membership && (
          <Button variant="ghost" size="sm" onClick={handleLeave} className="text-charcoal/60 hover:text-charcoal hover:bg-soft-gray">
            <LogOut className="w-4 h-4 mr-1" />
            Leave Group
          </Button>
        )}
        {isOwner && (
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-error hover:bg-error/10 hover:text-error">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete Group
          </Button>
        )}
      </div>
    </div>
  );
}
