import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@wisdom-journal/shared";

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Try to get existing profile
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) return data as UserProfile;

    // No profile row exists — create one (handles users who signed up before trigger existed)
    const fullName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      null;

    const { data: newProfile } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select()
      .single();

    return (newProfile as UserProfile) ?? null;
  } catch (error) {
    console.error("getProfile error:", error);
    return null;
  }
}
