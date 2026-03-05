import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@wisdom-journal/shared";

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as UserProfile) ?? null;
}
