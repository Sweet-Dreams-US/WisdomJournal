"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Lock,
  Flame,
  Star,
  Pencil,
  Book,
  BookOpen,
  Award,
  Search,
  Users,
  Grid3X3,
  Share2,
  Mic,
  Shield,
  MessageCircle,
  Globe,
  Landmark,
  FolderOpen,
  Folders,
  Library,
  PenTool,
} from "lucide-react";
import Card from "@/components/ui/Card";

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  achievement_type: string;
  requirement_value: number;
  sort_order: number;
}

interface AchievementsClientProps {
  achievements: Achievement[];
  earnedMap: Record<string, string>; // achievement_id -> earned_at
  stats: {
    totalResponses: number;
    currentStreak: number;
    longestStreak: number;
    categoryCount: number;
  };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  trophy: Trophy,
  star: Star,
  pencil: Pencil,
  book: Book,
  "book-open": BookOpen,
  award: Award,
  search: Search,
  users: Users,
  grid: Grid3X3,
  share: Share2,
  mic: Mic,
  shield: Shield,
  "message-circle": MessageCircle,
  globe: Globe,
  landmark: Landmark,
  folder: FolderOpen,
  folders: Folders,
  library: Library,
  pen: PenTool,
};

function getProgressForAchievement(
  achievement: Achievement,
  stats: AchievementsClientProps["stats"]
): { current: number; target: number } | null {
  const target = achievement.requirement_value;

  switch (achievement.achievement_type) {
    case "streak":
      return { current: Math.min(stats.longestStreak, target), target };
    case "milestone":
      return { current: Math.min(stats.totalResponses, target), target };
    case "category":
      return { current: Math.min(stats.categoryCount, target), target };
    default:
      return null;
  }
}

export default function AchievementsClient({
  achievements,
  earnedMap,
  stats,
}: AchievementsClientProps) {
  const earnedCount = Object.keys(earnedMap).length;
  const totalCount = achievements.length;

  // Group by type
  const grouped: Record<string, Achievement[]> = {};
  for (const a of achievements) {
    const type = a.achievement_type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(a);
  }

  const typeLabels: Record<string, string> = {
    streak: "Streak Achievements",
    milestone: "Response Milestones",
    category: "Category Achievements",
    special: "Special Achievements",
  };

  const typeOrder = ["milestone", "streak", "category", "special"];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-deep-sky hover:text-sky-blue transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-twilight mb-2">
              Achievements
            </h2>
            <p className="text-charcoal/60">
              Track your journaling milestones and accomplishments.
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-golden-hour" />
              <span className="text-2xl font-bold text-twilight">
                {earnedCount}
              </span>
              <span className="text-charcoal/40 text-sm">/ {totalCount}</span>
            </div>
            <p className="text-xs text-charcoal/50 mt-1">achievements unlocked</p>
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <Card padding="md" className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-charcoal">
            Overall Progress
          </span>
          <span className="text-sm text-charcoal/50">
            {Math.round((earnedCount / Math.max(totalCount, 1)) * 100)}%
          </span>
        </div>
        <div className="w-full bg-soft-gray rounded-full h-3">
          <div
            className="bg-gradient-to-r from-deep-sky to-sky-blue rounded-full h-3 transition-all duration-500"
            style={{
              width: `${(earnedCount / Math.max(totalCount, 1)) * 100}%`,
            }}
          />
        </div>
      </Card>

      {/* Achievement sections */}
      {typeOrder.map((type) => {
        const items = grouped[type];
        if (!items || items.length === 0) return null;

        return (
          <div key={type} className="mb-8">
            <h3 className="text-lg font-bold text-twilight mb-3">
              {typeLabels[type] || type}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((achievement) => {
                const isEarned = !!earnedMap[achievement.id];
                const earnedAt = earnedMap[achievement.id];
                const IconComponent =
                  iconMap[achievement.icon || ""] || Trophy;
                const progress = getProgressForAchievement(achievement, stats);

                return (
                  <Card
                    key={achievement.id}
                    padding="md"
                    className={`transition-all ${
                      isEarned
                        ? "border border-golden-hour/30 bg-golden-hour/5"
                        : "opacity-70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isEarned
                            ? "bg-golden-hour/20"
                            : "bg-soft-gray"
                        }`}
                      >
                        {isEarned ? (
                          <IconComponent
                            className="w-5 h-5 text-golden-hour"
                          />
                        ) : (
                          <Lock className="w-4 h-4 text-charcoal/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            isEarned ? "text-twilight" : "text-charcoal/50"
                          }`}
                        >
                          {achievement.name}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isEarned ? "text-charcoal/60" : "text-charcoal/40"
                          }`}
                        >
                          {achievement.description}
                        </p>

                        {/* Progress bar for numeric achievements */}
                        {!isEarned && progress && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-charcoal/40">
                                {progress.current} / {progress.target}
                              </span>
                            </div>
                            <div className="w-full bg-soft-gray rounded-full h-1.5">
                              <div
                                className="bg-deep-sky/50 rounded-full h-1.5 transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    (progress.current / progress.target) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Earned date */}
                        {isEarned && earnedAt && (
                          <p className="text-[10px] text-golden-hour mt-1.5">
                            Earned{" "}
                            {new Date(earnedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
