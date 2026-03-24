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
      const category = (data.category_slug as string) ?? "";
      const words = (data.word_count as number) ?? 0;
      return `${name} journaled${category ? ` about ${category.replace(/_/g, " ")}` : ""}${words ? ` (${words} words)` : ""}`;
    }
    case "streak_milestone": {
      const days = (data.streak as number) ?? 0;
      return `${name} reached a ${days}-day journaling streak!`;
    }
    case "achievement_earned": {
      const achievement = (data.achievement as string) ?? "an achievement";
      return `${name} earned ${achievement}`;
    }
    case "joined_group": {
      const groupName = (data.group_name as string) ?? "a group";
      return `${name} joined ${groupName}`;
    }
    case "friend_added":
      return `${name} made a new connection`;
    default:
      return `${name} did something`;
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
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-twilight">
          Activity
        </h1>
        <p className="text-sm text-charcoal/60 mt-1">
          Recent activity from you and your friends
        </p>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-charcoal/40 flex-shrink-0 mr-1" />
        {EVENT_TYPE_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = typeFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-deep-sky text-white"
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
        <Card padding="lg">
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
            <p className="text-charcoal/60 font-medium">No activity yet</p>
            <p className="text-sm text-charcoal/40 mt-1">
              Start journaling or connect with friends to see activity here
            </p>
          </div>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-6">
            <Activity className="w-10 h-10 text-charcoal/20 mx-auto mb-2" />
            <p className="text-charcoal/60 text-sm font-medium">
              No {typeFilter.replace(/_/g, " ")} activity
            </p>
            <p className="text-xs text-charcoal/40 mt-1">
              Try selecting a different filter to see more activity
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <Card key={event.id} padding="sm">
              <div className="flex items-center gap-3 py-1">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-soft-gray flex items-center justify-center">
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-charcoal">
                    {getEventDescription(event)}
                  </p>
                  <p className="text-xs text-charcoal/40 mt-0.5">
                    {timeAgo(event.created_at)}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {hasMore && typeFilter === "all" && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-deep-sky bg-deep-sky/10 hover:bg-deep-sky/20 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
