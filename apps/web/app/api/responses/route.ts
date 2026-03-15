import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedResponse } from "@/lib/ai/embeddings";
import { chatCompletion } from "@/lib/ai/openrouter";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    question_id,
    daily_item_id,
    response_text,
    category_id,
    subcategory_id,
    group_id,
    mood,
    tags,
    input_method,
  } = body;

  if (!response_text?.trim()) {
    return NextResponse.json(
      { error: "Response text is required" },
      { status: 400 }
    );
  }

  // Insert response
  const { data: response, error: responseError } = await supabase
    .from("responses")
    .insert({
      user_id: user.id,
      question_id: question_id || null,
      group_id: group_id || null,
      response_text: response_text.trim(),
      input_method: input_method || "text",
      response_context: group_id ? "organization" : "personal",
      mood: mood || null,
      tags: tags || [],
    })
    .select()
    .single();

  if (responseError) {
    return NextResponse.json(
      { error: responseError.message },
      { status: 500 }
    );
  }

  // Insert response_categories (primary tag)
  if (category_id) {
    await supabase.from("response_categories").insert({
      response_id: response.id,
      category_id,
      subcategory_id: subcategory_id || null,
      source: "primary",
    });
  }

  // Update daily question item if provided
  if (daily_item_id) {
    await supabase
      .from("daily_question_items")
      .update({ response_id: response.id })
      .eq("id", daily_item_id);

    // Check if all items are done → update set status
    const { data: setItems } = await supabase
      .from("daily_question_items")
      .select("response_id, skipped")
      .eq("set_id", body.set_id);

    if (setItems) {
      const allDone = setItems.every(
        (item: any) => item.response_id !== null || item.skipped
      );
      const anyDone = setItems.some(
        (item: any) => item.response_id !== null
      );

      await supabase
        .from("daily_question_sets")
        .update({
          status: allDone ? "completed" : anyDone ? "partial" : "pending",
        })
        .eq("id", body.set_id);
    }
  }

  // Update question history
  if (question_id) {
    await supabase
      .from("user_question_history")
      .upsert(
        {
          user_id: user.id,
          question_id,
          answered: true,
          shown_at: new Date().toISOString(),
        },
        { onConflict: "user_id,question_id" }
      );
  }

  // Generate embedding asynchronously (don't block response)
  embedResponse(response.id, response_text.trim()).catch(console.error);

  // Extract people mentions asynchronously (fire-and-forget)
  extractMentions(response.id, user.id, response_text.trim()).catch(
    console.error
  );

  return NextResponse.json({ response }, { status: 201 });
}

async function extractMentions(responseId: string, userId: string, text: string) {
  const supabase = createClient();
  try {
    const result = await chatCompletion(
      [
        {
          role: "system",
          content: `Extract people mentions from this journal entry. Return a JSON array of objects with:
- "name": the person's name as written
- "normalized": lowercase normalized version
- "relationship": one of: mother, father, parent, sibling, spouse, partner, child, grandparent, aunt, uncle, cousin, friend, coworker, boss, teacher, mentor, therapist, doctor, neighbor, acquaintance, other, or null
Only real people, not hypothetical. Return [] if none. Return ONLY valid JSON.`,
        },
        { role: "user", content: text },
      ],
      { maxTokens: 500, temperature: 0.1 }
    );

    const parsed = JSON.parse(result.content);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const rows = parsed.map(
      (m: { name: string; normalized: string; relationship: string | null }) => ({
        user_id: userId,
        response_id: responseId,
        mentioned_name: m.name,
        normalized_name: m.normalized.toLowerCase(),
        relationship: m.relationship,
      })
    );

    await supabase.from("people_mentions").upsert(rows, {
      onConflict: "response_id,normalized_name",
      ignoreDuplicates: true,
    });
  } catch (err) {
    console.error("Mention extraction failed:", err);
  }
}
