import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { learnPreferredHour } from "@/lib/engine/smart-time";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: schedule } = await supabase
    .from("notification_schedules")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Learn from last 90 days of responses
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const { data: recent } = await supabase
    .from("responses")
    .select("created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("created_at", since);

  const timestamps = (recent ?? []).map((r) => r.created_at);
  const learned = learnPreferredHour(timestamps);

  // Persist the learned hour back
  if (learned) {
    await supabase
      .from("notification_schedules")
      .upsert(
        {
          user_id: user.id,
          learned_hour_local: learned.hour,
          learned_from_count: learned.count,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
  }

  return NextResponse.json({
    schedule: schedule ?? null,
    learned,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { preferred_hour_local, quiet_hours_start, quiet_hours_end, web_push_subscription } = body;

  const { error } = await supabase
    .from("notification_schedules")
    .upsert(
      {
        user_id: user.id,
        preferred_hour_local: preferred_hour_local ?? null,
        quiet_hours_start: quiet_hours_start ?? null,
        quiet_hours_end: quiet_hours_end ?? null,
        web_push_subscription: web_push_subscription ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
