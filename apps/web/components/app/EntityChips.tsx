"use client";

import Link from "next/link";
import { User, MapPin, Calendar } from "lucide-react";
import { useMemo } from "react";

interface Entity {
  text: string;
  kind: "person" | "place" | "date";
}

/**
 * Lightweight client-side entity extraction — regex-based, zero-cost, imperfect
 * but useful. Catches Title-Cased names, "in <Place>" phrases, and common date
 * patterns. We intentionally do NOT call an LLM for this on every view.
 */
function extractEntities(text: string): Entity[] {
  if (!text) return [];
  const entities: Entity[] = [];
  const seen = new Set<string>();

  const commonStops = new Set([
    "I", "The", "A", "An", "My", "Your", "His", "Her", "Their",
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
  ]);

  // Title-cased sequences of 1-3 words (likely people/places)
  const nameMatches = [...text.matchAll(/\b([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,}){0,2})\b/g)];
  for (const m of nameMatches) {
    const cand = m[1];
    if (commonStops.has(cand)) continue;
    if (cand.length < 3) continue;
    const key = `p:${cand.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entities.push({ text: cand, kind: "person" });
  }

  // "in <Place>" / "at <Place>" / "from <Place>" / "to <Place>"
  const placeMatches = [...text.matchAll(/\b(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g)];
  for (const m of placeMatches) {
    const cand = m[1];
    const key = `pl:${cand.toLowerCase()}`;
    if (seen.has(key)) continue;
    const personIdx = entities.findIndex(
      (e) => e.kind === "person" && e.text.toLowerCase() === cand.toLowerCase()
    );
    if (personIdx >= 0) entities.splice(personIdx, 1);
    seen.add(key);
    entities.push({ text: cand, kind: "place" });
  }

  // Common date patterns
  const dateMatches = [...text.matchAll(
    /\b(\d{4}|January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{1,2}(?:,\s*\d{4})?)?\b/g
  )];
  for (const m of dateMatches) {
    const cand = m[0];
    const key = `d:${cand.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entities.push({ text: cand, kind: "date" });
  }

  return entities.slice(0, 14);
}

interface Props {
  text: string | null | undefined;
}

export default function EntityChips({ text }: Props) {
  const entities = useMemo(() => extractEntities(text ?? ""), [text]);

  if (entities.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-soft-gray">
      <p className="text-xs font-medium text-charcoal/50 mb-2">
        Referenced in this entry
      </p>
      <div className="flex flex-wrap gap-1.5">
        {entities.map((e, i) => {
          const Icon = e.kind === "person" ? User : e.kind === "place" ? MapPin : Calendar;
          const tone =
            e.kind === "person"
              ? "bg-deep-sky/10 text-deep-sky hover:bg-deep-sky/20"
              : e.kind === "place"
                ? "bg-golden-hour/10 text-golden-hour hover:bg-golden-hour/20"
                : "bg-sunrise-coral/10 text-sunrise-coral hover:bg-sunrise-coral/20";
          return (
            <Link
              key={`${e.kind}-${e.text}-${i}`}
              href={`/journal?q=${encodeURIComponent(e.text)}`}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${tone}`}
            >
              <Icon className="w-3 h-3" />
              {e.text}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
