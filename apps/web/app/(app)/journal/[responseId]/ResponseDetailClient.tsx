"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Clock, FileText, Tag, ChevronDown, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import type { JournalResponse } from "@wisdom-journal/shared";

interface ResponseDetailClientProps {
  response: JournalResponse;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ResponseDetailClient({ response }: ResponseDetailClientProps) {
  const [isFavorite, setIsFavorite] = useState(response.is_favorite);
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Get category from join data
  const primaryCategory = (response as any).categories?.[0]?.category;

  // Get the original question from join data
  const question = (response as any).question;

  async function toggleFavorite() {
    const newState = !isFavorite;
    setIsFavorite(newState);

    try {
      await fetch(`/api/responses/${response.id}/favorite`, {
        method: "POST",
      });
    } catch {
      // Revert on error
      setIsFavorite(!newState);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/journal"
        className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Journal
      </Link>

      {/* Original question */}
      {question && (
        <div className="bg-deep-sky/5 border border-deep-sky/10 rounded-xl p-4 mb-6">
          <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-1">
            Original Question
          </p>
          <p className="text-charcoal/80 text-sm leading-relaxed">{question.text}</p>
        </div>
      )}

      {/* Response */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {primaryCategory && (
              <CategoryBadge slug={primaryCategory.slug} name={primaryCategory.name} size="md" />
            )}
          </div>
          <button
            onClick={toggleFavorite}
            className="p-2 rounded-lg hover:bg-soft-gray transition-colors"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite
                  ? "text-sunrise-coral fill-sunrise-coral"
                  : "text-charcoal/30 hover:text-sunrise-coral"
              }`}
            />
          </button>
        </div>

        {/* Response text */}
        <div className="prose prose-charcoal max-w-none">
          <p className="text-charcoal leading-relaxed whitespace-pre-wrap text-base">
            {response.response_text}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-soft-gray text-xs text-charcoal/50">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(response.created_at)} at {formatTime(response.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {response.word_count} words
          </span>
          <span className="capitalize">{response.input_method} input</span>
        </div>

        {/* Tags */}
        {response.tags && response.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-soft-gray">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-charcoal/40" />
              <span className="text-xs font-medium text-charcoal/50">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {response.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-soft-gray text-xs text-charcoal/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* AI Insights */}
      <Card padding="md">
        <button
          onClick={() => setInsightsOpen(!insightsOpen)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-golden-hour" />
            <span className="text-sm font-medium text-charcoal">AI Insights</span>
            {!response.ai_processed_at && (
              <span className="text-xs text-charcoal/40 bg-soft-gray px-2 py-0.5 rounded-full">
                Processing...
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-charcoal/40 transition-transform ${
              insightsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {insightsOpen && (
          <div className="mt-4 pt-4 border-t border-soft-gray text-sm text-charcoal/70 space-y-3">
            {response.ai_summary && (
              <div>
                <p className="text-xs font-medium text-charcoal/50 mb-1">Summary</p>
                <p>{response.ai_summary}</p>
              </div>
            )}
            {response.ai_key_themes && response.ai_key_themes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-charcoal/50 mb-1">Key Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {response.ai_key_themes.map((theme) => (
                    <span key={theme} className="px-2 py-0.5 rounded-full bg-golden-hour/10 text-golden-hour text-xs">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {response.ai_sentiment && (
              <div>
                <p className="text-xs font-medium text-charcoal/50 mb-1">Sentiment</p>
                <p className="capitalize">{response.ai_sentiment}</p>
              </div>
            )}
            {!response.ai_summary && !response.ai_key_themes?.length && (
              <p className="text-charcoal/50">
                AI-powered insights will appear here once processing is complete.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
