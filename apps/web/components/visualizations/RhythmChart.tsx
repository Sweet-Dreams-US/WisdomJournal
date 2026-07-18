"use client";

import { useEffect, useState } from "react";
import type { WeekdayCount, WeekdayLabel } from "@/lib/data/get-growth-stats";

/**
 * "Your rhythm" — seven vertical bars, entries by weekday. Custom
 * inline SVG. Bars rise from the baseline with a staggered scaleY
 * draw-in; the strongest day glows golden-hour with a one-line caption
 * ("Sundays are your writing day").
 */

const W = 560;
const H = 210;
const PAD_T = 30; // room for count labels
const PAD_B = 26; // room for weekday labels
const PAD_X = 10;
const BASE_Y = H - PAD_B;
const INNER_H = BASE_Y - PAD_T;
const SLOT_W = (W - PAD_X * 2) / 7;
const BAR_W = 40;

const PLURAL: Record<WeekdayLabel, string> = {
  Sun: "Sundays",
  Mon: "Mondays",
  Tue: "Tuesdays",
  Wed: "Wednesdays",
  Thu: "Thursdays",
  Fri: "Fridays",
  Sat: "Saturdays",
};

interface Props {
  byWeekday: WeekdayCount[];
}

export default function RhythmChart({ byWeekday }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const total = byWeekday.reduce((sum, d) => sum + d.count, 0);

  if (byWeekday.length === 0 || total === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-heading text-lg text-twilight">
          Your rhythm hasn&apos;t started yet.
        </p>
        <p className="text-sm text-charcoal/45 font-body mt-2 max-w-sm mx-auto leading-relaxed">
          After a few entries, you&apos;ll see which days of the week your
          writing naturally gathers on.
        </p>
      </div>
    );
  }

  const max = Math.max(...byWeekday.map((d) => d.count), 1);
  const strongest = byWeekday.filter((d) => d.count === max);
  const hasSingleStrongest = strongest.length === 1;
  const caption = hasSingleStrongest
    ? `${PLURAL[strongest[0].weekday]} are your writing day.`
    : "Your writing is spread evenly across the week.";

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block max-w-xl mx-auto"
        role="img"
        aria-labelledby="rhythm-chart-title"
      >
        <title id="rhythm-chart-title">
          {`Entries by day of the week: ${byWeekday
            .map((d) => `${d.weekday} ${d.count}`)
            .join(", ")}`}
        </title>

        {/* Baseline */}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={BASE_Y}
          y2={BASE_Y}
          stroke="#2D3748"
          strokeOpacity="0.1"
          strokeWidth="1"
        />

        {byWeekday.map((d, i) => {
          const isStrongest = hasSingleStrongest && d.count === max;
          const barH =
            d.count > 0 ? Math.max((d.count / max) * INNER_H, 6) : 4;
          const x = PAD_X + i * SLOT_W + (SLOT_W - BAR_W) / 2;
          const y = BASE_Y - barH;
          const cx = PAD_X + i * SLOT_W + SLOT_W / 2;

          return (
            <g key={d.weekday}>
              {/* Bar: staggered scaleY rise from the baseline */}
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={Math.min(8, barH / 2)}
                fill={isStrongest ? "#F5A623" : "#4A90D9"}
                fillOpacity={
                  d.count === 0 ? 0.15 : isStrongest ? 0.9 : 0.55
                }
                style={{
                  transform: mounted ? "scaleY(1)" : "scaleY(0)",
                  transformBox: "fill-box",
                  transformOrigin: "bottom",
                  transition: `transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1) ${(
                    i * 0.07
                  ).toFixed(2)}s`,
                }}
              />

              {/* Count above the bar, Fraunces */}
              <text
                x={cx}
                y={y - 9}
                textAnchor="middle"
                fontSize="15"
                className="font-heading"
                fill={isStrongest ? "#F5A623" : "#2C3E6B"}
                fillOpacity={d.count === 0 ? 0.3 : 0.9}
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: `opacity 0.4s ease-out ${(0.35 + i * 0.07).toFixed(2)}s`,
                }}
              >
                {d.count}
              </text>

              {/* Weekday label */}
              <text
                x={cx}
                y={H - 8}
                textAnchor="middle"
                fontSize="12"
                className="font-body"
                fill="#2D3748"
                fillOpacity={isStrongest ? 0.7 : 0.4}
                fontWeight={isStrongest ? 600 : 400}
              >
                {d.weekday}
              </text>
            </g>
          );
        })}
      </svg>

      <p
        className="text-xs text-charcoal/45 font-body text-center mt-3"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease-out 0.9s",
        }}
      >
        {hasSingleStrongest && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-golden-hour mr-1.5 align-middle"
            aria-hidden="true"
          />
        )}
        {caption}
      </p>
    </div>
  );
}
