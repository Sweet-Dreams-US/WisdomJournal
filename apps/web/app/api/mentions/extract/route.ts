import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/ai/openrouter";
import { parseModelJson } from "@/lib/ai/parse-json";

/**
 * POST /api/mentions/extract
 * Extracts people mentions from a response using AI.
 * Called after saving a response (fire-and-forget pattern like embeddings).
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { response_id, response_text } = await request.json();

  if (!response_id || !response_text) {
    return NextResponse.json(
      { error: "response_id and response_text required" },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: response } = await supabase
    .from("responses")
    .select("id")
    .eq("id", response_id)
    .eq("user_id", user.id)
    .single();

  if (!response) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Use AI to extract people mentions
    const result = await chatCompletion(
      [
        {
          role: "system",
          content: `You extract people mentions from journal entries. Return a JSON array of objects with:
- "name": the person's name as written (e.g., "Mom", "Dr. Smith", "my friend Jake")
- "normalized": lowercase normalized version (e.g., "mom", "dr smith", "jake")
- "relationship": one of: mother, father, parent, sibling, spouse, partner, child, grandparent, aunt, uncle, cousin, friend, coworker, boss, teacher, mentor, therapist, doctor, neighbor, acquaintance, other, or null if unclear

Only extract real people references, not hypothetical or general references.
If no people are mentioned, return an empty array: []
Return ONLY valid JSON, no markdown or explanation.`,
        },
        {
          role: "user",
          content: response_text,
        },
      ],
      { maxTokens: 500, temperature: 0.1 }
    );

    let mentions: Array<{
      name: string;
      normalized: string;
      relationship: string | null;
    }> = [];

    const parsed = parseModelJson<typeof mentions>(result.content);
    if (Array.isArray(parsed)) {
      mentions = parsed;
    } else {
      console.error("Failed to parse mentions JSON:", result.content);
      return NextResponse.json({ mentions: [] });
    }

    if (mentions.length === 0) {
      return NextResponse.json({ mentions: [] });
    }

    // Insert mentions (upsert by response_id + normalized_name)
    const rows = mentions.map((m) => ({
      response_id,
      mentioned_name: m.name,
      normalized_name: m.normalized.toLowerCase(),
      relationship: m.relationship,
    }));

    const { error } = await supabase
      .from("people_mentions")
      .upsert(rows, {
        onConflict: "response_id,normalized_name",
        ignoreDuplicates: true,
      });

    if (error) {
      console.error("Failed to insert mentions:", error);
    }

    return NextResponse.json({ mentions: rows });
  } catch (err) {
    console.error("Mention extraction failed:", err);
    return NextResponse.json({ mentions: [] });
  }
}
