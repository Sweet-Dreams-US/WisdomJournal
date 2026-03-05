import { getProfile } from "@/lib/data/get-profile";
import { getWisdomQueries } from "@/lib/data/get-wisdom-queries";
import AskClient from "./AskClient";
import { redirect } from "next/navigation";

export default async function AskPage() {
  const [profile, pastQueries] = await Promise.all([
    getProfile(),
    getWisdomQueries(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return <AskClient profile={profile} pastQueries={pastQueries} />;
}
