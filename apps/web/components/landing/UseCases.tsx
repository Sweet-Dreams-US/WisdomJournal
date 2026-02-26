"use client";

import { Heart, Briefcase } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

const useCases = [
  {
    icon: Heart,
    category: "Personal",
    title: "Legacy & Family Memories",
    color: "sunrise-coral",
    items: [
      "Preserve stories and life lessons for future generations",
      "Capture family traditions, recipes, and cultural heritage",
      "Create a living memoir your grandchildren can interact with",
      "Document your values and beliefs in your own words",
    ],
  },
  {
    icon: Briefcase,
    category: "Business",
    title: "Knowledge Transfer",
    color: "sky-blue",
    items: [
      "Capture institutional knowledge before key people retire",
      "Accelerate executive onboarding with predecessor wisdom",
      "Preserve decision-making frameworks and rationale",
      "Build a queryable knowledge base from experienced leaders",
    ],
  },
];

export default function UseCases() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            Built For
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            Whether preserving personal legacy or business knowledge, Wisdom
            Journal adapts to your needs
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <ScrollReveal
              key={useCase.category}
              delay={index * 0.2}
              direction={index === 0 ? "left" : "right"}
            >
              <div className="glass-card rounded-2xl p-8 hover:border-white/15 transition-all duration-500 h-full">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 rounded-xl bg-${useCase.color}/10 flex items-center justify-center`}>
                    <useCase.icon className={`w-7 h-7 text-${useCase.color}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-body font-semibold text-${useCase.color} uppercase tracking-[0.2em]`}>
                      {useCase.category}
                    </p>
                    <h3 className="font-body text-lg font-bold text-white">
                      {useCase.title}
                    </h3>
                  </div>
                </div>
                <ul className="space-y-4">
                  {useCase.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full bg-${useCase.color}/60 mt-2 shrink-0`} />
                      <span className="font-body text-sm text-white/40 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
