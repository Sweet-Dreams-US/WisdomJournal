"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Calendar, BookOpen, Heart, Sparkles, Users, TrendingUp, Quote } from "lucide-react";
import Card from "@/components/ui/Card";

interface ResponseRow {
  id: string;
  response_text: string | null;
  created_at: string;
  mood: string | null;
  word_count: number;
  is_favorite: boolean;
  response_categories: any;
}

interface ProfileRow {
  full_name: string | null;
  current_streak: number;
  longest_streak: number;
}

interface Props {
  year: number;
  responses: ResponseRow[];
  profile: ProfileRow | null;
}

function extractPeople(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  const stops = new Set(["I","The","A","An","My","Your","His","Her","Their","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]);
  const matches = text.matchAll(/\b([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,}){0,2})\b/g);
  for (const m of matches) {
    const name = m[1];
    if (stops.has(name) || name.length < 3) continue;
    out.push(name);
  }
  return out;
}

export default function ReviewClient({ year, responses, profile }: Props) {
  const stats = useMemo(() => {
    const totalWords = responses.reduce((s, r) => s + (r.word_count ?? 0), 0);
    const daysWithEntry = new Set(responses.map((r) => r.created_at.slice(0, 10))).size;

    const catMap = new Map<string, { name: string; slug: string; count: number }>();
    const moodMap = new Map<string, number>();
    const peopleMap = new Map<string, number>();
    const monthMap = new Map<number, number>();

    for (const r of responses) {
      const cat = r.response_categories?.[0]?.category;
      if (cat) {
        const existing = catMap.get(cat.slug) ?? { name: cat.name, slug: cat.slug, count: 0 };
        existing.count += 1;
        catMap.set(cat.slug, existing);
      }
      if (r.mood) moodMap.set(r.mood, (moodMap.get(r.mood) ?? 0) + 1);
      for (const p of extractPeople(r.response_text ?? "")) {
        peopleMap.set(p, (peopleMap.get(p) ?? 0) + 1);
      }
      const m = new Date(r.created_at).getMonth();
      monthMap.set(m, (monthMap.get(m) ?? 0) + 1);
    }

    const favorites = responses.filter((r) => r.is_favorite).slice(0, 5);
    const topCategories = [...catMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);
    const topMoods = [...moodMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topPeople = [...peopleMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const longest = [...responses].sort((a, b) => (b.word_count ?? 0) - (a.word_count ?? 0))[0];

    const heatmap = Array.from({ length: 12 }, (_, i) => monthMap.get(i) ?? 0);
    const maxMonth = Math.max(1, ...heatmap);

    return { totalWords, daysWithEntry, topCategories, topMoods, topPeople, favorites, longest, heatmap, maxMonth };
  }, [responses]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "friend";

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <Link href="/encyclopedia" className="text-sm text-charcoal/55 hover:text-charcoal">
          ← Encyclopedia
        </Link>
        <h1 className="text-3xl font-bold text-twilight mt-3 font-heading">
          {year} in review
        </h1>
        <p className="text-charcoal/60 mt-1">
          {firstName}, here is the shape of your wisdom this year.
        </p>
      </header>

      {responses.length === 0 && (
        <Card padding="lg" className="text-center">
          <p className="text-charcoal/60">No entries yet for {year}.</p>
        </Card>
      )}

      {responses.length > 0 && (
        <>
          {/* Top-level stats */}
          <div className="grid sm:grid-cols-4 gap-3 mb-8">
            <StatTile icon={<BookOpen className="w-4 h-4" />} value={responses.length} label="Entries" />
            <StatTile icon={<TrendingUp className="w-4 h-4" />} value={stats.totalWords.toLocaleString()} label="Words" />
            <StatTile icon={<Calendar className="w-4 h-4" />} value={stats.daysWithEntry} label="Days written" />
            <StatTile icon={<Sparkles className="w-4 h-4" />} value={profile?.longest_streak ?? 0} label="Longest streak" />
          </div>

          {/* Monthly heatmap */}
          <Card padding="md" className="mb-6">
            <p className="text-sm font-medium text-charcoal/60 mb-3">Rhythm through the year</p>
            <div className="grid grid-cols-12 gap-1.5 items-end">
              {stats.heatmap.map((count, i) => {
                const h = Math.max(4, Math.round((count / stats.maxMonth) * 60));
                const mLabel = new Date(year, i, 1).toLocaleDateString("en-US", { month: "short" });
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded bg-gradient-to-t from-deep-sky/70 to-deep-sky/30"
                      style={{ height: `${h}px` }}
                      title={`${count} entries`}
                    />
                    <span className="text-[10px] text-charcoal/50">{mLabel[0]}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card padding="md">
              <p className="text-sm font-medium text-charcoal/60 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-golden-hour" /> Top categories
              </p>
              <ul className="space-y-2">
                {stats.topCategories.map((c) => (
                  <li key={c.slug} className="flex items-center justify-between text-sm">
                    <span className="text-charcoal">{c.name}</span>
                    <span className="text-charcoal/55">{c.count}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card padding="md">
              <p className="text-sm font-medium text-charcoal/60 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-deep-sky" /> Most mentioned people
              </p>
              {stats.topPeople.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topPeople.map(([name, count]) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-deep-sky/10 text-xs text-deep-sky"
                    >
                      {name} · {count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-charcoal/40 italic">No names detected yet.</p>
              )}
            </Card>

            <Card padding="md">
              <p className="text-sm font-medium text-charcoal/60 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-sunrise-coral" /> Moods this year
              </p>
              {stats.topMoods.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topMoods.map(([mood, count]) => (
                    <span
                      key={mood}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sunrise-coral/10 text-xs text-sunrise-coral"
                    >
                      {mood} · {count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-charcoal/40 italic">No moods tagged yet.</p>
              )}
            </Card>

            {stats.longest && (
              <Card padding="md">
                <p className="text-sm font-medium text-charcoal/60 mb-3 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-deep-sky" /> Your longest reflection
                </p>
                <Link
                  href={`/journal/${stats.longest.id}`}
                  className="block text-sm text-charcoal leading-relaxed italic line-clamp-5 hover:text-deep-sky"
                >
                  &ldquo;{(stats.longest.response_text ?? "").slice(0, 320)}…&rdquo;
                </Link>
                <p className="text-[11px] text-charcoal/45 mt-2">
                  {stats.longest.word_count} words ·{" "}
                  {new Date(stats.longest.created_at).toLocaleDateString()}
                </p>
              </Card>
            )}
          </div>

          {stats.favorites.length > 0 && (
            <Card padding="md">
              <p className="text-sm font-medium text-charcoal/60 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-sunrise-coral fill-sunrise-coral" /> Your favorites
              </p>
              <ul className="space-y-2">
                {stats.favorites.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/journal/${f.id}`}
                      className="block text-sm text-charcoal/90 leading-relaxed line-clamp-2 hover:text-deep-sky"
                    >
                      {f.response_text}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-card bg-white border border-soft-gray p-4">
      <div className="flex items-center gap-2 text-charcoal/55 text-xs uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-twilight mt-1">{value}</div>
    </div>
  );
}
