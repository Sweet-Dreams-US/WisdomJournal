"use client";

import { useEffect, useState } from "react";

const REACTIONS = ["❤️", "✨", "🫂", "🌱", "🕯️", "🙏"];

interface Reaction {
  id: string;
  user_id: string;
  emoji: string;
  profiles?: { full_name?: string | null; avatar_url?: string | null };
}

export default function ResponseReactions({
  responseId,
  currentUserId,
}: {
  responseId: string;
  currentUserId: string;
}) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/responses/${responseId}/reactions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setReactions(d?.reactions ?? []))
      .catch(() => null);
  }, [responseId]);

  async function toggle(emoji: string) {
    if (busy) return;
    setBusy(emoji);
    try {
      const res = await fetch(`/api/responses/${responseId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (data.toggled === "added") {
        setReactions((prev) => [...prev, { id: `local-${Date.now()}`, user_id: currentUserId, emoji }]);
      } else if (data.toggled === "removed") {
        setReactions((prev) => prev.filter((r) => !(r.user_id === currentUserId && r.emoji === emoji)));
      }
    } finally {
      setBusy(null);
    }
  }

  const grouped = new Map<string, Reaction[]>();
  for (const r of reactions) {
    if (!grouped.has(r.emoji)) grouped.set(r.emoji, []);
    grouped.get(r.emoji)!.push(r);
  }

  return (
    <div className="mt-4 pt-4 border-t border-soft-gray">
      <div className="flex flex-wrap gap-2 items-center">
        {[...grouped.entries()].map(([emoji, list]) => {
          const mine = list.some((l) => l.user_id === currentUserId);
          const names = list
            .map((l) => l.profiles?.full_name ?? "Someone")
            .slice(0, 3)
            .join(", ");
          return (
            <button
              key={emoji}
              onClick={() => toggle(emoji)}
              title={names + (list.length > 3 ? ` +${list.length - 3}` : "")}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
                mine
                  ? "bg-deep-sky/15 ring-1 ring-deep-sky/30"
                  : "bg-soft-gray/70 hover:bg-soft-gray"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-xs text-charcoal/70">{list.length}</span>
            </button>
          );
        })}

        <div className="h-6 w-px bg-soft-gray mx-1" />

        {REACTIONS.filter((e) => !grouped.has(e)).map((emoji) => (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={busy === emoji}
            className="text-sm px-2 py-1 rounded-full hover:bg-soft-gray text-charcoal/40 hover:text-charcoal transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
