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
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-twilight">
          People in Your Journal
        </h1>
        <p className="text-sm text-charcoal/60 mt-1">
          People mentioned across your journal entries, extracted automatically
        </p>
      </div>

      {mentions.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <Users2 className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
            <p className="text-charcoal/60 font-medium">
              No people mentioned yet
            </p>
            <p className="text-sm text-charcoal/40 mt-1">
              As you journal, people you mention will appear here automatically.
              Write about the people who matter to you!
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {mentions.map((mention) => (
            <Card key={mention.normalized_name} padding="md">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-soft-gray flex items-center justify-center">
                  {getRelationshipIcon(mention.relationship)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal">
                    {mention.display_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {mention.relationship && (
                      <span className="text-xs text-charcoal/50">
                        {formatRelationship(mention.relationship)}
                      </span>
                    )}
                    {mention.relationship && (
                      <span className="text-xs text-charcoal/30">·</span>
                    )}
                    <span className="text-xs text-charcoal/50">
                      Mentioned {mention.mention_count} time
                      {mention.mention_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
