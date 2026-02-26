"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import gsap from "gsap";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <BookOpen className="w-7 h-7 text-sky-blue group-hover:text-golden-hour transition-colors duration-300" />
            <span className="font-heading text-sm text-white tracking-wider">
              Wisdom
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="font-body text-sm text-white/50 hover:text-sky-blue transition-colors duration-300">
              How It Works
            </a>
            <a href="#features" className="font-body text-sm text-white/50 hover:text-sky-blue transition-colors duration-300">
              Features
            </a>
            <a href="#pricing" className="font-body text-sm text-white/50 hover:text-sky-blue transition-colors duration-300">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
