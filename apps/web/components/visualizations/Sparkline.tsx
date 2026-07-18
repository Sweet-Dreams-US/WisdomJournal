"use client";

import { useId } from "react";

interface SparklineProps {
  /** Series values, oldest -> newest (typically 30 points). */
  data: number[];
  /** Line/fill color. Defaults to deep-sky. */
  color?: string;
  /** Rendered height in px. Width is always 100% of the container. */
  height?: number;
  /** Accessible description for the chart. */
  label?: string;
  className?: string;
}

const VIEW_W = 100;

/**
 * A small, dependency-free sparkline: 1.5px line with a soft gradient
 * area fill, drawn in with a CSS stroke animation. All-zero series
 * renders a muted flat baseline instead of pretending there is signal.
 *
 * prefers-reduced-motion is handled globally (globals.css zeroes
 * animation durations), so the draw-in collapses to a static render.
 */
export default function Sparkline({
  data,
  color = "#4A90D9",
  height = 36,
  label = "Activity over time",
  className = "",
}: SparklineProps) {
  const gradientId = useId();

  const padTop = 3;
  const padBottom = 2.5;
  const max = data.length > 0 ? Math.max(...data) : 0;
  const isFlat = max === 0;
  const baselineY = height - padBottom;

  const toY = (value: number) =>
    isFlat
      ? baselineY
      : padTop + (1 - value / max) * (height - padTop - padBottom);

  const points =
    data.length === 1
      ? [
          { x: 0, y: toY(data[0]) },
          { x: VIEW_W, y: toY(data[0]) },
        ]
      : data.map((value, i) => ({
          x: (i / (data.length - 1)) * VIEW_W,
          y: toY(value),
        }));

  if (points.length === 0) return null;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${VIEW_W} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={`block w-full ${className}`}
      style={{ height: `${height}px` }}
    >
      <title>{label}</title>
      <style>{`
        @keyframes sparkline-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes sparkline-reveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      {!isFlat && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
            style={{
              opacity: 0,
              animation: "sparkline-reveal 0.7s ease-out 0.75s forwards",
            }}
          />
        </>
      )}
      <path
        d={linePath}
        fill="none"
        stroke={isFlat ? "#9BA3AF" : color}
        strokeOpacity={isFlat ? 0.45 : 1}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation:
            "sparkline-draw 1.1s cubic-bezier(0.4, 0, 0.2, 1) 0.15s forwards",
        }}
      />
    </svg>
  );
}
