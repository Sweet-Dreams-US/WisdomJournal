"use client";

import {
  Users, FileText, Flame, Brain, DollarSign,
  TrendingUp, Activity, Zap, BookOpen, Key,
  AlertTriangle, MessageSquare, Plus, Eye, Mail,
} from "lucide-react";
import { StatCard, GlassCard, MiniStat, formatNumber } from "./AdminShared";

interface OverviewTabProps {
  stats: any;
  onQuickAction: (action: string) => void;
}

export default function OverviewTab({ stats, onQuickAction }: OverviewTabProps) {
  const totalCodeUses = stats.beta_codes.reduce((sum: number, c: any) => sum + c.used_count, 0);
  const totalCodeSlots = stats.beta_codes.reduce((sum: number, c: any) => sum + c.max_uses, 0);

  // Build 30-day chart data
  const chartDays = stats.responses_by_day || [];
  const signupDays = stats.signups_by_day || [];
  const maxVal = Math.max(...chartDays.map((d: any) => d.count), 1);

  // Funnel data
  const funnel = stats.funnel || {
    signed_up: stats.total_users,
    onboarded: stats.onboarded_users,
    first_response: 0,
    five_plus_responses: 0,
  };

  const funnelSteps = [
    { label: "Signed Up", value: funnel.signed_up, color: "bg-sky-500" },
    { label: "Onboarded", value: funnel.onboarded, color: "bg-blue-500" },
    { label: "1st Response", value: funnel.first_response, color: "bg-indigo-500" },
    { label: "5+ Responses", value: funnel.five_plus_responses, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-4 h-4" />} label="Total Users" value={stats.total_users} color="text-sky-400" />
        <StatCard icon={<FileText className="w-4 h-4" />} label="Responses" value={formatNumber(stats.total_responses)} color="text-amber-400" />
        <StatCard icon={<BookOpen className="w-4 h-4" />} label="Words Written" value={formatNumber(stats.total_word_count)} color="text-emerald-400" />
        <StatCard
          icon={<DollarSign className="w-4 h-4" />}
          label="AI Cost"
          value={`$${(stats.ai.total_cost_cents / 100).toFixed(2)}`}
          subtitle={`${stats.ai.total_queries} queries total`}
          color="text-rose-400"
        />
      </div>

      {/* Active Users Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Zap className="w-4 h-4" />} label="Active 24h" value={stats.active_users_24h} color="text-green-400" />
        <StatCard icon={<Activity className="w-4 h-4" />} label="Active 7d" value={stats.active_users_7d} color="text-blue-400" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Active 30d" value={stats.active_users_30d || 0} color="text-violet-400" />
      </div>

      {/* Onboarding Funnel */}
      <GlassCard>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          Onboarding Funnel
        </h2>
        <div className="flex items-end gap-3">
          {funnelSteps.map((step, i) => {
            const pct = funnel.signed_up > 0 ? (step.value / funnel.signed_up) * 100 : 0;
            return (
              <div key={step.label} className="flex-1 text-center">
                <div className="relative h-32 flex items-end justify-center mb-2">
                  <div
                    className={`w-full ${step.color} rounded-t-lg transition-all duration-700 min-h-[8px]`}
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  />
                </div>
                <p className="text-lg font-bold text-white font-body">{step.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{step.label}</p>
                {i > 0 && (
                  <p className="text-[10px] text-slate-500">{Math.round(pct)}%</p>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* AI Usage Quick Stats */}
      <GlassCard>
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          AI Usage
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat label="Total Queries" value={formatNumber(stats.ai.total_queries)} />
          <MiniStat label="Total Cost" value={`$${(stats.ai.total_cost_cents / 100).toFixed(2)}`} />
          <MiniStat label="Tokens In" value={formatNumber(stats.ai.total_tokens_in)} />
          <MiniStat label="Tokens Out" value={formatNumber(stats.ai.total_tokens_out)} />
        </div>
        {stats.ai.total_queries > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-slate-400">
              Avg cost/query:{" "}
              <span className="font-bold text-purple-300 font-body">
                ${(stats.ai.total_cost_cents / stats.ai.total_queries / 100).toFixed(4)}
              </span>
              {" | "}
              Week: {stats.ai.week_queries} queries, ${(stats.ai.week_cost_cents / 100).toFixed(2)}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Signup Chart (30 days) */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Activity (30 Days)
          </h2>
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Responses
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Signups
            </span>
          </div>
        </div>
        <div className="flex items-end gap-[3px] h-36">
          {chartDays.map((day: any, idx: number) => {
            const signupCount = signupDays[idx]?.count || 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border border-white/10 shadow-xl">
                  <span className="font-body">{day.date.slice(5)}</span>: {day.count}r / {signupCount}s
                </div>
                {/* Response bar */}
                <div
                  className="w-full bg-sky-500/60 rounded-t-sm transition-all duration-300 hover:bg-sky-400/80 min-h-[2px]"
                  style={{ height: `${Math.max((day.count / maxVal) * 100, 2)}%` }}
                />
                {/* Signup dot */}
                {signupCount > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                )}
                {/* Date label - show every 5th */}
                {idx % 5 === 0 && (
                  <span className="text-[7px] text-slate-600 mt-0.5 font-body">{day.date.slice(8)}</span>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Quick Actions + Top Users */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <GlassCard>
          <h2 className="text-sm font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => onQuickAction("create-code")}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/20 transition-all text-sm group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Create Beta Code
            </button>
            <button
              onClick={() => onQuickAction("errors")}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-sm group"
            >
              <AlertTriangle className="w-4 h-4" />
              View Errors
              {(stats.errors?.last_24h || 0) > 0 && (
                <span className="ml-auto bg-red-500/30 text-red-300 text-[10px] px-2 py-0.5 rounded-full font-bold font-body">
                  {stats.errors.last_24h} today
                </span>
              )}
            </button>
            <button
              onClick={() => onQuickAction("invite")}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all text-sm group"
            >
              <Mail className="w-4 h-4" />
              Send Invite
            </button>
          </div>
        </GlassCard>

        {/* Top Users */}
        <GlassCard>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            Top Contributors
          </h2>
          <div className="space-y-1.5">
            {stats.top_users.slice(0, 5).map((u: any, i: number) => (
              <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? "bg-amber-500/20 text-amber-400" :
                    i === 1 ? "bg-slate-400/20 text-slate-300" :
                    i === 2 ? "bg-orange-500/20 text-orange-400" :
                    "bg-slate-600/30 text-slate-500"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{u.full_name || "Anonymous"}</p>
                    <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] shrink-0">
                  <span className="text-slate-400 font-body">{u.total_responses}r</span>
                  {u.current_streak > 0 && (
                    <span className="text-amber-400 font-bold font-body flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      {u.current_streak}d
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
