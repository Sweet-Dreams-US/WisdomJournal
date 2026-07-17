import { getCalendarData } from "@/lib/data/get-calendar-data";
import { getProfile } from "@/lib/data/get-profile";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const [entries, profile] = await Promise.all([
    getCalendarData(),
    getProfile(),
  ]);

  return (
    <CalendarClient
      entries={entries}
      currentStreak={profile?.current_streak ?? 0}
    />
  );
}
