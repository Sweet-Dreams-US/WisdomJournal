"use client";

import { ReactNode } from "react";

// ── Stat Card ──────────────────────────────────────────────
export function StatCard({
  icon,
  label,
  value,
  subtitle,
  color = "text-sky-400",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-300 group">
      <div className="flex items-center gap-2 mb-2">
        <span className={`${color} opacity-70 group-hover:opacity-100 transition-opacity`}>{icon}</span>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-body ${color}`}>{value}</p>
      {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Mini Stat ──────────────────────────────────────────────
export function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-700/30 rounded-xl p-3 text-center border border-white/5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-bold text-white font-body mt-0.5">{value}</p>
    </div>
  );
}

// ── Glass Card ─────────────────────────────────────────────
export function GlassCard({
  children,
  className = "",
  padding = "p-6",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl ${padding} ${className}`}>
      {children}
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────
const statusColors: Record<string, string> = {
  new: "bg-red-500/20 text-red-400 border-red-500/30",
  reviewed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  wont_fix: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  bug: "bg-red-500/20 text-red-400 border-red-500/30",
  feature: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  general: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  crash: "bg-red-600/20 text-red-300 border-red-600/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  fatal: "bg-red-700/20 text-red-300 border-red-700/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const colors = statusColors[status] || statusColors.general;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors} ${className}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Count Badge ────────────────────────────────────────────
export function CountBadge({ count, color = "bg-sky-500" }: { count: number; color?: string }) {
  if (count === 0) return null;
  return (
    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white ${color} px-1`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ── Loading Skeleton ───────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-700/50 rounded-xl ${className}`} />;
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
