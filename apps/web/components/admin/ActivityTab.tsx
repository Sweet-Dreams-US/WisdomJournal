"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, RefreshCw, Filter, ChevronDown,
  FileText, UserPlus, MessageSquare, Brain, Heart,
  Bookmark, Share2, Eye,
} from "lucide-react";
import { GlassCard, timeAgo, SkeletonList } from "./AdminShared";

interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

const eventTypeIcons: Record<string, any> = {
  response_created: <FileText className="w-3.5 h-3.5 text-sky-400" />,
  response_updated: <FileText className="w-3.5 h-3.5 text-blue-400" />,
  user_signup: <UserPlus className="w-3.5 h-3.5 text-green-400" />,
  feedback_submitted: <MessageSquare className="w-3.5 h-3.5 text-amber-400" />,
  wisdom_query: <Brain className="w-3.5 h-3.5 text-purple-400" />,
  friendship_created: <Heart className="w-3.5 h-3.5 text-rose-400" />,
  bookmark_created: <Bookmark className="w-3.5 h-3.5 text-amber-300" />,
  share_created: <Share2 className="w-3.5 h-3.5 text-sky-300" />,
  onboarding_completed: <UserPlus className="w-3.5 h-3.5 text-emerald-400" />,
};

const eventTypeLabels: Record<string, string> = {
  response_created: "wrote a response",
  response_updated: "updated a response",
  user_signup: "signed up",
  feedback_submitted: "submitted feedback",
  wisdom_query: "asked for wisdom",
  friendship_created: "connected with someone",
  bookmark_created: "bookmarked something",
  share_created: "shared something",
  onboarding_completed: "completed onboarding",
};

export default function ActivityTab() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const fetchActivity = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    try {
      const offset = append ? events.length : 0;
      const typeParam = typeFilter !== "all" ? `&type=${typeFilter}` : "";
      const res = await fetch(`/api/admin/activity?limit=50&offset=${offset}${typeParam}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setEvents((prev) => [...prev, ...(data.events || [])]);
        } else {
          setEvents(data.events || []);
        }
        setHasMore(data.has_more);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [typeFilter, events.length]);

  useEffect(() => {
    fetchActivity();
  }, [typeFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivity();
    }, 30000);
    return () => clearInterval(interval);
  }, [typeFilter]);

  const eventTypes = Object.keys(eventTypeLabels);

  if (loading && events.length === 0) {
    return (
      <div className="space-y-4">
        <SkeletonList count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter !== "all"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "bg-slate-800/30 text-slate-400 border border-white/5 hover:border-white/10"
              }`}
            >
              <Filter className="w-3 h-3" />
              {typeFilter === "all" ? "All Events" : typeFilter.replace(/_/g, " ")}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 py-1 min-w-[180px]">
                <button
                  onClick={() => { setTypeFilter("all"); setShowFilterMenu(false); }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                >
                  All Events
                </button>
                {eventTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); setShowFilterMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    {eventTypeIcons[t] || <Activity className="w-3 h-3 text-slate-500" />}
                    {t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[10px] text-slate-500">
            Auto-refreshes every 30s
          </span>
        </div>

        <button
          onClick={() => fetchActivity()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800/30 border border-white/5 hover:border-white/10 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Activity Feed */}
      <GlassCard padding="p-0">
        <div className="divide-y divide-white/5">
          {events.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No activity events yet.
            </div>
          )}
          {events.map((event) => {
            const icon = eventTypeIcons[event.event_type] || <Activity className="w-3.5 h-3.5 text-slate-500" />;
            const label = eventTypeLabels[event.event_type] || event.event_type.replace(/_/g, " ");
            const userName = event.user_name || event.user_email?.split("@")[0] || "Unknown";

            return (
              <div key={event.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-700/50 border border-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-slate-400">
                  {userName.charAt(0).toUpperCase()}
                </div>

                {/* Event icon */}
                <div className="shrink-0">{icon}</div>

                {/* Event description */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">
                    <span className="font-medium">{userName}</span>{" "}
                    <span className="text-slate-400">{label}</span>
                  </p>
                  {event.event_data && typeof event.event_data === "object" && event.event_data.title && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      &quot;{event.event_data.title}&quot;
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-slate-600 shrink-0 font-body">
                  {timeAgo(event.created_at)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {hasMore && events.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5">
            <button
              onClick={() => fetchActivity(true)}
              className="w-full py-2 rounded-lg bg-slate-700/20 text-slate-400 text-xs hover:bg-slate-700/30 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
