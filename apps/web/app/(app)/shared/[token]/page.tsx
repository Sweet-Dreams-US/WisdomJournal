import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import SharedResponseClient from "./SharedResponseClient";

export default async function SharedResponsePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: share } = await supabase
    .from("response_shares")
    .select(`
      *,
      response:responses(
        id, response_text, word_count, input_method, created_at,
        question:questions(text),
        categories:response_categories(category:categories(name, slug))
      )
    `)
    .eq("share_token", params.token)
    .single();

  if (!share || !share.response) {
    notFound();
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    notFound();
  }

  // Mark as viewed
  if (!share.viewed_at) {
    await supabase
      .from("response_shares")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", share.id);
  }

  // Get sharer's name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", share.shared_by)
    .single();

  return (
    <SharedResponseClient
      response={share.response}
      sharedByName={profile?.full_name || "Someone"}
      message={share.message}
    />
  );
}
