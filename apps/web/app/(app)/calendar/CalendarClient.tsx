"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
  PenLine,
} from "lucide-react";
import Card from "@/components/ui/Card";
import StatsCard from "@/components/ui/StatsCard";
import EmptyState from "@/components/ui/EmptyState";
import CategoryBadge from "@/components/ui/CategoryBadge";
import type { CalendarEntry } from "@/lib/data/get-calendar-data";
import { toLocalDateKey, todayKey } from "@/lib/utils/dates";
import { plural } from "@/lib/utils/plural";

const WEEKDAYS = [
  { short: "S", long: "Sun" },
  { short: "M", long: "Mon" },
  { short: "T", long: "Tue" },
  { short: "W", long: "Wed" },
  { short: "T", long: "Thu" },
  { short: "F", long: "Fri" },
  { short: "S", long: "Sat" },
];

/** Solid dot colors matching the category hues in lib/category-utils.ts. */
const CATEGORY_DOT_COLORS: Record<string, string> = {
  medical_health: "bg-rose-400",
  financial: "bg-emerald-500",
  relationships: "bg-pink-400",
  deeply_personal: "bg-purple-500",
  life_lessons: "bg-amber-400",
  family_traditions: "bg-orange-400",
  career_work: "bg-blue-500",
  hobbies_interests: "bg-teal-500",
  values_beliefs: "bg-indigo-400",
  memories_stories: "bg-sky-400",
  daily_reflection: "bg-yellow-400",
};

function dotClass(slug: string | null | undefined): string {
  return (slug && CATEGORY_DOT_COLORS[slug]) || "bg-deep-sky";
}

/** Subtle heat tint by entry count: more writing, deeper sky. */
function heatClass(count: number): string {
  if (count >= 3) return "bg-deep-sky/15";
  if (count === 2) return "bg-deep-sky/10";
  if (count === 1) return "bg-deep-sky/5";
  return "";
}

interface DayCell {
  key: string; // YYYY-MM-DD (local)
  dayOfMonth: number;
  inMonth: boolean;
}

/** Full weeks covering the month, Sunday-start (US convention). */
function buildMonthCells(year: number, month: number): DayCell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(year, month, i - firstDow + 1);
    return {
      key: toLocalDateKey(date),
      dayOfMonth: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
}

function formatDayHeading(dateKey: string): string {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface CalendarClientProps {
  entries: CalendarEntry[];
  currentStreak: number;
}

export default function CalendarClient({
  entries,
  currentStreak,
}: CalendarClientProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = todayKey();

  // Group entries by local calendar day (entries arrive sorted desc)
  const entriesByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    entries.forEach((entry) => {
      const key = toLocalDateKey(entry.created_at);
      const list = map.get(key);
      if (list) {
        list.push(entry);
      } else {
        map.set(key, [entry]);
      }
    });
    return map;
  }, [entries]);

  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

  const monthStats = useMemo(() => {
    let entryCount = 0;
    let words = 0;
    let activeDays = 0;
    entriesByDay.forEach((dayEntries, key) => {
      if (!key.startsWith(monthPrefix)) return;
      activeDays += 1;
      entryCount += dayEntries.length;
      dayEntries.forEach((entry) => {
        words += entry.word_count;
      });
    });
    return { entryCount, words, activeDays };
  }, [entriesByDay, monthPrefix]);

  const selectedEntries = selectedDate
    ? entriesByDay.get(selectedDate) ?? []
    : [];

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  function changeMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setSelectedDate(null);
  }

  function goToToday() {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelectedDate(null);
  }

  function handleDayClick(key: string, count: number) {
    if (count === 0) return; // empty day: no-op
    setSelectedDate((prev) => (prev === key ? null : key));
  }

  return (
    <div className="max-w-5xl">
      {/* Month stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-fade-in">
        <StatsCard
          value={monthStats.entryCount}
          label="Entries this month"
          icon={BookOpen}
        />
        <StatsCard
          value={monthStats.words.toLocaleString()}
          label="Words this month"
          icon={PenLine}
          iconColor="text-sky-blue"
          iconBg="bg-sky-blue/10"
        />
        <StatsCard
          value={monthStats.activeDays}
          label="Active days"
          icon={CalendarCheck}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <StatsCard
          value={currentStreak}
          label="Current streak"
          icon={Flame}
          iconColor="text-golden-hour"
          iconBg="bg-golden-hour/10"
        />
      </div>

      {/* Calendar */}
      <Card padding="sm" className="md:p-6 animate-fade-in-up">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="font-heading text-xl md:text-2xl text-twilight tracking-tight">
            {monthLabel}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="p-2 rounded-xl hover:bg-soft-gray active:scale-95 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 text-charcoal/60" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-deep-sky border border-charcoal/10 hover:border-deep-sky/40 hover:bg-deep-sky/5 transition-all duration-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="p-2 rounded-xl hover:bg-soft-gray active:scale-95 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4 text-charcoal/60" />
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-1 md:mb-1.5">
          {WEEKDAYS.map((day) => (
            <div
              key={day.long}
              className="text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-charcoal/35 py-1"
            >
              <span className="md:hidden">{day.short}</span>
              <span className="hidden md:inline">{day.long}</span>
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
          {cells.map((cell) => {
            const dayEntries = entriesByDay.get(cell.key) ?? [];
            const count = dayEntries.length;
            const isToday = cell.key === today;
            const isSelected = cell.key === selectedDate;
            const clickable = count > 0;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => handleDayClick(cell.key, count)}
                aria-label={`${formatDayHeading(cell.key)}: ${plural(count, "entry", "entries")}`}
                aria-pressed={isSelected}
                className={`
                  relative flex flex-col items-start rounded-xl border p-1 md:p-2 text-left
                  min-h-[52px] md:min-h-[104px]
                  transition-all duration-200
                  ${
                    isSelected
                      ? "border-deep-sky bg-deep-sky/15 shadow-card"
                      : `border-charcoal/[0.06] ${heatClass(count)}`
                  }
                  ${isToday && !isSelected ? "ring-2 ring-inset ring-deep-sky/50" : ""}
                  ${cell.inMonth ? "" : "opacity-40"}
                  ${
                    clickable
                      ? "cursor-pointer hover:border-deep-sky/40 hover:shadow-card"
                      : "cursor-default"
                  }
                `}
              >
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full text-[10px] md:text-xs font-semibold ${
                    isToday
                      ? "bg-deep-sky text-white"
                      : cell.inMonth
                        ? "text-charcoal/70"
                        : "text-charcoal/30"
                  }`}
                >
                  {cell.dayOfMonth}
                </span>

                {count > 0 && (
                  <span className="hidden md:block mt-1 text-[10px] font-medium text-charcoal/45">
                    {plural(count, "entry", "entries")}
                  </span>
                )}

                {count > 0 && (
                  <span className="mt-auto flex items-center gap-0.5 md:gap-1 pt-1">
                    {dayEntries.slice(0, 3).map((entry) => (
                      <span
                        key={entry.id}
                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${dotClass(entry.category?.slug)}`}
                      />
                    ))}
                    {count > 3 && (
                      <span className="text-[9px] md:text-[10px] font-semibold text-charcoal/50 leading-none">
                        +{count - 3}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected day entries */}
      {selectedDate && (
        <div className="mt-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-charcoal/50 uppercase tracking-wider">
              {formatDayHeading(selectedDate)}
            </h3>
            <span className="text-xs text-charcoal/40 font-medium">
              {plural(selectedEntries.length, "entry", "entries")}
            </span>
          </div>
          <div className="space-y-3">
            {selectedEntries.map((entry) => (
              <Link key={entry.id} href={`/journal/${entry.id}`} className="block">
                <Card hover padding="md" className="group cursor-pointer">
                  <div className="flex-1 min-w-0">
                    {entry.category && (
                      <CategoryBadge
                        slug={entry.category.slug}
                        name={entry.category.name}
                        size="sm"
                      />
                    )}
                    {entry.question_text && (
                      <p className="mt-2 text-xs font-medium text-charcoal/45 line-clamp-1">
                        {entry.question_text}
                      </p>
                    )}
                    <p className="text-charcoal mt-1.5 text-sm line-clamp-3 leading-relaxed tracking-tight">
                      {entry.response_text}
                    </p>
                    <p className="mt-3 text-[11px] text-charcoal/40 font-medium">
                      {plural(entry.word_count, "word")}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* First-run empty state */}
      {entries.length === 0 && (
        <EmptyState
          illustration="book"
          icon={BookOpen}
          title="Nothing on the Calendar Yet"
          description="Answer your daily questions and each day you write will light up here, building a month-by-month picture of your wisdom."
        />
      )}
    </div>
  );
}
