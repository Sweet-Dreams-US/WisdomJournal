import { getKnowledgeWebData } from "@/lib/data/get-knowledge-web";
import { getProfile } from "@/lib/data/get-profile";
import { getEncyclopediaStats } from "@/lib/data/get-encyclopedia-stats";
import { getCategoryTrends } from "@/lib/data/get-category-trends";
import EncyclopediaClient from "./EncyclopediaClient";

export default async function EncyclopediaPage() {
  const [webData, profile, stats, categoryTrends] = await Promise.all([
    getKnowledgeWebData(),
    getProfile(),
    getEncyclopediaStats(),
    getCategoryTrends(),
  ]);

  return (
    <EncyclopediaClient
      webData={webData}
      profile={profile}
      stats={stats}
      categoryTrends={categoryTrends}
    />
  );
}
