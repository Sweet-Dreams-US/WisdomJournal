import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CapsulesClient from "./CapsulesClient";

export default async function CapsulesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("time_capsules")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const capsules = (rows ?? []).map((c) => ({
    ...c,
    unlocked_now:
      c.is_opened || (c.open_on_date && c.open_on_date <= today),
  }));

  return <CapsulesClient initial={capsules} />;
}
