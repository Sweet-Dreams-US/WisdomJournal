import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

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

      // Handle beta code for new OAuth users
      const cookieStore = cookies();
      const betaCodeCookie = cookieStore.get("beta_code");

      if (betaCodeCookie?.value && data?.user) {
        const betaCode = betaCodeCookie.value;

        // Check if this is a new user (created_at is very recent, within last 60 seconds)
        const createdAt = new Date(data.user.created_at).getTime();
        const now = Date.now();
        const isNewUser = now - createdAt < 60000;

        if (isNewUser) {
          try {
            // Increment beta code usage via API endpoint
            await fetch(`${origin}/api/beta/use`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: betaCode, email: data.user.email }),
            });

            // Set beta_code_used on the user's profile
            await supabase
              .from("profiles")
              .update({ beta_code_used: betaCode })
              .eq("id", data.user.id);
          } catch {
            // Non-blocking — don't fail the auth flow
          }
        }

        // Clear the beta_code cookie
        const response = NextResponse.redirect(`${origin}${next}`);
        response.cookies.set("beta_code", "", { path: "/", maxAge: 0 });
        return response;
      }

      // Default — OAuth login or generic callback
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
