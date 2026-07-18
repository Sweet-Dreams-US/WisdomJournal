"use client";

import {
  Award,
  Book,
  BookOpen,
  Flame,
  Folder,
  Folders,
  Globe,
  Landmark,
  Library,
  Lock,
  MessageCircle,
  Mic,
  Pencil,
  Shield,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import { plural } from "@/lib/utils/plural";
import type { Achievement, AchievementType } from "@wisdom-journal/shared";
import type { AchievementsData } from "@/lib/data/get-achievements";

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  trophy: Trophy,
  pencil: Pencil,
  book: Book,
  "book-open": BookOpen,
  library: Library,
  landmark: Landmark,
  folder: Folder,
  folders: Folders,
  globe: Globe,
  "message-circle": MessageCircle,
  users: Users,
  mic: Mic,
  shield: Shield,
};

interface SectionMeta {
  type: AchievementType;
  title: string;
  iconColor: string;
  iconBg: string;
  barColor: string;
}

const SECTIONS: SectionMeta[] = [
  {
    type: "streak",
    title: "Streaks",
    iconColor: "text-golden-hour",
    iconBg: "bg-golden-hour/10",
    barColor: "bg-golden-hour",
  },
  {
    type: "milestone",
    title: "Milestones",
    iconColor: "text-deep-sky",
    iconBg: "bg-deep-sky/10",
    barColor: "bg-deep-sky",
  },
  {
    type: "category",
    title: "Categories",
    iconColor: "text-sunrise-coral",
    iconBg: "bg-sunrise-coral/10",
    barColor: "bg-sunrise-coral",
  },
  {
    type: "special",
    title: "Special",
    iconColor: "text-twilight",
    iconBg: "bg-twilight/10",
    barColor: "bg-twilight",
  },
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function formatEarnedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface AchievementsClientProps {
  data: AchievementsData;
}

export default function AchievementsClient({ data }: AchievementsClientProps) {
  const { achievements, earnedById, stats } = data;

  const totalCount = achievements.length;
  const earnedCount = achievements.filter((a) => earnedById[a.id]).length;
  const percent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  const now = Date.now();
  const recentlyEarned = achievements
    .filter((a) => {
      const earnedAt = earnedById[a.id];
      if (!earnedAt) return false;
      const diff = now - new Date(earnedAt).getTime();
      return diff >= 0 && diff <= SEVEN_DAYS_MS;
    })
    .sort(
      (a, b) =>
        new Date(earnedById[b.id]).getTime() -
        new Date(earnedById[a.id]).getTime()
    );

  function progressFor(achievement: Achievement): number | null {
    switch (achievement.achievement_type) {
      case "streak":
        return stats.longest_streak;
      case "milestone":
        return stats.total_responses;
      case "category":
        return stats.categories_covered;
      default:
        return null;
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h2 className="display-title mb-1.5">
          Achievements
        </h2>
        <p className="text-sm text-charcoal/50 font-medium">
          Badges you&apos;ve earned along your wisdom journey.
        </p>
      </div>

      {/* Recently earned banner */}
      {recentlyEarned.length > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-golden-hour/20 bg-golden-hour/[0.07] px-4 py-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-golden-hour/15 flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4 text-golden-hour" />
          </div>
          <p className="text-sm text-charcoal/70">
            <span className="font-semibold text-twilight">
              Recently earned:
            </span>{" "}
            {recentlyEarned.map((a) => a.name).join(", ")}
          </p>
        </div>
      )}

      {/* Hero: overall progress */}
      <Card padding="lg" className="mb-8 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-golden-hour/20 to-sunrise-coral/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-golden-hour" />
          </div>
          <div>
            <p className="display-title">
              {earnedCount} of {totalCount} earned
            </p>
            <p className="text-xs text-charcoal/50 font-medium uppercase tracking-wider">
              {plural(totalCount - earnedCount, "badge")} still waiting for you
            </p>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-soft-gray overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-golden-hour to-sunrise-coral transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </Card>

      {/* Sections by type */}
      {SECTIONS.map((section) => {
        const sectionAchievements = achievements.filter(
          (a) => a.achievement_type === section.type
        );
        if (sectionAchievements.length === 0) return null;

        return (
          <div key={section.type} className="mb-8 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-charcoal/70 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sectionAchievements.map((achievement, i) => {
                const earnedAt = earnedById[achievement.id];
                const isEarned = Boolean(earnedAt);
                const Icon = ICON_MAP[achievement.icon ?? ""] ?? Star;
                const progress = progressFor(achievement);
                const showProgress =
                  !isEarned &&
                  progress !== null &&
                  achievement.requirement_value > 0;

                return (
                  <div
                    key={achievement.id}
                    className="animate-stagger-in h-full"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <Card padding="sm" className="h-full">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isEarned
                              ? section.iconBg
                              : "bg-soft-gray grayscale opacity-40"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isEarned ? section.iconColor : "text-charcoal/40"
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-sm font-semibold tracking-tight ${
                              isEarned ? "text-twilight" : "text-charcoal/40"
                            }`}
                          >
                            {achievement.name}
                          </h4>
                          <p
                            className={`text-xs mt-0.5 leading-relaxed ${
                              isEarned ? "text-charcoal/50" : "text-charcoal/30"
                            }`}
                          >
                            {achievement.description}
                          </p>

                          {isEarned ? (
                            <p className="text-[11px] font-semibold text-success mt-2">
                              Earned {formatEarnedDate(earnedAt)}
                            </p>
                          ) : showProgress ? (
                            <div className="mt-2.5">
                              <div className="h-1.5 rounded-full bg-soft-gray overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${section.barColor} opacity-50 transition-all duration-500`}
                                  style={{
                                    width: `${Math.min(
                                      (progress /
                                        achievement.requirement_value) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <p className="text-[11px] text-charcoal/40 font-medium mt-1">
                                {Math.min(
                                  progress,
                                  achievement.requirement_value
                                )}{" "}
                                / {achievement.requirement_value}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-charcoal/30 font-medium mt-2 inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Locked
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
