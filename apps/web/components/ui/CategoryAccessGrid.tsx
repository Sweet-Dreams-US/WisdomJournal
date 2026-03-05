"use client";

import { getCategoryStyle } from "@/lib/category-utils";

interface CategoryToggle {
  slug: string;
  name: string;
  enabled: boolean;
}

interface CategoryAccessGridProps {
  categories: CategoryToggle[];
  onChange: (slug: string, enabled: boolean) => void;
  disabled?: boolean;
}

export default function CategoryAccessGrid({
  categories,
  onChange,
  disabled = false,
}: CategoryAccessGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {categories.map((cat) => {
        const style = getCategoryStyle(cat.slug);
        const Icon = style.icon;

        return (
          <label
            key={cat.slug}
            className={`
              flex items-center justify-between p-3 rounded-xl border
              transition-colors duration-150
              ${cat.enabled ? "border-deep-sky/30 bg-deep-sky/5" : "border-soft-gray bg-white"}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-deep-sky/20"}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${style.bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
              </div>
              <span className="text-sm font-medium text-charcoal">{cat.name}</span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={cat.enabled}
                onChange={(e) => onChange(cat.slug, e.target.checked)}
                disabled={disabled}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-soft-gray rounded-full peer-checked:bg-deep-sky transition-colors duration-200" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
          </label>
        );
      })}
    </div>
  );
}
