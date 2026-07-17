"use client";

import Link from "next/link";
import { Heart, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import type { JournalResponse } from "@wisdom-journal/shared";

interface ResponseCardProps {
  response: JournalResponse;
  showDate?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ResponseCard({ response, showDate = true }: ResponseCardProps) {
  // Get category from the join data (response_categories → category)
  const primaryCategory = (response as any).categories?.[0]?.category;

  return (
    <Link href={`/journal/${response.id}`}>
      <Card hover padding="md" className="group cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {primaryCategory && (
              <CategoryBadge slug={primaryCategory.slug} name={primaryCategory.name} size="sm" />
            )}
            <p className="text-charcoal mt-2 line-clamp-3 leading-relaxed tracking-tight">
              {response.response_text}
            </p>
            <div className="flex items-center gap-4 mt-3 text-[11px] text-charcoal/40 font-medium">
              {showDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(response.created_at)}
                </span>
              )}
              <span>{response.word_count} words</span>
            </div>
          </div>

          {response.is_favorite && (
            <Heart className="w-4 h-4 text-sunrise-coral fill-sunrise-coral flex-shrink-0 mt-1 transition-transform duration-300 group-hover:scale-110" />
          )}
        </div>
      </Card>
    </Link>
  );
}
