import { getProfile } from "@/lib/data/get-profile";
import { getDailyQuestions } from "@/lib/data/get-daily-questions";
import { getDailySerendipity } from "@/lib/data/get-serendipity";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const [dailySet, serendipity] = await Promise.all([
    getDailyQuestions().catch((e) => {
      console.error("Failed to load daily questions:", e);
      return null;
    }),
    getDailySerendipity().catch((e) => {
      console.error("Failed to load serendipity:", e);
      return null;
    }),
  ]);

  return <DashboardClient profile={profile} dailySet={dailySet} serendipity={serendipity} />;
}
