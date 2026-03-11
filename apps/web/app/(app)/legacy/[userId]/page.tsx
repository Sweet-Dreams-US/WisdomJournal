import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LegacyWisdomClient from "./LegacyWisdomClient";

interface Props {
  params: { userId: string };
}

export default async function LegacyWisdomPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify the current user is a legacy contact of the target user
  const { data: legacyEntry } = await supabase
    .from("legacy_contacts")
    .select("*")
    .eq("user_id", params.userId)
    .or(`contact_user_id.eq.${user.id},contact_email.eq.${user.email}`)
    .maybeSingle();

  if (!legacyEntry) {
    redirect("/dashboard");
  }

  // Get the deceased user's profile
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, created_at, total_responses")
    .eq("id", params.userId)
    .single();

  if (!targetProfile) {
    redirect("/dashboard");
  }

  // Get response count and category coverage
  const { data: categories } = await supabase
    .from("user_category_stats")
    .select("category_id, response_count, categories(name, slug)")
    .eq("user_id", params.userId)
    .order("response_count", { ascending: false });

  // Get recent responses (for browse)
  const { data: responses } = await supabase
    .from("responses")
    .select(`
      id, response_text, word_count, created_at, is_favorite,
      question:questions(question_text),
      categories:response_categories(category:categories(name, slug))
    `)
    .eq("user_id", params.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <LegacyWisdomClient
      targetProfile={targetProfile}
      legacyEntry={legacyEntry}
      categories={categories ?? []}
      responses={responses ?? []}
    />
  );
}
