import { chatCompletion, AI_MODELS } from "./openrouter";

interface ResponseContext {
  question_text: string;
  response_text: string;
  category_id: string;
}

interface FollowUpQuestion {
  text: string;
  category_id: string;
}

export async function generateFollowUpQuestions(
  responses: ResponseContext[]
): Promise<FollowUpQuestion[]> {
  if (responses.length === 0) return [];

  const entriesText = responses
    .map((r, i) => `[${i}] Q: "${r.question_text}"\nA: ${r.response_text}`)
    .join("\n\n");

  try {
    const result = await chatCompletion(
      [
        {
          role: "system",
          content: `You generate follow-up journal questions based on someone's previous answers. Each follow-up should dig deeper into something interesting, specific, or emotional they said. Return ONLY a valid JSON array of objects with "text" (the question) and "source_index" (which response 0-${responses.length - 1} inspired it). Generate exactly 5 questions. Questions should be warm, personal, and invite deeper reflection. Never use dashes in the questions. Keep questions concise (under 20 words).`,
        },
        {
          role: "user",
          content: `Here are today's answered questions:\n\n${entriesText}`,
        },
      ],
      {
        model: AI_MODELS.FAST,
        maxTokens: 400,
        temperature: 0.6,
      }
    );

    const cleaned = result.content
      .trim()
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 5).map((item: any) => ({
      text: item.text,
      category_id: responses[item.source_index]?.category_id || responses[0].category_id,
    }));
  } catch (error) {
    console.error("Follow-up question generation failed:", error);
    return [];
  }
}
