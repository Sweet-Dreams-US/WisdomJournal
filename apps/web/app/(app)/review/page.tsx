import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewClient from "./ReviewClient";

export default async function YearInReviewPage({
  searchParams,
}: {
  searchParams?: { year?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const year = Number(searchParams?.year ?? new Date().getFullYear());
  const start = new Date(year, 0, 1).toISOString();
  const end = new Date(year + 1, 0, 1).toISOString();

  const [{ data: responses }, { data: profile }] = await Promise.all([
    supabase
      .from("responses")
      .select("id, response_text, created_at, mood, word_count, is_favorite, response_categories:response_categories(category:categories(slug, name))")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("full_name, current_streak, longest_streak").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <ReviewClient
      year={year}
      responses={responses ?? []}
      profile={profile ?? null}
    />
  );
}
