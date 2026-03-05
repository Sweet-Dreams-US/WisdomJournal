import { createClient } from "@/lib/supabase/server";
import type { DailyQuestionSet } from "@wisdom-journal/shared";
import { rankQuestions, selectDiverseQuestions } from "./question-scoring";

/**
 * Generate a daily question set for a user.
 * Called when no set exists for today.
 *
 * Algorithm:
 * 1. Get candidate pool: active questions not answered in 30 days, not skipped in 14 days
 * 2. Score each using weighted factors
 * 3. Select 4 category questions with diversity constraints
 * 4. Select 1 daily reflection question
 * 5. Persist the set and return it
 *
 * Race condition protection: UNIQUE(user_id, date) catches duplicates.
 */
export async function generateDailyQuestions(
  userId: string,
  date: string
): Promise<DailyQuestionSet | null> {
  const supabase = createClient();

  // Get user's category stats for scoring
  const { data: categoryStats } = await supabase
    .from("user_category_stats")
    .select("category_id, response_count")
    .eq("user_id", userId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_responses")
    .eq("id", userId)
    .single();

  const totalResponses = profile?.total_responses ?? 0;

  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .neq("slug", "daily_reflection");

  const totalCategories = categories?.length ?? 10;

  // Get candidate pool: active category questions not recently shown
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: candidates } = await supabase
    .from("questions")
    .select(
      `
      id, text, category_id, subcategory_id, difficulty, emotional_weight,
      avg_rating, skip_rate, is_daily_reflection,
      category:categories(slug),
      history:user_question_history!left(shown_at, answered, skipped)
      `
    )
    .eq("is_active", true)
    .eq("is_daily_reflection", false);

  if (!candidates || candidates.length === 0) {
    return null;
  }

  // Filter out recently answered (30 days) or recently skipped (14 days)
  const filteredCandidates = candidates
    .filter((q: any) => {
      const history = q.history?.find?.((h: any) => h) ?? q.history?.[0];
      if (!history) return true; // Never shown = eligible
      if (history.answered) {
        const answeredDate = new Date(history.shown_at);
        return answeredDate < thirtyDaysAgo;
      }
      if (history.skipped) {
        const skippedDate = new Date(history.shown_at);
        return skippedDate < fourteenDaysAgo;
      }
      return true;
    })
    .map((q: any) => {
      const history = q.history?.find?.((h: any) => h) ?? q.history?.[0];
      return {
        id: q.id,
        text: q.text,
        category_id: q.category_id,
        category_slug: q.category?.slug ?? "",
        subcategory_id: q.subcategory_id,
        difficulty: q.difficulty,
        emotional_weight: q.emotional_weight,
        avg_rating: q.avg_rating,
        skip_rate: q.skip_rate ?? 0,
        is_daily_reflection: q.is_daily_reflection,
        last_shown_at: history?.shown_at ?? null,
        was_answered: history?.answered ?? false,
        was_skipped: history?.skipped ?? false,
      };
    });

  // Score and select 4 category questions
  const ranked = rankQuestions(
    filteredCandidates,
    {
      userCategoryStats: categoryStats ?? [],
      totalResponses,
      totalCategories,
    },
    "medium"
  );

  const selectedCategory = selectDiverseQuestions(ranked, 4);

  // Select 1 daily reflection (random from pool)
  const { data: reflections } = await supabase
    .from("questions")
    .select("id, text, category_id, subcategory_id, difficulty, emotional_weight")
    .eq("is_active", true)
    .eq("is_daily_reflection", true)
    .limit(50);

  let selectedReflection = reflections?.[0];
  if (reflections && reflections.length > 0) {
    selectedReflection =
      reflections[Math.floor(Math.random() * reflections.length)];
  }

  if (selectedCategory.length === 0 && !selectedReflection) {
    return null;
  }

  // Build the items list
  const allQuestions = [
    ...selectedCategory.map((q, i) => ({
      question_id: q.id,
      sort_order: i + 1,
    })),
  ];

  if (selectedReflection) {
    allQuestions.push({
      question_id: selectedReflection.id,
      sort_order: allQuestions.length + 1,
    });
  }

  // Insert the daily set — handle race condition with unique constraint
  const { data: newSet, error: setError } = await supabase
    .from("daily_question_sets")
    .insert({
      user_id: userId,
      date,
      status: "pending",
    })
    .select()
    .single();

  if (setError) {
    // Unique violation means another request already created it
    if (setError.code === "23505") {
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
        .eq("user_id", userId)
        .eq("date", date)
        .single();

      if (existingSet) {
        existingSet.items?.sort(
          (a: { sort_order: number }, b: { sort_order: number }) =>
            a.sort_order - b.sort_order
        );
      }
      return existingSet as unknown as DailyQuestionSet;
    }
    return null;
  }

  // Insert daily question items
  const items = allQuestions.map((q) => ({
    set_id: newSet.id,
    question_id: q.question_id,
    sort_order: q.sort_order,
  }));

  await supabase.from("daily_question_items").insert(items);

  // Upsert question history
  for (const q of allQuestions) {
    await supabase
      .from("user_question_history")
      .upsert(
        {
          user_id: userId,
          question_id: q.question_id,
          shown_at: new Date().toISOString(),
        },
        { onConflict: "user_id,question_id" }
      );
  }

  // Re-fetch with full joins
  const { data: fullSet } = await supabase
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
    .eq("id", newSet.id)
    .single();

  if (fullSet) {
    fullSet.items?.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
  }

  return fullSet as unknown as DailyQuestionSet;
}
