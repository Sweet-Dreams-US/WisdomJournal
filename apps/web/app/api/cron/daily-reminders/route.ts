import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { dailyReminderEmail, streakWarningEmail } from "@/lib/email/templates";

/**
 * Vercel Cron: runs daily at 9 AM UTC.
 * 1. Finds users who have daily_reminder ON and haven't journaled today
 * 2. Sends reminder emails
 * 3. Creates in-app notifications
 * 4. Also sends streak warning emails to users about to lose their streak
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let remindersSent = 0;
  let streakWarningsSent = 0;

  try {
    // 1. Daily reminder emails
    // Find users who opted in for daily_reminder and haven't journaled today
    const { data: usersNeedingReminder } = await admin.rpc(
      "get_users_needing_daily_reminder"
    );

    if (usersNeedingReminder && usersNeedingReminder.length > 0) {
      for (const user of usersNeedingReminder) {
        const template = dailyReminderEmail(
          user.full_name?.split(" ")[0] ?? "there"
        );

        const sent = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
        });

        if (sent) remindersSent++;

        // Also create in-app notification
        await admin.from("notifications").insert({
          user_id: user.id,
          type: "daily_reminder",
          title: "Time to reflect",
          body: "Your daily wisdom question is waiting. Take a moment to journal today.",
          data: {},
        });
      }
    }

    // 2. Streak warning emails
    // Find users with active streaks who haven't journaled today
    const { data: usersAtRisk } = await admin.rpc(
      "get_users_with_streak_at_risk"
    );

    if (usersAtRisk && usersAtRisk.length > 0) {
      for (const user of usersAtRisk) {
        if (user.current_streak < 3) continue; // Only warn for streaks worth preserving

        const template = streakWarningEmail(
          user.full_name?.split(" ")[0] ?? "there",
          user.current_streak
        );

        const sent = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
        });

        if (sent) streakWarningsSent++;

        // In-app notification
        await admin.from("notifications").insert({
          user_id: user.id,
          type: "streak_warning",
          title: `Your ${user.current_streak}-day streak is at risk!`,
          body: "Journal today to keep your streak alive.",
          data: { streak: user.current_streak },
        });
      }
    }
  } catch (error) {
    console.error("Daily reminder cron failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    reminders_sent: remindersSent,
    streak_warnings_sent: streakWarningsSent,
  });
}
