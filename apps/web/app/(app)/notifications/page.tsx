import { Suspense } from "react";
import { getNotifications } from "@/lib/data/get-notifications";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const result = await getNotifications();

  return (
    <Suspense
      fallback={
        <div className="max-w-3xl animate-pulse">
          <div className="h-8 w-48 bg-soft-gray rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-soft-gray rounded-card" />
            ))}
          </div>
        </div>
      }
    >
      <NotificationsClient
        initialNotifications={result.notifications}
        initialUnreadCount={result.unread_count}
      />
    </Suspense>
  );
}
