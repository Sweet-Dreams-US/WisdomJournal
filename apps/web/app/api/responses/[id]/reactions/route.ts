import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("response_reactions")
    .select("id, user_id, emoji, created_at, profiles:profiles!response_reactions_user_id_fkey(full_name, avatar_url)")
    .eq("response_id", params.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ reactions: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { emoji } = await req.json();
  if (!emoji || typeof emoji !== "string") {
    return NextResponse.json({ error: "emoji required" }, { status: 400 });
  }

  // Toggle behavior: delete if exists, else insert
  const { data: existing } = await supabase
    .from("response_reactions")
    .select("id")
    .eq("response_id", params.id)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("response_reactions").delete().eq("id", existing.id);
    return NextResponse.json({ toggled: "removed" });
  }

  const { error } = await supabase
    .from("response_reactions")
    .insert({ response_id: params.id, user_id: user.id, emoji });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ toggled: "added" });
}
