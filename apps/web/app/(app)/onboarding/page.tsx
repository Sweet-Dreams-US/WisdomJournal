import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if already completed
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/dashboard");

  // Get categories for step 2
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description")
    .order("name");

  return <OnboardingClient categories={categories ?? []} />;
}
