import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return user;
}

export async function PATCH(request: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id, is_admin, is_deceased } = await request.json();

  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updates: Record<string, any> = {};
  if (typeof is_admin === "boolean") updates.is_admin = is_admin;
  if (typeof is_deceased === "boolean") {
    updates.is_deceased = is_deceased;
    updates.deceased_at = is_deceased ? new Date().toISOString() : null;
  }

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
