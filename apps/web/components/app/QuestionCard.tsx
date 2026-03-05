"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import type { Question } from "@wisdom-journal/shared";

interface QuestionCardProps {
  question: Question;
  isAnswered: boolean;
  responsePreview?: string;
  questionNumber: number;
  categorySlug?: string;
  categoryName?: string;
}

export default function QuestionCard({
  question,
  isAnswered,
  responsePreview,
  questionNumber,
  categorySlug,
  categoryName,
}: QuestionCardProps) {
  // Use passed-in category props (from join data) or fall back to question's category relation
  const slug = categorySlug ?? (question as any).category?.slug;
  const name = categoryName ?? (question as any).category?.name;

  return (
    <Card hover={!isAnswered} padding="md" className="group">
      <div className="flex items-start gap-4">
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${isAnswered ? "bg-success/10" : "bg-deep-sky/10"}
          `}
        >
          {isAnswered ? (
            <Check className="w-5 h-5 text-success" />
          ) : (
            <span className="text-sm font-bold text-deep-sky">{questionNumber}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {slug && name && (
            <CategoryBadge slug={slug} name={name} size="sm" />
          )}
          <p className="text-charcoal font-medium mt-2 leading-relaxed">
            {question.text}
          </p>

          {isAnswered && responsePreview && (
            <p className="text-sm text-charcoal/50 mt-2 line-clamp-2">
              {responsePreview}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 self-center">
          {isAnswered ? (
            <span className="text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
              Completed
            </span>
          ) : (
            <Link
              href={`/journal/respond/${question.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-deep-sky hover:text-sky-blue transition-colors"
            >
              Answer
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
