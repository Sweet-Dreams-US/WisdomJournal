import { createClient } from "@/lib/supabase/server";
import { pickSerendipity, type SerendipityCandidate } from "@/lib/engine/serendipity";

export async function getDailySerendipity(): Promise<SerendipityCandidate | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  try {
    return await pickSerendipity(supabase as any, user.id);
  } catch (e) {
    console.error("serendipity error", e);
    return null;
  }
}
