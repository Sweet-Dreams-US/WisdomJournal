import { Suspense } from "react";
import { getResponses } from "@/lib/data/get-responses";
import JournalClient from "./JournalClient";

export default async function JournalPage() {
  const responses = await getResponses();

  return (
    <Suspense fallback={<JournalSkeleton />}>
      <JournalClient initialResponses={responses} />
    </Suspense>
  );
}

function JournalSkeleton() {
  return (
    <div className="max-w-4xl animate-pulse">
      <div className="h-8 w-64 bg-soft-gray rounded mb-2" />
      <div className="h-5 w-80 bg-soft-gray rounded mb-6" />
      <div className="h-14 bg-soft-gray rounded-xl mb-4" />
      <div className="h-10 bg-soft-gray rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-soft-gray rounded-card" />
        ))}
      </div>
    </div>
  );
}
