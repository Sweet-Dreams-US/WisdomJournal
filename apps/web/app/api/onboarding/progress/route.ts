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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    // Missing server config — don't force users onto the onboarding page.
    return NextResponse.json({ completed_at: new Date().toISOString() });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);

  // Use maybeSingle so a missing row doesn't throw.
  const { data: existing } = await admin
    .from("onboarding_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
  }

  // Upsert is idempotent under the unique (user_id) constraint. This handles
  // any race where two tabs trigger the initial fetch at the same time.
  const { data: created, error } = await admin
    .from("onboarding_progress")
    .upsert({ user_id: user.id }, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("onboarding progress upsert failed:", error);
    // Do NOT force a 500 that would break the guard. Fall back to a permissive
    // shape so the app stays usable; client will just skip the guard check.
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const admin = createServiceClient(supabaseUrl, serviceKey);

  // Ensure row exists via upsert (idempotent thanks to unique user_id constraint).
  await admin
    .from("onboarding_progress")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

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
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
