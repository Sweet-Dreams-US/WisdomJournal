import { redirect } from "next/navigation";
import { getAchievements } from "@/lib/data/get-achievements";
import AchievementsClient from "./AchievementsClient";

export default async function AchievementsPage() {
  const data = await getAchievements();

  if (!data) {
    redirect("/login");
  }

  return <AchievementsClient data={data} />;
}
