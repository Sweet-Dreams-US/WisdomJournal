import { createClient } from "@/lib/supabase/server";
import type { DailyQuestionSet } from "@wisdom-journal/shared";
import { rankQuestions, selectDiverseQuestions } from "./question-scoring";

/**
 * Generate a daily question set for a user.
 * Called when no set exists for today.
 */
export async function generateDailyQuestions(
  userId: string,
  date: string
): Promise<DailyQuestionSet | null> {
  const supabase = createClient();

  try {
    // Get user's category stats for scoring
    const { data: categoryStats } = await supabase
      .from("user_category_stats")
      .select("category_id, response_count")
      .eq("user_id", userId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("total_responses, work_questions_enabled")
      .eq("id", userId)
      .maybeSingle();

    const totalResponses = profile?.total_responses ?? 0;
    const workQuestionsEnabled = profile?.work_questions_enabled ?? true;

    // Check for an active organization membership (business questions)
    const { data: orgMembership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const isActiveOrgMember = !!orgMembership;

    const { data: categories } = await supabase
      .from("categories")
      .select("id")
      .neq("slug", "daily_reflection")
      .eq("context_type", "personal");

    const totalCategories = categories?.length ?? 10;

    // Get candidate pool: sample from each category to ensure diversity
    // Fetch a random spread across all categories instead of first 500 rows
    const fetchCandidatesForCategories = async (
      catIds: string[]
    ): Promise<any[]> => {
      const pool: any[] = [];
      for (const catId of catIds) {
        const { data: catQuestions } = await supabase
          .from("questions")
          .select(
            `
            id, text, category_id, subcategory_id, difficulty, emotional_weight,
            avg_rating, skip_rate, is_daily_reflection,
            category:categories(slug)
            `
          )
          .eq("is_active", true)
          .eq("is_daily_reflection", false)
          .eq("category_id", catId)
          .limit(50);

        if (catQuestions) pool.push(...catQuestions);
      }
      return pool;
    };

    const categoryIds = categories?.map((c: any) => c.id) ?? [];
    const allCandidates = await fetchCandidatesForCategories(categoryIds);

    const candidates = allCandidates;
    const candidateError = null;

    if (candidateError) {
      console.error("Question query error:", candidateError);
      return null;
    }

    if (!candidates || candidates.length === 0) {
      console.error("No candidate questions found in database");
      return null;
    }

    // Fetch user's question history separately to avoid complex join issues
    const { data: historyRows } = await supabase
      .from("user_question_history")
      .select("question_id, shown_at, answered, skipped")
      .eq("user_id", userId);

    const historyMap = new Map<string, { shown_at: string; answered: boolean; skipped: boolean }>();
    if (historyRows) {
      for (const h of historyRows) {
        historyMap.set(h.question_id, h);
      }
    }

    // Filter out recently answered (30 days) or recently skipped (14 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const filterAndMapCandidates = (pool: any[]) =>
      pool
        .filter((q: any) => {
          const history = historyMap.get(q.id);
          if (!history) return true;
          if (history.answered) {
            return new Date(history.shown_at) < thirtyDaysAgo;
          }
          if (history.skipped) {
            return new Date(history.shown_at) < fourteenDaysAgo;
          }
          return true;
        })
        .map((q: any) => {
          const history = historyMap.get(q.id);
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

    const filteredCandidates = filterAndMapCandidates(candidates);

    if (filteredCandidates.length === 0) {
      console.error("All questions filtered out by history");
      return null;
    }

    const scoringContext = {
      userCategoryStats: categoryStats ?? [],
      totalResponses,
      totalCategories,
    };

    // Score and select 4 category questions
    const ranked = rankQuestions(filteredCandidates, scoringContext, "medium");

    let selectedCategory = selectDiverseQuestions(ranked, 4);
    let selectedBusiness: typeof selectedCategory = [];

    // Org members with work questions enabled get 2 personal + 2 business
    if (isActiveOrgMember && workQuestionsEnabled) {
      const { data: businessCategories } = await supabase
        .from("categories")
        .select("id")
        .eq("context_type", "business");

      const businessCategoryIds =
        businessCategories?.map((c: any) => c.id) ?? [];

      if (businessCategoryIds.length > 0) {
        const businessCandidates = await fetchCandidatesForCategories(
          businessCategoryIds
        );
        const filteredBusiness = filterAndMapCandidates(businessCandidates);

        if (filteredBusiness.length > 0) {
          const rankedBusiness = rankQuestions(
            filteredBusiness,
            scoringContext,
            "medium"
          );
          selectedBusiness = selectDiverseQuestions(rankedBusiness, 2);

          if (selectedBusiness.length > 0) {
            // Reduce personal questions to 2 to make room for business
            selectedCategory = selectDiverseQuestions(ranked, 2);
          }
        }
      }
      // If no business questions exist yet, fall back to 4 personal silently
    }

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

    if (
      selectedCategory.length === 0 &&
      selectedBusiness.length === 0 &&
      !selectedReflection
    ) {
      return null;
    }

    // Build the items list: personal first, then business, then reflection
    const allQuestions = [...selectedCategory, ...selectedBusiness].map(
      (q, i) => ({
        question_id: q.id,
        sort_order: i + 1,
      })
    );

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
      if (setError.code === "23505") {
        // Race condition: another request created the set
        return await refetchSet(supabase, userId, date);
      }
      console.error("Failed to create daily set:", setError);
      return null;
    }

    // Insert daily question items
    const items = allQuestions.map((q) => ({
      set_id: newSet.id,
      question_id: q.question_id,
      sort_order: q.sort_order,
    }));

    const { error: itemsError } = await supabase
      .from("daily_question_items")
      .insert(items);

    if (itemsError) {
      console.error("Failed to insert daily items:", itemsError);
    }

    // Upsert question history (fire and forget)
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
    return await refetchSet(supabase, newSet.id);
  } catch (error) {
    console.error("generateDailyQuestions error:", error);
    return null;
  }
}

async function refetchSet(
  supabase: ReturnType<typeof createClient>,
  idOrUserId: string,
  date?: string
): Promise<DailyQuestionSet | null> {
  let query = supabase
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
    );

  if (date) {
    query = query.eq("user_id", idOrUserId).eq("date", date);
  } else {
    query = query.eq("id", idOrUserId);
  }

  const { data: fullSet } = await query.single();

  if (fullSet) {
    fullSet.items?.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
  }

  return fullSet as unknown as DailyQuestionSet;
}
