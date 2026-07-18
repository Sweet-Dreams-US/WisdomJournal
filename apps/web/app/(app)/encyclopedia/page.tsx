import { getKnowledgeWebData } from "@/lib/data/get-knowledge-web";
import { getProfile } from "@/lib/data/get-profile";
import { getEncyclopediaStats } from "@/lib/data/get-encyclopedia-stats";
import { getCategoryTrends } from "@/lib/data/get-category-trends";
import { getGrowthStats } from "@/lib/data/get-growth-stats";
import EncyclopediaClient from "./EncyclopediaClient";

export default async function EncyclopediaPage() {
  const [webData, profile, stats, categoryTrends, growth] = await Promise.all([
    getKnowledgeWebData(),
    getProfile(),
    getEncyclopediaStats(),
    getCategoryTrends(),
    // getGrowthStats never throws, but belt-and-braces: a growth
    // failure must never blank the whole encyclopedia page.
    getGrowthStats().catch(() => null),
  ]);

  return (
    <EncyclopediaClient
      webData={webData}
      profile={profile}
      stats={stats}
      categoryTrends={categoryTrends}
      growth={growth}
    />
  );
}
