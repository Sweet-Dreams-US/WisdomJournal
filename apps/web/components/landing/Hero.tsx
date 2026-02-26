"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import Button from "@/components/ui/Button";

export default function Hero() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.5 });

    tl.fromTo(
      badgeRef.current,
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
    )
      .fromTo(
        headingRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
        "-=0.3"
      )
      .fromTo(
        subRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.5"
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      );
  }, []);

  return (
    <section className="min-h-screen flex items-center pt-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2.5 mb-10"
          >
            <div className="w-2 h-2 rounded-full bg-golden-hour animate-pulse-glow" />
            <span className="text-xs font-body font-medium text-stardust tracking-widest uppercase">
              AI-powered wisdom preservation
            </span>
          </div>

          <h1
            ref={headingRef}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-8 text-glow"
          >
            Your Wisdom
            <br />
            <span className="text-golden-hour text-glow-gold">Lives Forever</span>
          </h1>

          <p
            ref={subRef}
            className="font-body text-base sm:text-lg text-stardust/70 mb-12 leading-relaxed max-w-2xl mx-auto font-light"
          >
            Answer daily questions. Build a living archive of your knowledge,
            stories, and values. Let your loved ones ask your wisdom anything
            &mdash; even when you&apos;re not there.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
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

          <p className="mt-8 text-xs font-body text-white/30 tracking-wider">
            Free to start &middot; No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
