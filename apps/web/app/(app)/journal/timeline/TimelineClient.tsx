"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Heart } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";
import type { JournalResponse } from "@wisdom-journal/shared";

type Group = { month: string; label: string; items: JournalResponse[] };

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function TimelineClient({ responses }: { responses: JournalResponse[] }) {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, JournalResponse[]>();
    for (const r of responses) {
      const key = monthKey(r.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, items]) => ({ month, label: monthLabel(month), items }));
  }, [responses]);

  const [activeMonth, setActiveMonth] = useState<string | null>(groups[0]?.month ?? null);

  const totalWords = useMemo(
    () => responses.reduce((sum, r) => sum + (r.word_count ?? 0), 0),
    [responses]
  );

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-twilight">The timeline of your wisdom</h2>
          <p className="text-charcoal/60 text-sm mt-1">
            {responses.length} entries · {Intl.NumberFormat().format(totalWords)} words captured
          </p>
        </div>
        <Link
          href="/journal"
          className="text-sm text-deep-sky hover:underline inline-flex items-center gap-1"
        >
          List view <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {groups.length === 0 && (
        <Card padding="lg" className="text-center">
          <p className="text-charcoal/60">Nothing here yet. Answer your first question to begin your timeline.</p>
        </Card>
      )}

      <div className="flex gap-6">
        {/* Month rail */}
        <aside className="hidden md:flex flex-col gap-1 sticky top-24 self-start w-36 text-right">
          {groups.map((g) => (
            <button
              key={g.month}
              onClick={() => {
                setActiveMonth(g.month);
                const el = document.getElementById(`month-${g.month}`);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`px-3 py-1.5 rounded-button text-xs font-medium transition-colors ${
                activeMonth === g.month
                  ? "bg-deep-sky/10 text-deep-sky"
                  : "text-charcoal/50 hover:text-charcoal"
              }`}
            >
              {g.label} · {g.items.length}
            </button>
          ))}
        </aside>

        <div className="flex-1 relative">
          {/* Spine */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-deep-sky/30 via-soft-gray to-golden-hour/20" />
          <div className="space-y-10">
            {groups.map((g) => (
              <section key={g.month} id={`month-${g.month}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-deep-sky/10 border border-deep-sky/30 flex items-center justify-center text-xs font-bold text-deep-sky">
                    {g.items.length}
                  </span>
                  <h3 className="text-lg font-bold text-twilight">{g.label}</h3>
                </div>
                <ul className="space-y-3 pl-12 relative">
                  {g.items.map((r) => {
                    const d = new Date(r.created_at);
                    const dayLabel = d.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const cat = (r as any).categories?.[0]?.category;
                    return (
                      <li key={r.id} className="relative">
                        <span className="absolute -left-8 top-3 w-2 h-2 rounded-full bg-deep-sky ring-4 ring-cloud-white" />
                        <Link
                          href={`/journal/${r.id}`}
                          className="block p-4 rounded-card bg-white border border-soft-gray hover:border-deep-sky/30 hover:shadow-card transition-all"
                        >
                          <div className="flex items-center gap-2 text-xs text-charcoal/50 mb-1">
                            <span>{dayLabel}</span>
                            {cat && <CategoryBadge slug={cat.slug} name={cat.name} size="sm" />}
                            {r.mood && <span className="ml-auto">{r.mood}</span>}
                            {r.is_favorite && <Heart className="w-3.5 h-3.5 text-sunrise-coral fill-sunrise-coral ml-auto" />}
                          </div>
                          <p className="text-sm text-charcoal leading-relaxed line-clamp-3">
                            {r.response_text}
                          </p>
                          <div className="mt-2 text-[11px] text-charcoal/40">
                            {r.word_count} words
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
