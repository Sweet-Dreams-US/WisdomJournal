import { createClient } from "@/lib/supabase/server";
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

  // Fetch response dates for the last 49 days (activity heatmap)
  let responseDates: string[] = [];
  try {
    const supabase = createClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 49);
    const { data } = await supabase
      .from("responses")
      .select("created_at")
      .eq("user_id", profile.id)
      .is("deleted_at", null)
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false });

    responseDates = (data ?? []).map((r: any) => r.created_at);
  } catch (e) {
    console.error("Failed to load response dates:", e);
  }

  // Fetch recent favorites (up to 3)
  let recentFavorites: any[] = [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("responses")
      .select("id, body, created_at, question:questions(text)")
      .eq("user_id", profile.id)
      .eq("is_favorite", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(3);

    recentFavorites = data ?? [];
  } catch (e) {
    console.error("Failed to load favorites:", e);
  }

  // Fetch unread notification count
  let unreadNotificationCount = 0;
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .is("read_at", null);

    unreadNotificationCount = count ?? 0;
  } catch (e) {
    console.error("Failed to load notification count:", e);
  }

  return (
    <DashboardClient
      profile={profile}
      dailySet={dailySet}
      responseDates={responseDates}
      recentFavorites={recentFavorites}
      unreadNotificationCount={unreadNotificationCount}
    />
  );
}
