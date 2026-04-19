"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Keyboard, Send, ArrowRight, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import MoodSelector, { MoodId } from "@/components/ui/MoodSelector";
import type { Question } from "@wisdom-journal/shared";
import { queueResponse, requestBackgroundSync } from "@/lib/offline/offline-queue";

interface Props {
  question: Question;
  dailyItemId: string;
  setId: string;
  categorySlug?: string;
  categoryName?: string;
  onAnswered?: () => void;
}

/**
 * Inline quick-compose that lets users answer the first question without
 * navigating to the full respond page. Expands in place; falls through to the
 * deeper respond page when user clicks "Keep going".
 */
export default function QuickCompose({
  question,
  dailyItemId,
  setId,
  categorySlug,
  categoryName,
  onAnswered,
}: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [mood, setMood] = useState<MoodId | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [text]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function quickSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    setError(null);

    const payload = {
      question_id: question.id,
      daily_item_id: dailyItemId,
      set_id: setId,
      response_text: text.trim(),
      category_id: (question as any).category_id,
      subcategory_id: (question as any).subcategory_id,
      input_method: "text" as const,
      mood,
    };

    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onAnswered?.();
        router.refresh();
        setText("");
        setMood(null);
        setExpanded(false);
      } else {
        const err = await res.json();
        setError(err.error || "Could not save — try the full response page.");
      }
    } catch {
      // Offline: queue it
      try {
        await queueResponse(payload);
        requestBackgroundSync();
        onAnswered?.();
        router.refresh();
        setText("");
        setExpanded(false);
      } catch {
        setError("Saved offline will not work here — tap Keep going.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!expanded) {
    return (
      <Card padding="md" hover className="cursor-pointer" onClick={() => setExpanded(true)}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-golden-hour/10">
            <Sparkles className="w-5 h-5 text-golden-hour" />
          </div>
          <div className="flex-1 min-w-0">
            {categorySlug && categoryName && (
              <CategoryBadge slug={categorySlug} name={categoryName} size="sm" />
            )}
            <p className="text-charcoal font-medium mt-2 leading-relaxed">{question.text}</p>
            <p className="text-xs text-charcoal/45 mt-2">Tap anywhere to begin writing</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="border-deep-sky/30 ring-1 ring-deep-sky/10">
      <div className="flex items-start gap-2 mb-3">
        {categorySlug && categoryName && (
          <CategoryBadge slug={categorySlug} name={categoryName} size="sm" />
        )}
        <span className="text-xs text-charcoal/40 ml-auto">{wordCount} words</span>
      </div>
      <p className="text-lg text-twilight font-semibold leading-relaxed mb-4">{question.text}</p>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start writing here. Press Ctrl+Enter to save."
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") quickSave();
        }}
        className="w-full min-h-[120px] resize-none bg-transparent text-charcoal font-body leading-relaxed focus:outline-none placeholder:text-charcoal/30"
      />

      <div className="mt-3 space-y-3">
        <MoodSelector value={mood} onChange={setMood} compact />

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-soft-gray">
          <button
            onClick={() => router.push(`/journal/respond/${question.id}`)}
            className="inline-flex items-center gap-1.5 text-xs text-charcoal/60 hover:text-charcoal"
          >
            <Mic className="w-3.5 h-3.5" />
            Voice / full page
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-charcoal/45 hover:text-charcoal ml-auto"
          >
            Collapse
          </button>
          <button
            onClick={quickSave}
            disabled={!text.trim() || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-deep-sky text-white text-sm font-medium hover:bg-deep-sky/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Card>
  );
}
