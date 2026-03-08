"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto mt-20">
      <Card padding="lg" className="text-center">
        <AlertTriangle className="w-12 h-12 text-golden-hour mx-auto mb-4" />
        <h2 className="text-xl font-bold text-twilight mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-charcoal/60 mb-6 font-body">
          This page ran into an error. This usually means a database migration
          needs to be run, or there is a temporary connection issue.
        </p>
        <Button onClick={reset} size="md">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </Card>
    </div>
  );
}
