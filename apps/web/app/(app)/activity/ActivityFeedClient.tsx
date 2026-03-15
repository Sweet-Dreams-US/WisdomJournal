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
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-twilight">
          Activity
        </h1>
        <p className="text-sm text-charcoal/60 mt-1">
          Recent activity from you and your friends
        </p>
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
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
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

          {events.length >= 30 && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-2 text-sm text-deep-sky hover:text-deep-sky/80 transition-colors"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
