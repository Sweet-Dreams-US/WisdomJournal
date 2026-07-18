"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, SkipForward, Check, Keyboard, Mic, ChevronDown, BookOpen } from "lucide-react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import Button from "@/components/ui/Button";
import VoiceRecorder from "@/components/app/VoiceRecorder";
import { getCategoryStyle } from "@/lib/category-utils";
import type { Question } from "@wisdom-journal/shared";

interface RespondClientProps {
  question: Question;
  dailyItemId: string;
  setId: string;
  categorySlug?: string;
  categoryName?: string;
  questionIndex: number;
  totalQuestions: number;
}

const STAR_ANGLES = [0, 60, 120, 180, 240, 300];

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showPastResponses, setShowPastResponses] = useState(false);
  const [pastResponses, setPastResponses] = useState<
    { id: string; response_text: string; created_at: string; question_text: string | null }[]
  >([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastFetched, setPastFetched] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const categoryStyle = getCategoryStyle(categorySlug ?? "");

  // Fetch similar past responses when toggled open
  useEffect(() => {
    if (showPastResponses && !pastFetched && question.category_id) {
      setPastLoading(true);
      fetch(
        `/api/responses/similar?category_id=${question.category_id}&question_id=${question.id}`
      )
        .then((res) => res.json())
        .then((data) => {
          setPastResponses(data.responses ?? []);
          setPastFetched(true);
        })
        .catch(() => {
          setPastFetched(true);
        })
        .finally(() => {
          setPastLoading(false);
        });
    }
  }, [showPastResponses, pastFetched, question.category_id, question.id]);

  // After a successful save: let the 600ms micro-celebration play inside the
  // card, then proceed with the existing redirect. Under reduced motion the
  // celebration is skipped and the redirect happens immediately.
  useEffect(() => {
    if (!saved) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => {
        router.push("/dashboard");
        router.refresh();
      },
      reducedMotion ? 0 : 750
    );
    return () => clearTimeout(timer);
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
        // Fire-and-forget achievement check
        fetch("/api/achievements/check", { method: "POST" }).catch(() => {});
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

  // Cmd/Ctrl+Enter saves, from either input mode
  const saveRef = useRef<() => void>(() => {});
  saveRef.current = () => {
    void handleSave();
  };
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        saveRef.current();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-6 animate-fade-in [animation-fill-mode:both]"
      >
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
        <Card padding="md" className="mb-4 border border-warning/30 bg-warning/5 animate-fade-in-down">
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
      <div className="relative">
        {/* Ambient category-tinted glow behind the question card */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 w-[36rem] max-w-full h-60 animate-fade-in [animation-fill-mode:both]"
          style={{ animationDelay: "0.2s" }}
        >
          <div
            className={`w-full h-full ${categoryStyle.color}`}
            style={{
              background:
                "radial-gradient(ellipse at center top, currentColor 0%, transparent 70%)",
              opacity: 0.06,
            }}
          />
        </div>

        <Card
          padding="lg"
          className="mb-6 relative animate-fade-in-up [animation-fill-mode:both]"
          style={{ animationDelay: "0.05s" }}
        >
          {categorySlug && categoryName && (
            <div
              className="animate-fade-in [animation-fill-mode:both]"
              style={{ animationDelay: "0.18s" }}
            >
              <CategoryBadge slug={categorySlug} name={categoryName} size="md" />
            </div>
          )}
          <div
            className="animate-fade-in-up [animation-fill-mode:both]"
            style={{ animationDelay: "0.32s" }}
          >
            <h1
              className="font-heading text-2xl md:text-3xl leading-snug text-twilight mt-4 animate-blur-in [animation-fill-mode:both]"
              style={{ animationDelay: "0.32s" }}
            >
              {question.text}
            </h1>
          </div>
        </Card>
      </div>

      {/* Similar past responses */}
      {question.category_id && (
        <div
          className="mb-4 animate-fade-in [animation-fill-mode:both]"
          style={{ animationDelay: "0.45s" }}
        >
          <button
            onClick={() => setShowPastResponses(!showPastResponses)}
            className="flex items-center gap-2 text-xs text-charcoal/50 hover:text-charcoal/70 transition-colors font-body"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Show past responses in this category
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showPastResponses ? "rotate-180" : ""}`}
            />
          </button>

          {showPastResponses && (
            <div className="mt-2">
              {pastLoading && (
                <div className="text-xs text-charcoal/40 font-body animate-pulse py-2">
                  Loading past responses...
                </div>
              )}
              {pastFetched && pastResponses.length === 0 && !pastLoading && (
                <p className="text-xs text-charcoal/40 font-body py-2">
                  No past responses in this category yet.
                </p>
              )}
              {pastResponses.length > 0 && (
                <div className="space-y-2">
                  {pastResponses.map((pr) => (
                    <Card key={pr.id} padding="sm" className="bg-soft-gray/50">
                      {pr.question_text && (
                        <p className="text-xs text-charcoal/40 font-body mb-1 italic">
                          {pr.question_text}
                        </p>
                      )}
                      <p className="text-xs text-charcoal/60 font-body line-clamp-2 leading-relaxed">
                        {pr.response_text}
                      </p>
                      <p className="text-xs text-charcoal/30 font-body mt-1">
                        {new Date(pr.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input area (voice or text) */}
      <div
        className="animate-fade-in-up [animation-fill-mode:both]"
        style={{ animationDelay: "0.52s" }}
      >
        {/* Voice recorder (primary) */}
        {inputMode === "voice" && (
          <Card padding="lg" className="mb-4 animate-fade-in">
            <VoiceRecorder onTranscript={handleTranscript} currentText={text} disabled={saving} />
          </Card>
        )}

        {/* Transcript / text display */}
        {inputMode === "voice" && text && (
          <Card padding="md" className="mb-4 animate-fade-in">
            <label className="text-xs text-charcoal/40 font-body mb-2 block">
              Your words
            </label>
            <p className="text-charcoal leading-relaxed font-body whitespace-pre-wrap">
              {text}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-soft-gray">
              <span className="font-mono text-[11px] text-charcoal/40">
                {wordCount} {wordCount === 1 ? "word" : "words"}
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
          <Card padding="md" className="mb-4 animate-fade-in">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Take your time. Every word is kept exactly as you write it."
              className="w-full min-h-[150px] resize-none bg-transparent text-charcoal font-body leading-relaxed focus:outline-none placeholder:text-charcoal/30"
            />
            <div className="flex items-center justify-end pt-2 min-h-[18px]">
              {wordCount > 0 && (
                <span className="font-mono text-[11px] text-charcoal/40 animate-fade-in">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
              )}
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
      </div>

      {/* Error */}
      {saveError && (
        <Card padding="md" className="mb-4 border border-error/30 bg-error/5 animate-fade-in">
          <p className="text-sm text-error">{saveError}</p>
        </Card>
      )}

      {/* Save button */}
      <div
        className="sticky bottom-0 bg-cloud-white py-4 flex items-center justify-end gap-3 border-t border-soft-gray -mx-4 px-4 md:-mx-8 md:px-8 animate-fade-in [animation-fill-mode:both]"
        style={{ animationDelay: "0.62s" }}
      >
        {!saved && (
          <span className="font-mono text-[11px] text-charcoal/30 select-none" aria-hidden>
            ⌘↵ to save
          </span>
        )}
        <div className="relative">
          {/* Golden star-burst: one-shot, plays when the save lands */}
          {saved && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              {STAR_ANGLES.map((angle, i) => (
                <span
                  key={angle}
                  className="wj-star"
                  style={
                    {
                      "--wj-angle": `${angle}deg`,
                      animationDelay: `${i * 0.03}s`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={wordCount === 0 || saving}
            size="md"
            className="min-w-[9.5rem]"
          >
            {saved ? (
              <Check className="w-5 h-5 animate-scale-in" />
            ) : saving ? (
              "Saving..."
            ) : (
              "Save Response"
            )}
          </Button>
        </div>
      </div>

      <style>{`
        .wj-star {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 9999px;
          background: #F5A623;
          opacity: 0;
          animation: wj-star-burst 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes wj-star-burst {
          0% {
            opacity: 0;
            transform: rotate(var(--wj-angle)) translateY(-4px) scale(0.4);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--wj-angle)) translateY(-34px) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wj-star {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
