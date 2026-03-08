import { getKnowledgeWebData } from "@/lib/data/get-knowledge-web";
import { getProfile } from "@/lib/data/get-profile";
import { getEncyclopediaStats } from "@/lib/data/get-encyclopedia-stats";
import EncyclopediaClient from "./EncyclopediaClient";

export default async function EncyclopediaPage() {
  const [webData, profile, stats] = await Promise.all([
    getKnowledgeWebData(),
    getProfile(),
    getEncyclopediaStats(),
  ]);

  return (
    <EncyclopediaClient
      webData={webData}
      profile={profile}
      stats={stats}
    />
  );
}
