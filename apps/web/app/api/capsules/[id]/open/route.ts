import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: capsule } = await supabase
    .from("time_capsules")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!capsule) return NextResponse.json({ error: "not found" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  if (capsule.open_on_date && capsule.open_on_date > today) {
    return NextResponse.json({ error: "not yet unlockable" }, { status: 403 });
  }

  const { error } = await supabase
    .from("time_capsules")
    .update({ is_opened: true, opened_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
