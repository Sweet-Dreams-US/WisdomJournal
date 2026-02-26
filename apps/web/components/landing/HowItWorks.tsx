"use client";

import { MessageSquare, Archive, Search } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";
import FloatingOrbs from "@/components/animations/FloatingOrbs";

const steps = [
  {
    icon: MessageSquare,
    title: "Answer",
    subtitle: "Daily Questions",
    description:
      "Each day, receive thoughtful prompts designed to draw out your life experiences, values, and hard-won knowledge.",
    color: "sky-blue",
    gradient: "from-sky-blue/20 to-deep-sky/5",
  },
  {
    icon: Archive,
    title: "Build",
    subtitle: "Your Archive",
    description:
      "Your responses are securely stored and organized, creating a rich, searchable library of your unique perspective.",
    color: "golden-hour",
    gradient: "from-golden-hour/20 to-golden-hour/5",
  },
  {
    icon: Search,
    title: "Share",
    subtitle: "Your Wisdom",
    description:
      "Your loved ones or successors can ask questions and receive answers drawn from your accumulated wisdom via AI.",
    color: "sunrise-coral",
    gradient: "from-sunrise-coral/20 to-sunrise-coral/5",
  },
];

const orbConfigs = [
  { color: "rgba(74, 144, 217, 0.06)", size: 300, x: "80%", y: "20%", blur: 80 },
  { color: "rgba(245, 166, 35, 0.04)", size: 250, x: "10%", y: "60%", blur: 60 },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 gradient-section-dark relative overflow-hidden">
      <FloatingOrbs orbs={orbConfigs} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            How It Works
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            Three steps to preserving a lifetime of wisdom
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <ScrollReveal key={step.title} delay={index * 0.15} direction="up">
              <div className="glass-card rounded-2xl p-8 text-center relative group hover:border-white/15 transition-all duration-500">
                {/* Step number */}
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-${step.color} flex items-center justify-center`}>
                  <span className="font-body font-bold text-xs text-night-sky">{index + 1}</span>
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 mx-auto mb-6 mt-2 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                  <step.icon className={`w-7 h-7 text-${step.color}`} />
                </div>

                <h3 className="font-heading text-lg text-white mb-1">
                  {step.title}
                </h3>
                <p className={`font-body text-sm font-semibold text-${step.color} mb-4`}>
                  {step.subtitle}
                </p>
                <p className="font-body text-sm text-white/40 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Connecting line */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
    </section>
  );
}
