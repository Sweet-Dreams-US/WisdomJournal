import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Route based on callback type
      if (type === "recovery") {
        // Password reset — send to reset-password page
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      if (type === "signup" || type === "email") {
        // Email confirmation — send to verify-email with confirmed flag
        return NextResponse.redirect(`${origin}/verify-email?confirmed=true`);
      }

      // Default — OAuth login or generic callback
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
