import { BookOpen } from "lucide-react";
import Card from "@/components/ui/Card";

export default function JournalPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-twilight mb-2">
          Your Wisdom Journal
        </h2>
        <p className="text-charcoal/60">
          Browse and revisit your past responses.
        </p>
      </div>

      <Card padding="lg">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-deep-sky mx-auto mb-4" />
          <h3 className="text-xl font-bold text-twilight mb-2">
            No Entries Yet
          </h3>
          <p className="text-charcoal/60 max-w-md mx-auto">
            Once you start answering daily questions, your responses will
            appear here as a searchable archive of your wisdom.
          </p>
        </div>
      </Card>
    </div>
  );
}
