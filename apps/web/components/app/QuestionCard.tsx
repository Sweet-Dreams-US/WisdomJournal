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

  const body = (
    <div className="flex items-start gap-4">
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          transition-all duration-300
          ${
            isAnswered
              ? "bg-success/10"
              : "bg-gradient-to-br from-deep-sky/10 to-sky-blue/5 group-hover:from-deep-sky/15 group-hover:to-sky-blue/10"
          }
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
        <p className="text-charcoal font-medium mt-2 leading-relaxed tracking-tight">
          {question.text}
        </p>

        {isAnswered && responsePreview && (
          <p className="text-sm text-charcoal/40 mt-2 line-clamp-2 italic">
            {responsePreview}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 self-center">
        {isAnswered ? (
          <span className="text-[11px] font-semibold text-success/80 bg-success/8 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Done
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-deep-sky group-hover:text-sky-blue transition-all duration-200 group-hover:gap-2">
            Answer
            <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  const card = (
    <Card
      hover={!isAnswered}
      padding="md"
      className={`group transition-all duration-300 ${isAnswered ? "opacity-75" : ""}`}
    >
      {body}
    </Card>
  );

  // Unanswered questions: the whole card is the tap target, not just "Answer"
  if (!isAnswered) {
    return (
      <Link href={`/journal/respond/${question.id}`} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
