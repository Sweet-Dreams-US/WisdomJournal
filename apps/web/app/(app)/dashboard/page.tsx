import { Sun, Flame, BookOpen } from "lucide-react";
import Card from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-twilight mb-2">
          Good morning! Ready to share some wisdom?
        </h2>
        <p className="text-charcoal/60">
          Your daily questions are waiting for you.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <Card padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-golden-hour/10 flex items-center justify-center">
            <Flame className="w-6 h-6 text-golden-hour" />
          </div>
          <div>
            <p className="text-2xl font-bold text-twilight">0</p>
            <p className="text-sm text-charcoal/60">Day Streak</p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-deep-sky/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-deep-sky" />
          </div>
          <div>
            <p className="text-2xl font-bold text-twilight">0</p>
            <p className="text-sm text-charcoal/60">Responses</p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sunrise-coral/10 flex items-center justify-center">
            <Sun className="w-6 h-6 text-sunrise-coral" />
          </div>
          <div>
            <p className="text-2xl font-bold text-twilight">3</p>
            <p className="text-sm text-charcoal/60">Questions Today</p>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="text-center py-12">
          <Sun className="w-16 h-16 text-golden-hour mx-auto mb-4" />
          <h3 className="text-xl font-bold text-twilight mb-2">
            Daily Questions Coming Soon
          </h3>
          <p className="text-charcoal/60 max-w-md mx-auto">
            Your personalized daily wisdom prompts will appear here.
            Check back soon as we prepare thoughtful questions just for you.
          </p>
        </div>
      </Card>
    </div>
  );
}
