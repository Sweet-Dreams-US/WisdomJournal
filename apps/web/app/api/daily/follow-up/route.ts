import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { generateFollowUpQuestions } from "@/lib/ai/follow-up-questions";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 3 follow-up generations per hour
  const limit = rateLimit(user.id, "follow-up-gen", 3, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Follow-up limit reached. Try again later." },
      { status: 429 }
    );
  }

  const today = new Date().toISOString().split("T")[0];

  // Get today's set
  const { data: set } = await supabase
    .from("daily_question_sets")
    .select(`
      id,
      items:daily_question_items(
        id, sort_order, response_id, skipped,
        question:questions(id, text, category_id)
      )
    `)
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (!set) {
    return NextResponse.json({ error: "No daily questions found for today" }, { status: 404 });
  }

  const items = (set as any).items || [];

  // Check if follow-ups already generated (items with sort_order > 5)
  const existingFollowUps = items.filter((i: any) => i.sort_order > 5);
  if (existingFollowUps.length > 0) {
    return NextResponse.json({ message: "Follow-ups already generated", items });
  }

  // Need at least 3 answered items
  const answeredItems = items.filter((i: any) => i.response_id !== null);
  if (answeredItems.length < 3) {
    return NextResponse.json(
      { error: "Answer at least 3 questions before generating follow-ups" },
      { status: 400 }
    );
  }

  // Fetch the response texts for answered items
  const responseIds = answeredItems.map((i: any) => i.response_id);
  const { data: responses } = await supabase
    .from("responses")
    .select("id, response_text")
    .in("id", responseIds);

  const responseMap = new Map((responses || []).map((r: any) => [r.id, r.response_text]));

  const contexts = answeredItems.map((item: any) => ({
    question_text: item.question?.text || "",
    response_text: responseMap.get(item.response_id) || "",
    category_id: item.question?.category_id || "",
  }));

  // Generate follow-up questions via AI
  const followUps = await generateFollowUpQuestions(contexts);

  if (followUps.length === 0) {
    return NextResponse.json({ error: "Could not generate follow-up questions" }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createServiceClient(supabaseUrl, serviceKey);

  // Insert questions and items
  const newItems = [];
  for (let i = 0; i < followUps.length; i++) {
    const fq = followUps[i];

    // Create question in DB
    const { data: question } = await admin
      .from("questions")
      .insert({
        text: fq.text,
        category_id: fq.category_id,
        difficulty: "medium",
        emotional_weight: "neutral",
        expected_length: "medium",
        is_daily_reflection: false,
      })
      .select("id")
      .single();

    if (!question) continue;

    // Insert daily_question_item
    const { data: item } = await admin
      .from("daily_question_items")
      .insert({
        set_id: set.id,
        question_id: question.id,
        sort_order: 6 + i,
      })
      .select("*, question:questions(*, category:categories(*))")
      .single();

    if (item) newItems.push(item);
  }

  return NextResponse.json({ items: newItems }, { status: 201 });
}
