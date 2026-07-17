import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion, AI_MODELS } from "@/lib/ai/openrouter";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 insight requests per 10 minutes
  const limit = rateLimit(user.id, "response-insight", 30, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes." },
      { status: 429 }
    );
  }

  // Fetch the response
  const { data: response } = await supabase
    .from("responses")
    .select("id, response_text, question:questions(text)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!response) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  const questionText = (response as any).question?.text;
  const responseText = response.response_text;

  const prompt = questionText
    ? `Question asked: "${questionText}"\n\nTheir answer:\n${responseText}`
    : responseText;

  try {
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
        model: AI_MODELS.FAST,
        maxTokens: 150,
        temperature: 0.2,
      }
    );

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
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const admin = createServiceClient(supabaseUrl, serviceKey);

    await admin
      .from("responses")
      .update({
        ai_summary: summary,
        ai_key_themes: themes,
        ai_sentiment: sentiment,
        ai_processed_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    return NextResponse.json({
      ai_summary: summary,
      ai_key_themes: themes,
      ai_sentiment: sentiment,
      ai_processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Insight generation failed:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
