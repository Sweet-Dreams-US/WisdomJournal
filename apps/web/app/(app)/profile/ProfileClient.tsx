"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Flame,
  FileText,
  Download,
  Trash2,
  Users,
  Clock,
  Settings,
} from "lucide-react";
import Card from "@/components/ui/Card";
import StatsCard from "@/components/ui/StatsCard";
import Button from "@/components/ui/Button";
import LegacySection from "@/components/app/LegacySection";
import UsernameEditor from "@/components/app/UsernameEditor";
import type {
  UserProfile,
  EncyclopediaStats,
  NotificationPreferences,
} from "@wisdom-journal/shared";
import type { GroupWithMembership } from "@/lib/data/get-groups";

interface ProfileClientProps {
  profile: UserProfile;
  stats: EncyclopediaStats | null;
  notifPrefs: NotificationPreferences | null;
  groups: GroupWithMembership[];
}

export default function ProfileClient({
  profile,
  stats,
  notifPrefs: initialNotifPrefs,
  groups,
}: ProfileClientProps) {
  const defaultPrefs: NotificationPreferences = {
    id: "",
    user_id: profile.id,
    group_id: null,
    daily_reminder: true,
    streak_warning: true,
    group_invites: true,
    query_received: true,
    achievements: true,
    email_digest: false,
    reminder_time: "09:00",
    created_at: "",
    updated_at: "",
  };

  const [notifPrefs, setNotifPrefs] = useState(initialNotifPrefs ?? defaultPrefs);
  const [questionDepth, setQuestionDepth] = useState<string>("medium");

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  async function toggleNotif(key: keyof typeof notifPrefs) {
    if (typeof notifPrefs[key] === "boolean") {
      const newVal = !notifPrefs[key];
      setNotifPrefs((prev) => ({ ...prev, [key]: newVal }));

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newVal }),
      });
    }
  }

  async function updateReminderTime(time: string) {
    setNotifPrefs((prev) => ({ ...prev, reminder_time: time }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminder_time: time }),
    });
  }

  const categoryBreakdown = stats?.category_breakdown ?? [];
  const maxCategoryCount = Math.max(
    ...categoryBreakdown.map((c: any) => c.response_count),
    1
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-twilight mb-2">Your Profile</h2>
          <p className="text-charcoal/60">Manage your account settings and preferences.</p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button text-sm font-medium text-charcoal/60 hover:text-charcoal border border-charcoal/20 hover:border-charcoal/40 transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>

      {/* User info card */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-deep-sky">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-twilight">{profile.full_name}</h3>
            {profile.username && (
              <p className="text-sm text-deep-sky font-medium">@{profile.username}</p>
            )}
            <p className="text-sm text-charcoal/60">{profile.email}</p>
            {profile.bio && (
              <p className="text-sm text-charcoal/70 mt-1">{profile.bio}</p>
            )}
            <p className="text-xs text-charcoal/40 mt-2">Member since {memberSince}</p>
          </div>
        </div>
      </Card>

      <UsernameEditor initial={profile.username ?? ""} />

      {/* Encyclopedia stats */}
      <h3 className="text-lg font-bold text-twilight mb-3">Your Encyclopedia</h3>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <StatsCard
          value={stats?.total_responses ?? 0}
          label="Total Responses"
          icon={BookOpen}
          iconColor="text-deep-sky"
          iconBg="bg-deep-sky/10"
        />
        <StatsCard
          value={(stats?.total_word_count ?? 0).toLocaleString()}
          label="Total Words"
          icon={FileText}
          iconColor="text-twilight"
          iconBg="bg-twilight/10"
        />
        <StatsCard
          value={stats?.current_streak ?? 0}
          label="Current Streak"
          icon={Flame}
          iconColor="text-golden-hour"
          iconBg="bg-golden-hour/10"
        />
      </div>

      {/* Category coverage */}
      {categoryBreakdown.length > 0 && (
        <Card padding="md" className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-charcoal">Category Coverage</span>
            <span className="text-xs text-charcoal/50">
              {stats?.categories_covered ?? 0} of {stats?.total_categories ?? 0} categories
            </span>
          </div>
          <div className="space-y-2.5">
            {categoryBreakdown.map((cat: any) => (
              <div key={cat.category_id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-charcoal/70">{cat.name}</span>
                  <span className="text-charcoal/40">{cat.response_count} responses</span>
                </div>
                <div className="h-2 bg-soft-gray rounded-full overflow-hidden">
                  <div
                    className="h-full bg-deep-sky rounded-full transition-all"
                    style={{
                      width: `${(cat.response_count / maxCategoryCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notifications */}
      <h3 className="text-lg font-bold text-twilight mb-3">Notifications</h3>
      <Card padding="md" className="mb-6">
        <div className="space-y-4">
          {[
            { key: "daily_reminder" as const, label: "Daily reminder", desc: "Get reminded to answer your daily questions" },
            { key: "streak_warning" as const, label: "Streak warning", desc: "Warn when you're about to lose your streak" },
            { key: "group_invites" as const, label: "Group invites", desc: "Notify when you receive a group invitation" },
            { key: "query_received" as const, label: "Wisdom queries", desc: "Notify when someone queries your wisdom" },
            { key: "achievements" as const, label: "Achievements", desc: "Celebrate when you earn a new achievement" },
            { key: "email_digest" as const, label: "Weekly email digest", desc: "Summary of your weekly activity" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-charcoal">{item.label}</p>
                <p className="text-xs text-charcoal/50">{item.desc}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key] as boolean}
                  onChange={() => toggleNotif(item.key)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-soft-gray rounded-full peer-checked:bg-deep-sky transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          ))}

          <div className="pt-2 border-t border-soft-gray flex items-center gap-3">
            <Clock className="w-4 h-4 text-charcoal/40" />
            <span className="text-sm text-charcoal/60">Reminder time:</span>
            <input
              type="time"
              value={notifPrefs.reminder_time}
              onChange={(e) => updateReminderTime(e.target.value)}
              className="text-sm font-body text-charcoal border border-soft-gray rounded-input px-2 py-1"
            />
          </div>
        </div>
      </Card>

      {/* Question preferences */}
      <h3 className="text-lg font-bold text-twilight mb-3">Question Preferences</h3>
      <Card padding="md" className="mb-6">
        <p className="text-sm text-charcoal/60 mb-3">
          Choose the depth of your daily questions.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["easy", "medium", "deep", "challenging"].map((level) => (
            <button
              key={level}
              onClick={() => setQuestionDepth(level)}
              className={`
                px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all
                ${questionDepth === level
                  ? "bg-deep-sky text-white shadow-button"
                  : "bg-soft-gray text-charcoal/60 hover:bg-charcoal/10"
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>
      </Card>

      {/* Legacy Contacts */}
      <div className="mb-6">
        <LegacySection />
      </div>

      {/* Groups summary */}
      <h3 className="text-lg font-bold text-twilight mb-3">Groups</h3>
      <Card padding="md" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-charcoal/60">
            You&apos;re in {groups.length} {groups.length === 1 ? "group" : "groups"}
          </span>
          <Link
            href="/groups"
            className="text-sm text-deep-sky hover:text-sky-blue transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-soft-gray transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-deep-sky/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-deep-sky" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">{group.name}</p>
                <p className="text-xs text-charcoal/50">{group.member_count} members</p>
              </div>
            </Link>
          ))}
          {groups.length === 0 && (
            <p className="text-sm text-charcoal/40 text-center py-4">No groups yet.</p>
          )}
        </div>
      </Card>

      {/* Account actions */}
      <h3 className="text-lg font-bold text-twilight mb-3">Account</h3>
      <Card padding="md" className="mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Subscription</p>
              <p className="text-xs text-charcoal/50 capitalize">{profile.subscription_tier} plan</p>
            </div>
            <Button variant="outline" size="sm" className="border-charcoal/20 text-charcoal/60 hover:text-charcoal hover:border-charcoal/40">
              Manage
            </Button>
          </div>
          <div className="border-t border-soft-gray pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Export Data</p>
              <p className="text-xs text-charcoal/50">Download all your entries as JSON</p>
            </div>
            <Button variant="outline" size="sm" className="border-charcoal/20 text-charcoal/60 hover:text-charcoal hover:border-charcoal/40">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
          <div className="border-t border-soft-gray pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-error">Delete Account</p>
              <p className="text-xs text-charcoal/50">Permanently delete all your data</p>
            </div>
            <Button variant="ghost" size="sm" className="text-error hover:bg-error/10 hover:text-error">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
