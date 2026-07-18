"use client";

import { useEffect, useState } from "react";
import type { GrowthPoint } from "@/lib/data/get-growth-stats";

/**
 * Cumulative words area chart — a single rising line that makes the
 * archive's accumulation felt. Custom inline SVG, no chart libraries.
 * The line draws in over ~1s (stroke-dashoffset), the gradient fill
 * fades up beneath it, and the final point pulses softly golden-hour
 * with the running total in Fraunces beside it.
 */

const W = 800;
const H = 230;
const PAD_T = 34;
const PAD_B = 28;
const PAD_L = 8;
const PAD_R = 22;
const BASE_Y = H - PAD_B;
const INNER_H = BASE_Y - PAD_T;
const INNER_W = W - PAD_L - PAD_R;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse a local YYYY-MM-DD key without the UTC-midnight shift. */
function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface XY {
  x: number;
  y: number;
}

/** Smooth monotone-safe path: cubic segments with midpoint controls. */
function smoothPath(pts: XY[]): string {
  if (pts.length === 0) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cx = ((p0.x + p1.x) / 2).toFixed(2);
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

interface Props {
  points: GrowthPoint[];
}

export default function GrowthChart({ points }: Props) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 120);
    return () => clearTimeout(timer);
  }, []);

  // ── Empty and single-point states: warmth instead of a bare chart ──
  if (points.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-heading text-lg text-twilight">
          Your curve begins with a single word.
        </p>
        <p className="text-sm text-charcoal/45 font-body mt-2 max-w-sm mx-auto leading-relaxed">
          Answer today&apos;s question and this space becomes a rising line —
          every entry lifting it a little higher.
        </p>
      </div>
    );
  }

  if (points.length === 1) {
    const only = points[0];
    return (
      <div className="py-10 text-center">
        <p className="font-heading text-3xl text-twilight">
          {only.totalWords.toLocaleString()}
          <span className="text-base text-charcoal/40 ml-2">words kept</span>
        </p>
        <p className="text-sm text-charcoal/45 font-body mt-2 max-w-sm mx-auto leading-relaxed">
          One day on the page, {formatDate(only.dateKey)}. Your growth curve
          takes shape with your next entry.
        </p>
      </div>
    );
  }

  // ── Scales: time on x, cumulative words on y ──
  const firstDay = parseDateKey(points[0].dateKey).getTime();
  const lastDay = parseDateKey(points[points.length - 1].dateKey).getTime();
  const spanDays = Math.max(Math.round((lastDay - firstDay) / DAY_MS), 1);

  const lastPoint = points[points.length - 1];
  const maxWords = Math.max(lastPoint.totalWords, 1);

  const pts: XY[] = points.map((p) => {
    const days = Math.round((parseDateKey(p.dateKey).getTime() - firstDay) / DAY_MS);
    return {
      x: Number((PAD_L + (days / spanDays) * INNER_W).toFixed(2)),
      y: Number((BASE_Y - (p.totalWords / maxWords) * INNER_H).toFixed(2)),
    };
  });

  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${BASE_Y} L ${pts[0].x} ${BASE_Y} Z`;
  const end = pts[pts.length - 1];

  // Label sits just left of the final point, vertically centered on it.
  const labelTopPct = (end.y / H) * 100;
  const labelRightPct = 100 - (end.x / W) * 100;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block"
        role="img"
        aria-labelledby="growth-chart-title"
      >
        <title id="growth-chart-title">
          {`Cumulative words written over time: ${lastPoint.totalWords.toLocaleString()} words across ${lastPoint.totalEntries.toLocaleString()} entries since ${formatDate(points[0].dateKey)}`}
        </title>

        <defs>
          <linearGradient id="growth-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A90D9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4A90D9" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Whisper-quiet gridlines */}
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={BASE_Y - INNER_H * f}
            y2={BASE_Y - INNER_H * f}
            stroke="#2D3748"
            strokeOpacity="0.05"
            strokeWidth="1"
          />
        ))}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={BASE_Y}
          y2={BASE_Y}
          stroke="#2D3748"
          strokeOpacity="0.1"
          strokeWidth="1"
        />

        {/* Gradient fill fades up after the line begins drawing */}
        <path
          d={areaPath}
          fill="url(#growth-area-fill)"
          style={{
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.8s ease-out 0.35s",
          }}
        />

        {/* The line itself — 1s draw-in via normalized dashoffset */}
        <path
          d={linePath}
          fill="none"
          stroke="#4A90D9"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={drawn ? 0 : 1}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Final point: soft golden-hour pulse once the line arrives */}
        <g
          style={{
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.5s ease-out 0.85s",
          }}
        >
          <circle
            cx={end.x}
            cy={end.y}
            r={9}
            fill="rgba(245, 166, 35, 0.28)"
            className="animate-breathe"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <circle
            cx={end.x}
            cy={end.y}
            r={4.5}
            fill="#F5A623"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </g>

        {/* X labels: first + last date only */}
        <text
          x={PAD_L}
          y={H - 8}
          fontSize="12"
          fill="#2D3748"
          fillOpacity="0.4"
          className="font-body"
        >
          {formatDate(points[0].dateKey)}
        </text>
        <text
          x={W - PAD_R}
          y={H - 8}
          textAnchor="end"
          fontSize="12"
          fill="#2D3748"
          fillOpacity="0.4"
          className="font-body"
        >
          {formatDate(lastPoint.dateKey)}
        </text>
      </svg>

      {/* Running total in Fraunces, beside the final point */}
      <div
        className="absolute whitespace-nowrap text-right pointer-events-none"
        style={{
          top: `${labelTopPct}%`,
          right: `calc(${labelRightPct}% + 22px)`,
          transform: "translateY(-50%)",
          opacity: drawn ? 1 : 0,
          transition: "opacity 0.6s ease-out 0.9s",
        }}
      >
        <span className="font-heading text-xl sm:text-2xl text-twilight leading-none">
          {lastPoint.totalWords.toLocaleString()}
        </span>
        <span className="text-[11px] sm:text-xs text-charcoal/45 font-body ml-1.5">
          words kept
        </span>
      </div>
    </div>
  );
}
