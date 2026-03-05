import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processWisdomQuery } from "@/lib/ai/wisdom-query";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query_text, target_user_id, group_id, mode } =
    await request.json();

  if (!query_text?.trim()) {
    return NextResponse.json(
      { error: "Query text is required" },
      { status: 400 }
    );
  }

  // Default: query your own wisdom
  const targetUserId = target_user_id || user.id;

  const result = await processWisdomQuery({
    querierId: user.id,
    targetUserId,
    queryText: query_text.trim(),
    groupId: group_id || null,
    mode: mode || "personality",
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result, { status: 201 });
}
