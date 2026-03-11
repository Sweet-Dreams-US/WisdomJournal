"use client";

import { useState } from "react";
import {
  Heart,
  BookOpen,
  MessageCircle,
  Star,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface LegacyWisdomClientProps {
  targetProfile: {
    id: string;
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
    total_responses: number;
  };
  legacyEntry: {
    message: string | null;
    relationship: string | null;
    is_primary: boolean;
  };
  categories: any[];
  responses: any[];
}

export default function LegacyWisdomClient({
  targetProfile,
  legacyEntry,
  categories,
  responses,
}: LegacyWisdomClientProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "ask">("browse");
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const firstName = targetProfile.full_name?.split(" ")[0] ?? "Your loved one";
  const initials = targetProfile.full_name
    ? targetProfile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const memberSince = new Date(targetProfile.created_at).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  async function handleAsk() {
    if (!query.trim() || asking) return;
    setAsking(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await fetch("/api/wisdom/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          target_user_id: targetProfile.id,
          mode: "personality",
        }),
      });

      const data = await res.json();

      if (res.ok && data.ai_response) {
        setAiResponse(data.ai_response);
      } else {
        setAiError(data.error || "Could not get a response. Please try again.");
      }
    } catch {
      setAiError("Network error. Please try again.");
    } finally {
      setAsking(false);
    }
  }

  const filteredResponses = filterCategory
    ? responses.filter((r: any) =>
        r.categories?.some(
          (c: any) => c.category?.slug === filterCategory
        )
      )
    : responses;

  return (
    <div className="max-w-3xl">
      {/* Memorial header */}
      <div className="mb-8 text-center">
        <div className="w-24 h-24 rounded-full bg-sunrise-coral/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-sunrise-coral">
            {initials}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-twilight mb-1">
          {targetProfile.full_name}&apos;s Wisdom
        </h2>
        {targetProfile.bio && (
          <p className="text-sm text-charcoal/60 mb-2 italic">
            &ldquo;{targetProfile.bio}&rdquo;
          </p>
        )}
        <p className="text-xs text-charcoal/40">
          Member since {memberSince} &middot;{" "}
          {targetProfile.total_responses} journal entries
        </p>
      </div>

      {/* Personal message from the deceased */}
      {legacyEntry.message && (
        <Card padding="lg" className="mb-6 border border-sunrise-coral/20 bg-sunrise-coral/5">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-sunrise-coral mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-twilight mb-1">
                A message from {firstName}
              </p>
              <p className="text-sm text-charcoal/70 leading-relaxed italic">
                &ldquo;{legacyEntry.message}&rdquo;
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Gentle intro */}
      <Card padding="lg" className="mb-6">
        <p className="text-sm text-charcoal/60 leading-relaxed">
          {firstName} chose you{legacyEntry.relationship ? ` as their ${legacyEntry.relationship}` : ""}{" "}
          to carry on their wisdom. Here you can browse their journal entries
          and ask questions to hear their voice through the words they left behind.
          Take your time. There is no rush.
        </p>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-soft-gray/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("browse")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "browse"
              ? "bg-white text-twilight shadow-sm"
              : "text-charcoal/50 hover:text-charcoal/70"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Browse Entries
        </button>
        <button
          onClick={() => setActiveTab("ask")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "ask"
              ? "bg-white text-twilight shadow-sm"
              : "text-charcoal/50 hover:text-charcoal/70"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Ask {firstName}
        </button>
      </div>

      {/* Browse tab */}
      {activeTab === "browse" && (
        <>
          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilterCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !filterCategory
                    ? "bg-deep-sky text-white"
                    : "bg-soft-gray text-charcoal/60 hover:bg-charcoal/10"
                }`}
              >
                All ({responses.length})
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat.category_id}
                  onClick={() =>
                    setFilterCategory(cat.categories?.slug ?? null)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterCategory === cat.categories?.slug
                      ? "bg-deep-sky text-white"
                      : "bg-soft-gray text-charcoal/60 hover:bg-charcoal/10"
                  }`}
                >
                  {cat.categories?.name} ({cat.response_count})
                </button>
              ))}
            </div>
          )}

          {/* Response list */}
          <div className="space-y-3">
            {filteredResponses.length === 0 && (
              <Card padding="lg" className="text-center">
                <p className="text-sm text-charcoal/50">
                  No entries found in this category.
                </p>
              </Card>
            )}
            {filteredResponses.map((r: any) => {
              const isExpanded = expandedResponse === r.id;
              const categoryName =
                r.categories?.[0]?.category?.name ?? "Uncategorized";
              const preview = r.response_text?.slice(0, 180);
              const hasMore = r.response_text?.length > 180;

              return (
                <Card key={r.id} padding="md" className="transition-all">
                  {/* Question */}
                  {r.question?.question_text && (
                    <p className="text-xs font-medium text-deep-sky mb-2">
                      {r.question.question_text}
                    </p>
                  )}

                  {/* Response */}
                  <p className="text-sm text-charcoal leading-relaxed">
                    {isExpanded ? r.response_text : preview}
                    {hasMore && !isExpanded && "..."}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-soft-gray/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-charcoal/40 bg-soft-gray px-2 py-0.5 rounded-full">
                        {categoryName}
                      </span>
                      {r.is_favorite && (
                        <Star className="w-3 h-3 text-golden-hour fill-golden-hour" />
                      )}
                      <span className="text-xs text-charcoal/30">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {hasMore && (
                      <button
                        onClick={() =>
                          setExpandedResponse(isExpanded ? null : r.id)
                        }
                        className="flex items-center gap-1 text-xs text-deep-sky hover:text-sky-blue transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Less <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            More <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Ask tab */}
      {activeTab === "ask" && (
        <div>
          <Card padding="lg" className="mb-4 border border-sunrise-coral/10 bg-sunrise-coral/5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-sunrise-coral mt-0.5 flex-shrink-0" />
              <p className="text-sm text-charcoal/60 leading-relaxed">
                Ask a question and hear {firstName}&apos;s voice through their
                journal entries. The AI will respond as {firstName} would,
                drawing only from their actual words and experiences.
              </p>
            </div>
          </Card>

          <div className="relative mb-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`What would you like to ask ${firstName}?`}
              className="w-full rounded-xl border border-soft-gray px-4 py-3 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-deep-sky/30 resize-none h-28"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
            />
          </div>

          <Button
            onClick={handleAsk}
            disabled={asking || !query.trim()}
            className="w-full"
          >
            {asking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Listening to {firstName}&apos;s wisdom...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Ask {firstName}
              </>
            )}
          </Button>

          {/* Error */}
          {aiError && (
            <Card padding="md" className="mt-4 border border-error/20 bg-error/5">
              <p className="text-sm text-error">{aiError}</p>
            </Card>
          )}

          {/* AI Response */}
          {aiResponse && (
            <Card padding="lg" className="mt-4 border border-sunrise-coral/20 bg-sunrise-coral/5">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-sunrise-coral" />
                <span className="text-sm font-medium text-twilight">
                  {firstName}&apos;s Wisdom
                </span>
              </div>
              <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
                {aiResponse}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
