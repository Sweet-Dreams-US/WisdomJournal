import { Suspense } from "react";
import { getMentionsSummary } from "@/lib/data/get-mentions";
import PeopleClient from "./PeopleClient";

export const dynamic = "force-dynamic";

export default function PeoplePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl animate-pulse">
          <div className="h-8 bg-soft-gray rounded w-48 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-soft-gray rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <PeoplePageContent />
    </Suspense>
  );
}

async function PeoplePageContent() {
  const mentions = await getMentionsSummary();
  return <PeopleClient mentions={mentions} />;
}
