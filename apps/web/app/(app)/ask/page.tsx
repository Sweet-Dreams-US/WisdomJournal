import { MessageCircle } from "lucide-react";
import Card from "@/components/ui/Card";

export default function AskPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-twilight mb-2">
          Ask Wisdom
        </h2>
        <p className="text-charcoal/60">
          Query the wisdom you&apos;ve shared and get AI-powered answers.
        </p>
      </div>

      <Card padding="lg">
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-deep-sky mx-auto mb-4" />
          <h3 className="text-xl font-bold text-twilight mb-2">
            Coming Soon
          </h3>
          <p className="text-charcoal/60 max-w-md mx-auto">
            Once you&apos;ve built up your wisdom archive, you and your loved
            ones will be able to ask questions and receive AI-powered answers
            drawn from your unique perspective.
          </p>
        </div>
      </Card>
    </div>
  );
}
