import { createClient } from "@/lib/supabase/server";

export interface WebNode {
  id: string;
  type: "center" | "category" | "subcategory";
  slug: string;
  name: string;
  responseCount: number;
  wordCount: number;
  color: string;
  icon: string;
}

export interface WebLink {
  source: string;
  target: string;
  strength: number; // 0-1 based on response count
}

export interface KnowledgeWebData {
  nodes: WebNode[];
  links: WebLink[];
  totalResponses: number;
  totalWords: number;
  categoriesCovered: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  medical_health: "#f43f5e",     // rose-500
  financial: "#059669",           // emerald-600
  relationships: "#ec4899",       // pink-500
  deeply_personal: "#9333ea",     // purple-600
  life_lessons: "#f59e0b",        // amber-500
  family_traditions: "#f97316",   // orange-500
  career_work: "#2563eb",         // blue-600
  hobbies_interests: "#14b8a6",   // teal-500
  values_beliefs: "#6366f1",      // indigo-500
  memories_stories: "#0ea5e9",    // sky-500
  daily_reflection: "#eab308",    // yellow-500
};

export async function getKnowledgeWebData(): Promise<KnowledgeWebData | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get categories with subcategories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, icon, subcategories(id, slug, name)")
    .order("sort_order");

  if (!categories) return null;

  // Get user's category stats
  const { data: catStats } = await supabase
    .from("user_category_stats")
    .select("category_id, response_count, word_count")
    .eq("user_id", user.id);

  // Get response count per subcategory via response_categories
  const { data: subStats } = await supabase
    .from("response_categories")
    .select("subcategory_id, category_id")
    .eq("source", "primary")
    .not("subcategory_id", "is", null);

  // Count responses per subcategory
  const subCounts: Record<string, number> = {};
  if (subStats) {
    // Filter to only user's responses
    for (const rc of subStats) {
      if (rc.subcategory_id) {
        subCounts[rc.subcategory_id] = (subCounts[rc.subcategory_id] ?? 0) + 1;
      }
    }
  }

  // Get profile for center node
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, total_responses, total_word_count")
    .eq("id", user.id)
    .single();

  const nodes: WebNode[] = [];
  const links: WebLink[] = [];

  // Center node
  const centerId = "center";
  nodes.push({
    id: centerId,
    type: "center",
    slug: "you",
    name: profile?.full_name ?? "You",
    responseCount: profile?.total_responses ?? 0,
    wordCount: profile?.total_word_count ?? 0,
    color: "#4A90D9",
    icon: "user",
  });

  let categoriesCovered = 0;

  for (const cat of categories) {
    const stat = catStats?.find((s: any) => s.category_id === cat.id);
    const catResponseCount = stat?.response_count ?? 0;
    const catWordCount = stat?.word_count ?? 0;

    if (catResponseCount > 0) categoriesCovered++;

    const catNodeId = `cat_${cat.slug}`;
    nodes.push({
      id: catNodeId,
      type: "category",
      slug: cat.slug,
      name: cat.name,
      responseCount: catResponseCount,
      wordCount: catWordCount,
      color: CATEGORY_COLORS[cat.slug] ?? "#6b7280",
      icon: cat.icon,
    });

    // Link center → category (strength based on response proportion)
    const maxResponses = Math.max(
      ...(catStats?.map((s: any) => s.response_count) ?? [1]),
      1
    );
    links.push({
      source: centerId,
      target: catNodeId,
      strength: catResponseCount > 0 ? Math.max(0.15, catResponseCount / maxResponses) : 0.05,
    });

    // Subcategories
    const subs = (cat as any).subcategories ?? [];
    for (const sub of subs) {
      const subCount = subCounts[sub.id] ?? 0;
      const subNodeId = `sub_${sub.slug}`;

      nodes.push({
        id: subNodeId,
        type: "subcategory",
        slug: sub.slug,
        name: sub.name,
        responseCount: subCount,
        wordCount: 0, // Not tracked at sub level
        color: CATEGORY_COLORS[cat.slug] ?? "#6b7280",
        icon: cat.icon,
      });

      links.push({
        source: catNodeId,
        target: subNodeId,
        strength: subCount > 0 ? 0.5 : 0.15,
      });
    }
  }

  return {
    nodes,
    links,
    totalResponses: profile?.total_responses ?? 0,
    totalWords: profile?.total_word_count ?? 0,
    categoriesCovered,
  };
}
