import { getFriend } from "@/lib/data/get-friend";
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

  return <FriendDetailClient friend={friend} />;
}
