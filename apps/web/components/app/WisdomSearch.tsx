"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { MOODS } from "@/components/ui/MoodSelector";

interface SearchResult {
  response_id: string;
  excerpt: string;
  created_at: string;
  category_slug?: string | null;
  category_name?: string | null;
  mood?: string | null;
  rank?: number;
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

function highlightExcerpt(excerpt: string, query: string): Array<string | { hit: string }> {
  const plain = stripHtml(excerpt);
  if (!query.trim()) return [plain];
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (terms.length === 0) return [plain];
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = plain.split(pattern);
  return parts.map((p, i) => (i % 2 === 1 ? { hit: p } : p));
}

export default function WisdomSearch({ autoFocus }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRun = useRef(0);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const now = Date.now();
    const runAt = now + 220;
    lastRun.current = runAt;
    const t = window.setTimeout(async () => {
      if (lastRun.current !== runAt) return;
      if (!q.trim() && !category && !mood) {
        setResults([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (category) params.set("category", category);
      if (mood) params.set("mood", mood);
      try {
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 240);
    return () => window.clearTimeout(t);
  }, [q, category, mood]);

  function clear() {
    setQ("");
    setCategory(null);
    setMood(null);
    inputRef.current?.focus();
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your wisdom..."
          className="w-full pl-10 pr-10 py-3 rounded-button bg-white border border-soft-gray focus:border-deep-sky focus:outline-none text-sm"
        />
        {(q || category || mood) && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-soft-gray"
            aria-label="Clear"
          >
            <X className="w-3.5 h-3.5 text-charcoal/45" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-charcoal/40">Mood:</span>
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMood(mood === m.id ? null : m.id)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              mood === m.id
                ? "bg-deep-sky/15 text-deep-sky ring-1 ring-deep-sky/30"
                : "bg-soft-gray/60 text-charcoal/55 hover:bg-soft-gray"
            }`}
          >
            <span className="mr-1">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-charcoal/55">
            <Loader2 className="w-4 h-4 animate-spin" /> searching…
          </div>
        )}
        {!loading && results.length === 0 && (q || category || mood) && (
          <p className="text-sm text-charcoal/45 italic">No matching entries.</p>
        )}
        <ul className="space-y-2">
          {results.map((r) => {
            const segments = highlightExcerpt(r.excerpt, q);
            return (
              <li key={r.response_id}>
                <Link
                  href={`/journal/${r.response_id}`}
                  className="block p-4 rounded-card bg-white border border-soft-gray hover:border-deep-sky/40 hover:shadow-card transition-all"
                >
                  <div className="flex items-center gap-2 mb-1 text-xs text-charcoal/50">
                    <span>
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {r.category_name && (
                      <>
                        <span>·</span>
                        <span>{r.category_name}</span>
                      </>
                    )}
                    {r.mood && <span className="ml-auto">{r.mood}</span>}
                  </div>
                  <p className="text-sm text-charcoal leading-relaxed">
                    {segments.map((seg, i) =>
                      typeof seg === "string" ? (
                        <span key={i}>{seg}</span>
                      ) : (
                        <mark key={i} className="bg-golden-hour/25 text-charcoal rounded px-0.5">
                          {seg.hit}
                        </mark>
                      )
                    )}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
