"use client";

import { useMemo, useState } from "react";
import { Download, Printer, BookMarked } from "lucide-react";

interface Response {
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
  bio: string | null;
  current_streak: number;
  longest_streak: number;
  total_responses: number;
  created_at: string;
}

interface CatRow {
  slug: string;
  name: string;
}

interface Props {
  profile: ProfileRow | null;
  responses: Response[];
  categories: CatRow[];
}

export default function MemorialClient({ profile, responses, categories }: Props) {
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Response[]>();
    const filtered = favoritesOnly ? responses.filter((r) => r.is_favorite) : responses;
    for (const r of filtered) {
      const cat = r.response_categories?.[0]?.category;
      const key = cat?.slug ?? "uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [responses, favoritesOnly]);

  const totalWords = useMemo(
    () => responses.reduce((s, r) => s + (r.word_count ?? 0), 0),
    [responses]
  );

  function printPage() {
    window.print();
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Someone";
  const joinYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : "";

  return (
    <div className="max-w-4xl mx-auto">
      <style jsx global>{`
        @media print {
          @page { margin: 0.8in; }
          .no-print { display: none !important; }
          body { background: white !important; color: #111 !important; }
          .memorial-entry { break-inside: avoid; page-break-inside: avoid; }
          .memorial-section { page-break-before: always; }
          .memorial-section:first-of-type { page-break-before: auto; }
        }
      `}</style>

      <header className="no-print flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-twilight flex items-center gap-2">
            <BookMarked className="w-5 h-5" /> Memorial book
          </h1>
          <p className="text-sm text-charcoal/60 mt-1">
            A printable book of your wisdom, organized by category. Use your browser&apos;s Save as PDF in the print dialog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-charcoal/70">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
            />
            Favorites only
          </label>
          <button
            onClick={printPage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-deep-sky text-white text-sm font-medium hover:bg-deep-sky/90"
          >
            <Printer className="w-4 h-4" />
            Print / save as PDF
          </button>
        </div>
      </header>

      {/* Book */}
      <article className="bg-white rounded-card border border-soft-gray p-10 print:border-0 print:rounded-none print:p-0">
        {/* Cover */}
        <section className="text-center py-16 border-b border-soft-gray">
          <div className="text-[9px] uppercase tracking-[0.4em] text-charcoal/50 mb-4">
            Wisdom Journal · Memorial Edition
          </div>
          <h1 className="text-5xl font-heading text-twilight">{firstName}</h1>
          {profile?.bio && (
            <p className="text-charcoal/70 mt-6 max-w-xl mx-auto italic leading-relaxed">
              {profile.bio}
            </p>
          )}
          <div className="mt-10 text-sm text-charcoal/60">
            {responses.length} entries · {totalWords.toLocaleString()} words
            {joinYear && ` · since ${joinYear}`}
          </div>
        </section>

        {categories.map((cat) => {
          const list = grouped.get(cat.slug);
          if (!list || list.length === 0) return null;
          return (
            <section key={cat.slug} className="memorial-section py-10 border-b border-soft-gray last:border-0">
              <h2 className="text-3xl font-heading text-twilight mb-6">{cat.name}</h2>
              <div className="space-y-8">
                {list.map((r) => (
                  <article key={r.id} className="memorial-entry">
                    <div className="text-xs text-charcoal/50 mb-1 flex items-center gap-2">
                      <span>
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {r.mood && <span>· {r.mood}</span>}
                      {r.is_favorite && <span>· ♥</span>}
                    </div>
                    <p className="text-charcoal leading-loose whitespace-pre-wrap">
                      {r.response_text}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {/* Uncategorized fallback */}
        {grouped.get("uncategorized") && (
          <section className="memorial-section py-10">
            <h2 className="text-3xl font-heading text-twilight mb-6">Other reflections</h2>
            <div className="space-y-8">
              {grouped.get("uncategorized")!.map((r) => (
                <article key={r.id} className="memorial-entry">
                  <div className="text-xs text-charcoal/50 mb-1">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  <p className="text-charcoal leading-loose whitespace-pre-wrap">
                    {r.response_text}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
