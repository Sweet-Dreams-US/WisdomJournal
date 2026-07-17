import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  UserPlus,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Landmark,
  Code2,
  Handshake,
  Rocket,
  Check,
  Sparkles,
  Heart,
  ArrowRight,
  DoorOpen,
  Hourglass,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import DynamicSky from "@/components/sky/DynamicSky";
import ScrollReveal from "@/components/animations/ScrollReveal";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Wisdom Journal for Business — Institutional Knowledge, Preserved",
  description:
    "Capture how your experts think, decide, and get things done — a few minutes a day. Role-aware daily questions, private entries, and knowledge coverage dashboards for teams.",
};

/* ─────────────────────────── Hero ─────────────────────────── */

function BusinessHero() {
  return (
    <section className="min-h-screen flex items-center pt-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 glass-card rounded-full px-5 py-2.5 mb-10 animate-stagger-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-2 h-2 rounded-full bg-golden-hour animate-pulse" />
            <span className="text-xs font-body font-medium text-stardust tracking-widest uppercase">
              Wisdom Journal for Teams
            </span>
          </div>

          <h1
            className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-8 text-glow animate-stagger-in"
            style={{ animationDelay: "0.25s" }}
          >
            Institutional knowledge,
            <br />
            <span className="text-golden-hour text-glow-gold">preserved</span>
          </h1>

          <p
            className="font-body text-base sm:text-lg text-stardust/70 mb-12 leading-relaxed max-w-2xl mx-auto font-light animate-stagger-in"
            style={{ animationDelay: "0.4s" }}
          >
            Key people leave &mdash; and take a decade of judgment with them.
            Wisdom Journal captures how your experts think, decide, and get
            things done, a few minutes a day.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-stagger-in"
            style={{ animationDelay: "0.55s" }}
          >
            <Link href="/register">
              <Button size="lg">Start Your Organization</Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </a>
          </div>

          <p
            className="mt-8 text-xs font-body text-white/30 tracking-wider animate-stagger-in"
            style={{ animationDelay: "0.7s" }}
          >
            Free during beta &middot; No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── The problem ─────────────────────── */

const problems = [
  {
    icon: Landmark,
    question: "“What did we agree with that vendor in 2019 — and why?”",
    description:
      "The contract is in a drawer somewhere. The reasoning behind it lives in one person's memory. When they move on, the context moves on with them — and the next negotiation starts from zero.",
  },
  {
    icon: DoorOpen,
    question: "“Who actually knows how this works?”",
    description:
      "Every organization has single points of failure: the one engineer who understands the legacy system, the one ops lead who knows why the process bends where it does. Retirement, resignation, reorganization — any of them turns that knowledge into a rumor.",
  },
  {
    icon: Hourglass,
    question: "“Why does it take a year to get up to speed?”",
    description:
      "Because the real playbook was never written down. New hires get the process docs — not the judgment, the history, or the hard-won lessons of the people who came before them.",
  },
];

function ProblemSection() {
  return (
    <section className="py-32 relative overflow-hidden bg-black/10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            Knowledge Walks Out the Door
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            Every organization runs on unwritten knowledge. You notice it the
            day it&apos;s gone.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <ScrollReveal key={problem.question} delay={index * 0.15} direction="up">
              <div className="glass-card rounded-2xl p-8 h-full hover:border-white/15 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-golden-hour/20 to-golden-hour/5 flex items-center justify-center mb-6">
                  <problem.icon className="w-6 h-6 text-golden-hour" />
                </div>
                <h3 className="font-heading text-base text-white mb-4 leading-snug">
                  {problem.question}
                </h3>
                <p className="font-body text-sm text-white/40 leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── How it works for teams ─────────────── */

const teamSteps = [
  {
    icon: Building2,
    title: "Create Your Organization",
    description:
      "Set up your organization and departments in minutes — engineering, sales, operations, whatever mirrors how you actually work.",
    color: "text-sky-blue",
    bg: "bg-sky-blue",
    gradient: "from-sky-blue/20 to-deep-sky/5",
  },
  {
    icon: UserPlus,
    title: "Invite Your Key People",
    description:
      "Send email invitations with a role and job title. The people whose knowledge you can't afford to lose are journaling by tomorrow.",
    color: "text-golden-hour",
    bg: "bg-golden-hour",
    gradient: "from-golden-hour/20 to-golden-hour/5",
  },
  {
    icon: MessageSquare,
    title: "Role-Aware Daily Questions",
    description:
      "Five minutes a day. Business questions about decisions, processes, and stakeholders — mixed with personal reflection and tuned to each person's role.",
    color: "text-sunrise-coral",
    bg: "bg-sunrise-coral",
    gradient: "from-sunrise-coral/20 to-sunrise-coral/5",
  },
  {
    icon: BarChart3,
    title: "Watch Coverage Grow",
    description:
      "Dashboards show participation and which knowledge areas are covered — and where the gaps are before they become emergencies.",
    color: "text-sky-blue",
    bg: "bg-sky-blue",
    gradient: "from-sky-blue/20 to-deep-sky/5",
  },
];

function HowItWorksForTeams() {
  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            How It Works for Teams
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            Four steps from tribal knowledge to living archive
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamSteps.map((step, index) => (
            <ScrollReveal key={step.title} delay={index * 0.12} direction="up">
              <div className="glass-card rounded-2xl p-8 text-center relative group h-full hover:border-white/15 transition-all duration-500">
                <div
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${step.bg} flex items-center justify-center`}
                >
                  <span className="font-body font-bold text-xs text-night-sky">
                    {index + 1}
                  </span>
                </div>

                <div
                  className={`w-16 h-16 mx-auto mb-6 mt-2 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}
                >
                  <step.icon className={`w-7 h-7 ${step.color}`} />
                </div>

                <h3 className="font-heading text-base text-white mb-4">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-white/40 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2} direction="up" className="mt-12">
          <div className="glass-card rounded-2xl p-8 max-w-3xl mx-auto border-sky-blue/20">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-blue/20 to-deep-sky/5 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-sky-blue" />
              </div>
              <div>
                <h3 className="font-heading text-base text-white mb-2">
                  Private by Design
                </h3>
                <p className="font-body text-sm text-white/40 leading-relaxed">
                  Entries stay private to their authors. Admins see
                  participation and knowledge coverage metrics &mdash; never
                  the content of anyone&apos;s answers. People write honestly
                  when they know who&apos;s reading.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ───────────────────── Use cases ───────────────────── */

const businessUseCases = [
  {
    icon: Landmark,
    title: "Executive Transitions",
    description:
      "Your new CFO asks “Why this banking partner?” and gets the reasoning from the person who made the call — not a shrug from the room.",
  },
  {
    icon: Code2,
    title: "Senior Engineers",
    description:
      "Architecture decisions, tribal knowledge, and the “don't touch that” folklore — captured while the people who lived it are still around to explain it.",
  },
  {
    icon: Handshake,
    title: "Sales & Client Relationships",
    description:
      "How the Johnson account likes to work, what was promised two renewals ago, and which topics to never open in a negotiation.",
  },
  {
    icon: Rocket,
    title: "Onboarding Acceleration",
    description:
      "New hires learn from the accumulated judgment of the people who came before them — not just the process docs.",
  },
];

function UseCasesGrid() {
  return (
    <section className="py-32 relative overflow-hidden bg-black/10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-20">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            Where It Pays Off
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            The moments when captured wisdom earns its keep
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {businessUseCases.map((useCase, index) => (
            <ScrollReveal
              key={useCase.title}
              delay={index * 0.12}
              direction={index % 2 === 0 ? "right" : "left"}
            >
              <div className="glass-card rounded-2xl p-8 h-full hover:border-white/15 transition-all duration-500">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl bg-sky-blue/10 flex items-center justify-center shrink-0">
                    <useCase.icon className="w-7 h-7 text-sky-blue" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base text-white mb-3">
                      {useCase.title}
                    </h3>
                    <p className="font-body text-sm text-white/40 leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Pricing ───────────────────── */

const businessFeatures = [
  "Up to 50 seats",
  "Role-based business questions",
  "Departments & member management",
  "Knowledge coverage dashboards",
  "Entries private to their authors",
  "Priority support",
];

const enterpriseFeatures = [
  "Unlimited seats",
  "Custom question frameworks",
  "Dedicated support",
  "Everything in Business",
];

function BusinessPricing() {
  return (
    <section id="pricing" className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl text-white mb-4 text-glow">
            Business Pricing
          </h2>
          <p className="font-body text-sm text-stardust/50 max-w-lg mx-auto tracking-wide">
            Simple per-seat pricing. No long-term contracts.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mb-14">
          <div className="max-w-2xl mx-auto glass-card rounded-full px-6 py-3 flex items-center justify-center gap-2.5 border-golden-hour/25">
            <Sparkles className="w-4 h-4 text-golden-hour shrink-0" />
            <p className="font-body text-xs sm:text-sm text-golden-hour/90 tracking-wide text-center">
              Free during beta &mdash; pricing applies at launch.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <ScrollReveal direction="up">
            <div className="glass-card rounded-2xl p-8 relative h-full border-sky-blue/30 glow-blue hover:border-white/15 transition-all duration-500">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-deep-sky to-sky-blue text-white text-[10px] font-body font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                Most Popular
              </div>

              <div className="text-center mb-8 mt-2">
                <h3 className="font-body text-lg font-bold text-white mb-3">
                  Business
                </h3>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="font-body text-4xl font-bold text-white">
                    $19.99
                  </span>
                  <span className="font-body text-sm text-white/40">
                    /seat/month
                  </span>
                </div>
                <p className="font-body text-xs text-white/30 mt-2">
                  For teams that can&apos;t afford to forget
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {businessFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="font-body text-sm text-white/40">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="block">
                <Button variant="primary" fullWidth>
                  Start Your Organization
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15}>
            <div className="glass-card rounded-2xl p-8 relative h-full hover:border-white/15 transition-all duration-500">
              <div className="text-center mb-8 mt-2">
                <h3 className="font-body text-lg font-bold text-white mb-3">
                  Enterprise
                </h3>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="font-body text-4xl font-bold text-white">
                    Custom
                  </span>
                </div>
                <p className="font-body text-xs text-white/30 mt-2">
                  For organizations with deeper needs
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {enterpriseFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="font-body text-sm text-white/40">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a href="mailto:cole@marcuccilli.com" className="block">
                <Button variant="outline" fullWidth>
                  Contact Us
                </Button>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Personal cross-link ─────────────── */

function PersonalCrossLink() {
  return (
    <section className="py-24 relative overflow-hidden bg-black/10 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-sunrise-coral/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-sunrise-coral" />
          </div>
          <h2 className="font-heading text-xl sm:text-2xl text-white mb-4">
            Here for your family instead?
          </h2>
          <p className="font-body text-sm text-stardust/50 mb-8 max-w-lg mx-auto leading-relaxed">
            Wisdom Journal began as a way to preserve personal wisdom for the
            people you love &mdash; stories, values, and a lifetime of lessons.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-sm text-sky-blue hover:text-golden-hour transition-colors duration-300"
          >
            Explore Wisdom Journal for families
            <ArrowRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ───────────────────── Page ───────────────────── */

export default function BusinessPage() {
  return (
    <div className="relative min-h-screen">
      <DynamicSky />
      <div className="relative z-10">
        <Navbar />
        <main>
          <BusinessHero />
          <ProblemSection />
          <HowItWorksForTeams />
          <UseCasesGrid />
          <BusinessPricing />
          <PersonalCrossLink />
        </main>
        <Footer />
      </div>
    </div>
  );
}
