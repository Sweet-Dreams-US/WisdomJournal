"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctaRef.current) return;

    gsap.fromTo(
      ctaRef.current.querySelectorAll(".cta-animate"),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <footer>
      {/* CTA Section */}
      <section ref={ctaRef} className="py-32 relative overflow-hidden bg-black/10 backdrop-blur-sm">

        {/* Decorative SVG shapes */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1440 600" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="ctaLine1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(124,185,232,0)" />
              <stop offset="50%" stopColor="rgba(124,185,232,0.1)" />
              <stop offset="100%" stopColor="rgba(124,185,232,0)" />
            </linearGradient>
          </defs>
          <line x1="0" y1="100" x2="1440" y2="100" stroke="url(#ctaLine1)" strokeWidth="1" />
          <line x1="0" y1="500" x2="1440" y2="500" stroke="url(#ctaLine1)" strokeWidth="1" />
          <circle cx="200" cy="300" r="150" fill="rgba(74,144,217,0.03)" />
          <circle cx="1200" cy="200" r="200" fill="rgba(245,166,35,0.02)" />
        </svg>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="cta-animate font-heading text-2xl sm:text-3xl text-white mb-6 text-glow">
            Start Today
          </h2>
          <p className="cta-animate font-body text-base text-stardust/50 mb-12 max-w-xl mx-auto leading-relaxed">
            Every day that passes is wisdom that could be lost. Begin your
            journey of capturing what matters most.
          </p>
          <div className="cta-animate">
            <Link href="/register">
              <Button variant="secondary" size="lg">
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom footer */}
      <div className="bg-black/20 backdrop-blur-md border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-blue" />
              <span className="font-heading text-xs text-white">
                Wisdom
              </span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/business" className="font-body text-xs text-white/30 hover:text-white/60 transition-colors">
                For Business
              </Link>
              <Link href="/privacy" className="font-body text-xs text-white/30 hover:text-white/60 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="font-body text-xs text-white/30 hover:text-white/60 transition-colors">
                Terms
              </Link>
              <a href="mailto:cole@marcuccilli.com" className="font-body text-xs text-white/30 hover:text-white/60 transition-colors">
                Contact
              </a>
            </div>

            <p className="font-body text-xs text-white/20">
              &copy; {new Date().getFullYear()} Sweet Dreams Music LLC
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
