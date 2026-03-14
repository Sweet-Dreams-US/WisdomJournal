import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get existing progress or create new row
  let { data: progress } = await admin
    .from("onboarding_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!progress) {
    const { data: newProgress, error } = await admin
      .from("onboarding_progress")
      .insert({ user_id: user.id })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    progress = newProgress;
  }

  return NextResponse.json(progress);
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

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Ensure row exists
  const { data: existing } = await admin
    .from("onboarding_progress")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    await admin.from("onboarding_progress").insert({ user_id: user.id });
  }

  // Build update payload
  const updateData: Record<string, unknown> = { [step]: true };

  if (step === "categories_selected" && data?.selected_category_ids) {
    updateData.selected_category_ids = data.selected_category_ids;
  }

  if (step === "reminder_set" && data?.reminder_time) {
    updateData.reminder_time = data.reminder_time;
  }

  const { data: updated, error } = await admin
    .from("onboarding_progress")
    .update(updateData)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
