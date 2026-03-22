"use client";

import { useState, useEffect } from "react";
import {
  Shield, BarChart3, Users, Key, MessageSquare,
  AlertTriangle, Activity, RefreshCw,
} from "lucide-react";
import { SkeletonGrid, SkeletonList, CountBadge } from "@/components/admin/AdminShared";
import OverviewTab from "@/components/admin/OverviewTab";
import UsersTab from "@/components/admin/UsersTab";
import BetaTab from "@/components/admin/BetaTab";
import FeedbackTab from "@/components/admin/FeedbackTab";
import ErrorsTab from "@/components/admin/ErrorsTab";
import ActivityTab from "@/components/admin/ActivityTab";

type Tab = "overview" | "users" | "beta" | "feedback" | "errors" | "activity";

interface AdminStats {
  total_users: number;
  total_responses: number;
  active_users_24h: number;
  active_users_7d: number;
  active_users_30d: number;
  onboarded_users: number;
  total_word_count: number;
  total_friendships: number;
  total_groups: number;
  funnel: {
    signed_up: number;
    onboarded: number;
    first_response: number;
    five_plus_responses: number;
  };
  ai: {
    total_queries: number;
    total_cost_cents: number;
    total_tokens_in: number;
    total_tokens_out: number;
    week_queries: number;
    week_cost_cents: number;
  };
  errors: {
    last_24h: number;
    last_7d: number;
  };
  feedback: {
    total: number;
    by_status: Record<string, number>;
  };
  daily_activity: Record<string, number>;
  daily_signups: Record<string, number>;
  responses_by_day: { date: string; count: number }[];
  signups_by_day: { date: string; count: number }[];
  beta_codes: any[];
  all_users: any[];
  top_users: any[];
}

export default function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
        setLastRefresh(new Date());
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  function handleQuickAction(action: string) {
    switch (action) {
      case "create-code":
        setActiveTab("beta");
        break;
      case "errors":
        setActiveTab("errors");
        break;
      case "invite":
        setActiveTab("beta");
        break;
    }
  }

  // Tab config
  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" />, badge: stats?.total_users },
    { key: "beta", label: "Beta", icon: <Key className="w-4 h-4" />, badge: stats?.beta_codes?.length },
    {
      key: "feedback",
      label: "Feedback",
      icon: <MessageSquare className="w-4 h-4" />,
      badge: stats?.feedback?.by_status?.new || 0,
    },
    {
      key: "errors",
      label: "Errors",
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: stats?.errors?.last_24h || 0,
    },
    { key: "activity", label: "Activity", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-900 -m-4 md:-m-8 p-4 md:p-8 rounded-2xl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-sky-400" />
              </div>
              Beta Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-body">
              Wisdom Journal -- Last refreshed {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-slate-300 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1.5 bg-slate-800/30 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-slate-700/50 text-white border border-white/10 shadow-lg"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <CountBadge
                  count={tab.badge}
                  color={
                    tab.key === "errors" ? "bg-red-500" :
                    tab.key === "feedback" ? "bg-amber-500" :
                    "bg-slate-600"
                  }
                />
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && !stats && (
          <div className="space-y-6">
            <SkeletonGrid count={4} />
            <SkeletonGrid count={3} />
            <SkeletonList count={5} />
          </div>
        )}

        {/* Error State */}
        {!loading && !stats && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-white font-medium">Failed to load admin data</p>
            <p className="text-sm text-slate-400 mt-1">Check your connection and try again.</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-6 py-2 rounded-xl bg-sky-500 text-white text-sm hover:bg-sky-400 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab Content */}
        {stats && (
          <div>
            {activeTab === "overview" && (
              <OverviewTab stats={stats} onQuickAction={handleQuickAction} />
            )}
            {activeTab === "users" && (
              <UsersTab stats={stats} onRefresh={fetchStats} />
            )}
            {activeTab === "beta" && (
              <BetaTab stats={stats} onRefresh={fetchStats} />
            )}
            {activeTab === "feedback" && (
              <FeedbackTab />
            )}
            {activeTab === "errors" && (
              <ErrorsTab />
            )}
            {activeTab === "activity" && (
              <ActivityTab />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
