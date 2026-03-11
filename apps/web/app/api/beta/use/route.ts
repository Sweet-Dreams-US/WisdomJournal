import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { code, email } = await request.json();

  if (!code || !email) {
    return NextResponse.json({ error: "Missing code or email" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Get current count and increment
  const { data: betaCode } = await admin
    .from("beta_invite_codes")
    .select("id, used_count")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (betaCode) {
    await admin
      .from("beta_invite_codes")
      .update({ used_count: betaCode.used_count + 1 })
      .eq("id", betaCode.id);
  }

  // Update the user's profile with the beta code used
  await admin
    .from("profiles")
    .update({ beta_code_used: code })
    .eq("email", email);

  return NextResponse.json({ success: true });
}
