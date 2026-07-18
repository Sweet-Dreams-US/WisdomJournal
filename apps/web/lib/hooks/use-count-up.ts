"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 up to `value` on mount (~700ms, ease-out cubic)
 * using requestAnimationFrame, and returns the current display number.
 *
 * - SSR-safe: the initial render returns 0 on both server and client
 *   (no hydration mismatch); the animation only runs in an effect.
 * - Respects prefers-reduced-motion by jumping straight to `value`.
 * - If `value` changes later, animates from the currently displayed
 *   number to the new value.
 */
export function useCountUp(value: number, durationMs = 700): number {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    const from = displayRef.current;
    const delta = value - from;
    if (delta === 0) return;

    let frame: number;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const next = t >= 1 ? value : Math.round(from + delta * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return display;
}
