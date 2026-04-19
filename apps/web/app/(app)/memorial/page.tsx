import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MemorialClient from "./MemorialClient";

export default async function MemorialPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: responses }, { data: categories }] = await Promise.all([
    supabase.from("profiles").select("full_name, bio, current_streak, longest_streak, total_responses, created_at").eq("id", user.id).maybeSingle(),
    supabase
      .from("responses")
      .select("id, response_text, created_at, mood, word_count, is_favorite, response_categories:response_categories(category:categories(slug,name))")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase.from("categories").select("slug, name").order("sort_order", { ascending: true }),
  ]);

  return (
    <MemorialClient
      profile={profile ?? null}
      responses={responses ?? []}
      categories={categories ?? []}
    />
  );
}
