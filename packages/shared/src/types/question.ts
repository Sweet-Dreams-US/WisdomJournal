export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: "easy" | "medium" | "deep";
  created_at: string;
}

export type QuestionCategory =
  | "life_lessons"
  | "family"
  | "career"
  | "values"
  | "memories"
  | "advice"
  | "beliefs"
  | "traditions"
  | "relationships"
  | "legacy";
