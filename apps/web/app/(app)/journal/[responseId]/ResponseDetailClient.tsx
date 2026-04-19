"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Clock, FileText, Tag, ChevronDown, Sparkles, Share2, Link2, Check, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import Button from "@/components/ui/Button";
import EntityChips from "@/components/app/EntityChips";
import RelatedResponses from "@/components/app/RelatedResponses";
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

  // AI insights state (on-demand)
  const [aiSummary, setAiSummary] = useState(response.ai_summary);
  const [aiThemes, setAiThemes] = useState(response.ai_key_themes);
  const [aiSentiment, setAiSentiment] = useState(response.ai_sentiment);
  const [aiProcessed, setAiProcessed] = useState(!!response.ai_processed_at);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Share state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

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
      setIsFavorite(!newState);
    }
  }

  async function generateInsights() {
    if (insightLoading) return;
    setInsightLoading(true);
    setInsightError(null);

    try {
      const res = await fetch(`/api/responses/${response.id}/insights`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.ai_summary);
        setAiThemes(data.ai_key_themes);
        setAiSentiment(data.ai_sentiment);
        setAiProcessed(true);
      } else {
        const data = await res.json();
        setInsightError(data.error || "Failed to generate insights.");
      }
    } catch {
      setInsightError("Network error. Please try again.");
    } finally {
      setInsightLoading(false);
    }
  }

  async function createShareLink() {
    if (shareLoading) return;
    setShareLoading(true);

    try {
      const res = await fetch(`/api/responses/${response.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_type: "link" }),
      });

      if (res.ok) {
        const data = await res.json();
        const link = `${window.location.origin}/shared/${data.share.share_token}`;
        setShareLink(link);
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }
    } catch {
      // Silent fail
    } finally {
      setShareLoading(false);
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShareOpen(!shareOpen)}
              className="p-2 rounded-lg hover:bg-soft-gray transition-colors"
              title="Share"
            >
              <Share2 className="w-4.5 h-4.5 text-charcoal/30 hover:text-deep-sky transition-colors" />
            </button>
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
        </div>

        {/* Share panel */}
        {shareOpen && (
          <div className="mb-4 p-3 rounded-xl bg-soft-gray/50 border border-soft-gray">
            <p className="text-xs font-medium text-charcoal/60 mb-2">Share this response</p>
            {shareLink ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 text-xs bg-white rounded-lg px-3 py-2 border border-soft-gray text-charcoal/70"
                />
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareLink);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 3000);
                  }}
                  className="px-3 py-2 rounded-lg bg-deep-sky text-white text-xs font-medium hover:bg-sky-blue transition-colors"
                >
                  {shareCopied ? (
                    <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                  ) : (
                    <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> Copy</span>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={createShareLink}
                disabled={shareLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-deep-sky text-white text-xs font-medium hover:bg-sky-blue transition-colors disabled:opacity-50"
              >
                {shareLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Link2 className="w-3 h-3" />
                )}
                Generate Share Link
              </button>
            )}
          </div>
        )}

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

        {/* Entity chips — people, places, dates extracted from text */}
        <EntityChips text={response.response_text} />

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
          </div>
          <ChevronDown
            className={`w-4 h-4 text-charcoal/40 transition-transform ${
              insightsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {insightsOpen && (
          <div className="mt-4 pt-4 border-t border-soft-gray text-sm text-charcoal/70 space-y-3">
            {aiProcessed ? (
              <>
                {aiSummary && (
                  <div>
                    <p className="text-xs font-medium text-charcoal/50 mb-1">Summary</p>
                    <p>{aiSummary}</p>
                  </div>
                )}
                {aiThemes && aiThemes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-charcoal/50 mb-1">Key Themes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiThemes.map((theme) => (
                        <span key={theme} className="px-2 py-0.5 rounded-full bg-golden-hour/10 text-golden-hour text-xs">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {aiSentiment && (
                  <div>
                    <p className="text-xs font-medium text-charcoal/50 mb-1">Sentiment</p>
                    <p className="capitalize">{aiSentiment}</p>
                  </div>
                )}
                <button
                  onClick={generateInsights}
                  disabled={insightLoading}
                  className="text-xs text-deep-sky hover:text-sky-blue transition-colors"
                >
                  {insightLoading ? "Regenerating..." : "Regenerate insights"}
                </button>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-charcoal/50 mb-3">
                  Get AI analysis of this response: a summary, key themes, and sentiment.
                </p>
                <button
                  onClick={generateInsights}
                  disabled={insightLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-golden-hour/10 text-golden-hour text-sm font-medium hover:bg-golden-hour/20 transition-colors disabled:opacity-50"
                >
                  {insightLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {insightLoading ? "Analyzing..." : "Generate Insights"}
                </button>
                {insightError && (
                  <p className="text-xs text-error mt-2">{insightError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Echoes — semantically-related past entries */}
      <RelatedResponses responseId={response.id} />
    </div>
  );
}
