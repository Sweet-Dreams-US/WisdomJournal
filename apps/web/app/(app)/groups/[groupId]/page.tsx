import { notFound } from "next/navigation";
import { getGroup } from "@/lib/data/get-group";
import GroupDetailClient from "./GroupDetailClient";

interface Props {
  params: { groupId: string };
}

export default async function GroupDetailPage({ params }: Props) {
  const group = await getGroup(params.groupId);

  if (!group) {
    notFound();
  }

  return <GroupDetailClient group={group} />;
}
