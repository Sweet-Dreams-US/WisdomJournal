"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Plus, Globe, Lock, ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import TrustColorBadge from "@/components/ui/TrustColorBadge";
import type { UserProfile, GroupType } from "@wisdom-journal/shared";
import type { GroupWithMembership } from "@/lib/data/get-groups";

const typeIcons: Record<GroupType, typeof Globe> = {
  private: Lock,
  organization: Users,
  public: Globe,
};

interface GroupsClientProps {
  profile: UserProfile;
  groups: GroupWithMembership[];
}

export default function GroupsClient({ profile, groups }: GroupsClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    type: "private" as GroupType,
    defaultAccess: true,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating || !newGroup.name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroup.name.trim(),
          description: newGroup.description.trim() || null,
          group_type: newGroup.type,
          default_category_access: newGroup.defaultAccess,
        }),
      });

      if (res.ok) {
        setShowCreate(false);
        setNewGroup({ name: "", description: "", type: "private", defaultAccess: true });
        router.refresh();
      }
    } catch (error) {
      console.error("Create group error:", error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-twilight mb-2">Groups</h2>
          <p className="text-charcoal/60">
            Share wisdom with family, friends, and communities.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-1" />
          New Group
        </Button>
      </div>

      {/* Create group form */}
      {showCreate && (
        <Card padding="lg" className="mb-6">
          <h3 className="text-lg font-bold text-twilight mb-4">Create a Group</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              variant="light"
              label="Group name"
              placeholder="e.g., Mitchell Family"
              value={newGroup.name}
              onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              variant="light"
              label="Description"
              placeholder="What is this group for?"
              value={newGroup.description}
              onChange={(e) => setNewGroup((prev) => ({ ...prev, description: e.target.value }))}
            />

            <div>
              <label className="block text-xs font-body font-medium text-charcoal/60 mb-1.5 tracking-wide">
                Group type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["private", "organization", "public"] as GroupType[]).map((type) => {
                  const Icon = typeIcons[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewGroup((prev) => ({ ...prev, type }))}
                      className={`
                        flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all
                        ${newGroup.type === type
                          ? "bg-deep-sky text-white"
                          : "bg-soft-gray text-charcoal/60 hover:bg-charcoal/10"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-charcoal">Default category access</p>
                <p className="text-xs text-charcoal/50">New members can see all categories by default</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={newGroup.defaultAccess}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, defaultAccess: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-soft-gray rounded-full peer-checked:bg-deep-sky transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreate(false)}
                className="text-charcoal/60 hover:text-charcoal hover:bg-soft-gray"
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={!newGroup.name.trim() || creating}>
                {creating ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Groups Yet"
          description="Create a group to share your wisdom with family, friends, or communities."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Group
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const TypeIcon = typeIcons[group.group_type];

            return (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card hover padding="md" className="cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-6 h-6 text-deep-sky" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-twilight truncate">{group.name}</h3>
                        {group.access_summary && (
                          <TrustColorBadge color={group.access_summary.trust_color} />
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-charcoal/60 line-clamp-1">{group.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-charcoal/40">
                        <span>{group.member_count} members</span>
                        <span className="capitalize">{group.group_type}</span>
                        {group.membership && (
                          <span className="capitalize">{group.membership.role}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-charcoal/30 flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
