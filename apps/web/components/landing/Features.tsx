import {
  CalendarDays,
  Mic,
  Brain,
  Shield,
  Flame,
  Users,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Daily Questions",
    description:
      "Thoughtfully crafted prompts that draw out your deepest wisdom, one day at a time.",
  },
  {
    icon: Mic,
    title: "Voice Capture",
    description:
      "Speak your stories naturally. We transcribe and preserve every word.",
  },
  {
    icon: Brain,
    title: "AI-Powered Queries",
    description:
      "Your loved ones can ask questions and get answers drawn from your wisdom archive.",
  },
  {
    icon: Shield,
    title: "Access Control",
    description:
      "You decide who can access your wisdom. Set permissions per person.",
  },
  {
    icon: Flame,
    title: "Streaks & Motivation",
    description:
      "Stay consistent with daily streaks, milestones, and gentle reminders.",
  },
  {
    icon: Users,
    title: "Shared Wisdom",
    description:
      "Invite family members or colleagues to access and learn from your knowledge.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-twilight mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-charcoal/60 max-w-2xl mx-auto">
            Powerful tools to capture, preserve, and share your wisdom
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-card hover:bg-soft-gray transition-colors duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-blue/10 flex items-center justify-center mb-4 group-hover:bg-deep-sky/10 transition-colors">
                <feature.icon className="w-6 h-6 text-deep-sky" />
              </div>
              <h3 className="text-lg font-bold text-twilight mb-2">
                {feature.title}
              </h3>
              <p className="text-charcoal/60 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
