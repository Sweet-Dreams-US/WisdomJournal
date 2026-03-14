import { Suspense } from "react";
import { getFriends } from "@/lib/data/get-friends";
import FriendsClient from "./FriendsClient";

export default async function FriendsPage() {
  const friends = await getFriends();

  return (
    <Suspense
      fallback={
        <div className="max-w-3xl animate-pulse space-y-4">
          <div className="h-8 w-48 bg-soft-gray rounded" />
          <div className="h-32 bg-soft-gray rounded-2xl" />
          <div className="h-32 bg-soft-gray rounded-2xl" />
        </div>
      }
    >
      <FriendsClient friends={friends} />
    </Suspense>
  );
}
