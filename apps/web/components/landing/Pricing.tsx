"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ScrollReveal from "@/components/animations/ScrollReveal";

const betaFeatures = [
  "Unlimited daily questions",
  "Voice & text responses",
  "AI-powered wisdom queries",
  "Personal knowledge encyclopedia",
  "Share with friends & groups",
  "Per-category privacy controls",
  "Daily follow-up questions",
  "Full export & backup",
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            Join the Beta
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            Wisdom Journal is currently in private beta. Everything is free for early members.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up">
          <div className="max-w-lg mx-auto">
            <div
              className="glass-card rounded-2xl p-8 relative border-sky-blue/30 glow-blue animate-glow-pulse hover:-translate-y-1 hover:border-sky-blue/60 transition-all duration-300"
              style={{ animationDuration: "4s" }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-deep-sky to-sky-blue text-white text-[10px] font-body font-bold px-4 py-1.5 rounded-full tracking-widest uppercase flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Beta Access
              </div>

              <div className="text-center mb-8 mt-2">
                <h3 className="font-body text-lg font-bold text-white mb-3">
                  Early Adopter
                </h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="font-body text-4xl font-bold text-white">
                    Free
                  </span>
                </div>
                <p className="font-body text-xs text-white/30 mt-2">
                  All features included during beta
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {betaFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="font-body text-sm text-white/40">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="block">
                <Button variant="primary" fullWidth>
                  Request Beta Access
                </Button>
              </Link>

              <p className="font-body text-[11px] text-white/20 text-center mt-4">
                You&apos;ll need an invite code to register. Contact us if you don&apos;t have one.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
