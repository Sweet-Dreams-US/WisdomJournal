"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import type { PersonDetail, PersonEntry } from "@/lib/data/get-person-mentions";
import { toLocalDateKey } from "@/lib/utils/dates";
import { plural } from "@/lib/utils/plural";

const MAX_PREVIEW_CHARS = 400;

function formatShortDate(timestamp: string): string {
  return new Date(toLocalDateKey(timestamp) + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
}

function formatEntryDate(timestamp: string): string {
  return new Date(toLocalDateKey(timestamp) + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );
}

function formatRelationship(r: string): string {
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Render entry text with occurrences of the person's name highlighted. */
function HighlightedText({ text, name }: { text: string; name: string }) {
  const truncated =
    text.length > MAX_PREVIEW_CHARS
      ? text.slice(0, MAX_PREVIEW_CHARS).trimEnd() + "…"
      : text;

  if (!name) return <>{truncated}</>;

  const pattern = new RegExp(`(${escapeRegExp(name)})`, "gi");
  const parts = truncated.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === name.toLowerCase() ? (
          <mark
            key={i}
            className="bg-golden-hour/20 text-charcoal rounded px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function EntryCard({ entry, name }: { entry: PersonEntry; name: string }) {
  return (
    <Link href={`/journal/${entry.response_id}`} className="block">
      <Card hover padding="md" className="group cursor-pointer">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {entry.category && (
            <CategoryBadge
              slug={entry.category.slug}
              name={entry.category.name}
              size="sm"
            />
          )}
        </div>
        {entry.question_text && (
          <p className="text-xs text-charcoal/45 font-medium italic mb-1.5 line-clamp-2">
            {entry.question_text}
          </p>
        )}
        <p className="text-charcoal line-clamp-5 leading-relaxed tracking-tight">
          <HighlightedText text={entry.response_text} name={name} />
        </p>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-charcoal/40 font-medium">
          <span>{plural(entry.word_count, "word")}</span>
        </div>
      </Card>
    </Link>
  );
}

interface Props {
  person: PersonDetail;
}

export default function PersonDetailClient({ person }: Props) {
  const initial = person.display_name.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href="/people"
        className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to People
      </Link>

      {/* Person header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-deep-sky/15 to-sky-blue/5 border border-charcoal/[0.04] flex items-center justify-center">
          <span className="text-2xl font-bold text-deep-sky">{initial}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl font-bold text-twilight tracking-tight">
              {person.display_name}
            </h2>
            {person.relationship && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sunrise-coral/10 text-sunrise-coral text-xs font-semibold">
                {formatRelationship(person.relationship)}
              </span>
            )}
          </div>
          <p className="text-sm text-charcoal/50 mt-1 font-medium">
            Mentioned {plural(person.total_count, "time")} · first{" "}
            {formatShortDate(person.first_mention)} · latest{" "}
            {formatShortDate(person.last_mention)}
          </p>
        </div>
      </div>

      {/* Timeline of entries */}
      {person.entries.length === 0 ? (
        <Card padding="lg" className="animate-scale-in">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-deep-sky/8 to-sky-blue/4 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-charcoal/20" />
            </div>
            <p className="text-charcoal/60 font-semibold tracking-tight">
              No entries to show
            </p>
            <p className="text-sm text-charcoal/40 mt-1 max-w-sm mx-auto">
              The journal entries mentioning {person.display_name} are no
              longer available.
            </p>
          </div>
        </Card>
      ) : (
        <div className="relative pl-6">
          {/* Vertical timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-charcoal/10" />

          <div className="space-y-6">
            {person.entries.map((entry, i) => (
              <div
                key={entry.response_id}
                className="relative animate-stagger-in"
                style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
              >
                {/* Timeline dot */}
                <div className="absolute -left-6 top-1 w-[15px] h-[15px] rounded-full bg-white border-2 border-deep-sky/40" />
                <h3 className="text-sm font-semibold text-charcoal/50 uppercase tracking-wider mb-2">
                  {formatEntryDate(entry.created_at)}
                </h3>
                <EntryCard entry={entry} name={person.display_name} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
