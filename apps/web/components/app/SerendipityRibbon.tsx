"use client";

import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useState } from "react";

interface Props {
  candidate: {
    response_id: string;
    excerpt: string;
    category_slug: string | null;
    category_name: string | null;
    created_at: string;
    surface_type: string;
    context: string;
  } | null;
}

export default function SerendipityRibbon({ candidate }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!candidate || dismissed) return null;

  const date = new Date(candidate.created_at);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const badgeTone =
    candidate.surface_type === "on_this_day"
      ? "bg-golden-hour/10 text-golden-hour border-golden-hour/30"
      : candidate.surface_type === "anniversary"
        ? "bg-sunrise-coral/10 text-sunrise-coral border-sunrise-coral/30"
        : "bg-deep-sky/10 text-deep-sky border-deep-sky/30";

  return (
    <div className="mb-6 rounded-card bg-gradient-to-r from-deep-sky/5 via-golden-hour/5 to-sunrise-coral/5 border border-soft-gray p-5 relative overflow-hidden">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-soft-gray transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-charcoal/40" />
      </button>

      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-golden-hour" />
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeTone}`}>
          {candidate.context}
        </span>
        <span className="text-[10px] text-charcoal/40">{formatted}</span>
      </div>

      <p className="text-charcoal/90 leading-relaxed italic font-body">
        &ldquo;{candidate.excerpt}{candidate.excerpt.length >= 280 ? "…" : ""}&rdquo;
      </p>

      <div className="mt-3 flex items-center justify-between">
        {candidate.category_name && (
          <span className="text-xs text-charcoal/50">{candidate.category_name}</span>
        )}
        <Link
          href={`/journal/${candidate.response_id}`}
          className="inline-flex items-center gap-1 text-sm text-deep-sky font-medium hover:underline"
        >
          Re-read
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
