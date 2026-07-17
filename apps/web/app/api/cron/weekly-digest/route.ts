import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { weeklyDigestEmail } from "@/lib/email/templates";

/**
 * Vercel Cron: runs every Sunday at 2 PM UTC.
 * Sends a weekly digest email to all users (beta) with stats from the past 7 days.
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

  let emailsSent = 0;
  let errors = 0;

  try {
    // For beta: send to all users. Later: filter by weekly_digest preference.
    const { data: users } = await admin
      .from("profiles")
      .select("id, email, full_name, current_streak")
      .eq("is_deceased", false);

    if (!users || users.length === 0) {
      return NextResponse.json({ ok: true, emails_sent: 0 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Format date range for subject line
    const rangeStart = sevenDaysAgo.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const rangeEnd = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const dateRange = `${rangeStart} \u2013 ${rangeEnd}`;

    for (const user of users) {
      try {
        // 1. Responses this week
        const { data: weekResponses } = await admin
          .from("responses")
          .select("id, word_count, created_at")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .gte("created_at", sevenDaysAgoISO)
          .order("created_at", { ascending: false });

        const responsesCount = weekResponses?.length ?? 0;
        const totalWords = weekResponses?.reduce(
          (sum: number, r: any) => sum + (r.word_count || 0),
          0
        ) ?? 0;

        // 2. Categories covered this week
        const responseIds = (weekResponses ?? []).map((r: any) => r.id);
        let categoriesCovered: string[] = [];
        let topCategory: string | null = null;

        if (responseIds.length > 0) {
          const { data: catData } = await admin
            .from("response_categories")
            .select("category:categories(name)")
            .in("response_id", responseIds);

          if (catData) {
            const catCounts: Record<string, number> = {};
            for (const rc of catData) {
              const name = (rc as any).category?.name;
              if (name) {
                catCounts[name] = (catCounts[name] || 0) + 1;
              }
            }
            categoriesCovered = Object.keys(catCounts);

            // Top category = most entries
            if (categoriesCovered.length > 0) {
              topCategory = Object.entries(catCounts).sort(
                (a, b) => b[1] - a[1]
              )[0][0];
            }
          }
        }

        // 3. New achievements earned this week
        const { data: recentAchievements } = await admin
          .from("user_achievements")
          .select("achievement:achievements(name)")
          .eq("user_id", user.id)
          .gte("earned_at", sevenDaysAgoISO);

        const newAchievements = (recentAchievements ?? [])
          .map((a: any) => a.achievement?.name)
          .filter(Boolean);

        // 4. Build and send email
        const firstName = user.full_name?.split(" ")[0] ?? "there";
        const template = weeklyDigestEmail(firstName, {
          responsesCount,
          totalWords,
          currentStreak: user.current_streak ?? 0,
          categoriesCovered,
          topCategory,
          newAchievements,
          dateRange,
        });

        const sent = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
        });

        if (sent) emailsSent++;
      } catch (userError) {
        console.error(
          `Weekly digest failed for user ${user.id}:`,
          userError
        );
        errors++;
      }
    }
  } catch (error) {
    console.error("Weekly digest cron failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    emails_sent: emailsSent,
    errors,
  });
}
