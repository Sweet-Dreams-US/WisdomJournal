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
    <div className="text-center py-16">
      <Icon className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-twilight mb-2">{title}</h3>
      <p className="text-charcoal/60 max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
}
