"use client";

import { BookOpen, Flame, Trophy, Users, UserPlus } from "lucide-react";

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const eventIcons: Record<string, typeof BookOpen> = {
  response_created: BookOpen,
  streak_milestone: Flame,
  achievement_earned: Trophy,
  joined_group: Users,
  friend_added: UserPlus,
};

const eventColors: Record<string, string> = {
  response_created: "bg-deep-sky/10 text-deep-sky",
  streak_milestone: "bg-golden-hour/10 text-golden-hour",
  achievement_earned: "bg-golden-hour/10 text-golden-hour",
  joined_group: "bg-lavender-mist/30 text-twilight",
  friend_added: "bg-deep-sky/10 text-deep-sky",
};

function getEventDescription(event: ActivityEvent): string {
  const name = event.profile?.full_name ?? "Someone";
  const data = event.event_data;

  switch (event.event_type) {
    case "response_created": {
      const category = (data.category_name as string) ?? "a topic";
      const wordCount = data.word_count as number | undefined;
      const wordInfo = wordCount ? ` (${wordCount} words)` : "";
      return `${name} shared a response in ${category}${wordInfo}`;
    }
    case "streak_milestone": {
      const days = (data.streak_days as number) ?? 0;
      return `${name} reached a ${days}-day streak!`;
    }
    case "achievement_earned": {
      const achievement = (data.achievement_name as string) ?? "an achievement";
      return `${name} earned ${achievement}`;
    }
    case "joined_group":
      return `${name} joined the group`;
    case "friend_added":
      return `${name} added a new friend`;
    default:
      return `${name} did something`;
  }
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;

  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-charcoal/40">
        No activity yet. Events will appear here as group members journal.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event) => {
        const Icon = eventIcons[event.event_type] ?? BookOpen;
        const colorClass =
          eventColors[event.event_type] ?? "bg-soft-gray text-charcoal/60";
        const name = event.profile?.full_name ?? "?";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-cloud-white/50 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-deep-sky">
                {initials}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
                >
                  <Icon className="w-3 h-3" />
                </div>
                <p className="text-sm text-charcoal/60 leading-snug">
                  {getEventDescription(event)}
                </p>
              </div>
              <p className="text-xs text-charcoal/40 mt-0.5 ml-7">
                {getRelativeTime(event.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
