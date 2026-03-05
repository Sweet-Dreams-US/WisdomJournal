"use client";

import { Flame, BookOpen, Sun, PartyPopper } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import ProgressDots from "@/components/ui/ProgressDots";
import QuestionCard from "@/components/app/QuestionCard";
import Card from "@/components/ui/Card";
import type { UserProfile, DailyQuestionSet } from "@wisdom-journal/shared";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface DashboardClientProps {
  profile: UserProfile;
  dailySet: DailyQuestionSet | null;
}

export default function DashboardClient({
  profile,
  dailySet,
}: DashboardClientProps) {
  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  const items = (dailySet as any)?.items ?? [];
  const totalQuestions = items.length;
  const answeredCount = items.filter(
    (item: any) => item.response_id !== null
  ).length;
  const allDone = totalQuestions > 0 && answeredCount === totalQuestions;

  return (
    <div className="max-w-4xl">
      {/* Greeting */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-twilight mb-2">
          {greeting}, {firstName}!
        </h2>
        <p className="text-charcoal/60">
          {allDone
            ? "You've answered all your questions today. Well done!"
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
          value={totalQuestions}
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
              Today&apos;s Questions &mdash; {answeredCount} of{" "}
              {totalQuestions}
            </h3>
            <ProgressDots total={totalQuestions} completed={answeredCount} />
          </div>

          {/* All-done celebration */}
          {allDone && (
            <Card padding="lg" className="mb-6 text-center">
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

          {/* Question cards */}
          <div className="space-y-3">
            {items.map((item: any, i: number) => (
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
        </>
      )}
    </div>
  );
}
