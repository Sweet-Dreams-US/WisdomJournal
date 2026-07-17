"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MessageSquare, Bug, Lightbulb, AlertTriangle,
  ChevronDown, ChevronUp, StickyNote, RefreshCw,
} from "lucide-react";
import { GlassCard, StatusBadge, CountBadge, timeAgo, formatDate, SkeletonList } from "./AdminShared";

type FeedbackType = "all" | "bug" | "feature" | "general" | "crash";
type FeedbackStatus = "all" | "new" | "reviewed" | "in_progress" | "resolved" | "wont_fix";

interface FeedbackItem {
  id: string;
  user_id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  page_url: string | null;
  metadata: any;
  admin_notes: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function FeedbackTab() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FeedbackType>("all");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    fetchFeedback();
  }, []);

  async function fetchFeedback() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setFeedback((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f))
    );
  }

  async function saveNote(id: string) {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, admin_notes: noteText }),
    });
    setFeedback((prev) =>
      prev.map((f) => (f.id === id ? { ...f, admin_notes: noteText } : f))
    );
    setEditingNote(null);
    setNoteText("");
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: feedback.length, bug: 0, feature: 0, general: 0, crash: 0 };
    const s: Record<string, number> = { all: feedback.length, new: 0, reviewed: 0, in_progress: 0, resolved: 0, wont_fix: 0 };
    feedback.forEach((f) => {
      c[f.type] = (c[f.type] || 0) + 1;
      s[f.status] = (s[f.status] || 0) + 1;
    });
    return { types: c, statuses: s };
  }, [feedback]);

  const filtered = useMemo(() => {
    return feedback.filter((f) => {
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      return true;
    });
  }, [feedback, typeFilter, statusFilter]);

  const typeIcons: Record<string, any> = {
    bug: <Bug className="w-3 h-3" />,
    feature: <Lightbulb className="w-3 h-3" />,
    general: <MessageSquare className="w-3 h-3" />,
    crash: <AlertTriangle className="w-3 h-3" />,
  };

  const statusOptions = ["new", "reviewed", "in_progress", "resolved", "wont_fix"];

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
      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "bug", "feature", "general", "crash"] as FeedbackType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === t
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                : "bg-slate-800/30 text-slate-400 border border-white/5 hover:border-white/10"
            }`}
          >
            {t !== "all" && typeIcons[t]}
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            <CountBadge count={counts.types[t] || 0} color={t === "bug" || t === "crash" ? "bg-red-500" : t === "feature" ? "bg-blue-500" : "bg-slate-500"} />
          </button>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "reviewed", "in_progress", "resolved", "wont_fix"] as FeedbackStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                : "bg-slate-800/30 text-slate-400 border border-white/5 hover:border-white/10"
            }`}
          >
            {s === "all" ? "All Status" : s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            <CountBadge
              count={counts.statuses[s] || 0}
              color={s === "new" ? "bg-red-500" : s === "in_progress" ? "bg-yellow-500" : s === "resolved" ? "bg-green-500" : "bg-slate-500"}
            />
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <GlassCard padding="p-0">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm text-white font-medium">{filtered.length} items</span>
          <button onClick={fetchFeedback} className="text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No feedback items match your filters.
            </div>
          )}
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="hover:bg-white/[0.02] transition-colors">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{typeIcons[item.type] || typeIcons.general}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{item.title || "Untitled"}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.user_name || item.user_email || "Unknown"} -- {timeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={item.type} />
                    <StatusBadge status={item.status} />
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4">
                    <div className="bg-slate-700/20 rounded-xl p-4 space-y-3 border border-white/5">
                      {/* Description */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Description</p>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.description || "No description"}</p>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] text-slate-500 bg-slate-700/30 px-2 py-1 rounded border border-white/5">
                          User: {item.user_email || "unknown"}
                        </span>
                        {item.page_url && (
                          <span className="text-[10px] text-slate-500 bg-slate-700/30 px-2 py-1 rounded border border-white/5">
                            Page: {item.page_url}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 bg-slate-700/30 px-2 py-1 rounded border border-white/5">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {/* Metadata */}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Metadata</p>
                          <pre className="text-[10px] text-slate-400 bg-slate-800/50 p-2 rounded-lg overflow-auto font-body">
                            {JSON.stringify(item.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Admin Notes */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                          <StickyNote className="w-3 h-3" />
                          Admin Notes
                        </p>
                        {editingNote === item.id ? (
                          <div className="flex gap-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg bg-slate-700/30 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 resize-none"
                              rows={2}
                              placeholder="Add a note..."
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => saveNote(item.id)}
                                className="px-3 py-1 rounded-lg bg-sky-500 text-white text-xs hover:bg-sky-400"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => { setEditingNote(null); setNoteText(""); }}
                                className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs hover:bg-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingNote(item.id); setNoteText(item.admin_notes || ""); }}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                          >
                            {item.admin_notes || "Click to add note..."}
                          </button>
                        )}
                      </div>

                      {/* Status Change */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Update Status</p>
                        <div className="flex gap-2 flex-wrap">
                          {statusOptions.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(item.id, s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                item.status === s
                                  ? "ring-2 ring-sky-500/50"
                                  : ""
                              }`}
                            >
                              <StatusBadge status={s} />
                            </button>
                          ))}
                        </div>
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
