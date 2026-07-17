"use client";

import { useState } from "react";
import { Flame, BookOpen, Sun, PartyPopper, Sparkles, Loader2, History } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import ProgressDots from "@/components/ui/ProgressDots";
import QuestionCard from "@/components/app/QuestionCard";
import MemoryCard from "@/components/app/MemoryCard";
import Card from "@/components/ui/Card";
import type { UserProfile, DailyQuestionSet } from "@wisdom-journal/shared";
import type { Memory } from "@/lib/data/get-memories";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface DashboardClientProps {
  profile: UserProfile;
  dailySet: DailyQuestionSet | null;
  memories: Memory[];
}

export default function DashboardClient({
  profile,
  dailySet,
  memories,
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
      <div className="mb-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-twilight mb-1.5 tracking-tight">
          {greeting}, {firstName}
        </h2>
        <p className="text-sm text-charcoal/50 font-medium">
          {allOriginalDone && bonusItems.length === 0
            ? "You've answered all your questions today. Want some follow-ups?"
            : allOriginalDone && bonusItems.length > 0
              ? `You have ${bonusItems.length - answeredFollowUps} bonus questions remaining.`
              : totalQuestions > 0
                ? "Your daily questions are waiting for you."
                : "Your questions are being prepared..."}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 animate-fade-in-up">
        <StatsCard
          value={profile.current_streak}
          label="Day Streak"
          icon={Flame}
          iconColor="text-golden-hour"
          iconBg="bg-golden-hour/10"
        />
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

      {/* Daily progress */}
      {totalQuestions > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-charcoal/70 uppercase tracking-wider">
              Today&apos;s Questions &mdash; {answeredAll} of {totalAll}
            </h3>
            <ProgressDots total={totalAll} completed={answeredAll} />
          </div>

          {/* Question cards */}
          <div className="space-y-3">
            {originalItems.map((item: any, i: number) => (
              <div
                key={item.id}
                className="animate-stagger-in"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <QuestionCard
                  question={item.question}
                  isAnswered={item.response_id !== null}
                  responsePreview={undefined}
                  questionNumber={i + 1}
                  categorySlug={item.question?.category?.slug}
                  categoryName={item.question?.category?.name}
                />
              </div>
            ))}
          </div>

          {/* Follow-up section */}
          {allOriginalDone && bonusItems.length === 0 && (
            <div className="mt-6 animate-fade-in-up">
              {canGenerateFollowUps ? (
                <Card padding="lg" className="text-center border border-golden-hour/15 bg-gradient-to-br from-golden-hour/[0.04] to-transparent">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-golden-hour/20 to-golden-hour/5 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-golden-hour animate-breathe" />
                  </div>
                  <h3 className="text-lg font-semibold text-twilight mb-1 tracking-tight">
                    Ready for more?
                  </h3>
                  <p className="text-charcoal/50 text-sm mb-5 max-w-sm mx-auto">
                    Based on your answers today, we can generate 5 personalized follow-up questions that dig deeper.
                  </p>
                  <button
                    onClick={generateFollowUps}
                    disabled={loadingFollowUps}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-golden-hour to-[#e8951c] text-white font-semibold hover:shadow-glow-warm active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                  >
                    {loadingFollowUps ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {loadingFollowUps ? "Generating..." : "Generate Follow-ups"}
                  </button>
                  {followUpError && (
                    <p className="text-xs text-error mt-3">{followUpError}</p>
                  )}
                </Card>
              ) : !allOriginalDone ? null : (
                <Card padding="lg" className="text-center animate-scale-in">
                  <PartyPopper className="w-12 h-12 text-golden-hour mx-auto mb-3 animate-bounce-subtle" />
                  <h3 className="text-lg font-semibold text-twilight mb-1 tracking-tight">
                    All done for today!
                  </h3>
                  <p className="text-charcoal/50 text-sm">
                    Come back tomorrow for new questions. Your streak is{" "}
                    <span className="text-gradient-warm font-semibold">{profile.current_streak} days</span> strong.
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Bonus questions */}
          {bonusItems.length > 0 && (
            <div className="mt-6 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-golden-hour animate-orbit" />
                <h3 className="text-[11px] font-bold text-golden-hour uppercase tracking-[0.15em]">
                  Bonus Follow-up Questions
                </h3>
              </div>
              <div className="space-y-3">
                {bonusItems.map((item: any, i: number) => (
                  <div
                    key={item.id}
                    className="animate-stagger-in"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <QuestionCard
                      question={item.question}
                      isAnswered={item.response_id !== null}
                      responsePreview={undefined}
                      questionNumber={totalQuestions + i + 1}
                      categorySlug={item.question?.category?.slug || item.question?.categories?.slug}
                      categoryName={item.question?.category?.name || item.question?.categories?.name}
                    />
                  </div>
                ))}
              </div>

              {answeredFollowUps === bonusItems.length && (
                <Card padding="lg" className="mt-4 text-center animate-scale-in">
                  <PartyPopper className="w-12 h-12 text-golden-hour mx-auto mb-3 animate-bounce-subtle" />
                  <h3 className="text-lg font-semibold text-twilight mb-1 tracking-tight">
                    Incredible! All 10 questions answered!
                  </h3>
                  <p className="text-charcoal/50 text-sm">
                    You went above and beyond today. Your streak is{" "}
                    <span className="text-gradient-warm font-semibold">{profile.current_streak} days</span> strong.
                  </p>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* On this day — memories */}
      {memories.length > 0 && (
        <div className="mt-10 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-golden-hour" />
            <h3 className="text-[11px] font-bold text-golden-hour uppercase tracking-[0.15em]">
              On this day
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memories.map((memory, i) => (
              <div
                key={memory.response_id}
                className="animate-stagger-in h-full"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <MemoryCard memory={memory} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
