"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users2,
  Heart,
  Briefcase,
  GraduationCap,
  User,
  Search,
  X,
  UserCheck,
} from "lucide-react";
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

interface FriendMatch {
  id: string;
  full_name: string;
}

interface Props {
  mentions: MentionSummary[];
  friendNames: FriendMatch[];
}

export default function PeopleClient({ mentions, friendNames }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMentions = useMemo(() => {
    if (!searchQuery.trim()) return mentions;
    const q = searchQuery.toLowerCase();
    return mentions.filter(
      (m) =>
        m.display_name.toLowerCase().includes(q) ||
        m.normalized_name.toLowerCase().includes(q) ||
        (m.relationship && m.relationship.toLowerCase().includes(q))
    );
  }, [mentions, searchQuery]);

  // Check if a mentioned person matches a friend name
  function findFriendMatch(normalizedName: string): FriendMatch | null {
    return (
      friendNames.find(
        (f) =>
          f.full_name.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(f.full_name.toLowerCase())
      ) ?? null
    );
  }

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

      {/* Search bar */}
      {mentions.length > 0 && (
        <div className="relative mb-4 animate-fade-in">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search people by name or relationship..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-charcoal/15 bg-white text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-deep-sky/30 focus:border-deep-sky transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Count */}
      {filteredMentions.length > 0 && searchQuery && (
        <p className="text-xs text-charcoal/50 mb-3 font-medium">
          {filteredMentions.length} of {mentions.length} people
        </p>
      )}

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
      ) : filteredMentions.length === 0 ? (
        <Card padding="lg" className="animate-scale-in">
          <div className="text-center py-6">
            <Search className="w-10 h-10 text-charcoal/20 mx-auto mb-2" />
            <p className="text-charcoal/60 text-sm">
              No people match &quot;{searchQuery}&quot;
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filteredMentions.map((mention, i) => {
            const friendMatch = findFriendMatch(mention.normalized_name);

            return (
              <div
                key={mention.normalized_name}
                className="animate-stagger-in"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
              >
                <Link
                  href={`/people/${encodeURIComponent(mention.normalized_name)}`}
                  className="block"
                >
                  <Card
                    padding="md"
                    className="group cursor-pointer hover:shadow-card-glow hover:-translate-y-0.5 transition-all duration-300"
                  >
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
                          {friendMatch && (
                            <>
                              <span className="text-[11px] text-charcoal/20">·</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
                                <UserCheck className="w-3 h-3" />
                                Friend
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Mention count indicator */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-lg bg-deep-sky/8 flex items-center justify-center"
                          title={`${mention.mention_count} mentions`}
                        >
                          <span className="text-xs font-bold text-deep-sky">
                            {mention.mention_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
