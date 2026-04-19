import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedResponse } from "@/lib/ai/embeddings";

/**
 * Answer a group's shared prompt — creates a response + links it to the prompt.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { shared_prompt_id, response_text, mood, input_method } = await req.json();
  if (!shared_prompt_id || !response_text?.trim()) {
    return NextResponse.json({ error: "shared_prompt_id and response_text required" }, { status: 400 });
  }

  // Confirm caller is a member of this group
  const { data: membership } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || membership.status !== "active") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Find the underlying question (if any)
  const { data: prompt } = await supabase
    .from("shared_group_prompts")
    .select("question_id, question:questions(category_id, subcategory_id)")
    .eq("id", shared_prompt_id)
    .maybeSingle();

  const { data: response, error } = await supabase
    .from("responses")
    .insert({
      user_id: user.id,
      question_id: prompt?.question_id ?? null,
      group_id: params.id,
      response_text: response_text.trim(),
      input_method: input_method || "text",
      response_context: "personal",
      mood: mood || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const categoryId = (prompt?.question as any)?.category_id;
  const subcategoryId = (prompt?.question as any)?.subcategory_id;
  if (categoryId) {
    await supabase.from("response_categories").insert({
      response_id: response.id,
      category_id: categoryId,
      subcategory_id: subcategoryId ?? null,
      source: "primary",
    });
  }

  await supabase.from("shared_prompt_responses").insert({
    shared_prompt_id,
    response_id: response.id,
  });

  embedResponse(response.id, response_text.trim()).catch(console.error);

  return NextResponse.json({ response }, { status: 201 });
}
