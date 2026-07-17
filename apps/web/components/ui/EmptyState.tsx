import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-deep-sky/8 to-sky-blue/4 flex items-center justify-center mx-auto mb-5">
        <Icon className="w-10 h-10 text-charcoal/20" />
      </div>
      <h3 className="text-lg font-semibold text-twilight mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-charcoal/50 max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
