import { getProfile } from "@/lib/data/get-profile";
import { getDailyQuestions } from "@/lib/data/get-daily-questions";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  // Fetch daily questions separately so it doesn't crash the whole page
  let dailySet = null;
  try {
    dailySet = await getDailyQuestions();
  } catch (e) {
    console.error("Failed to load daily questions:", e);
  }

  return <DashboardClient profile={profile} dailySet={dailySet} />;
}
