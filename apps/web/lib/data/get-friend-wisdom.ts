import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export interface FriendResponse {
  id: string;
  response_text: string;
  word_count: number;
  input_method: string;
  is_favorite: boolean;
  created_at: string;
  question: {
    id: string;
    question_text: string;
  } | null;
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export async function getFriendWisdom(
  friendshipId: string,
  categoryId?: string
): Promise<FriendResponse[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the friendship and verify access
  const { data: friendship } = await admin
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .eq("status", "accepted")
    .single();

  if (!friendship) return [];
  if (friendship.user_a !== user.id && friendship.user_b !== user.id) return [];

  const friendId =
    friendship.user_a === user.id ? friendship.user_b : friendship.user_a;

  // Get which categories the friend has shared with us
  const { data: sharedAccess } = await admin
    .from("friend_category_access")
    .select("category_id")
    .eq("friendship_id", friendshipId)
    .eq("user_id", friendId) // the FRIEND controls what THEY share
    .eq("is_enabled", true);

  if (!sharedAccess || sharedAccess.length === 0) return [];

  const sharedCategoryIds = sharedAccess.map((a: any) => a.category_id);

  // Filter by specific category if provided
  const filterCategoryIds = categoryId
    ? sharedCategoryIds.filter((id: string) => id === categoryId)
    : sharedCategoryIds;

  if (filterCategoryIds.length === 0) return [];

  // Get friend's responses in shared categories
  const { data: responseCategoryLinks } = await admin
    .from("response_categories")
    .select("response_id, category_id")
    .in("category_id", filterCategoryIds);

  if (!responseCategoryLinks || responseCategoryLinks.length === 0) return [];

  const responseIds = [
    ...new Set(responseCategoryLinks.map((rc: any) => rc.response_id)),
  ];

  // Fetch the actual responses (only friend's)
  const { data: responses } = await admin
    .from("responses")
    .select(
      `
      id, response_text, word_count, input_method, is_favorite, created_at,
      question:questions(id, question_text)
    `
    )
    .in("id", responseIds)
    .eq("user_id", friendId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!responses) return [];

  // Get categories for each response
  const { data: allCategories } = await admin
    .from("categories")
    .select("id, name, slug");

  const categoryMap = new Map(
    (allCategories ?? []).map((c: any) => [c.id, c])
  );

  // Build response-to-categories map
  const responseCategoryMap = new Map<string, any[]>();
  for (const rc of responseCategoryLinks) {
    const cats = responseCategoryMap.get(rc.response_id) ?? [];
    const cat = categoryMap.get(rc.category_id);
    if (cat) cats.push(cat);
    responseCategoryMap.set(rc.response_id, cats);
  }

  return responses.map((r: any) => ({
    ...r,
    question: r.question ?? null,
    categories: responseCategoryMap.get(r.id) ?? [],
  }));
}
