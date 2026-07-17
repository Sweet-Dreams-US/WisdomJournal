import { getProfile } from "@/lib/data/get-profile";
import { getDailyQuestions } from "@/lib/data/get-daily-questions";
import { getMemories, type Memory } from "@/lib/data/get-memories";
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

  // "On this day" memories are best-effort — never block the dashboard
  let memories: Memory[] = [];
  try {
    memories = await getMemories();
  } catch (e) {
    console.error("Failed to load memories:", e);
  }

  return (
    <DashboardClient profile={profile} dailySet={dailySet} memories={memories} />
  );
}
