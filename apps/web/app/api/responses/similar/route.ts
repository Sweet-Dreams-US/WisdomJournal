import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categoryId = request.nextUrl.searchParams.get("category_id");
  const questionId = request.nextUrl.searchParams.get("question_id");

  if (!categoryId) {
    return NextResponse.json(
      { error: "category_id is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch up to 2 recent responses in the same category, excluding any for the current question
    const query = supabase
      .from("responses")
      .select(`
        id,
        response_text,
        created_at,
        question:questions(text),
        categories:response_categories!inner(category_id)
      `)
      .eq("user_id", user.id)
      .eq("categories.category_id", categoryId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(2);

    // Exclude responses for the current question if provided
    if (questionId) {
      query.neq("question_id", questionId);
    }

    const { data: responses, error } = await query;

    if (error) {
      console.error("Similar responses query error:", error);
      return NextResponse.json({ responses: [] });
    }

    const formatted = (responses ?? []).map((r: any) => ({
      id: r.id,
      response_text: r.response_text,
      created_at: r.created_at,
      question_text: r.question?.text ?? null,
    }));

    return NextResponse.json({ responses: formatted });
  } catch (error) {
    console.error("Similar responses error:", error);
    return NextResponse.json({ responses: [] });
  }
}
