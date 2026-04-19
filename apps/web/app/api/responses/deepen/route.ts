import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AI_MODELS, chatCompletion } from "@/lib/ai/openrouter";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question_text, draft } = await request.json();
  if (!draft || typeof draft !== "string" || draft.trim().length < 80) {
    return NextResponse.json({ probe: null });
  }

  const systemPrompt = `You are a gentle journaling companion. Your job is to suggest ONE short follow-up question (under 18 words) that would help the writer go one layer deeper on what they just wrote. Never summarize. Never praise. Never use "I" or "you should". Ask a question, nothing else. No dashes, no em-dashes.`;

  const userMsg = `Original question: ${question_text}\n\nTheir draft so far:\n"""\n${draft.trim().slice(0, 1600)}\n"""\n\nWrite a single short follow-up question that opens the door one level deeper. Output only the question.`;

  try {
    const res = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      { model: AI_MODELS.FAST, maxTokens: 60, temperature: 0.6 }
    );

    let probe = res.content.trim();
    probe = probe.replace(/^["'\u201c]|["'\u201d]$/g, "").trim();
    if (!probe.endsWith("?")) probe = probe.replace(/[.!]*$/, "") + "?";
    if (probe.split(/\s+/).length > 22) {
      return NextResponse.json({ probe: null });
    }
    return NextResponse.json({ probe });
  } catch (err) {
    console.error("deepen error", err);
    return NextResponse.json({ probe: null });
  }
}
