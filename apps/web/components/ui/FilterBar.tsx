"use client";

import { getCategoryStyle } from "@/lib/category-utils";

interface FilterItem {
  slug: string;
  name: string;
}

interface FilterBarProps {
  items: FilterItem[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export default function FilterBar({ items, selected, onSelect }: FilterBarProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto py-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <button
        onClick={() => onSelect(null)}
        className={`
          px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap
          transition-all duration-200 flex-shrink-0
          ${!selected
            ? "bg-gradient-to-r from-deep-sky to-sky-blue text-white shadow-sm"
            : "bg-charcoal/[0.04] text-charcoal/60 hover:bg-charcoal/[0.08] hover:text-charcoal/80"
          }
        `}
      >
        All
      </button>
      {items.map((item) => {
        const style = getCategoryStyle(item.slug);
        const isActive = selected === item.slug;
        const Icon = style.icon;

        return (
          <button
            key={item.slug}
            onClick={() => onSelect(isActive ? null : item.slug)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold
              whitespace-nowrap transition-all duration-200 flex-shrink-0
              ${isActive
                ? `${style.bgColor} ${style.color} shadow-sm`
                : "bg-charcoal/[0.04] text-charcoal/60 hover:bg-charcoal/[0.08] hover:text-charcoal/80"
              }
            `}
          >
            <Icon className="w-3 h-3" />
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
