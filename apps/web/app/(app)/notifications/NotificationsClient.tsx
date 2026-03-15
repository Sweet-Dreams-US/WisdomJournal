"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  UserPlus,
  UserCheck,
  Users,
  MessageCircle,
  Sparkles,
  Flame,
  AlertCircle,
  Check,
  CheckCheck,
} from "lucide-react";
import Card from "@/components/ui/Card";
import type { Notification } from "@/lib/data/get-notifications";

function getNotificationIcon(type: string) {
  switch (type) {
    case "friend_request":
      return <UserPlus className="w-5 h-5 text-deep-sky" />;
    case "friend_accepted":
      return <UserCheck className="w-5 h-5 text-green-500" />;
    case "group_invite":
      return <Users className="w-5 h-5 text-deep-sky" />;
    case "query_received":
      return <MessageCircle className="w-5 h-5 text-golden-hour" />;
    case "achievement":
      return <Sparkles className="w-5 h-5 text-golden-hour" />;
    case "streak_warning":
      return <Flame className="w-5 h-5 text-sunrise-coral" />;
    case "daily_reminder":
      return <Bell className="w-5 h-5 text-deep-sky" />;
    default:
      return <AlertCircle className="w-5 h-5 text-charcoal/40" />;
  }
}

function getNotificationLink(notification: Notification): string | null {
  const data = notification.data as Record<string, string>;
  switch (notification.type) {
    case "friend_request":
    case "friend_accepted":
      return data?.friendship_id ? `/friends/${data.friendship_id}` : "/friends";
    case "group_invite":
      return data?.group_id ? `/groups/${data.group_id}` : "/groups";
    case "query_received":
      return "/ask";
    case "daily_reminder":
      return "/dashboard";
    default:
      return null;
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
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

export default function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  async function markRead(id: string) {
    try {
      await fetch("/api/notifications/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-twilight">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-charcoal/60 mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-deep-sky hover:bg-deep-sky/10 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
            <p className="text-charcoal/60 font-medium">No notifications yet</p>
            <p className="text-sm text-charcoal/40 mt-1">
              You&apos;ll get notified about friend requests, group invites, and more
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const link = getNotificationLink(notification);
            const isUnread = !notification.read_at;
            const content = (
              <Card
                padding="md"
                className={`transition-colors ${
                  isUnread
                    ? "bg-deep-sky/5 border-deep-sky/10"
                    : "hover:bg-soft-gray/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        isUnread
                          ? "font-semibold text-charcoal"
                          : "text-charcoal/70"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-xs text-charcoal/50 mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-xs text-charcoal/40 mt-1">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                  {isUnread && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markRead(notification.id);
                      }}
                      className="p-1 rounded hover:bg-white transition-colors flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4 text-charcoal/30 hover:text-deep-sky" />
                    </button>
                  )}
                </div>
              </Card>
            );

            return link ? (
              <Link key={notification.id} href={link} onClick={() => isUnread && markRead(notification.id)}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
