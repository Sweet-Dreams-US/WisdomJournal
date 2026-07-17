"use client";

import { useState, useEffect } from "react";
import { Users, FileText, Flame, Key, Shield, UserX, Plus, Bug, Lightbulb, Heart, MessageCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface AdminStats {
  total_users: number;
  total_responses: number;
  active_users_7d: number;
  beta_codes: BetaCode[];
  recent_users: AdminUser[];
  feedback: FeedbackItem[];
}

interface FeedbackItem {
  id: string;
  type: "bug" | "idea" | "praise" | "other";
  message: string;
  page_url: string | null;
  status: "new" | "reviewed" | "resolved";
  created_at: string;
  profile: { full_name: string | null; email: string } | null;
}

interface BetaCode {
  id: string;
  code: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  total_responses: number;
  current_streak: number;
  created_at: string;
  beta_code_used: string | null;
  is_admin: boolean;
}

export default function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newCodeMax, setNewCodeMax] = useState("15");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }

  async function createCode() {
    if (!newCode.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim(), max_uses: parseInt(newCodeMax) || 15 }),
      });
      if (res.ok) {
        setNewCode("");
        fetchStats();
      }
    } catch {} finally {
      setCreating(false);
    }
  }

  async function toggleCode(id: string, active: boolean) {
    await fetch("/api/admin/codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: active }),
    });
    fetchStats();
  }

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, is_admin: isAdmin }),
    });
    fetchStats();
  }

  async function setFeedbackStatus(id: string, status: FeedbackItem["status"]) {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchStats();
  }

  async function markDeceased(userId: string, deceased: boolean) {
    if (deceased && !confirm("This will activate legacy mode for this user. Their legacy contacts will gain access to their wisdom. Continue?")) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, is_deceased: deceased }),
    });
    fetchStats();
  }

  if (loading) {
    return (
      <div className="max-w-5xl animate-pulse space-y-4">
        <div className="h-8 bg-soft-gray rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-soft-gray rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-charcoal/60">Failed to load admin data.</p>;

  const totalCodeUses = stats.beta_codes.reduce((sum, c) => sum + c.used_count, 0);
  const totalCodeSlots = stats.beta_codes.reduce((sum, c) => sum + c.max_uses, 0);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-twilight font-heading flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-charcoal/60 mt-1">Manage users, beta codes, and platform settings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<Users className="w-4 h-4" />} label="Total Users" value={stats.total_users} color="text-deep-sky" />
        <StatCard icon={<FileText className="w-4 h-4" />} label="Total Responses" value={stats.total_responses} color="text-golden-hour" />
        <StatCard icon={<Flame className="w-4 h-4" />} label="Active (7d)" value={stats.active_users_7d} color="text-sunrise-coral" />
        <StatCard icon={<Key className="w-4 h-4" />} label="Beta Slots" value={`${totalCodeUses}/${totalCodeSlots}`} color="text-twilight" />
      </div>

      {/* Beta Codes */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-lg font-semibold text-twilight mb-4">Beta Invite Codes</h2>

        <div className="space-y-3 mb-6">
          {stats.beta_codes.map((code) => (
            <div key={code.id} className="flex items-center justify-between p-3 rounded-xl bg-soft-gray/50">
              <div>
                <code className="text-sm font-mono font-bold text-twilight">{code.code}</code>
                <p className="text-xs text-charcoal/50 mt-0.5">
                  {code.used_count}/{code.max_uses} used
                </p>
              </div>
              <button
                onClick={() => toggleCode(code.id, !code.is_active)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  code.is_active
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {code.is_active ? "Active" : "Disabled"}
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="NEW-CODE-NAME"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Max uses"
            value={newCodeMax}
            onChange={(e) => setNewCodeMax(e.target.value)}
            className="w-24"
          />
          <Button onClick={createCode} disabled={creating || !newCode.trim()} size="md">
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>
      </Card>

      {/* Beta Feedback */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-lg font-semibold text-twilight mb-1">
          Beta Feedback
          {stats.feedback.filter((f) => f.status === "new").length > 0 && (
            <span className="ml-2 text-xs font-semibold text-white bg-sunrise-coral px-2 py-0.5 rounded-full align-middle">
              {stats.feedback.filter((f) => f.status === "new").length} new
            </span>
          )}
        </h2>
        <p className="text-xs text-charcoal/50 mb-4">
          What testers are reporting from the in-app feedback button.
        </p>

        {stats.feedback.length === 0 ? (
          <p className="text-sm text-charcoal/40 py-6 text-center">
            No feedback yet. It will appear here as testers use the feedback button.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.feedback.map((f) => {
              const TypeIcon =
                f.type === "bug" ? Bug : f.type === "idea" ? Lightbulb : f.type === "praise" ? Heart : MessageCircle;
              return (
                <div key={f.id} className={`p-3 rounded-xl border ${f.status === "new" ? "border-deep-sky/20 bg-deep-sky/[0.03]" : "border-charcoal/[0.06] bg-soft-gray/40"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <TypeIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        f.type === "bug" ? "text-error" : f.type === "idea" ? "text-golden-hour" : f.type === "praise" ? "text-sunrise-coral" : "text-charcoal/50"
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm text-charcoal whitespace-pre-wrap break-words">{f.message}</p>
                        <p className="text-[11px] text-charcoal/40 mt-1.5">
                          {f.profile?.full_name || f.profile?.email || "Unknown user"}
                          {f.page_url && <> · <code>{f.page_url}</code></>}
                          {" · "}
                          {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <select
                      value={f.status}
                      onChange={(e) => setFeedbackStatus(f.id, e.target.value as FeedbackItem["status"])}
                      className={`text-xs rounded-lg border px-2 py-1 flex-shrink-0 ${
                        f.status === "new"
                          ? "border-deep-sky/30 text-deep-sky"
                          : f.status === "reviewed"
                            ? "border-golden-hour/40 text-golden-hour"
                            : "border-success/40 text-success"
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Users */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-twilight mb-4">Users ({stats.recent_users.length})</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-soft-gray text-left text-xs text-charcoal/50 uppercase tracking-wider">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Responses</th>
                <th className="pb-3 pr-4">Streak</th>
                <th className="pb-3 pr-4">Code</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_users.map((u) => (
                <tr key={u.id} className="border-b border-soft-gray/50">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-charcoal truncate max-w-[200px]">
                      {u.full_name || "No name"}
                      {u.is_admin && <span className="ml-1 text-xs text-deep-sky">(admin)</span>}
                    </p>
                    <p className="text-xs text-charcoal/50">{u.email}</p>
                  </td>
                  <td className="py-3 pr-4 text-charcoal/70">{u.total_responses}</td>
                  <td className="py-3 pr-4">
                    {u.current_streak > 0 ? (
                      <span className="text-golden-hour font-medium">{u.current_streak}d</span>
                    ) : (
                      <span className="text-charcoal/30">0</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <code className="text-xs text-charcoal/50">{u.beta_code_used || "n/a"}</code>
                  </td>
                  <td className="py-3 pr-4 text-xs text-charcoal/50">
                    {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleAdmin(u.id, !u.is_admin)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          u.is_admin ? "bg-deep-sky/10 text-deep-sky" : "bg-soft-gray text-charcoal/40 hover:text-charcoal"
                        }`}
                        title={u.is_admin ? "Remove admin" : "Make admin"}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => markDeceased(u.id, true)}
                        className="p-1.5 rounded-lg bg-soft-gray text-charcoal/40 hover:text-sunrise-coral text-xs transition-colors"
                        title="Activate legacy mode"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-charcoal/50 font-body">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}
