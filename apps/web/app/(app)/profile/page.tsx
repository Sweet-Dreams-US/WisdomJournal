import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data/get-profile";
import { getEncyclopediaStats } from "@/lib/data/get-encyclopedia-stats";
import { getNotificationPrefs } from "@/lib/data/get-notification-prefs";
import { getGroups } from "@/lib/data/get-groups";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const [profile, stats, notifPrefs, groups] = await Promise.all([
    getProfile(),
    getEncyclopediaStats(),
    getNotificationPrefs(),
    getGroups(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <ProfileClient
      profile={profile}
      stats={stats}
      notifPrefs={notifPrefs}
      groups={groups}
    />
  );
}
