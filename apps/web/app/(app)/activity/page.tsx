import { Suspense } from "react";
import { getActivityFeed } from "@/lib/data/get-activity-feed";
import ActivityFeedClient from "./ActivityFeedClient";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl animate-pulse">
          <div className="h-8 bg-soft-gray rounded w-48 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-soft-gray rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <ActivityPageContent />
    </Suspense>
  );
}

async function ActivityPageContent() {
  const events = await getActivityFeed();
  return <ActivityFeedClient initialEvents={events} />;
}
