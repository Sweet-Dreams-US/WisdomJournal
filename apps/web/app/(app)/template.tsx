"use client";

import type { ReactNode } from "react";

/**
 * Route-transition wrapper for the (app) group.
 *
 * Next.js remounts templates on every navigation by design, so the
 * entrance animation (280ms fade + 8px rise, defined as `route-enter`
 * in tailwind.config.ts) replays each time a new page renders.
 *
 * The keyframe ends at `transform: none` so this wrapper never remains
 * a containing block for fixed-position descendants (modals, etc.).
 * Reduced motion is handled globally in globals.css, which zeroes
 * animation durations under prefers-reduced-motion.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-route-enter">{children}</div>;
}
