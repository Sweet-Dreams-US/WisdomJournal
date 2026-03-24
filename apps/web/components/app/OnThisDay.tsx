"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";

interface OnThisDayItem {
  response: {
    id: string;
    response_text: string;
    word_count: number;
    created_at: string;
    question?: { question_text: string } | null;
    categories?: Array<{
      category?: { name: string; slug: string; icon: string } | null;
    }>;
  };
  time_ago_label: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text || "";
  return text.slice(0, maxLen).trimEnd() + "...";
}

export default function OnThisDay() {
  const [items, setItems] = useState<OnThisDayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchOnThisDay() {
      try {
        const res = await fetch("/api/responses/on-this-day");
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.items ?? []);
      } catch {
        // Silent fail — don't show the component if the request fails
      } finally {
        setLoading(false);
      }
    }
    fetchOnThisDay();
  }, []);

  // Don't render anything if loading or no items
  if (loading || items.length === 0) return null;

  const primaryItem = items[0];
  const remainingItems = items.slice(1);
  const primaryCategory =
    primaryItem.response.categories?.[0]?.category?.name ?? null;

  return (
    <Card padding="lg" className="border border-golden-hour/20 bg-golden-hour/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-golden-hour" />
        <h3 className="text-sm font-bold text-golden-hour uppercase tracking-wider">
          On This Day
        </h3>
      </div>

      {/* Primary memory */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-charcoal/50">
            {primaryItem.time_ago_label} &middot;{" "}
            {formatDate(primaryItem.response.created_at)}
          </span>
        </div>
        {primaryItem.response.question?.question_text && (
          <p className="text-sm font-medium text-twilight mb-1">
            {primaryItem.response.question.question_text}
          </p>
        )}
        <p className="text-sm text-charcoal/70 leading-relaxed">
          {truncate(primaryItem.response.response_text, 200)}
        </p>
      </div>

      {/* Expand/collapse for additional items */}
      {remainingItems.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-deep-sky hover:text-deep-sky/80 transition-colors mb-3"
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {expanded
              ? "Show less"
              : `${remainingItems.length} more memory${remainingItems.length === 1 ? "" : "s"}`}
          </button>

          {expanded && (
            <div className="space-y-3 mb-3 pl-3 border-l-2 border-golden-hour/20">
              {remainingItems.map((item) => (
                <div key={item.response.id}>
                  <span className="text-xs text-charcoal/50">
                    {item.time_ago_label} &middot;{" "}
                    {formatDate(item.response.created_at)}
                  </span>
                  {item.response.question?.question_text && (
                    <p className="text-sm font-medium text-twilight mt-0.5">
                      {item.response.question.question_text}
                    </p>
                  )}
                  <p className="text-sm text-charcoal/70 leading-relaxed mt-0.5">
                    {truncate(item.response.response_text, 150)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CTA */}
      {primaryCategory && (
        <Link
          href={`/ask?q=How has my thinking about ${encodeURIComponent(primaryCategory)} changed?`}
          className="inline-flex items-center gap-1.5 text-sm text-deep-sky hover:text-deep-sky/80 font-medium transition-colors"
        >
          Reflect on this
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </Card>
  );
}
