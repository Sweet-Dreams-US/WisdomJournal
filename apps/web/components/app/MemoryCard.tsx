import Link from "next/link";
import { Sparkles } from "lucide-react";
import CategoryBadge from "@/components/ui/CategoryBadge";
import type { Memory } from "@/lib/data/get-memories";

interface MemoryCardProps {
  memory: Memory;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <Link
      href={`/journal/${memory.response_id}`}
      className="block h-full group"
    >
      <div className="h-full flex flex-col rounded-card shadow-card border border-golden-hour/15 bg-gradient-to-br from-golden-hour/[0.07] via-white to-sunrise-coral/[0.05] p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 ease-out">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-golden-hour" />
          <span className="text-[10px] font-bold text-golden-hour uppercase tracking-[0.15em]">
            {memory.label}
          </span>
        </div>

        {memory.question_text && (
          <p className="text-xs text-charcoal/50 font-medium mb-1.5 line-clamp-2">
            {memory.question_text}
          </p>
        )}

        <p className="text-sm text-charcoal/80 italic leading-relaxed line-clamp-3">
          &ldquo;{memory.response_text}&rdquo;
        </p>

        {memory.category_slug && memory.category_name && (
          <div className="mt-auto pt-3">
            <CategoryBadge
              slug={memory.category_slug}
              name={memory.category_name}
              size="sm"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
