/**
 * Question scoring for the daily question engine.
 * Scores candidate questions using weighted factors to ensure
 * diverse, balanced, and engaging daily question sets.
 */

interface CandidateQuestion {
  id: string;
  text: string;
  category_id: string;
  category_slug: string;
  subcategory_id: string | null;
  difficulty: string;
  emotional_weight: string;
  avg_rating: number | null;
  skip_rate: number;
  is_daily_reflection: boolean;
  // From history join
  last_shown_at: string | null;
  was_answered: boolean;
  was_skipped: boolean;
}

interface UserCategoryStat {
  category_id: string;
  response_count: number;
}

interface ScoringContext {
  userCategoryStats: UserCategoryStat[];
  totalResponses: number;
  totalCategories: number;
}

interface ScoredQuestion extends CandidateQuestion {
  score: number;
}

// Scoring weights
const WEIGHTS = {
  category_need: 0.35,
  difficulty_balance: 0.20,
  recency_bonus: 0.15,
  quality_score: 0.15,
  follow_up_relevance: 0.10,
  randomness: 0.05,
};

/**
 * Score a candidate question based on multiple weighted factors.
 */
export function scoreQuestion(
  question: CandidateQuestion,
  context: ScoringContext,
  targetDifficulty: string
): number {
  let score = 0;

  // 1. Category need (0.35) — prioritize underrepresented categories
  const catStat = context.userCategoryStats.find(
    (s) => s.category_id === question.category_id
  );
  const catResponseCount = catStat?.response_count ?? 0;
  const avgPerCategory =
    context.totalResponses / Math.max(context.totalCategories, 1);
  const categoryNeed = avgPerCategory > 0
    ? Math.max(0, 1 - catResponseCount / (avgPerCategory * 2))
    : 1;
  score += categoryNeed * WEIGHTS.category_need;

  // 2. Difficulty balance (0.20) — favor the target difficulty
  const difficultyMatch = question.difficulty === targetDifficulty ? 1.0 : 0.3;
  score += difficultyMatch * WEIGHTS.difficulty_balance;

  // 3. Recency bonus (0.15) — prefer questions not shown recently
  if (question.last_shown_at) {
    const daysSinceShown =
      (Date.now() - new Date(question.last_shown_at).getTime()) /
      (1000 * 60 * 60 * 24);
    const recencyScore = Math.min(daysSinceShown / 60, 1); // Max at 60 days
    score += recencyScore * WEIGHTS.recency_bonus;
  } else {
    // Never shown = full recency bonus
    score += 1.0 * WEIGHTS.recency_bonus;
  }

  // 4. Quality score (0.15) — higher avg_rating and lower skip_rate
  const ratingScore = question.avg_rating
    ? (question.avg_rating - 1) / 4
    : 0.5;
  const skipPenalty = question.skip_rate;
  score += (ratingScore * 0.7 + (1 - skipPenalty) * 0.3) * WEIGHTS.quality_score;

  // 5. Follow-up relevance (0.10) — placeholder for future contextual scoring
  score += 0.5 * WEIGHTS.follow_up_relevance;

  // 6. Randomness (0.05) — small random factor for variety
  score += Math.random() * WEIGHTS.randomness;

  return score;
}

/**
 * Score and rank a pool of candidate questions.
 */
export function rankQuestions(
  candidates: CandidateQuestion[],
  context: ScoringContext,
  targetDifficulty: string
): ScoredQuestion[] {
  return candidates
    .map((q) => ({
      ...q,
      score: scoreQuestion(q, context, targetDifficulty),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Select the best 4 category questions respecting diversity constraints.
 */
export function selectDiverseQuestions(
  ranked: ScoredQuestion[],
  count: number = 4
): ScoredQuestion[] {
  const selected: ScoredQuestion[] = [];
  const categoryCount: Record<string, number> = {};
  let hasEasy = false;
  let hasDeep = false;
  let heavyCount = 0;

  for (const q of ranked) {
    if (selected.length >= count) break;

    const catCount = categoryCount[q.category_id] ?? 0;

    // Max 2 per category
    if (catCount >= 2) continue;

    // Max 1 heavy emotional weight
    if (q.emotional_weight === "heavy" && heavyCount >= 1) continue;

    selected.push(q);
    categoryCount[q.category_id] = catCount + 1;
    if (q.difficulty === "easy") hasEasy = true;
    if (q.difficulty === "deep") hasDeep = true;
    if (q.emotional_weight === "heavy") heavyCount++;
  }

  // If constraints aren't met, backfill from remaining
  if (selected.length < count) {
    for (const q of ranked) {
      if (selected.length >= count) break;
      if (selected.some((s) => s.id === q.id)) continue;
      selected.push(q);
    }
  }

  // Sort by difficulty: easy → medium → deep → challenging
  const difficultyOrder: Record<string, number> = {
    easy: 0,
    medium: 1,
    deep: 2,
    challenging: 3,
  };
  selected.sort(
    (a, b) =>
      (difficultyOrder[a.difficulty] ?? 1) -
      (difficultyOrder[b.difficulty] ?? 1)
  );

  return selected;
}
