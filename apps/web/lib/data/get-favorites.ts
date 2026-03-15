import { createClient } from "@/lib/supabase/server";
import type { JournalResponse } from "@wisdom-journal/shared";

export async function getFavorites(): Promise<JournalResponse[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("responses")
    .select(
      `
      *,
      categories:response_categories(
        *,
        category:categories(*)
      ),
      question:questions(text)
      `
    )
    .eq("user_id", user.id)
    .eq("is_favorite", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (data as unknown as JournalResponse[]) ?? [];
}
