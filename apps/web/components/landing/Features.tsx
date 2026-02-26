"use client";

import {
  CalendarDays,
  Mic,
  Brain,
  Shield,
  Flame,
  Users,
} from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";
import FloatingOrbs from "@/components/animations/FloatingOrbs";

const features = [
  {
    icon: CalendarDays,
    title: "Daily Questions",
    description:
      "Thoughtfully crafted prompts that draw out your deepest wisdom, one day at a time.",
    color: "sky-blue",
  },
  {
    icon: Mic,
    title: "Voice Capture",
    description:
      "Speak your stories naturally. We transcribe and preserve every word.",
    color: "golden-hour",
  },
  {
    icon: Brain,
    title: "AI Queries",
    description:
      "Your loved ones can ask questions and get answers from your wisdom archive.",
    color: "sunrise-coral",
  },
  {
    icon: Shield,
    title: "Access Control",
    description:
      "You decide who can access your wisdom. Set permissions per person.",
    color: "deep-sky",
  },
  {
    icon: Flame,
    title: "Streaks",
    description:
      "Stay consistent with daily streaks, milestones, and gentle reminders.",
    color: "golden-hour",
  },
  {
    icon: Users,
    title: "Shared Wisdom",
    description:
      "Invite family or colleagues to access and learn from your knowledge.",
    color: "sky-blue",
  },
];

const orbConfigs = [
  { color: "rgba(255, 126, 107, 0.04)", size: 350, x: "90%", y: "30%", blur: 90 },
  { color: "rgba(74, 144, 217, 0.05)", size: 300, x: "5%", y: "70%", blur: 70 },
];

export default function Features() {
  return (
    <section id="features" className="py-32 gradient-section-dark relative overflow-hidden">
      <FloatingOrbs orbs={orbConfigs} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            Everything
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            Powerful tools to capture, preserve, and share your wisdom
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 0.1} direction="scale">
              <div className="glass-card rounded-2xl p-6 group hover:border-white/15 transition-all duration-500 cursor-default">
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className={`w-5 h-5 text-${feature.color}`} />
                </div>
                <h3 className="font-body text-base font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-white/35 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
