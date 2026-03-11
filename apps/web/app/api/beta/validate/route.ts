import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  if (!code?.trim()) {
    return NextResponse.json({ valid: false, message: "Invite code is required" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ valid: false, message: "Server configuration error" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: betaCode } = await admin
    .from("beta_invite_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!betaCode) {
    return NextResponse.json({ valid: false, message: "Invalid invite code" });
  }

  if (betaCode.used_count >= betaCode.max_uses) {
    return NextResponse.json({ valid: false, message: "This invite code has reached its limit" });
  }

  return NextResponse.json({ valid: true, message: "Valid code" });
}
