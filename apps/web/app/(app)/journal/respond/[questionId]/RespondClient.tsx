"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, SkipForward, Mic, Check } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import ResponseEditor from "@/components/ui/ResponseEditor";
import Button from "@/components/ui/Button";
import type { Question } from "@wisdom-journal/shared";
import gsap from "gsap";

interface RespondClientProps {
  question: Question;
  dailyItemId: string;
  setId: string;
  categorySlug?: string;
  categoryName?: string;
  questionIndex: number;
  totalQuestions: number;
}

export default function RespondClient({
  question,
  dailyItemId,
  setId,
  categorySlug,
  categoryName,
  questionIndex,
  totalQuestions,
}: RespondClientProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const checkRef = useRef<HTMLDivElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (saved && checkRef.current) {
      gsap.fromTo(
        checkRef.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
          onComplete: () => {
            setTimeout(() => router.push("/dashboard"), 1000);
          },
        }
      );
    }
  }, [saved, router]);

  async function handleSave() {
    if (saving || wordCount === 0) return;
    setSaving(true);

    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          daily_item_id: dailyItemId,
          set_id: setId,
          response_text: text.trim(),
          category_id: question.category_id,
          subcategory_id: question.subcategory_id,
        }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        const err = await res.json();
        console.error("Save failed:", err);
        setSaving(false);
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaving(false);
    }
  }

  async function handleSkip() {
    await fetch("/api/daily/skip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: dailyItemId,
        set_id: setId,
        question_id: question.id,
      }),
    });
    router.push("/dashboard");
  }

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div ref={checkRef} className="mb-6">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-10 h-10 text-success" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-twilight mb-2">Wisdom saved!</h2>
        <p className="text-charcoal/60">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <span className="text-sm font-medium text-charcoal/50">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <button
          onClick={() => setShowSkipConfirm(true)}
          className="inline-flex items-center gap-1 text-sm text-charcoal/50 hover:text-charcoal transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
      </div>

      {/* Skip confirmation */}
      {showSkipConfirm && (
        <Card padding="md" className="mb-4 border border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-charcoal">Are you sure you want to skip this question?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="text-sm text-charcoal/60 hover:text-charcoal px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSkip}
                className="text-sm text-warning font-medium hover:text-warning/80 px-3 py-1"
              >
                Yes, skip
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Question */}
      <Card padding="lg" className="mb-6">
        {categorySlug && categoryName && (
          <CategoryBadge slug={categorySlug} name={categoryName} size="md" />
        )}
        <p className="text-xl text-twilight font-semibold mt-3 leading-relaxed">
          {question.text}
        </p>
      </Card>

      {/* Editor */}
      <ResponseEditor value={text} onChange={setText} />

      {/* Footer */}
      <div className="sticky bottom-0 bg-cloud-white py-4 mt-4 flex items-center justify-between border-t border-soft-gray -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="flex items-center gap-4">
          <span className="text-xs text-charcoal/40">{wordCount} words</span>
          <button
            disabled
            className="inline-flex items-center gap-1 text-xs text-charcoal/30 cursor-not-allowed"
            title="Voice recording coming soon"
          >
            <Mic className="w-4 h-4" />
            Voice (coming soon)
          </button>
        </div>
        <Button
          onClick={handleSave}
          disabled={wordCount === 0 || saving}
          size="md"
        >
          {saving ? "Saving..." : "Save Response"}
        </Button>
      </div>
    </div>
  );
}
