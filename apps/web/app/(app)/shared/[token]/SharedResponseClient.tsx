"use client";

import Link from "next/link";
import { ArrowLeft, Share2, Clock, FileText } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";

interface SharedResponseClientProps {
  response: any;
  sharedByName: string;
  message?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function SharedResponseClient({
  response,
  sharedByName,
  message,
}: SharedResponseClientProps) {
  const primaryCategory = response.categories?.[0]?.category;
  const question = response.question;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Shared by banner */}
      <Card padding="md" className="mb-6 border border-deep-sky/20 bg-deep-sky/5">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-deep-sky" />
          <p className="text-sm text-charcoal">
            <span className="font-semibold">{sharedByName}</span> shared this wisdom with you
          </p>
        </div>
        {message && (
          <p className="text-sm text-charcoal/60 mt-2 italic">&ldquo;{message}&rdquo;</p>
        )}
      </Card>

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
      <Card padding="lg">
        {primaryCategory && (
          <div className="mb-4">
            <CategoryBadge slug={primaryCategory.slug} name={primaryCategory.name} size="md" />
          </div>
        )}

        <div className="prose prose-charcoal max-w-none">
          <p className="text-charcoal leading-relaxed whitespace-pre-wrap text-base">
            {response.response_text}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-soft-gray text-xs text-charcoal/50">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(response.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {response.word_count} words
          </span>
        </div>
      </Card>
    </div>
  );
}
