"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Menu, X } from "lucide-react";
import gsap from "gsap";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  // Close mobile menu on click outside
  useEffect(() => {
    if (!mobileOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        navRef.current &&
        !navRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

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

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        ref={menuRef}
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-6 pt-2 space-y-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
          <a
            href="#how-it-works"
            onClick={closeMobile}
            className="block font-body text-sm text-white/50 hover:text-sky-blue transition-colors duration-300"
          >
            How It Works
          </a>
          <a
            href="#features"
            onClick={closeMobile}
            className="block font-body text-sm text-white/50 hover:text-sky-blue transition-colors duration-300"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={closeMobile}
            className="block font-body text-sm text-white/50 hover:text-sky-blue transition-colors duration-300"
          >
            Pricing
          </a>

          <div className="pt-2 border-t border-white/10 space-y-3">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={closeMobile}>
                <Button size="sm" fullWidth>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={closeMobile}>
                  <Button variant="ghost" size="sm" fullWidth>
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={closeMobile}>
                  <Button size="sm" fullWidth>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
