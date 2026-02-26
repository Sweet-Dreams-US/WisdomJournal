"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ScrollReveal from "@/components/animations/ScrollReveal";
import { SUBSCRIPTION_TIERS } from "@wisdom-journal/shared";

const tiers = [
  { key: "free" as const, popular: false },
  { key: "standard" as const, popular: true },
  { key: "premium" as const, popular: false },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-32 gradient-section-mid relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            Pricing
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map(({ key, popular }, index) => {
            const tier = SUBSCRIPTION_TIERS[key];
            return (
              <ScrollReveal key={key} delay={index * 0.15} direction="up">
                <div
                  className={`
                    rounded-2xl p-8 relative h-full flex flex-col
                    ${popular
                      ? "glass-card border-sky-blue/30 glow-blue"
                      : "glass-card"
                    }
                    hover:border-white/15 transition-all duration-500
                  `}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-deep-sky to-sky-blue text-white text-[10px] font-body font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                      Popular
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="font-body text-lg font-bold text-white mb-3">
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-body text-4xl font-bold text-white">
                        ${tier.price}
                      </span>
                      {tier.price > 0 && (
                        <span className="font-body text-sm text-white/30">/mo</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span className="font-body text-sm text-white/40">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/register" className="block">
                    <Button
                      variant={popular ? "primary" : "outline"}
                      fullWidth
                    >
                      {tier.price === 0 ? "Start Free" : "Free Trial"}
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
