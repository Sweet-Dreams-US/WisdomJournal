"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2.5 mb-10 animate-stagger-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-2 h-2 rounded-full bg-golden-hour animate-pulse-glow" />
            <span className="text-xs font-body font-medium text-stardust tracking-widest uppercase">
              AI-powered wisdom preservation
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-8">
            <span className="block overflow-hidden py-2 -my-2">
              <span
                className="hero-line block text-glow"
                style={{ animationDelay: "0.35s" }}
              >
                Your Wisdom
              </span>
            </span>
            <span className="block overflow-hidden py-2 -my-2">
              <span
                className="hero-line block text-golden-hour text-glow-gold"
                style={{ animationDelay: "0.47s" }}
              >
                Lives Forever
              </span>
            </span>
          </h1>

          <p
            className="font-body text-base sm:text-lg text-stardust/70 mb-12 leading-relaxed max-w-2xl mx-auto font-light animate-fade-in-up"
            style={{ animationDelay: "0.9s", animationFillMode: "both" }}
          >
            Answer daily questions. Build a living archive of your knowledge,
            stories, and values. Let your loved ones ask your wisdom anything
            &mdash; even when you&apos;re not there.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "1.05s", animationFillMode: "both" }}
          >
            <Link href="/register">
              <Button size="lg">
                Begin Your Legacy
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg">
                Explore
              </Button>
            </a>
          </div>

          <p
            className="mt-8 text-xs font-body text-white/30 tracking-wider animate-fade-in-up"
            style={{ animationDelay: "1.2s", animationFillMode: "both" }}
          >
            Free to start &middot; No credit card required
          </p>
        </div>
      </div>

      <style jsx>{`
        .hero-line {
          transform: translateY(130%);
          animation: heroLineRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes heroLineRise {
          from {
            transform: translateY(130%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
