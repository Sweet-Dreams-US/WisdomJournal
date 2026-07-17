"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Sparkles, Info, Star, ChevronDown, Clock, MessageCircle, Users, RefreshCw } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import type { UserProfile, WisdomQuery } from "@wisdom-journal/shared";
import { plural } from "@/lib/utils/plural";

type QueryMode = "personality" | "neutral";
type ResponseLength = "concise" | "full";

interface AiResult {
  id?: string;
  ai_response: string;
  source_count: number;
  source_response_ids: string[];
  sources: { id: string; text: string; category_slug: string }[];
}

interface FriendOption {
  friendshipId: string;
  userId: string;
  name: string;
  sharedCategories: number;
}

interface AskClientProps {
  profile: UserProfile;
  pastQueries: WisdomQuery[];
  friendOptions?: FriendOption[];
}

export default function AskClient({ profile, pastQueries, friendOptions = [] }: AskClientProps) {
  const searchParams = useSearchParams();
  const initialFriend = searchParams.get("friend") ?? "";

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<QueryMode>("personality");
  const [responseLength, setResponseLength] = useState<ResponseLength>("concise");
  const [targetFriend, setTargetFriend] = useState(initialFriend);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [rating, setRating] = useState(0);
  const [showSources, setShowSources] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);

  const selectedFriend = friendOptions.find((f) => f.friendshipId === targetFriend);
  const firstName = selectedFriend
    ? selectedFriend.name.split(" ")[0]
    : profile.full_name?.split(" ")[0] ?? "your";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setRating(0);
    setError(null);
    setFollowUps([]);

    try {
      const res = await fetch("/api/wisdom/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: query.trim(),
          mode,
          response_length: responseLength,
          ...(selectedFriend ? { target_user_id: selectedFriend.userId } : {}),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.ai_response) {
          setResult(data);
          setFollowUps(generateFollowUps(query.trim()));
        } else {
          setError("No response was generated. Try a different question or add more journal entries first.");
        }
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRate(stars: number) {
    setRating(stars);
    if (result?.id) {
      try {
        await fetch("/api/wisdom/rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query_id: result.id, rating: stars }),
        });
      } catch {
        // Silent fail for rating
      }
    }
  }

  async function handleRegenerate() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setRating(0);
    setError(null);
    setFollowUps([]);

    try {
      const res = await fetch("/api/wisdom/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: query.trim(),
          mode,
          response_length: responseLength,
          ...(selectedFriend ? { target_user_id: selectedFriend.userId } : {}),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ai_response) {
        setResult(data);
        setFollowUps(generateFollowUps(query.trim()));
      } else {
        setError(data.error || "No response was generated. Try a different question.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function generateFollowUps(q: string): string[] {
    const lower = q.toLowerCase();
    const suggestions: string[] = [];

    // Category-aware follow-up generation
    const topicMap: Record<string, string[]> = {
      career: [
        "What obstacles have I faced in my career?",
        "How has my thinking about work changed over time?",
        "What motivates me professionally?",
      ],
      goal: [
        "What obstacles have I faced reaching my goals?",
        "How has my thinking about goals changed?",
        "What goals have I already achieved?",
      ],
      relationship: [
        "What patterns show up in my relationships?",
        "How do I handle conflict with others?",
        "What do I value most in people?",
      ],
      family: [
        "What lessons have I learned from my family?",
        "How have my family relationships evolved?",
        "What traditions matter most to me?",
      ],
      health: [
        "What habits have helped my wellbeing?",
        "How has my approach to health changed?",
        "What challenges have I faced with my health?",
      ],
      values: [
        "How do my values show up in daily life?",
        "Have my core values shifted over time?",
        "When have my values been tested?",
      ],
      fear: [
        "How have I overcome past fears?",
        "What gives me courage when I'm afraid?",
        "How have my fears changed over time?",
      ],
      gratitude: [
        "What am I most grateful for right now?",
        "How does gratitude affect my outlook?",
        "What unexpected things have I been thankful for?",
      ],
      growth: [
        "What has been my biggest area of growth?",
        "What experiences shaped who I am today?",
        "Where do I still want to grow?",
      ],
    };

    // Find matching topic
    for (const [topic, qs] of Object.entries(topicMap)) {
      if (lower.includes(topic)) {
        suggestions.push(...qs.filter((s) => s.toLowerCase() !== lower));
        break;
      }
    }

    // Generic follow-ups if no topic match
    if (suggestions.length === 0) {
      const generic = [
        `How has my thinking about this changed over time?`,
        `What patterns emerge from my reflections on this?`,
        `What have I learned about myself through this?`,
      ];
      suggestions.push(...generic);
    }

    return suggestions.slice(0, 3);
  }

  function handleFollowUp(followUpQuery: string) {
    setQuery(followUpQuery);
    setResult(null);
    setRating(0);
    setError(null);
    setFollowUps([]);
    // Auto-submit after a short delay to let state settle
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) form.requestSubmit();
    }, 50);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-twilight mb-2">Ask Wisdom</h2>
        <p className="text-charcoal/60">
          Query the wisdom you&apos;ve shared and get AI-powered answers.
        </p>
      </div>

      {/* Friend target selector */}
      {friendOptions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-charcoal/50" />
            <span className="text-sm text-charcoal/60">Whose wisdom?</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTargetFriend("")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !targetFriend
                  ? "bg-deep-sky text-white"
                  : "bg-soft-gray text-charcoal/60 hover:text-charcoal"
              }`}
            >
              My Wisdom
            </button>
            {friendOptions.map((f) => (
              <button
                key={f.friendshipId}
                type="button"
                onClick={() => setTargetFriend(f.friendshipId)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  targetFriend === f.friendshipId
                    ? "bg-deep-sky text-white"
                    : "bg-soft-gray text-charcoal/60 hover:text-charcoal"
                }`}
                title={`${f.sharedCategories} categories shared with you`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
          <div className="inline-flex rounded-xl bg-soft-gray p-1">
            <button
              type="button"
              onClick={() => setResponseLength("concise")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                responseLength === "concise"
                  ? "bg-white text-deep-sky shadow-sm"
                  : "text-charcoal/60 hover:text-charcoal"
              }`}
            >
              Concise
            </button>
            <button
              type="button"
              onClick={() => setResponseLength("full")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                responseLength === "full"
                  ? "bg-white text-deep-sky shadow-sm"
                  : "text-charcoal/60 hover:text-charcoal"
              }`}
            >
              Full Detail
            </button>
          </div>
          <div className="group relative">
            <Info className="w-4 h-4 text-charcoal/30 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-twilight text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
              <strong>Personality Mode</strong> responds in {firstName}&apos;s voice and style.
              <strong>Neutral Mode</strong> gives factual answers drawn from the entries.
              <br /><br />
              <strong>Concise</strong> gives a short AI-summarized answer.
              <strong>Full Detail</strong> gives the complete response with full context.
            </div>
          </div>
          <div className="flex-1" />
          <Button type="submit" disabled={!query.trim() || loading} size="md">
            {loading ? "Thinking..." : "Ask"}
          </Button>
        </div>
      </form>

      {/* Error */}
      {error && !loading && (
        <Card padding="md" className="mb-6 border border-error/30 bg-error/5">
          <p className="text-sm text-error">{error}</p>
        </Card>
      )}

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
              Based on {plural(result.source_count, "journal entry", "journal entries")}
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

            {/* Rating + Regenerate */}
            <div className="flex items-center gap-3">
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
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-charcoal/50 hover:text-deep-sky hover:bg-deep-sky/5 transition-colors disabled:opacity-50"
                title="Try again with the same question"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Try Again
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Follow-up suggestions */}
      {result && !loading && followUps.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-charcoal/50 mb-2 font-body">Continue exploring:</p>
          <div className="flex flex-col gap-2">
            {followUps.map((followUp) => (
              <button
                key={followUp}
                onClick={() => handleFollowUp(followUp)}
                className="text-left px-4 py-2.5 rounded-xl border border-soft-gray bg-white hover:border-deep-sky/30 hover:bg-deep-sky/5 transition-all text-sm text-charcoal/70 hover:text-charcoal group"
              >
                <Search className="w-3.5 h-3.5 inline mr-2 text-charcoal/30 group-hover:text-deep-sky transition-colors" />
                {followUp}
              </button>
            ))}
          </div>
        </div>
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
