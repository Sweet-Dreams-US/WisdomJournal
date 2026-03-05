import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data/get-profile";
import { getGroups } from "@/lib/data/get-groups";
import GroupsClient from "./GroupsClient";

export default async function GroupsPage() {
  const [profile, groups] = await Promise.all([
    getProfile(),
    getGroups(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return <GroupsClient profile={profile} groups={groups} />;
}
