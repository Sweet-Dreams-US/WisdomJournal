import Link from "next/link";
import { Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="gradient-hero min-h-screen flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-golden-hour" />
            <span className="text-sm font-medium text-twilight">
              AI-powered wisdom preservation
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-twilight leading-tight mb-6">
            Your wisdom deserves to{" "}
            <span className="text-deep-sky">live forever</span>
          </h1>

          <p className="text-xl sm:text-2xl text-charcoal/70 mb-10 leading-relaxed">
            Answer daily questions. Build a living archive of your knowledge,
            stories, and values. Let your loved ones ask your wisdom anything
            &mdash; even when you&apos;re not there.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">
                Start Preserving Your Wisdom
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </a>
          </div>

          <p className="mt-6 text-sm text-warm-gray">
            Free to start. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
