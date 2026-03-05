import { getProfile } from "@/lib/data/get-profile";
import { getDailyQuestions } from "@/lib/data/get-daily-questions";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const [profile, dailySet] = await Promise.all([
    getProfile(),
    getDailyQuestions(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return <DashboardClient profile={profile} dailySet={dailySet} />;
}
