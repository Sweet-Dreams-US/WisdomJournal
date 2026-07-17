import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = ["bug", "idea", "praise", "other"] as const;

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, message, page_url } = body;

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Please write a short message first" },
      { status: 400 }
    );
  }

  if (message.trim().length > 4000) {
    return NextResponse.json(
      { error: "Message is too long (4000 characters max)" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    type: VALID_TYPES.includes(type) ? type : "other",
    message: message.trim(),
    page_url: typeof page_url === "string" ? page_url.slice(0, 500) : null,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
