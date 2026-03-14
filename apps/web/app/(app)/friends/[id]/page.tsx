import { getFriend } from "@/lib/data/get-friend";
import { getFriendWisdom } from "@/lib/data/get-friend-wisdom";
import { redirect } from "next/navigation";
import FriendDetailClient from "./FriendDetailClient";

export default async function FriendDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const friend = await getFriend(params.id);

  if (!friend || friend.friendship.status !== "accepted") {
    redirect("/friends");
  }

  const sharedWisdom = await getFriendWisdom(params.id);

  return (
    <FriendDetailClient
      friend={friend}
      initialWisdom={sharedWisdom}
    />
  );
}
