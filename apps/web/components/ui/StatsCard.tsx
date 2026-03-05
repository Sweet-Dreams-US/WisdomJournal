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
    <Card padding="md" className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-twilight">{value}</p>
        <p className="text-sm text-charcoal/60">{label}</p>
      </div>
    </Card>
  );
}
