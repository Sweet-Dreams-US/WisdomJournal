"use client";

import { useState } from "react";
import { Search, Sparkles, Info, Star, ChevronDown, Clock, MessageCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import type { UserProfile, WisdomQuery } from "@wisdom-journal/shared";

type QueryMode = "personality" | "neutral";

interface AiResult {
  ai_response: string;
  source_count: number;
  source_response_ids: string[];
  sources: { id: string; text: string; category_slug: string }[];
}

interface AskClientProps {
  profile: UserProfile;
  pastQueries: WisdomQuery[];
}

export default function AskClient({ profile, pastQueries }: AskClientProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<QueryMode>("personality");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [rating, setRating] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const firstName = profile.full_name?.split(" ")[0] ?? "your";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setRating(0);

    try {
      const res = await fetch("/api/wisdom/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: query.trim(),
          mode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        console.error("Query failed:", data.error);
      }
    } catch (error) {
      console.error("Query error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRate(stars: number) {
    setRating(stars);
    // TODO: Could call an API to update the rating on the wisdom_queries record
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-twilight mb-2">Ask Wisdom</h2>
        <p className="text-charcoal/60">
          Query the wisdom you&apos;ve shared and get AI-powered answers.
        </p>
      </div>

      {/* Query input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask ${firstName}'s wisdom a question...`}
            className="
              w-full pl-12 pr-4 py-4 rounded-card
              bg-white border border-soft-gray
              text-charcoal placeholder-charcoal/40
              font-body text-base
              focus:outline-none focus:ring-2 focus:ring-deep-sky/30 focus:border-deep-sky/40
              transition-all duration-200 shadow-card
            "
          />
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-3 mt-3">
          <div className="inline-flex rounded-xl bg-soft-gray p-1">
            <button
              type="button"
              onClick={() => setMode("personality")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "personality"
                  ? "bg-white text-deep-sky shadow-sm"
                  : "text-charcoal/60 hover:text-charcoal"
              }`}
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              Personality Mode
            </button>
            <button
              type="button"
              onClick={() => setMode("neutral")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                mode === "neutral"
                  ? "bg-white text-deep-sky shadow-sm"
                  : "text-charcoal/60 hover:text-charcoal"
              }`}
            >
              Neutral Mode
            </button>
          </div>
          <div className="group relative">
            <Info className="w-4 h-4 text-charcoal/30 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-twilight text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
              <strong>Personality Mode</strong> responds in {firstName}&apos;s voice and style.
              <br /><br />
              <strong>Neutral Mode</strong> gives factual answers drawn from the entries.
            </div>
          </div>
          <div className="flex-1" />
          <Button type="submit" disabled={!query.trim() || loading} size="md">
            {loading ? "Thinking..." : "Ask"}
          </Button>
        </div>
      </form>

      {/* Loading skeleton */}
      {loading && (
        <Card padding="lg" className="mb-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-soft-gray rounded w-full" />
            <div className="h-4 bg-soft-gray rounded w-11/12" />
            <div className="h-4 bg-soft-gray rounded w-10/12" />
            <div className="h-4 bg-soft-gray rounded w-9/12" />
          </div>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <Card padding="lg" className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-golden-hour/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-golden-hour" />
            </div>
            <p className="text-charcoal leading-relaxed">{result.ai_response}</p>
          </div>

          <div className="border-t border-soft-gray pt-4 mt-4">
            <p className="text-xs text-charcoal/50 mb-3">
              Based on {result.source_count} responses
            </p>

            {/* Sources toggle */}
            {result.sources.length > 0 && (
              <>
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-1 text-xs text-deep-sky hover:text-sky-blue transition-colors mb-3"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showSources ? "rotate-180" : ""}`}
                  />
                  {showSources ? "Hide" : "Show"} source entries
                </button>

                {showSources && (
                  <div className="space-y-2 mb-4">
                    {result.sources.map((source) => (
                      <div
                        key={source.id}
                        className="p-3 rounded-xl bg-soft-gray/50 text-sm text-charcoal/70 line-clamp-2"
                      >
                        {source.text}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-charcoal/50">Rate this response:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-4 h-4 transition-colors ${
                        star <= rating
                          ? "text-golden-hour fill-golden-hour"
                          : "text-charcoal/20 hover:text-golden-hour/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Query history */}
      {!result && !loading && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-medium text-charcoal/60 mb-4"
          >
            <Clock className="w-4 h-4" />
            Past Queries
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showHistory ? "rotate-180" : ""}`}
            />
          </button>

          {showHistory && pastQueries.length > 0 ? (
            <div className="space-y-3">
              {pastQueries.map((wq) => (
                <Card key={wq.id} padding="md" hover className="cursor-pointer" onClick={() => {
                  setQuery(wq.query_text);
                }}>
                  <p className="font-medium text-charcoal text-sm mb-1">
                    {wq.query_text}
                  </p>
                  {wq.ai_response && (
                    <p className="text-xs text-charcoal/50 line-clamp-2">
                      {wq.ai_response}
                    </p>
                  )}
                  <p className="text-xs text-charcoal/30 mt-2">
                    {new Date(wq.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {wq.rating && (
                      <span className="ml-2">
                        {"★".repeat(wq.rating)}
                      </span>
                    )}
                  </p>
                </Card>
              ))}
            </div>
          ) : showHistory ? (
            <EmptyState
              icon={MessageCircle}
              title="Ask your first question"
              description="Type a question above to explore the wisdom you've captured."
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
