"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2, Loader2 } from "lucide-react";

interface Related {
  response_id: string;
  excerpt: string;
  created_at: string;
  category_name?: string | null;
  similarity?: number | null;
}

export default function RelatedResponses({ responseId }: { responseId: string }) {
  const [items, setItems] = useState<Related[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/responses/${responseId}/related`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setItems(d?.related ?? []))
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [responseId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-charcoal/45 py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> finding echoes…
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-deep-sky" />
        <span className="text-sm font-medium text-charcoal">Echoes of this in your past entries</span>
      </div>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.response_id}>
            <Link
              href={`/journal/${r.response_id}`}
              className="block p-3 rounded-card bg-white border border-soft-gray hover:border-deep-sky/40 hover:shadow-card transition-all"
            >
              <div className="flex items-center gap-2 text-[11px] text-charcoal/50 mb-1">
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
                {typeof r.similarity === "number" && (
                  <span className="ml-auto text-[10px] text-deep-sky">
                    {Math.round(r.similarity * 100)}% match
                  </span>
                )}
              </div>
              <p className="text-sm text-charcoal line-clamp-2">{r.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
