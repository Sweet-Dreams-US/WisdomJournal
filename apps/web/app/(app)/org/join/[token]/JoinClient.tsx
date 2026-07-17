"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Clock, HelpCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export type InvitationState = "valid" | "invalid" | "expired" | "used";

interface JoinClientProps {
  token: string;
  orgName: string | null;
  initialState: InvitationState;
}

const stateContent: Record<
  Exclude<InvitationState, "valid">,
  { icon: typeof Clock; title: string; description: string }
> = {
  invalid: {
    icon: HelpCircle,
    title: "This invitation link isn't valid",
    description:
      "Double-check the link from your email, or ask an organization admin to send you a new invitation.",
  },
  expired: {
    icon: Clock,
    title: "This invitation has expired",
    description:
      "Invitations are valid for 14 days. Ask an organization admin to send you a fresh one.",
  },
  used: {
    icon: CheckCircle2,
    title: "This invitation has already been used",
    description:
      "If that was you, your organization is waiting for you in the Organizations tab.",
  },
};

export default function JoinClient({
  token,
  orgName,
  initialState,
}: JoinClientProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  async function handleJoin() {
    if (joining) return;
    setJoining(true);
    setError(null);

    try {
      const res = await fetch("/api/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.organization?.slug) {
        router.push(`/org/${data.organization.slug}`);
        return;
      }

      if (res.status === 409) {
        setAlreadyMember(true);
        setError("You're already a member of this organization.");
      } else if (res.status === 410) {
        setError(
          data.error || "This invitation has expired or was already used."
        );
      } else if (res.status === 404) {
        setError(data.error || "This invitation is no longer valid.");
      } else {
        setError(data.error || "Failed to join the organization.");
      }
      setJoining(false);
    } catch {
      setError("Network error. Please try again.");
      setJoining(false);
    }
  }

  // Non-joinable states resolved server-side
  if (initialState !== "valid") {
    const content = stateContent[initialState];
    const Icon = content.icon;
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card padding="lg" className="text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-soft-gray flex items-center justify-center mx-auto mb-5">
            <Icon className="w-8 h-8 text-charcoal/30" />
          </div>
          <h2 className="text-xl font-bold text-twilight mb-2">
            {content.title}
          </h2>
          <p className="text-sm text-charcoal/50 leading-relaxed mb-6">
            {content.description}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/organizations">
              <Button variant="outline-light" size="sm">
                Your Organizations
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Go to Today</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card padding="lg" className="text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-deep-sky to-sky-blue flex items-center justify-center mx-auto mb-5 shadow-button">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/40 mb-2">
          You&apos;ve been invited
        </p>
        <h2 className="text-2xl font-bold text-twilight mb-3">
          Join {orgName ?? "the organization"}
        </h2>
        <p className="text-sm text-charcoal/50 leading-relaxed mb-6">
          Accept this invitation to start contributing your working knowledge
          to {orgName ?? "your team"}&apos;s shared wisdom. Your entries stay
          private to you — teammates and admins only ever see participation
          counts.
        </p>

        {error && (
          <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg mb-4">
            {error}
          </p>
        )}

        {alreadyMember ? (
          <Link href="/organizations">
            <Button size="md">View Your Organizations</Button>
          </Link>
        ) : (
          <Button size="md" onClick={handleJoin} disabled={joining}>
            {joining ? "Joining..." : "Join Organization"}
          </Button>
        )}
      </Card>
    </div>
  );
}
