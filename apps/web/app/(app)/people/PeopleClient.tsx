"use client";

import { Users2, Heart, Briefcase, GraduationCap, User } from "lucide-react";
import Card from "@/components/ui/Card";
import type { MentionSummary } from "@/lib/data/get-mentions";

function getRelationshipIcon(relationship: string | null) {
  switch (relationship) {
    case "mother":
    case "father":
    case "parent":
    case "child":
    case "sibling":
    case "grandparent":
    case "aunt":
    case "uncle":
    case "cousin":
    case "spouse":
    case "partner":
      return <Heart className="w-4 h-4 text-sunrise-coral" />;
    case "coworker":
    case "boss":
      return <Briefcase className="w-4 h-4 text-deep-sky" />;
    case "teacher":
    case "mentor":
      return <GraduationCap className="w-4 h-4 text-golden-hour" />;
    case "friend":
      return <Users2 className="w-4 h-4 text-green-500" />;
    default:
      return <User className="w-4 h-4 text-charcoal/40" />;
  }
}

function formatRelationship(r: string | null): string {
  if (!r) return "";
  return r.charAt(0).toUpperCase() + r.slice(1);
}

interface Props {
  mentions: MentionSummary[];
}

export default function PeopleClient({ mentions }: Props) {
  return (
    <div className="max-w-3xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-twilight tracking-tight">
          People in Your Journal
        </h1>
        <p className="text-sm text-charcoal/50 mt-1 font-medium">
          People mentioned across your journal entries, extracted automatically
        </p>
      </div>

      {mentions.length === 0 ? (
        <Card padding="lg" className="animate-scale-in">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sunrise-coral/8 to-sunrise-coral/3 flex items-center justify-center mx-auto mb-4">
              <Users2 className="w-8 h-8 text-charcoal/20" />
            </div>
            <p className="text-charcoal/60 font-semibold tracking-tight">
              No people mentioned yet
            </p>
            <p className="text-sm text-charcoal/40 mt-1 max-w-sm mx-auto">
              As you journal, people you mention will appear here automatically.
              Write about the people who matter to you!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-2">
          {mentions.map((mention, i) => (
            <div
              key={mention.normalized_name}
              className="animate-stagger-in"
              style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
            >
              <Card padding="md" className="group hover:shadow-card-glow transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-soft-gray to-white flex items-center justify-center border border-charcoal/[0.04] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {getRelationshipIcon(mention.relationship)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal tracking-tight">
                      {mention.display_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {mention.relationship && (
                        <span className="text-[11px] text-charcoal/45 font-medium">
                          {formatRelationship(mention.relationship)}
                        </span>
                      )}
                      {mention.relationship && (
                        <span className="text-[11px] text-charcoal/20">·</span>
                      )}
                      <span className="text-[11px] text-charcoal/40 font-medium">
                        Mentioned {mention.mention_count} time
                        {mention.mention_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {/* Mention count indicator */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-lg bg-deep-sky/8 flex items-center justify-center"
                      title={`${mention.mention_count} mentions`}
                    >
                      <span className="text-xs font-bold text-deep-sky">{mention.mention_count}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
