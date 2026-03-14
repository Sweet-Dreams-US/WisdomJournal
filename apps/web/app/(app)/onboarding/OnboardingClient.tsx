"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getCategoryStyle } from "@/lib/category-utils";
import { BookOpen, Check, Clock, ChevronRight, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

interface OnboardingClientProps {
  categories: Category[];
}

export default function OnboardingClient({ categories }: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [loading, setLoading] = useState(false);

  async function saveStep(stepName: string, data?: Record<string, unknown>) {
    await fetch("/api/onboarding/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: stepName, data }),
    });
  }

  async function handleWelcome() {
    setLoading(true);
    await saveStep("welcome_seen");
    setStep(2);
    setLoading(false);
  }

  async function handleCategories() {
    if (selectedCategories.length < 3) return;
    setLoading(true);
    await saveStep("categories_selected", {
      selected_category_ids: selectedCategories,
    });
    setStep(3);
    setLoading(false);
  }

  async function handleReminder(skip: boolean) {
    setLoading(true);
    if (skip) {
      await saveStep("reminder_set");
    } else {
      await saveStep("reminder_set", { reminder_time: reminderTime });
    }
    setStep(4);
    setLoading(false);
  }

  async function handleComplete() {
    setLoading(true);
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/dashboard");
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  return (
    <div className="min-h-screen bg-cloud-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-10 bg-deep-sky"
                  : s < step
                    ? "w-6 bg-sky-blue"
                    : "w-6 bg-soft-gray"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card padding="lg" className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-sky-blue/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-deep-sky" />
              </div>
            </div>
            <h1 className="font-heading text-3xl text-twilight mb-4">
              Welcome to Wisdom Journal
            </h1>
            <p className="text-twilight/70 text-lg mb-2">
              Your personal space to capture life&apos;s wisdom, one question at a time.
            </p>
            <p className="text-twilight/60 mb-8">
              Each day, you&apos;ll receive thoughtful questions designed to help you
              reflect on your experiences, values, and stories. Over time, your
              journal becomes a rich collection of wisdom that can be shared with
              the people you love.
            </p>
            <Button onClick={handleWelcome} disabled={loading} size="lg">
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        )}

        {/* Step 2: Pick Categories */}
        {step === 2 && (
          <Card padding="lg">
            <div className="text-center mb-6">
              <h2 className="font-heading text-2xl text-twilight mb-2">
                What matters most to you?
              </h2>
              <p className="text-twilight/60">
                Choose at least 3 categories to personalize your daily questions.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {categories.map((cat) => {
                const style = getCategoryStyle(cat.slug);
                const Icon = style.icon;
                const isSelected = selectedCategories.includes(cat.id);

                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`
                      relative p-4 rounded-2xl border-2 transition-all duration-200 text-left
                      ${
                        isSelected
                          ? `${style.bgColor} border-current ${style.color} shadow-md scale-[1.02]`
                          : "bg-white border-soft-gray hover:border-sky-blue/30 hover:shadow-sm"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <Icon
                      className={`w-6 h-6 mb-2 ${isSelected ? style.color : "text-twilight/40"}`}
                    />
                    <div
                      className={`text-sm font-semibold ${isSelected ? style.color : "text-twilight"}`}
                    >
                      {cat.name}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-twilight/50">
                {selectedCategories.length} selected (min 3)
              </span>
              <Button
                onClick={handleCategories}
                disabled={selectedCategories.length < 3 || loading}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Set Reminder */}
        {step === 3 && (
          <Card padding="lg" className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </div>
            <h2 className="font-heading text-2xl text-twilight mb-2">
              Set a Daily Reminder
            </h2>
            <p className="text-twilight/60 mb-6">
              Building a journaling habit is easier with a gentle nudge.
              Pick a time that works best for you.
            </p>

            <div className="flex justify-center mb-8">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-6 py-3 text-lg border-2 border-soft-gray rounded-xl text-twilight focus:outline-none focus:border-deep-sky transition-colors"
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleReminder(true)}
                disabled={loading}
                className="text-twilight/50 hover:text-twilight/70 transition-colors text-sm font-medium"
              >
                Skip for now
              </button>
              <Button onClick={() => handleReminder(false)} disabled={loading}>
                Set Reminder
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <Card padding="lg" className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <h2 className="font-heading text-2xl text-twilight mb-2">
              You&apos;re All Set!
            </h2>
            <p className="text-twilight/60 mb-6">
              Your journal is ready. Let&apos;s begin capturing your wisdom.
            </p>

            <div className="inline-flex items-center gap-2 bg-sky-blue/10 text-deep-sky px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Check className="w-4 h-4" />
              You selected {selectedCategories.length} categories
            </div>

            <div>
              <Button onClick={handleComplete} disabled={loading} size="lg">
                Start Journaling
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
