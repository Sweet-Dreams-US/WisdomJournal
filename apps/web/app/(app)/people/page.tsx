import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getMentionsSummary } from "@/lib/data/get-mentions";
import PeopleClient from "./PeopleClient";

export const dynamic = "force-dynamic";

export default function PeoplePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl animate-pulse">
          <div className="h-8 bg-soft-gray rounded w-48 mb-6" />
          <div className="h-10 bg-soft-gray rounded-xl mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-soft-gray rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <PeoplePageContent />
    </Suspense>
  );
}

async function PeoplePageContent() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mentions = await getMentionsSummary();

  // Get friend names for matching
  let friendNames: { id: string; full_name: string }[] = [];
  if (user) {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("user_a, user_b")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq("status", "accepted");

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map((f) =>
        f.user_a === user.id ? f.user_b : f.user_a
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", friendIds)
        .not("full_name", "is", null);

      friendNames = (profiles ?? []).filter(
        (p): p is { id: string; full_name: string } => p.full_name !== null
      );
    }
  }

  return <PeopleClient mentions={mentions} friendNames={friendNames} />;
}
