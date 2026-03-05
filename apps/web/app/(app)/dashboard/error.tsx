"use client";

import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
      <h2 className="text-lg font-bold text-twilight mb-2">Something went wrong</h2>
      <p className="text-sm text-charcoal/60 mb-6">
        We couldn&apos;t load your dashboard. Please try again.
      </p>
      <Button onClick={reset} size="sm">
        Try Again
      </Button>
    </div>
  );
}
