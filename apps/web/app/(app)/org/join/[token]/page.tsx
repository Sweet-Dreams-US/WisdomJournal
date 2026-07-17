import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import JoinClient, { type InvitationState } from "./JoinClient";

interface Props {
  params: { token: string };
}

export default async function JoinPage({ params }: Props) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The join route isn't covered by middleware auth protection, so guard here.
  // Middleware has no next-param support, so a plain /login redirect it is.
  if (!user) {
    redirect("/login");
  }

  // Look up the invitation with the service role (invitee isn't a member yet,
  // so RLS would hide the row from them).
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invitation } = await admin
    .from("organization_invitations")
    .select("token, expires_at, accepted_at, organizations(name, slug)")
    .eq("token", params.token)
    .maybeSingle();

  let state: InvitationState = "valid";
  let orgName: string | null = null;

  if (!invitation) {
    state = "invalid";
  } else {
    const orgRel = Array.isArray(invitation.organizations)
      ? invitation.organizations[0]
      : invitation.organizations;
    orgName = orgRel?.name ?? null;

    if (invitation.accepted_at) {
      state = "used";
    } else if (
      invitation.expires_at &&
      new Date(invitation.expires_at) < new Date()
    ) {
      state = "expired";
    }
  }

  return (
    <JoinClient token={params.token} orgName={orgName} initialState={state} />
  );
}
