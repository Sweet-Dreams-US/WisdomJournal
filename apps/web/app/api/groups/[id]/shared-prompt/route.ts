import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  const { data: prompts } = await supabase
    .from("shared_group_prompts")
    .select("id, question_id, custom_question_text, created_by, active_from, active_until, created_at, question:questions(id, text, category:categories(slug, name))")
    .eq("group_id", params.id)
    .lte("active_from", today)
    .gte("active_until", today)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!prompts || prompts.length === 0) {
    return NextResponse.json({ prompt: null, responses: [] });
  }

  const prompt = prompts[0];

  const { data: linked } = await supabase
    .from("shared_prompt_responses")
    .select("response:responses(id, response_text, created_at, mood, user_id, profiles:profiles!responses_user_id_fkey(full_name, avatar_url))")
    .eq("shared_prompt_id", prompt.id);

  return NextResponse.json({
    prompt,
    responses: (linked ?? []).map((l: any) => l.response).filter(Boolean),
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { question_id, custom_question_text, active_until } = body;

  if (!question_id && !custom_question_text?.trim()) {
    return NextResponse.json({ error: "question_id or custom_question_text required" }, { status: 400 });
  }

  // Verify the caller is admin/owner of the group
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.status !== "active" || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("shared_group_prompts")
    .insert({
      group_id: params.id,
      question_id: question_id ?? null,
      custom_question_text: custom_question_text?.trim() ?? null,
      created_by: user.id,
      active_until: active_until ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompt: data }, { status: 201 });
}
