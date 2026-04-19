"use client";

import { useState } from "react";

export const MOODS = [
  { id: "calm", emoji: "🌙", label: "Calm" },
  { id: "bright", emoji: "☀️", label: "Bright" },
  { id: "heavy", emoji: "🌧️", label: "Heavy" },
  { id: "curious", emoji: "🌱", label: "Curious" },
  { id: "grateful", emoji: "✨", label: "Grateful" },
  { id: "restless", emoji: "🌊", label: "Restless" },
  { id: "tender", emoji: "🕊️", label: "Tender" },
] as const;

export type MoodId = typeof MOODS[number]["id"];

interface Props {
  value: MoodId | null;
  onChange: (next: MoodId | null) => void;
  compact?: boolean;
}

export default function MoodSelector({ value, onChange, compact = false }: Props) {
  return (
    <div className="flex flex-wrap gap-2 items-center" role="radiogroup" aria-label="Mood">
      {!compact && (
        <span className="text-xs text-charcoal/60 mr-1 uppercase tracking-wide">Mood</span>
      )}
      {MOODS.map((m) => {
        const active = value === m.id;
        return (
          <button
            key={m.id}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => onChange(active ? null : m.id)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-150
              ${
                active
                  ? "bg-deep-sky/15 text-deep-sky ring-1 ring-deep-sky/30 scale-[1.03]"
                  : "bg-soft-gray/70 text-charcoal/60 hover:bg-soft-gray hover:text-charcoal"
              }
            `}
          >
            <span className="text-base leading-none">{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
