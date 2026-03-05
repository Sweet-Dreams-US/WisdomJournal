import { Flame } from "lucide-react";

interface StreakDisplayProps {
  count: number;
  size?: "sm" | "md" | "lg";
}

export default function StreakDisplay({ count, size = "md" }: StreakDisplayProps) {
  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span className={`inline-flex items-center font-body font-semibold text-golden-hour ${sizeClasses[size]}`}>
      <Flame className={iconSizes[size]} />
      {count}
      <span className="font-normal text-charcoal/50">day streak</span>
    </span>
  );
}
