"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  datesWithEntries?: Set<string>;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (formatDate(date) === formatDate(today)) return "Today";
  if (formatDate(date) === formatDate(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function CalendarStrip({
  selectedDate,
  onDateSelect,
  datesWithEntries = new Set(),
}: CalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 30 days back from today
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Scroll to selected date on mount
  useEffect(() => {
    if (scrollRef.current) {
      const selected = scrollRef.current.querySelector("[data-selected=true]");
      if (selected) {
        selected.scrollIntoView({ inline: "center", behavior: "smooth" });
      }
    }
  }, []);

  function scroll(direction: "left" | "right") {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => scroll("left")}
        className="p-1.5 rounded-lg hover:bg-soft-gray transition-colors flex-shrink-0"
      >
        <ChevronLeft className="w-4 h-4 text-charcoal/60" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {days.map((day) => {
          const dateStr = formatDate(day);
          const isSelected = dateStr === selectedDate;
          const hasEntry = datesWithEntries.has(dateStr);

          return (
            <button
              key={dateStr}
              data-selected={isSelected}
              onClick={() => onDateSelect(dateStr)}
              className={`
                flex flex-col items-center px-3 py-2 rounded-xl min-w-[60px]
                transition-all duration-150 flex-shrink-0
                ${isSelected
                  ? "bg-deep-sky text-white shadow-button"
                  : "hover:bg-soft-gray text-charcoal/70"
                }
              `}
            >
              <span className="text-[10px] font-medium uppercase">
                {getDayLabel(day)}
              </span>
              <span className="text-lg font-bold">{day.getDate()}</span>
              {hasEntry && (
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? "bg-white" : "bg-deep-sky"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scroll("right")}
        className="p-1.5 rounded-lg hover:bg-soft-gray transition-colors flex-shrink-0"
      >
        <ChevronRight className="w-4 h-4 text-charcoal/60" />
      </button>
    </div>
  );
}
