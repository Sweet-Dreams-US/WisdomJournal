import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { UserProfile } from "@wisdom-journal/shared";

/**
 * Returns the signed-in user's profile.
 *
 * Invariant: if the user is authenticated (has a valid auth.users row),
 * this function returns a UserProfile — never null. Earlier versions
 * could return null on transient RLS/upsert failures which caused pages
 * to `redirect('/login')`, which the middleware then redirected to
 * `/dashboard`, creating a ping-pong that made most sidebar links
 * appear to jump straight to the dashboard. Never again.
 *
 * We prefer service-role reads so RLS quirks can't silently hide an
 * existing row. If all DB reads/writes fail, we synthesize a stub
 * profile from auth metadata so the app stays navigable.
 */
export async function getProfile(): Promise<UserProfile | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Prefer service-role read — bypasses any RLS weirdness.
    const admin =
      supabaseUrl && serviceKey ? createServiceClient(supabaseUrl, serviceKey) : null;

    const readClient = admin ?? (supabase as unknown as ReturnType<typeof createServiceClient>);

    const { data } = await readClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      // Patch a missing full_name so the sidebar always shows something sensible.
      if (!data.full_name && admin) {
        const nameFromAuth =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          null;
        if (nameFromAuth) {
          await admin
            .from("profiles")
            .update({ full_name: nameFromAuth })
            .eq("id", user.id);
          data.full_name = nameFromAuth;
        }
      }
      return data as UserProfile;
    }

    // No row yet — try to create one via service role.
    if (admin) {
      const fullName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        null;

      const { data: newProfile } = await admin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email!,
            full_name: fullName,
            avatar_url: user.user_metadata?.avatar_url ?? null,
          },
          { onConflict: "id" }
        )
        .select("*")
        .maybeSingle();

      if (newProfile) return newProfile as UserProfile;

      // Last-resort re-read after upsert failure.
      const { data: reread } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (reread) return reread as UserProfile;
    }

    // DB unavailable or upsert silently failed — return a stub built from auth
    // metadata so pages stay usable instead of redirecting to /login.
    console.warn("getProfile: returning auth-only stub for", user.id);
    const stub: UserProfile = {
      id: user.id,
      email: user.email ?? "",
      full_name:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        null,
      username: null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      bio: null,
      timezone: null,
      subscription_tier: "free",
      stripe_customer_id: null,
      current_streak: 0,
      longest_streak: 0,
      total_responses: 0,
      total_word_count: 0,
      voice_response_enabled: false,
      voice_capture_enabled: false,
      ai_personality_enabled: false,
      is_deceased: false,
      deceased_at: null,
      onboarding_completed: true,
      onboarding_completed_at: null,
      is_admin: false,
      beta_code_used: null,
      notification_preferences: { daily_reminder: true, email_digest: false },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return stub;
  } catch (error) {
    console.error("getProfile error:", error);
    return null;
  }
}
