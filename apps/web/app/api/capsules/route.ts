import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("time_capsules")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const capsules = (data ?? []).map((c) => ({
    ...c,
    unlocked_now:
      c.is_opened ||
      (c.open_on_date && c.open_on_date <= today),
  }));

  return NextResponse.json({ capsules });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title, body, open_on_date, open_on_event, recipient_email } = await req.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }
  if (!open_on_date && !open_on_event?.trim()) {
    return NextResponse.json({ error: "open_on_date or open_on_event required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("time_capsules")
    .insert({
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
      open_on_date: open_on_date || null,
      open_on_event: open_on_event?.trim() || null,
      recipient_email: recipient_email?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ capsule: data }, { status: 201 });
}
