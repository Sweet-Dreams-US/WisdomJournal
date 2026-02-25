import Link from "next/link";
import { BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-soft-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-deep-sky" />
            <span className="font-heading font-bold text-xl text-twilight">
              Wisdom Journal
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-charcoal hover:text-deep-sky transition-colors">
              How It Works
            </a>
            <a href="#features" className="text-charcoal hover:text-deep-sky transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-charcoal hover:text-deep-sky transition-colors">
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
