import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { item_id, set_id, question_id } = await request.json();

  if (!item_id) {
    return NextResponse.json(
      { error: "item_id is required" },
      { status: 400 }
    );
  }

  // Mark the daily item as skipped
  const { error } = await supabase
    .from("daily_question_items")
    .update({ skipped: true })
    .eq("id", item_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update question history
  if (question_id) {
    await supabase
      .from("user_question_history")
      .upsert(
        {
          user_id: user.id,
          question_id,
          skipped: true,
          shown_at: new Date().toISOString(),
        },
        { onConflict: "user_id,question_id" }
      );
  }

  // Check if all items are done → update set status
  if (set_id) {
    const { data: setItems } = await supabase
      .from("daily_question_items")
      .select("response_id, skipped")
      .eq("set_id", set_id);

    if (setItems) {
      const allDone = setItems.every(
        (item: any) => item.response_id !== null || item.skipped
      );
      const allSkipped = setItems.every((item: any) => item.skipped);
      const anyDone = setItems.some(
        (item: any) => item.response_id !== null
      );

      let status = "pending";
      if (allSkipped) status = "skipped";
      else if (allDone) status = "completed";
      else if (anyDone) status = "partial";

      await supabase
        .from("daily_question_sets")
        .update({ status })
        .eq("id", set_id);
    }
  }

  return NextResponse.json({ success: true });
}
