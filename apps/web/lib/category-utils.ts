import {
  HeartPulse,
  Banknote,
  Users,
  Lock,
  Lightbulb,
  Home,
  Briefcase,
  Palette,
  Compass,
  BookOpen,
  Sun,
  Scale,
  Workflow,
  Handshake,
  ShieldAlert,
  Landmark,
  Users2,
  type LucideIcon,
} from "lucide-react";

interface CategoryStyle {
  icon: LucideIcon;
  color: string;       // text color class
  bgColor: string;     // background color class
}

const categoryStyles: Record<string, CategoryStyle> = {
  medical_health: {
    icon: HeartPulse,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
  financial: {
    icon: Banknote,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  relationships: {
    icon: Users,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
  },
  deeply_personal: {
    icon: Lock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  life_lessons: {
    icon: Lightbulb,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  family_traditions: {
    icon: Home,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  career_work: {
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  hobbies_interests: {
    icon: Palette,
    color: "text-teal-500",
    bgColor: "bg-teal-50",
  },
  values_beliefs: {
    icon: Compass,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
  },
  memories_stories: {
    icon: BookOpen,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
  },
  daily_reflection: {
    icon: Sun,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
  // Business categories (migration 042)
  decision_making: {
    icon: Scale,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  process_systems: {
    icon: Workflow,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  stakeholders: {
    icon: Handshake,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  crisis_challenges: {
    icon: ShieldAlert,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  institutional_knowledge: {
    icon: Landmark,
    color: "text-stone-600",
    bgColor: "bg-stone-100",
  },
  leadership_management: {
    icon: Users2,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
};

const defaultStyle: CategoryStyle = {
  icon: BookOpen,
  color: "text-gray-500",
  bgColor: "bg-gray-50",
};

export function getCategoryStyle(slug: string): CategoryStyle {
  return categoryStyles[slug] ?? defaultStyle;
}

export function getCategoryIcon(slug: string): LucideIcon {
  return getCategoryStyle(slug).icon;
}
