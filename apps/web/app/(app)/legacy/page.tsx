import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { plural } from "@/lib/utils/plural";

export default async function LegacyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find legacy entries where this user is a contact
  const { data: legacyEntries } = await supabase
    .from("legacy_contacts")
    .select(`
      id, relationship, message, is_primary, created_at,
      user_id
    `)
    .or(`contact_user_id.eq.${user.id},contact_email.eq.${user.email}`);

  if (!legacyEntries || legacyEntries.length === 0) {
    return (
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-twilight mb-2">Inherited Wisdom</h2>
        <p className="text-charcoal/60 mb-8">
          No one has designated you as a legacy contact yet.
        </p>
      </div>
    );
  }

  // Get profiles for all the users who designated us
  const userIds = legacyEntries.map((e) => e.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, total_responses")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-twilight mb-2">Inherited Wisdom</h2>
      <p className="text-charcoal/60 mb-8">
        These people trusted you with their wisdom. Take your time exploring what they left behind.
      </p>

      <div className="space-y-4">
        {legacyEntries.map((entry) => {
          const profile = profileMap.get(entry.user_id);
          if (!profile) return null;

          const initials = profile.full_name
            ? profile.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "?";

          return (
            <Link
              key={entry.id}
              href={`/legacy/${entry.user_id}`}
              className="block p-5 rounded-2xl bg-white border border-soft-gray hover:border-sunrise-coral/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-sunrise-coral/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-sunrise-coral">
                    {initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-twilight">
                    {profile.full_name}
                  </h3>
                  <p className="text-sm text-charcoal/50">
                    {entry.relationship && (
                      <span className="capitalize">{entry.relationship} &middot; </span>
                    )}
                    {plural(profile.total_responses, "journal entry", "journal entries")}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
