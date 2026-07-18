import { plural } from "@/lib/utils/plural";
import type { DayActivity } from "@/lib/data/get-week-activity";

interface WeekStripProps {
  days: DayActivity[];
}

const MIN_BAR = 4;
const MAX_BAR = 28;

/** "2026-07-18" -> "S"/"M"/... parsed as a LOCAL date (never new Date(key)). */
function dayInitial(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
}

/**
 * Compact 7-day momentum strip for the dashboard greeting area.
 * Bars grow with entry count; today glows golden-hour. Pure CSS
 * scaleY entrance (covered by the global reduced-motion rule).
 */
export default function WeekStrip({ days }: WeekStripProps) {
  if (days.length === 0) return null;

  const total = days.reduce((sum, d) => sum + d.count, 0);
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div
      role="img"
      aria-label={`${plural(total, "entry", "entries")} in the last 7 days`}
      className="flex flex-col items-start sm:items-end shrink-0"
    >
      <style>{`
        @keyframes wj-bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>

      <div className="flex items-end gap-1.5" style={{ height: MAX_BAR }}>
        {days.map((day, i) => {
          const height =
            day.count === 0
              ? MIN_BAR
              : Math.round(
                  MIN_BAR + (day.count / maxCount) * (MAX_BAR - MIN_BAR)
                );
          // Non-today bars deepen from deep-sky/30 toward deep-sky by intensity.
          const intensity =
            day.count === 0 ? 0.15 : 0.3 + 0.7 * (day.count / maxCount);

          return (
            <div
              key={day.dateKey}
              className="w-2 rounded-full"
              style={{
                height,
                background: day.isToday
                  ? "#F5A623"
                  : `rgba(74, 144, 217, ${intensity.toFixed(2)})`,
                boxShadow: day.isToday
                  ? "0 0 10px rgba(245, 166, 35, 0.45)"
                  : undefined,
                transformOrigin: "bottom",
                animation: "wj-bar-grow 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
                animationDelay: `${i * 0.05}s`,
              }}
            />
          );
        })}
      </div>

      <div className="flex gap-1.5 mt-1" aria-hidden="true">
        {days.map((day) => (
          <span
            key={day.dateKey}
            className={`w-2 text-center text-[9px] leading-none font-medium ${
              day.isToday ? "text-golden-hour/70" : "text-charcoal/30"
            }`}
          >
            {dayInitial(day.dateKey)}
          </span>
        ))}
      </div>

      <p className="mt-1.5 text-[10px] text-charcoal/40 font-medium">
        {plural(total, "entry", "entries")} this week
      </p>
    </div>
  );
}
