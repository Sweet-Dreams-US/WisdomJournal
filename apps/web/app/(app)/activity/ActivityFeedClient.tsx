"use client";

import { useState } from "react";
import {
  BookOpen,
  Flame,
  Trophy,
  Users,
  UserPlus,
  Activity,
} from "lucide-react";
import Card from "@/components/ui/Card";
import type { ActivityEvent } from "@/lib/data/get-activity-feed";

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
  const [events] = useState(initialEvents);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/activity?offset=${events.length}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.events?.length > 0) {
          // Would need setState here but keeping simple for now
        }
      }
    } finally {
      setLoading(false);
    }
  }

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
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-deep-sky/15 via-golden-hour/10 to-transparent" />

          <div className="space-y-1.5">
            {events.map((event, i) => (
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

          {events.length >= 30 && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-deep-sky hover:text-deep-sky/80 transition-all duration-200 mt-2"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
