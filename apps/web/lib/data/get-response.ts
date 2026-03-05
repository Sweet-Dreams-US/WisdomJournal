import { createClient } from "@/lib/supabase/server";
import type { JournalResponse } from "@wisdom-journal/shared";

export async function getResponse(
  responseId: string
): Promise<JournalResponse | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("responses")
    .select(
      `
      *,
      categories:response_categories(
        *,
        category:categories(*)
      ),
      question:questions(*)
      `
    )
    .eq("id", responseId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  return (data as unknown as JournalResponse) ?? null;
}
