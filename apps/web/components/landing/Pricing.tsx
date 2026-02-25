import { Check } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { SUBSCRIPTION_TIERS } from "@wisdom-journal/shared";

const tiers = [
  { key: "free" as const, popular: false },
  { key: "standard" as const, popular: true },
  { key: "premium" as const, popular: false },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-soft-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-twilight mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-lg text-charcoal/60 max-w-2xl mx-auto">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map(({ key, popular }) => {
            const tier = SUBSCRIPTION_TIERS[key];
            return (
              <Card
                key={key}
                padding="lg"
                className={`relative ${
                  popular
                    ? "border-2 border-deep-sky ring-1 ring-deep-sky/20"
                    : "border border-soft-gray"
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-deep-sky text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-twilight mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-twilight">
                      ${tier.price}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-warm-gray">/month</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-charcoal/70">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="block">
                  <Button
                    variant={popular ? "primary" : "outline"}
                    fullWidth
                  >
                    {tier.price === 0 ? "Get Started Free" : "Start Free Trial"}
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
