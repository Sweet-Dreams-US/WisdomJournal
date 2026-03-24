"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  BookOpen,
  Sun,
  PartyPopper,
  Sparkles,
  Loader2,
  Clock,
  CheckCircle2,
  Heart,
  Compass,
  Lock,
} from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import ProgressDots from "@/components/ui/ProgressDots";
import QuestionCard from "@/components/app/QuestionCard";
import OnThisDay from "@/components/app/OnThisDay";
import Card from "@/components/ui/Card";
import type { UserProfile, DailyQuestionSet } from "@wisdom-journal/shared";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface FavoriteItem {
  id: string;
  body: string;
  created_at: string;
  question: { text: string } | null;
}

interface DashboardClientProps {
  profile: UserProfile;
  dailySet: DailyQuestionSet | null;
  responseDates: string[];
  recentFavorites: FavoriteItem[];
  unreadNotificationCount: number;
}

// --- Streak Countdown Timer ---
function StreakCountdown({
  hasStreak,
  answeredToday,
}: {
  hasStreak: boolean;
  answeredToday: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!hasStreak || answeredToday) return;

    function calcTimeLeft() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }

    setTimeLeft(calcTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft());
    }, 60_000);

    return () => clearInterval(interval);
  }, [hasStreak, answeredToday]);

  if (!hasStreak) return null;

  if (answeredToday) {
    return (
      <div className="flex items-center gap-1.5 mt-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-medium text-emerald-600">
          Streak secured for today!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <Clock className="w-3.5 h-3.5 text-golden-hour" />
      <span className="text-xs text-charcoal/60">
        Answer in <span className="font-medium text-golden-hour">{timeLeft}</span> to keep your streak
      </span>
    </div>
  );
}

// --- Weekly Activity Heatmap ---
function ActivityHeatmap({ responseDates }: { responseDates: string[] }) {
  const heatmapData = useMemo(() => {
    // Build a map of date -> response count for the last 49 days
    const counts: Record<string, number> = {};
    for (const dateStr of responseDates) {
      const day = dateStr.split("T")[0];
      counts[day] = (counts[day] || 0) + 1;
    }

    // Generate the last 49 days
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    const today = new Date();
    for (let i = 48; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({
        date: key,
        count: counts[key] || 0,
        dayOfWeek: d.getDay(), // 0=Sun, 1=Mon, ...
      });
    }

    return days;
  }, [responseDates]);

  // Organize into 7 columns (weeks), 7 rows (days)
  const weeks: (typeof heatmapData)[] = [];
  let currentWeek: typeof heatmapData = [];
  // Pad the first week to align by day of week
  const firstDay = heatmapData[0];
  if (firstDay) {
    for (let i = 0; i < firstDay.dayOfWeek; i++) {
      currentWeek.push({ date: "", count: -1, dayOfWeek: i });
    }
  }
  for (const day of heatmapData) {
    currentWeek.push(day);
    if (day.dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  function getColor(count: number): string {
    if (count < 0) return "bg-transparent";
    if (count === 0) return "bg-gray-100";
    if (count === 1) return "bg-deep-sky/30";
    return "bg-deep-sky/70";
  }

  const dayLabels = ["", "M", "", "W", "", "F", ""];

  return (
    <Card padding="md" className="mb-8">
      <h3 className="text-sm font-bold text-twilight mb-3">Activity</h3>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="w-3 h-3 flex items-center justify-center text-[9px] text-charcoal/40"
            >
              {label}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                title={
                  day.count >= 0
                    ? `${day.date}: ${day.count} response${day.count !== 1 ? "s" : ""}`
                    : ""
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-charcoal/40">Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-deep-sky/30" />
        <div className="w-3 h-3 rounded-sm bg-deep-sky/70" />
        <span className="text-[10px] text-charcoal/40">More</span>
      </div>
    </Card>
  );
}

// --- Query Suggestions Widget ---
function QuerySuggestions({ dailySet }: { dailySet: DailyQuestionSet | null }) {
  const suggestions = useMemo(() => {
    const items = (dailySet as any)?.items ?? [];
    // Collect category names from questions
    const categoryCounts: Record<string, number> = {};
    for (const item of items) {
      const catName =
        item.question?.category?.name ??
        item.question?.categories?.name;
      if (catName) {
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      }
    }

    // Sort by frequency
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const result: { text: string; query: string }[] = [];

    if (sortedCategories[0]) {
      result.push({
        text: `What have I learned about ${sortedCategories[0]}?`,
        query: `What have I learned about ${sortedCategories[0]}?`,
      });
    }
    if (sortedCategories[1]) {
      result.push({
        text: `Show me patterns in my ${sortedCategories[1]} reflections`,
        query: `Show me patterns in my ${sortedCategories[1]} reflections`,
      });
    }
    if (sortedCategories[0] && sortedCategories.length >= 2) {
      result.push({
        text: `How has my thinking on ${sortedCategories[0]} evolved?`,
        query: `How has my thinking on ${sortedCategories[0]} evolved?`,
      });
    }

    // Fallback suggestions if no categories available
    if (result.length === 0) {
      result.push(
        {
          text: "What themes appear in my journal?",
          query: "What themes appear in my journal?",
        },
        {
          text: "Summarize my recent reflections",
          query: "Summarize my recent reflections",
        }
      );
    }

    return result.slice(0, 3);
  }, [dailySet]);

  if (suggestions.length === 0) return null;

  return (
    <Card padding="md" className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Compass className="w-4 h-4 text-deep-sky" />
        <h3 className="text-sm font-bold text-twilight">
          Explore Your Wisdom
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <Link
            key={i}
            href={`/ask?q=${encodeURIComponent(s.query)}`}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-deep-sky/10 text-deep-sky hover:bg-deep-sky/20 transition-colors"
          >
            {s.text}
          </Link>
        ))}
      </div>
    </Card>
  );
}

// --- Favorites Quick Access ---
function FavoritesQuickAccess({
  favorites,
}: {
  favorites: FavoriteItem[];
}) {
  if (!favorites || favorites.length === 0) return null;

  return (
    <Card padding="md" className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-sunrise-coral" />
          <h3 className="text-sm font-bold text-twilight">Favorites</h3>
        </div>
        <Link
          href="/favorites"
          className="text-xs text-deep-sky hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="space-y-2">
        {favorites.map((fav) => (
          <Link
            key={fav.id}
            href={`/journal/${fav.id}`}
            className="block p-3 rounded-lg bg-soft-gray/50 hover:bg-soft-gray transition-colors"
          >
            {fav.question && (
              <p className="text-xs text-charcoal/50 mb-1 truncate">
                {fav.question.text}
              </p>
            )}
            <p className="text-sm text-charcoal/80 line-clamp-2">
              {fav.body}
            </p>
            <p className="text-[10px] text-charcoal/40 mt-1">
              {new Date(fav.created_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardClient({
  profile,
  dailySet,
  responseDates,
  recentFavorites,
}: DashboardClientProps) {
  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  const allItems = (dailySet as any)?.items ?? [];
  const originalItems = allItems.filter((item: any) => item.sort_order <= 5);
  const followUpItems = allItems.filter((item: any) => item.sort_order > 5);

  const totalQuestions = originalItems.length;
  const answeredCount = originalItems.filter(
    (item: any) => item.response_id !== null
  ).length;
  const allOriginalDone = totalQuestions > 0 && answeredCount === totalQuestions;

  const totalFollowUps = followUpItems.length;
  const answeredFollowUps = followUpItems.filter(
    (item: any) => item.response_id !== null
  ).length;

  const [bonusItems, setBonusItems] = useState<any[]>(followUpItems);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const canGenerateFollowUps = answeredCount >= 3 && bonusItems.length === 0;

  // Check if the user has answered today (for streak countdown)
  const answeredToday = answeredCount > 0;

  // Follow-up unlock: how many more needed to reach 3
  const answersNeededForFollowUp = Math.max(0, 3 - answeredCount);
  const showFollowUpUnlock =
    answeredCount > 0 && answeredCount < 3 && bonusItems.length === 0;

  async function generateFollowUps() {
    if (loadingFollowUps) return;
    setLoadingFollowUps(true);
    setFollowUpError(null);

    try {
      const res = await fetch("/api/daily/follow-up", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.items) {
        setBonusItems(data.items);
      } else {
        setFollowUpError(data.error || "Could not generate follow-up questions.");
      }
    } catch {
      setFollowUpError("Network error. Please try again.");
    } finally {
      setLoadingFollowUps(false);
    }
  }

  const totalAll = totalQuestions + bonusItems.length;
  const answeredAll = answeredCount + answeredFollowUps;

  return (
    <div className="max-w-4xl">
      {/* Greeting */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-twilight mb-2">
          {greeting}, {firstName}!
        </h2>
        <p className="text-charcoal/60">
          {allOriginalDone && bonusItems.length === 0
            ? "You've answered all your questions today. Want some follow-ups?"
            : allOriginalDone && bonusItems.length > 0
              ? `You have ${bonusItems.length - answeredFollowUps} bonus questions remaining.`
              : totalQuestions > 0
                ? "Your daily questions are waiting for you."
                : "Your questions are being prepared. Refresh in a moment."}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div>
          <StatsCard
            value={profile.current_streak}
            label="Day Streak"
            icon={Flame}
            iconColor="text-golden-hour"
            iconBg="bg-golden-hour/10"
          />
          <div className="px-2 mt-1">
            <StreakCountdown
              hasStreak={profile.current_streak > 0}
              answeredToday={answeredToday}
            />
          </div>
        </div>
        <StatsCard
          value={profile.total_responses}
          label="Responses"
          icon={BookOpen}
          iconColor="text-deep-sky"
          iconBg="bg-deep-sky/10"
        />
        <StatsCard
          value={totalAll}
          label="Questions Today"
          icon={Sun}
          iconColor="text-sunrise-coral"
          iconBg="bg-sunrise-coral/10"
        />
      </div>

      {/* Follow-up unlock message */}
      {showFollowUpUnlock && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-golden-hour/5 border border-golden-hour/15">
          <Lock className="w-4 h-4 text-golden-hour flex-shrink-0" />
          <p className="text-sm text-charcoal/70">
            Answer{" "}
            <span className="font-semibold text-golden-hour">
              {answersNeededForFollowUp} more
            </span>{" "}
            to unlock bonus questions
          </p>
        </div>
      )}

      {/* Activity Heatmap */}
      <ActivityHeatmap responseDates={responseDates} />

      {/* Daily progress */}
      {totalQuestions > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-twilight">
              Today&apos;s Questions &mdash; {answeredAll} of {totalAll}
            </h3>
            <ProgressDots total={totalAll} completed={answeredAll} />
          </div>

          {/* Question cards */}
          <div className="space-y-3">
            {originalItems.map((item: any, i: number) => (
              <QuestionCard
                key={item.id}
                question={item.question}
                isAnswered={item.response_id !== null}
                responsePreview={undefined}
                questionNumber={i + 1}
                categorySlug={item.question?.category?.slug}
                categoryName={item.question?.category?.name}
              />
            ))}
          </div>

          {/* Follow-up section */}
          {allOriginalDone && bonusItems.length === 0 && (
            <div className="mt-6">
              {canGenerateFollowUps ? (
                <Card padding="lg" className="text-center border border-golden-hour/20 bg-golden-hour/5">
                  <Sparkles className="w-10 h-10 text-golden-hour mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-twilight mb-1">
                    Ready for more?
                  </h3>
                  <p className="text-charcoal/60 text-sm mb-4">
                    Based on your answers today, we can generate 5 personalized follow-up questions that dig deeper.
                  </p>
                  <button
                    onClick={generateFollowUps}
                    disabled={loadingFollowUps}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-golden-hour text-white font-medium hover:bg-golden-hour/90 transition-colors disabled:opacity-50"
                  >
                    {loadingFollowUps ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {loadingFollowUps ? "Generating..." : "Generate Follow-up Questions"}
                  </button>
                  {followUpError && (
                    <p className="text-xs text-error mt-3">{followUpError}</p>
                  )}
                </Card>
              ) : !allOriginalDone ? null : (
                <Card padding="lg" className="text-center">
                  <PartyPopper className="w-12 h-12 text-golden-hour mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-twilight mb-1">
                    All done for today!
                  </h3>
                  <p className="text-charcoal/60 text-sm">
                    Come back tomorrow for new questions. Your streak is{" "}
                    {profile.current_streak} days strong.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Bonus questions */}
          {bonusItems.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-golden-hour" />
                <h3 className="text-sm font-bold text-golden-hour uppercase tracking-wider">
                  Bonus Follow-up Questions
                </h3>
              </div>
              <div className="space-y-3">
                {bonusItems.map((item: any, i: number) => (
                  <QuestionCard
                    key={item.id}
                    question={item.question}
                    isAnswered={item.response_id !== null}
                    responsePreview={undefined}
                    questionNumber={totalQuestions + i + 1}
                    categorySlug={item.question?.category?.slug || item.question?.categories?.slug}
                    categoryName={item.question?.category?.name || item.question?.categories?.name}
                  />
                ))}
              </div>

              {answeredFollowUps === bonusItems.length && (
                <Card padding="lg" className="mt-4 text-center">
                  <PartyPopper className="w-12 h-12 text-golden-hour mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-twilight mb-1">
                    Incredible! All 10 questions answered!
                  </h3>
                  <p className="text-charcoal/60 text-sm">
                    You went above and beyond today. Your streak is{" "}
                    {profile.current_streak} days strong.
                  </p>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* On This Day */}
      <div className="mt-6">
        <OnThisDay />
      </div>

      {/* Favorites Quick Access */}
      <FavoritesQuickAccess favorites={recentFavorites} />

      {/* Query Suggestions */}
      <QuerySuggestions dailySet={dailySet} />
    </div>
  );
}
