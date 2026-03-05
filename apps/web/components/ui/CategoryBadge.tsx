import { getCategoryStyle } from "@/lib/category-utils";

interface CategoryBadgeProps {
  slug: string;
  name: string;
  size?: "sm" | "md";
}

export default function CategoryBadge({ slug, name, size = "sm" }: CategoryBadgeProps) {
  const style = getCategoryStyle(slug);
  const Icon = style.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-body font-medium
        ${style.bgColor} ${style.color}
        ${size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}
      `}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {name}
    </span>
  );
}
