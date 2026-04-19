"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles, Moon } from "lucide-react";

interface StreakState {
  current_streak: number;
  longest_streak: number;
  unused_tokens: number;
  grace_active: boolean;
  display: { label: string; tone: "ember" | "rest" | "flame"; tooltip?: string };
}

export default function StreakEmber() {
  const [state, setState] = useState<StreakState | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/streak/state")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (active && s) setState(s);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  if (!state) return null;

  const { display, unused_tokens } = state;
  const Icon = display.tone === "ember" ? Sparkles : display.tone === "rest" ? Moon : Flame;

  const colorTone =
    display.tone === "ember"
      ? "text-golden-hour"
      : display.tone === "rest"
        ? "text-deep-sky"
        : "text-golden-hour";

  return (
    <div
      className="px-4 py-3 border-b border-soft-gray"
      title={display.tooltip ?? `Longest: ${state.longest_streak} days`}
    >
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorTone}`}>
        <Icon className="w-3.5 h-3.5" />
        {display.label}
      </span>
      {unused_tokens > 0 && display.tone !== "ember" && (
        <span className="ml-2 text-[10px] text-charcoal/45">{unused_tokens} grace ready</span>
      )}
    </div>
  );
}
