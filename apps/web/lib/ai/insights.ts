import { createClient } from "@supabase/supabase-js";
import { chatCompletion } from "./openrouter";

/**
 * Generate AI insights for a saved response.
 * Populates: ai_summary, ai_key_themes, ai_sentiment, ai_processed_at
 * Uses Haiku for speed and cost efficiency.
 */
export async function generateResponseInsights(
  responseId: string,
  responseText: string,
  questionText?: string
): Promise<void> {
  if (!responseText?.trim()) return;

  try {
    const prompt = questionText
      ? `Question asked: "${questionText}"\n\nTheir answer:\n${responseText}`
      : responseText;

    const result = await chatCompletion(
      [
        {
          role: "system",
          content: `You analyze journal entries. Return ONLY valid JSON with these exact keys:
{
  "summary": "One sentence capturing the core of what they said. No dashes or hyphens.",
  "themes": ["theme1", "theme2", "theme3"],
  "sentiment": "positive|neutral|reflective|negative|mixed"
}

Rules:
- summary: 1 sentence max. Capture the essence. Never use dashes or hyphens. No filler.
- themes: 2 to 4 short phrases (2 to 3 words each). Drawn only from the text.
- sentiment: one of exactly: positive, neutral, reflective, negative, mixed
- Output ONLY the JSON object. No markdown, no explanation.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        model: "anthropic/claude-sonnet-4.6",
        maxTokens: 150,
        temperature: 0.2,
      }
    );

    // Parse the JSON response
    const cleaned = result.content.trim().replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const summary = typeof parsed.summary === "string" ? parsed.summary : null;
    const themes = Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5) : [];
    const sentimentValues = ["positive", "neutral", "reflective", "negative", "mixed"];
    const sentiment = sentimentValues.includes(parsed.sentiment) ? parsed.sentiment : "neutral";

    // Update using service role to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase env vars for insights update");
      return;
    }

    const admin = createClient(supabaseUrl, serviceKey);

    await admin
      .from("responses")
      .update({
        ai_summary: summary,
        ai_key_themes: themes,
        ai_sentiment: sentiment,
        ai_processed_at: new Date().toISOString(),
      })
      .eq("id", responseId);
  } catch (error) {
    console.error("Failed to generate response insights:", error);
  }
}
