"use client";

import { useState, useMemo } from "react";
import {
  Search, Shield, UserX, ChevronDown, ChevronUp,
  Filter, Users, Flame,
} from "lucide-react";
import { GlassCard, MiniStat, StatusBadge, timeAgo, formatDate } from "./AdminShared";

interface UsersTabProps {
  stats: any;
  onRefresh: () => void;
}

type UserFilter = "all" | "onboarded" | "not_onboarded" | "active" | "inactive";

export default function UsersTab({ stats, onRefresh }: UsersTabProps) {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [filter, setFilter] = useState<UserFilter>("all");
  const [sortBy, setSortBy] = useState<"newest" | "responses" | "streak">("newest");

  const filteredUsers = useMemo(() => {
    let users = stats.all_users || [];

    // Apply filter
    if (filter === "onboarded") users = users.filter((u: any) => u.onboarding_completed);
    if (filter === "not_onboarded") users = users.filter((u: any) => !u.onboarding_completed);
    if (filter === "active") {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      users = users.filter((u: any) => u.last_response_at && new Date(u.last_response_at).getTime() > sevenDaysAgo);
    }
    if (filter === "inactive") {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      users = users.filter((u: any) => !u.last_response_at || new Date(u.last_response_at).getTime() <= sevenDaysAgo);
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      users = users.filter(
        (u: any) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    // Apply sort
    if (sortBy === "responses") users = [...users].sort((a: any, b: any) => (b.total_responses || 0) - (a.total_responses || 0));
    if (sortBy === "streak") users = [...users].sort((a: any, b: any) => (b.current_streak || 0) - (a.current_streak || 0));

    return users;
  }, [stats, search, filter, sortBy]);

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, is_admin: isAdmin }),
    });
    onRefresh();
  }

  async function markDeceased(userId: string) {
    if (!confirm("This will activate legacy mode. Their legacy contacts will gain access to their wisdom. Continue?")) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, is_deceased: true }),
    });
    onRefresh();
  }

  const filters: { key: UserFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.all_users?.length || 0 },
    { key: "onboarded", label: "Onboarded", count: stats.all_users?.filter((u: any) => u.onboarding_completed).length || 0 },
    { key: "not_onboarded", label: "Not Onboarded", count: stats.all_users?.filter((u: any) => !u.onboarding_completed).length || 0 },
    { key: "active", label: "Active (7d)", count: stats.active_users_7d || 0 },
    { key: "inactive", label: "Inactive", count: (stats.all_users?.length || 0) - (stats.active_users_7d || 0) },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/30 backdrop-blur-sm transition-all"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500/50 backdrop-blur-sm"
        >
          <option value="newest">Newest First</option>
          <option value="responses">Most Responses</option>
          <option value="streak">Longest Streak</option>
        </select>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                : "bg-slate-800/30 text-slate-400 border border-white/5 hover:border-white/10"
            }`}
          >
            {f.label}
            <span className="font-body text-[10px] opacity-70">{f.count}</span>
          </button>
        ))}
      </div>

      {/* User Table */}
      <GlassCard padding="p-0">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
          <div className="col-span-3">User</div>
          <div className="col-span-2 text-center">Responses</div>
          <div className="col-span-2 text-center">Words</div>
          <div className="col-span-1 text-center">Streak</div>
          <div className="col-span-2 text-center">Last Active</div>
          <div className="col-span-2 text-center">Status</div>
        </div>

        {/* User Rows */}
        <div className="divide-y divide-white/5">
          {filteredUsers.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No users match your search.
            </div>
          )}
          {filteredUsers.map((u: any) => {
            const isExpanded = expandedUser === u.id;
            const lastActive = u.last_response_at ? timeAgo(u.last_response_at) : "Never";
            const isRecentlyActive = u.last_response_at && (Date.now() - new Date(u.last_response_at).getTime()) < 24 * 60 * 60 * 1000;

            return (
              <div key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                  className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-3.5 text-left items-center"
                >
                  {/* User info */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      isRecentlyActive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" :
                      lastActive === "Never" ? "bg-slate-600" :
                      "bg-slate-500"
                    }`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-white truncate">
                          {u.full_name || "No name"}
                        </p>
                        {u.is_admin && <StatusBadge status="active" className="!text-[8px] !px-1" />}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  {/* Responses */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-bold text-white font-body">{u.total_responses || 0}</span>
                  </div>

                  {/* Words */}
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-slate-300 font-body">{(u.total_word_count || 0).toLocaleString()}</span>
                  </div>

                  {/* Streak */}
                  <div className="col-span-1 text-center">
                    {u.current_streak > 0 ? (
                      <span className="text-sm text-amber-400 font-bold font-body flex items-center justify-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        {u.current_streak}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600 font-body">0</span>
                    )}
                  </div>

                  {/* Last Active */}
                  <div className="col-span-2 text-center">
                    <span className={`text-xs ${isRecentlyActive ? "text-green-400" : "text-slate-500"}`}>
                      {lastActive}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center justify-center gap-1.5">
                    {u.onboarding_completed ? (
                      <StatusBadge status="active" />
                    ) : (
                      <StatusBadge status="warning" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-4">
                    <div className="bg-slate-700/20 rounded-xl p-4 space-y-4 border border-white/5">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <MiniStat label="Responses" value={u.total_responses || 0} />
                        <MiniStat label="Words" value={(u.total_word_count || 0).toLocaleString()} />
                        <MiniStat label="Current Streak" value={`${u.current_streak || 0}d`} />
                        <MiniStat label="Best Streak" value={`${u.longest_streak || 0}d`} />
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          `Joined ${formatDate(u.created_at)}`,
                          `Code: ${u.beta_code_used || "none"}`,
                          `Tier: ${u.subscription_tier || "free"}`,
                          `Last active: ${lastActive}`,
                          u.onboarding_completed ? "Onboarded" : "Not onboarded",
                        ].map((meta) => (
                          <span key={meta} className="text-[10px] text-slate-400 bg-slate-700/30 rounded-lg px-2.5 py-1 border border-white/5">
                            {meta}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAdmin(u.id, !u.is_admin); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            u.is_admin
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30"
                              : "bg-slate-700/30 text-slate-400 border border-white/5 hover:border-white/10"
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.is_admin ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); markDeceased(u.id); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/30 text-slate-400 border border-white/5 hover:text-rose-400 hover:border-rose-500/20 transition-all"
                        >
                          <UserX className="w-3 h-3" />
                          Legacy Mode
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
