"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BookOpen,
  Flame,
  Trophy,
  Users,
  UserPlus,
  Activity,
  Loader2,
  Filter,
} from "lucide-react";
import Card from "@/components/ui/Card";
import type { ActivityEvent } from "@/lib/data/get-activity-feed";

const EVENT_TYPE_FILTERS = [
  { value: "all", label: "All", icon: Activity },
  { value: "response_created", label: "Responses", icon: BookOpen },
  { value: "achievement_earned", label: "Achievements", icon: Trophy },
  { value: "streak_milestone", label: "Streaks", icon: Flame },
  { value: "friend_added", label: "Friends", icon: UserPlus },
  { value: "joined_group", label: "Groups", icon: Users },
] as const;

function getEventIcon(type: string) {
  switch (type) {
    case "response_created":
      return <BookOpen className="w-4 h-4 text-deep-sky" />;
    case "streak_milestone":
      return <Flame className="w-4 h-4 text-golden-hour" />;
    case "achievement_earned":
      return <Trophy className="w-4 h-4 text-golden-hour" />;
    case "joined_group":
      return <Users className="w-4 h-4 text-deep-sky" />;
    case "friend_added":
      return <UserPlus className="w-4 h-4 text-green-500" />;
    default:
      return <Activity className="w-4 h-4 text-charcoal/40" />;
  }
}

function getEventDescription(event: ActivityEvent): string {
  const name = event.profile?.full_name?.split(" ")[0] ?? "Someone";
  const data = event.event_data as Record<string, unknown>;

  switch (event.event_type) {
    case "response_created": {
      // event_data: { response_id, word_count, category_slug, category_name }
      const category =
        (data.category_name as string) ??
        ((data.category_slug as string) ?? "").replace(/_/g, " ");
      const words = (data.word_count as number) ?? 0;
      return `${name} journaled${category ? ` about ${category}` : ""}${words ? ` (${words} words)` : ""}`;
    }
    case "streak_milestone": {
      const days =
        (data.streak_days as number) ?? (data.streak as number) ?? 0;
      return days > 0
        ? `${name} reached a ${days}-day journaling streak!`
        : `${name} hit a journaling streak milestone!`;
    }
    case "achievement_earned": {
      // event_data: { achievement_id, slug, name, icon }
      const achievement =
        (data.name as string) ?? (data.achievement as string) ?? "";
      return achievement
        ? `${name} earned the "${achievement}" achievement`
        : `${name} earned an achievement`;
    }
    case "joined_group": {
      const groupName = (data.group_name as string) ?? "a group";
      return `${name} joined ${groupName}`;
    }
    case "friend_added": {
      // event_data: { friend_id, friend_name }
      const friendName = (data.friend_name as string) ?? "";
      return friendName
        ? `${name} connected with ${friendName}`
        : `${name} made a new connection`;
    }
    default:
      return `${name} was active`;
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  initialEvents: ActivityEvent[];
}

export default function ActivityFeedClient({ initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialEvents.length >= 30);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    if (typeFilter === "all") return events;
    return events.filter((e) => e.event_type === typeFilter);
  }, [events, typeFilter]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/activity?offset=${events.length}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.events?.length > 0) {
          setEvents((prev) => [...prev, ...data.events]);
          setHasMore(data.events.length >= 20);
        } else {
          setHasMore(false);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [events.length]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-twilight tracking-tight">
          Activity
        </h1>
        <p className="text-sm text-charcoal/50 mt-1 font-medium">
          Recent activity from you and your friends
        </p>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 animate-fade-in">
        <Filter className="w-4 h-4 text-charcoal/40 flex-shrink-0 mr-1" />
        {EVENT_TYPE_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = typeFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-deep-sky text-white shadow-sm"
                  : "bg-soft-gray text-charcoal/60 hover:bg-charcoal/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {filter.label}
            </button>
          );
        })}
      </div>

      {events.length === 0 ? (
        <Card padding="lg" className="animate-scale-in">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-deep-sky/8 to-deep-sky/3 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-charcoal/20" />
            </div>
            <p className="text-charcoal/60 font-semibold tracking-tight">No activity yet</p>
            <p className="text-sm text-charcoal/40 mt-1">
              Start journaling or connect with friends to see activity here
            </p>
          </div>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card padding="lg" className="animate-scale-in">
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-deep-sky/8 to-deep-sky/3 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-charcoal/20" />
            </div>
            <p className="text-charcoal/60 text-sm font-semibold tracking-tight">
              No {typeFilter.replace(/_/g, " ")} activity
            </p>
            <p className="text-xs text-charcoal/40 mt-1">
              Try selecting a different filter to see more activity
            </p>
          </div>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-deep-sky/15 via-golden-hour/10 to-transparent" />

          <div className="space-y-1.5">
            {filteredEvents.map((event, i) => (
              <div
                key={event.id}
                className="animate-slide-in-left"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
              >
                <Card padding="sm" className="hover:shadow-card-glow transition-all duration-300 ml-2">
                  <div className="flex items-center gap-3 py-0.5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-soft-gray to-white flex items-center justify-center border border-charcoal/[0.04] relative z-10">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-charcoal tracking-tight">
                        {getEventDescription(event)}
                      </p>
                      <p className="text-[11px] text-charcoal/35 mt-0.5 font-medium">
                        {timeAgo(event.created_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {hasMore && typeFilter === "all" && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-deep-sky hover:text-deep-sky/80 transition-all duration-200 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
