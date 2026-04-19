"use client";

import { useEffect, useRef, useState } from "react";
import { SkipForward } from "lucide-react";

interface Props {
  durationSeconds?: number;
  contextLine?: string | null;
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * A 7-second framing ritual shown before answering.
 *
 * Design decision (change freely): breath-led, silent, with one contextual line
 * only when non-trivially meaningful. We do NOT play sound by default — an app
 * that makes noise without permission feels invasive. Ambient sound is a toggle
 * in ritual preferences, not the default.
 */
const PHASES = [
  { label: "Settle", seconds: 2, scale: 1, breath: "in" as const },
  { label: "Breathe in", seconds: 3, scale: 1.15, breath: "in" as const },
  { label: "Hold", seconds: 1, scale: 1.2, breath: "hold" as const },
  { label: "Breathe out", seconds: 3, scale: 1, breath: "out" as const },
  { label: "Begin", seconds: 1, scale: 1.05, breath: "hold" as const },
];

export default function ReflectionRitual({ contextLine, onComplete, onSkip }: Props) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const totalStart = useRef(Date.now());

  useEffect(() => {
    if (phaseIdx >= PHASES.length) {
      setFading(true);
      const t = window.setTimeout(() => onComplete(), 400);
      return () => window.clearTimeout(t);
    }
    const current = PHASES[phaseIdx];
    const t = window.setTimeout(() => setPhaseIdx((i) => i + 1), current.seconds * 1000);
    return () => window.clearTimeout(t);
  }, [phaseIdx, onComplete]);

  // Escape / tap to skip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onSkip?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSkip]);

  const current = PHASES[Math.min(phaseIdx, PHASES.length - 1)];
  const elapsed = (Date.now() - totalStart.current) / 1000;
  const totalSeconds = PHASES.reduce((s, p) => s + p.seconds, 0);
  const progress = Math.min(1, elapsed / totalSeconds);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(74,144,217,0.22) 0%, rgba(10,14,26,0.96) 60%)",
        backdropFilter: "blur(12px)",
      }}
      onClick={() => onSkip?.()}
      role="dialog"
      aria-label="Reflection ritual"
    >
      {/* Breathing circle */}
      <div className="relative w-48 h-48 mb-10">
        <div
          className="absolute inset-0 rounded-full transition-transform ease-in-out"
          style={{
            transform: `scale(${current.scale})`,
            transitionDuration: `${current.seconds}s`,
            background:
              "radial-gradient(circle at 50% 40%, #F5A623 0%, rgba(245,166,35,0.35) 35%, rgba(74,144,217,0.25) 70%, rgba(124,185,232,0) 100%)",
            boxShadow: "0 0 80px rgba(245,166,35,0.35), 0 0 160px rgba(74,144,217,0.25)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-stardust/90 text-sm tracking-widest uppercase">
            {current.label}
          </span>
        </div>
      </div>

      {contextLine && (
        <p className="text-stardust/80 text-base max-w-md text-center px-6 italic">
          {contextLine}
        </p>
      )}

      <div className="absolute bottom-12 flex flex-col items-center gap-4">
        <div className="w-40 h-0.5 bg-stardust/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-stardust/60 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSkip?.();
          }}
          className="inline-flex items-center gap-1.5 text-stardust/55 hover:text-stardust text-xs tracking-wide"
        >
          <SkipForward className="w-3.5 h-3.5" />
          skip
        </button>
      </div>
    </div>
  );
}
