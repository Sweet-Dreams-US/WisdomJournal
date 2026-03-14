import { Suspense } from "react";
import { getProfile } from "@/lib/data/get-profile";
import { getWisdomQueries } from "@/lib/data/get-wisdom-queries";
import { getFriends } from "@/lib/data/get-friends";
import AskClient from "./AskClient";
import { redirect } from "next/navigation";

export default async function AskPage() {
  const [profile, pastQueries, friendsData] = await Promise.all([
    getProfile(),
    getWisdomQueries(),
    getFriends(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  // Build friend options for the target selector
  const friendOptions = friendsData.accepted.map((f) => ({
    friendshipId: f.id,
    userId: f.friend_profile.id,
    name: f.friend_profile.full_name ?? "Unknown",
    sharedCategories: f.their_access_summary?.enabled_count ?? 0,
  }));

  return (
    <Suspense fallback={<div className="max-w-3xl animate-pulse"><div className="h-8 w-48 bg-soft-gray rounded mb-6" /><div className="h-16 bg-soft-gray rounded-2xl" /></div>}>
      <AskClient
        profile={profile}
        pastQueries={pastQueries}
        friendOptions={friendOptions}
      />
    </Suspense>
  );
}
