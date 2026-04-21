import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Uses the authenticated server client only. The onboarding_progress RLS
 * policies already allow each user to select/insert/update their own row,
 * so we don't need a service-role key here.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("onboarding_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
  }

  // Idempotent self-insert under RLS policy "Users can create their own onboarding".
  const { data: created, error } = await supabase
    .from("onboarding_progress")
    .upsert({ user_id: user.id }, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("onboarding progress upsert failed:", error);
    // Return a permissive shape so the client guard doesn't block navigation.
    return NextResponse.json({ completed_at: new Date().toISOString(), user_id: user.id });
  }

  return NextResponse.json(created ?? { user_id: user.id });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { step, data } = body;

  const validSteps = [
    "welcome_seen",
    "categories_selected",
    "reminder_set",
    "first_question_answered",
  ];

  if (!validSteps.includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  // Ensure row exists (idempotent under unique user_id constraint + RLS).
  await supabase
    .from("onboarding_progress")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  const updateData: Record<string, unknown> = { [step]: true };

  if (step === "categories_selected" && data?.selected_category_ids) {
    updateData.selected_category_ids = data.selected_category_ids;
  }

  if (step === "reminder_set" && data?.reminder_time) {
    updateData.reminder_time = data.reminder_time;
  }

  const { data: updated, error } = await supabase
    .from("onboarding_progress")
    .update(updateData)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
