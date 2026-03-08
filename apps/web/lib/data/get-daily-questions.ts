import { createClient } from "@/lib/supabase/server";
import type { DailyQuestionSet } from "@wisdom-journal/shared";
import { generateDailyQuestions } from "@/lib/engine/question-engine";

export async function getDailyQuestions(): Promise<DailyQuestionSet | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const today = new Date().toISOString().split("T")[0];

    // Try to fetch existing set for today
    const { data: existingSet } = await supabase
      .from("daily_question_sets")
      .select(
        `
        *,
        items:daily_question_items(
          *,
          question:questions(
            *,
            category:categories(*)
          )
        )
        `
      )
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (existingSet) {
      // Sort items by sort_order
      existingSet.items?.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
      return existingSet as unknown as DailyQuestionSet;
    }

    // No set exists — generate one
    const newSet = await generateDailyQuestions(user.id, today);
    return newSet;
  } catch (error) {
    console.error("getDailyQuestions error:", error);
    return null;
  }
}
