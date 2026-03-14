import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFriendWisdom } from "@/lib/data/get-friend-wisdom";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categoryId = request.nextUrl.searchParams.get("category_id") ?? undefined;

  const responses = await getFriendWisdom(params.id, categoryId);

  return NextResponse.json({ responses });
}
