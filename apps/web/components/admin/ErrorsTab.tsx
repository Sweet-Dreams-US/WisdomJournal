"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle, AlertCircle, XCircle,
  ChevronDown, ChevronUp, RefreshCw, Code,
} from "lucide-react";
import { GlassCard, StatusBadge, CountBadge, timeAgo, formatDate, SkeletonList } from "./AdminShared";

type Severity = "all" | "warning" | "error" | "fatal";

interface ErrorLog {
  id: string;
  user_id: string | null;
  severity: string;
  message: string;
  stack_trace: string | null;
  component_stack: string | null;
  page_url: string | null;
  metadata: any;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function ErrorsTab() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [errorsPerDay, setErrorsPerDay] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<Severity>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchErrors();
  }, []);

  async function fetchErrors() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/errors");
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors || []);
        setErrorsPerDay(data.errors_per_day || {});
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: errors.length, warning: 0, error: 0, fatal: 0 };
    errors.forEach((e) => {
      c[e.severity] = (c[e.severity] || 0) + 1;
    });
    return c;
  }, [errors]);

  const filtered = useMemo(() => {
    if (severityFilter === "all") return errors;
    return errors.filter((e) => e.severity === severityFilter);
  }, [errors, severityFilter]);

  // Build 7-day chart
  const chartDays: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    chartDays.push({ date: key, count: errorsPerDay[key] || 0 });
  }
  const maxErrors = Math.max(...chartDays.map((d) => d.count), 1);

  const severityIcons: Record<string, any> = {
    warning: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
    fatal: <XCircle className="w-3.5 h-3.5 text-red-300" />,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 w-20 bg-slate-700/50 rounded-lg animate-pulse" />)}
        </div>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Chart */}
      <GlassCard>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Errors (7 Days)
        </h2>
        <div className="flex items-end gap-2 h-20">
          {chartDays.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-white/10">
                <span className="font-body">{day.date.slice(5)}</span>: {day.count}
              </div>
              <div
                className={`w-full rounded-t-sm min-h-[2px] transition-all ${day.count > 0 ? "bg-red-500/60 hover:bg-red-400/80" : "bg-slate-700/30"}`}
                style={{ height: `${Math.max((day.count / maxErrors) * 100, 3)}%` }}
              />
              <span className="text-[8px] text-slate-600 font-body">{day.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Severity Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "warning", "error", "fatal"] as Severity[]).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              severityFilter === s
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                : "bg-slate-800/30 text-slate-400 border border-white/5 hover:border-white/10"
            }`}
          >
            {s !== "all" && severityIcons[s]}
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            <CountBadge count={counts[s] || 0} color={s === "fatal" ? "bg-red-600" : s === "error" ? "bg-red-500" : s === "warning" ? "bg-yellow-500" : "bg-slate-500"} />
          </button>
        ))}
      </div>

      {/* Error List */}
      <GlassCard padding="p-0">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm text-white font-medium">{filtered.length} errors</span>
          <button onClick={fetchErrors} className="text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No errors found. That is good news.
            </div>
          )}
          {filtered.map((err) => {
            const isExpanded = expandedId === err.id;
            return (
              <div key={err.id} className="hover:bg-white/[0.02] transition-colors">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : err.id)}
                  className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {severityIcons[err.severity] || severityIcons.error}
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate font-body">{err.message || "Unknown error"}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {err.user_name || err.user_email || "System"} -- {timeAgo(err.created_at)}
                        {err.page_url && ` -- ${err.page_url}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={err.severity} />
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4">
                    <div className="bg-slate-700/20 rounded-xl p-4 space-y-3 border border-white/5">
                      {/* Error Message */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Error Message</p>
                        <p className="text-sm text-red-300 font-body">{err.message}</p>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] text-slate-500 bg-slate-700/30 px-2 py-1 rounded border border-white/5">
                          User: {err.user_email || "System"}
                        </span>
                        {err.page_url && (
                          <span className="text-[10px] text-slate-500 bg-slate-700/30 px-2 py-1 rounded border border-white/5">
                            Page: {err.page_url}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 bg-slate-700/30 px-2 py-1 rounded border border-white/5">
                          {formatDate(err.created_at)}
                        </span>
                      </div>

                      {/* Stack Trace */}
                      {err.stack_trace && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                            <Code className="w-3 h-3" />
                            Stack Trace
                          </p>
                          <pre className="text-[10px] text-red-300/70 bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-48 font-body border border-white/5">
                            {err.stack_trace}
                          </pre>
                        </div>
                      )}

                      {/* Component Stack */}
                      {err.component_stack && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Component Stack</p>
                          <pre className="text-[10px] text-slate-400 bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-32 font-body border border-white/5">
                            {err.component_stack}
                          </pre>
                        </div>
                      )}

                      {/* Metadata */}
                      {err.metadata && Object.keys(err.metadata).length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Metadata</p>
                          <pre className="text-[10px] text-slate-400 bg-slate-800/50 p-2 rounded-lg overflow-auto font-body">
                            {JSON.stringify(err.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
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
