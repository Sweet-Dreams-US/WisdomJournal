import { createClient } from "@/lib/supabase/server";
import type { WisdomQuery } from "@wisdom-journal/shared";

export async function getWisdomQueries(): Promise<WisdomQuery[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("wisdom_queries")
    .select("*")
    .or(`querier_id.eq.${user.id},target_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data as WisdomQuery[]) ?? [];
}
