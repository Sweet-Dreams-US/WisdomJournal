"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  ChevronRight,
  Briefcase,
  BarChart3,
  ShieldCheck,
  X,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { plural } from "@/lib/utils/plural";

export type OrgRole = "owner" | "admin" | "member";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  member_count: number;
  my_role: OrgRole;
}

const SIZE_RANGES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const rolePillClasses: Record<OrgRole, string> = {
  owner: "bg-golden-hour/10 text-golden-hour",
  admin: "bg-deep-sky/10 text-deep-sky",
  member: "bg-soft-gray text-charcoal/60",
};

const selectClasses =
  "w-full px-4 py-3 rounded-input border border-soft-gray bg-white font-body text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-deep-sky/50 focus:border-deep-sky/30 transition-all duration-200";

const heroFeatures = [
  {
    icon: Briefcase,
    title: "Role-specific daily questions",
    description:
      "Each teammate answers short prompts tuned to their job — decisions, processes, and hard-won lessons.",
  },
  {
    icon: BarChart3,
    title: "Department coverage",
    description:
      "See which teams are capturing knowledge and where the gaps are, at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Knowledge that survives departures",
    description:
      "When someone moves on, what they knew stays with the team instead of walking out the door.",
  },
];

interface OrganizationsClientProps {
  organizations: OrganizationSummary[];
}

export default function OrganizationsClient({
  organizations,
}: OrganizationsClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    size_range: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating || !form.name.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          ...(form.industry.trim() ? { industry: form.industry.trim() } : {}),
          ...(form.size_range ? { size_range: form.size_range } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.organization?.slug) {
        router.push(`/org/${data.organization.slug}`);
      } else {
        setCreateError(data.error || "Failed to create organization");
        setCreating(false);
      }
    } catch {
      setCreateError("Network error. Please try again.");
      setCreating(false);
    }
  }

  const createModal = showCreate && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-twilight/30 backdrop-blur-sm animate-fade-in"
        onClick={() => setShowCreate(false)}
      />
      <Card padding="lg" className="relative w-full max-w-md animate-fade-in-up">
        <button
          type="button"
          onClick={() => setShowCreate(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-charcoal/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-charcoal/40" />
        </button>
        <h3 className="text-lg font-bold text-twilight mb-1">
          Create an Organization
        </h3>
        <p className="text-sm text-charcoal/50 mb-5">
          Set up a shared space where your team captures its working knowledge.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            variant="light"
            label="Organization name"
            placeholder="e.g., Sweet Dreams Music"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          <Input
            variant="light"
            label="Industry (optional)"
            placeholder="e.g., Music production"
            value={form.industry}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, industry: e.target.value }))
            }
          />
          <div>
            <label
              htmlFor="org-size-range"
              className="block text-xs font-body font-medium text-charcoal/60 mb-1.5 tracking-wide"
            >
              Company size (optional)
            </label>
            <select
              id="org-size-range"
              className={selectClasses}
              value={form.size_range}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, size_range: e.target.value }))
              }
            >
              <option value="">Not specified</option>
              {SIZE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range} people
                </option>
              ))}
            </select>
          </div>

          {createError && (
            <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">
              {createError}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="ghost-light"
              size="sm"
              type="button"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={!form.name.trim() || creating}>
              {creating ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  // Empty state: business hero
  if (organizations.length === 0) {
    return (
      <div className="max-w-3xl">
        <Card padding="lg" className="relative overflow-hidden animate-fade-in-up">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-deep-sky/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-golden-hour/5 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-deep-sky to-sky-blue flex items-center justify-center shadow-button mb-5">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-twilight mb-2">
              Capture your team&apos;s knowledge before it walks out the door
            </h2>
            <p className="text-charcoal/60 max-w-xl mb-8 leading-relaxed">
              Bring Wisdom Journal to work. Your team answers a few guided
              questions a day, and the know-how that usually lives in
              people&apos;s heads becomes a lasting company resource.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {heroFeatures.map((feature, i) => (
                <div
                  key={feature.title}
                  className="animate-stagger-in"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-deep-sky/10 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-deep-sky" />
                  </div>
                  <h3 className="text-sm font-semibold text-twilight mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-charcoal/50 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Your Organization
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-charcoal/40">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                Entries stay private to their authors — admins only see
                participation counts.
              </p>
            </div>
          </div>
        </Card>
        {createModal}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-twilight mb-2">Organizations</h2>
          <p className="text-charcoal/60">
            Capture and share your team&apos;s working knowledge.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Organization
        </Button>
      </div>

      <div className="space-y-3">
        {organizations.map((org, i) => (
          <div
            key={org.id}
            className="animate-stagger-in"
            style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}
          >
            <Link href={`/org/${org.slug}`}>
              <Card hover padding="md" className="cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-deep-sky/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {org.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org.logo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-deep-sky" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-twilight truncate">
                        {org.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${rolePillClasses[org.my_role]}`}
                      >
                        {org.my_role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-charcoal/40">
                      <span>{plural(org.member_count, "member")}</span>
                      {org.industry && <span>{org.industry}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-charcoal/30 flex-shrink-0" />
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {createModal}
    </div>
  );
}
