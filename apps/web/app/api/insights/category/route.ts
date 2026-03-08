import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/ai/openrouter";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category_id, category_name } = await request.json();

  if (!category_id) {
    return NextResponse.json(
      { error: "category_id is required" },
      { status: 400 }
    );
  }

  // Fetch user's responses in this category
  const { data: responses } = await supabase
    .from("responses")
    .select(`
      response_text,
      categories:response_categories!inner(category_id)
    `)
    .eq("user_id", user.id)
    .eq("categories.category_id", category_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(15);

  if (!responses || responses.length === 0) {
    return NextResponse.json({
      summary: "No responses in this category yet. Answer some questions to see insights here.",
      themes: [],
      patterns: [],
    });
  }

  const entriesText = responses
    .map((r: any, i: number) => `[${i + 1}] ${r.response_text}`)
    .join("\n\n");

  try {
    const result = await chatCompletion(
      [
        {
          role: "system",
          content: `You analyze a person's journal entries within the "${category_name || "this"}" category. Return ONLY valid JSON:
{
  "summary": "2 to 3 sentences synthesizing what this person has shared about this topic. What stands out about how they think, feel, and act in this area.",
  "themes": ["recurring theme 1", "recurring theme 2", "recurring theme 3"],
  "patterns": ["notable pattern or tendency 1", "notable pattern or tendency 2"]
}

Rules:
- Draw ONLY from the entries provided. No outside knowledge.
- Never use dashes or hyphens in sentences.
- Be specific, not generic. Reference actual content from their entries.
- themes: 2 to 4 short phrases that recur across entries.
- patterns: 1 to 3 observations about how they consistently think or behave in this area.
- Output ONLY the JSON. No markdown, no explanation.`,
        },
        {
          role: "user",
          content: `Here are ${responses.length} entries in the "${category_name}" category:\n\n${entriesText}`,
        },
      ],
      {
        model: "anthropic/claude-sonnet-4.6",
        maxTokens: 250,
        temperature: 0.3,
      }
    );

    const cleaned = result.content
      .trim()
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      summary: parsed.summary || "",
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      response_count: responses.length,
    });
  } catch (error) {
    console.error("Category insight generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
