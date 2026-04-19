"use client";

import { useEffect, useState } from "react";
import { Flame, BookOpen, Sun, PartyPopper, Sparkles, Loader2 } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import ProgressDots from "@/components/ui/ProgressDots";
import QuestionCard from "@/components/app/QuestionCard";
import QuickCompose from "@/components/app/QuickCompose";
import Card from "@/components/ui/Card";
import SerendipityRibbon from "@/components/app/SerendipityRibbon";
import { drainQueue } from "@/lib/offline/offline-queue";
import type { UserProfile, DailyQuestionSet } from "@wisdom-journal/shared";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Peaceful night";
}

interface SerendipityCandidate {
  response_id: string;
  excerpt: string;
  category_slug: string | null;
  category_name: string | null;
  created_at: string;
  surface_type: string;
  context: string;
}

interface DashboardClientProps {
  profile: UserProfile;
  dailySet: DailyQuestionSet | null;
  serendipity: SerendipityCandidate | null;
}

export default function DashboardClient({
  profile,
  dailySet,
  serendipity,
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

  // Drain offline queue on load + when connection returns
  useEffect(() => {
    let ignore = false;
    const run = () => {
      if (ignore) return;
      drainQueue().catch(() => null);
    };
    run();
    window.addEventListener("online", run);
    window.addEventListener("wj-sync-drain", run as EventListener);
    return () => {
      ignore = true;
      window.removeEventListener("online", run);
      window.removeEventListener("wj-sync-drain", run as EventListener);
    };
  }, []);

  return (
    <div className="max-w-4xl">
      {/* Serendipity — "on this day" / resurfaced entry */}
      <SerendipityRibbon candidate={serendipity} />

      {/* Greeting */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-twilight mb-2">
          {greeting}, {firstName}.
        </h2>
        <p className="text-charcoal/60">
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
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
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
            <h3 className="text-lg font-bold text-twilight">
              Today&apos;s Questions &mdash; {answeredAll} of {totalAll}
            </h3>
            <ProgressDots total={totalAll} completed={answeredAll} />
          </div>

          {/* Question cards — the first unanswered one becomes an inline QuickCompose */}
          <div className="space-y-3">
            {(() => {
              const firstUnansweredIdx = originalItems.findIndex(
                (it: any) => !it.response_id
              );
              return originalItems.map((item: any, i: number) => {
                const isAnswered = item.response_id !== null;
                if (!isAnswered && i === firstUnansweredIdx && dailySet) {
                  return (
                    <QuickCompose
                      key={item.id}
                      question={item.question}
                      dailyItemId={item.id}
                      setId={dailySet.id}
                      categorySlug={item.question?.category?.slug}
                      categoryName={item.question?.category?.name}
                    />
                  );
                }
                return (
                  <QuestionCard
                    key={item.id}
                    question={item.question}
                    isAnswered={isAnswered}
                    responsePreview={undefined}
                    questionNumber={i + 1}
                    categorySlug={item.question?.category?.slug}
                    categoryName={item.question?.category?.name}
                  />
                );
              });
            })()}
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
    </div>
  );
}
