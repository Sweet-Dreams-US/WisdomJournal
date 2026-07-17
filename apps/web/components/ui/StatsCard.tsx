import Card from "./Card";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  value: number | string;
  label: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({
  value,
  label,
  icon: Icon,
  iconColor = "text-deep-sky",
  iconBg = "bg-deep-sky/10",
}: StatsCardProps) {
  return (
    <Card padding="md" variant="elevated" className="group">
      <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:text-left sm:gap-4">
        <div
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold text-twilight tracking-tight">
            {value}
          </p>
          <p className="text-[10px] sm:text-xs text-charcoal/50 font-medium uppercase tracking-wider">
            {label}
          </p>
        </div>
      </div>
    </Card>
  );
}
