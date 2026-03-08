import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data/get-profile";
import { getEncyclopediaStats } from "@/lib/data/get-encyclopedia-stats";
import { getNotificationPrefs } from "@/lib/data/get-notification-prefs";
import { getGroups } from "@/lib/data/get-groups";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch these independently so one failure doesn't crash the page
  let stats = null;
  let notifPrefs = null;
  let groups: Awaited<ReturnType<typeof getGroups>> = [];

  try {
    [stats, notifPrefs, groups] = await Promise.all([
      getEncyclopediaStats(),
      getNotificationPrefs(),
      getGroups(),
    ]);
  } catch (e) {
    console.error("Failed to load profile data:", e);
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
