import { MessageSquare, Archive, Search } from "lucide-react";
import Card from "@/components/ui/Card";

const steps = [
  {
    icon: MessageSquare,
    title: "Answer Daily Questions",
    description:
      "Each day, receive thoughtful prompts designed to draw out your life experiences, values, and hard-won knowledge.",
  },
  {
    icon: Archive,
    title: "Build Your Wisdom Archive",
    description:
      "Your responses are securely stored and organized, creating a rich, searchable library of your unique perspective.",
  },
  {
    icon: Search,
    title: "Share Your Wisdom",
    description:
      "Your loved ones or business successors can ask questions and receive answers drawn from your accumulated wisdom via AI.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-twilight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-charcoal/60 max-w-2xl mx-auto">
            Three simple steps to preserving a lifetime of wisdom
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={step.title} hover padding="lg" className="text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-deep-sky text-white flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-sky-blue/10 flex items-center justify-center">
                <step.icon className="w-8 h-8 text-deep-sky" />
              </div>
              <h3 className="text-xl font-bold text-twilight mb-3">
                {step.title}
              </h3>
              <p className="text-charcoal/60 leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
