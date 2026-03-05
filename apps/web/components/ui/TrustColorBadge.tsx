import type { TrustColor } from "@wisdom-journal/shared";

interface TrustColorBadgeProps {
  color: TrustColor;
  showLabel?: boolean;
}

const colorMap: Record<TrustColor, { dot: string; label: string }> = {
  green: { dot: "bg-emerald-500", label: "Full access" },
  yellow: { dot: "bg-amber-400", label: "Partial access" },
  red: { dot: "bg-red-500", label: "Limited access" },
};

export default function TrustColorBadge({ color, showLabel = false }: TrustColorBadgeProps) {
  const { dot, label } = colorMap[color];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      {showLabel && (
        <span className="text-xs text-charcoal/60 font-body">{label}</span>
      )}
    </span>
  );
}
