import { createClient } from "@/lib/supabase/server";
import type { Category } from "@wisdom-journal/shared";

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("categories")
    .select("*, subcategories(*)")
    .order("sort_order");

  return (data as Category[]) ?? [];
}
