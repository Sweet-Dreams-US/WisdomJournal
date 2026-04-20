import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { UserProfile } from "@wisdom-journal/shared";

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Try to get existing profile
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      // Fix missing full_name in existing profiles
      if (!data.full_name) {
        const nameFromAuth =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          null;
        if (nameFromAuth) {
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (serviceKey && supabaseUrl) {
            const admin = createServiceClient(supabaseUrl, serviceKey);
            await admin
              .from("profiles")
              .update({ full_name: nameFromAuth })
              .eq("id", user.id);
            data.full_name = nameFromAuth;
          }
        }
      }
      return data as UserProfile;
    }

    // No profile row — create one using service role to bypass RLS
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY or URL for profile creation");
      return null;
    }

    const admin = createServiceClient(supabaseUrl, serviceKey);

    const fullName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      null;

    const { data: newProfile, error: insertError } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select()
      .single();

    if (insertError) {
      // Fall through: select via service role in case RLS blocked the earlier read.
      const { data: existing } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (existing) return existing as UserProfile;
      console.error("Failed to create profile:", insertError);
      return null;
    }

    return (newProfile as UserProfile) ?? null;
  } catch (error) {
    console.error("getProfile error:", error);
    return null;
  }
}
