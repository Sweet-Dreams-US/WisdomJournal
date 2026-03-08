"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, SkipForward, Check, Keyboard, Mic } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import Button from "@/components/ui/Button";
import VoiceRecorder from "@/components/app/VoiceRecorder";
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const checkRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
            setTimeout(() => {
              router.push("/dashboard");
              router.refresh();
            }, 1000);
          },
        }
      );
    }
  }, [saved, router]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && inputMode === "text") {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text, inputMode]);

  async function handleSave() {
    if (saving || wordCount === 0) return;
    setSaving(true);
    setSaveError(null);

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
          input_method: inputMode === "voice" ? "voice" : "text",
        }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        const err = await res.json();
        setSaveError(err.error || "Failed to save. Please try again.");
        setSaving(false);
      }
    } catch (error) {
      setSaveError("Network error. Please check your connection and try again.");
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
    router.refresh();
  }

  function handleTranscript(transcript: string) {
    setText(transcript);
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
            <p className="text-sm text-charcoal">Skip this question?</p>
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

      {/* Voice recorder (primary) */}
      {inputMode === "voice" && (
        <Card padding="lg" className="mb-4">
          <VoiceRecorder onTranscript={handleTranscript} disabled={saving} />
        </Card>
      )}

      {/* Transcript / text display */}
      {inputMode === "voice" && text && (
        <Card padding="md" className="mb-4">
          <label className="text-xs text-charcoal/40 font-body mb-2 block">
            Your words
          </label>
          <p className="text-charcoal leading-relaxed font-body whitespace-pre-wrap">
            {text}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-soft-gray">
            <span className="text-xs text-charcoal/40 font-body">
              {wordCount} words
            </span>
            <button
              onClick={() => setText("")}
              className="text-xs text-charcoal/40 hover:text-charcoal transition-colors font-body"
            >
              Clear and re-record
            </button>
          </div>
        </Card>
      )}

      {/* Text input mode (secondary) */}
      {inputMode === "text" && (
        <Card padding="md" className="mb-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your response..."
            className="w-full min-h-[150px] resize-none bg-transparent text-charcoal font-body leading-relaxed focus:outline-none placeholder:text-charcoal/30"
          />
          <div className="flex items-center justify-between pt-3 border-t border-soft-gray">
            <span className="text-xs text-charcoal/40 font-body">
              {wordCount} words
            </span>
          </div>
        </Card>
      )}

      {/* Mode toggle */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setInputMode(inputMode === "voice" ? "text" : "voice")}
          className="inline-flex items-center gap-2 text-xs text-charcoal/40 hover:text-charcoal/60 transition-colors font-body"
        >
          {inputMode === "voice" ? (
            <>
              <Keyboard className="w-3.5 h-3.5" />
              Switch to typing
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              Switch to voice
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {saveError && (
        <Card padding="md" className="mb-4 border border-error/30 bg-error/5">
          <p className="text-sm text-error">{saveError}</p>
        </Card>
      )}

      {/* Save button */}
      <div className="sticky bottom-0 bg-cloud-white py-4 flex justify-end border-t border-soft-gray -mx-4 px-4 md:-mx-8 md:px-8">
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
