import { Heart, Briefcase } from "lucide-react";
import Card from "@/components/ui/Card";

const useCases = [
  {
    icon: Heart,
    category: "Personal",
    title: "Legacy & Family Memories",
    items: [
      "Preserve stories and life lessons for future generations",
      "Capture family traditions, recipes, and cultural heritage",
      "Create a living memoir your grandchildren can interact with",
      "Document your values and beliefs in your own words",
    ],
  },
  {
    icon: Briefcase,
    category: "Business",
    title: "Knowledge Transfer",
    items: [
      "Capture institutional knowledge before key people retire",
      "Accelerate executive onboarding with predecessor wisdom",
      "Preserve decision-making frameworks and rationale",
      "Build a queryable knowledge base from experienced leaders",
    ],
  },
];

export default function UseCases() {
  return (
    <section className="py-24 bg-soft-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-twilight mb-4">
            Built For What Matters
          </h2>
          <p className="text-lg text-charcoal/60 max-w-2xl mx-auto">
            Whether preserving personal legacy or business knowledge, Wisdom
            Journal adapts to your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase) => (
            <Card key={useCase.category} hover padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-deep-sky/10 flex items-center justify-center">
                  <useCase.icon className="w-6 h-6 text-deep-sky" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-deep-sky uppercase tracking-wide">
                    {useCase.category}
                  </p>
                  <h3 className="text-xl font-bold text-twilight">
                    {useCase.title}
                  </h3>
                </div>
              </div>
              <ul className="space-y-3">
                {useCase.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-golden-hour mt-2.5 shrink-0" />
                    <span className="text-charcoal/70">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
