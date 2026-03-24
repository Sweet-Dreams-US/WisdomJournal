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
  ChevronRight,
  BookOpen,
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

interface MentionDetail {
  id: string;
  response_id: string;
  mentioned_name: string;
  relationship: string | null;
  created_at: string;
  response: {
    id: string;
    response_text: string;
    created_at: string;
  } | null;
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
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [personDetails, setPersonDetails] = useState<MentionDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  async function handlePersonClick(normalizedName: string) {
    if (selectedPerson === normalizedName) {
      setSelectedPerson(null);
      setPersonDetails([]);
      return;
    }

    setSelectedPerson(normalizedName);
    setDetailsLoading(true);

    try {
      const res = await fetch(
        `/api/people/mentions?name=${encodeURIComponent(normalizedName)}`
      );
      if (res.ok) {
        const data = await res.json();
        setPersonDetails(data.mentions ?? []);
      }
    } finally {
      setDetailsLoading(false);
    }
  }

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

      {/* Search bar */}
      {mentions.length > 0 && (
        <div className="relative mb-4">
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
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Count */}
      {filteredMentions.length > 0 && searchQuery && (
        <p className="text-xs text-charcoal/50 mb-3">
          {filteredMentions.length} of {mentions.length} people
        </p>
      )}

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
      ) : filteredMentions.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-6">
            <Search className="w-10 h-10 text-charcoal/20 mx-auto mb-2" />
            <p className="text-charcoal/60 text-sm">
              No people match &quot;{searchQuery}&quot;
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMentions.map((mention) => {
            const isSelected = selectedPerson === mention.normalized_name;
            const friendMatch = findFriendMatch(mention.normalized_name);

            return (
              <div key={mention.normalized_name}>
                <Card padding="md">
                  <button
                    onClick={() => handlePersonClick(mention.normalized_name)}
                    className="w-full text-left"
                  >
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
                            <span className="text-xs text-charcoal/30">
                              ·
                            </span>
                          )}
                          <span className="text-xs text-charcoal/50">
                            Mentioned {mention.mention_count} time
                            {mention.mention_count !== 1 ? "s" : ""}
                          </span>
                          {friendMatch && (
                            <>
                              <span className="text-xs text-charcoal/30">
                                ·
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <UserCheck className="w-3 h-3" />
                                Friend
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-charcoal/30 transition-transform ${isSelected ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>
                </Card>

                {/* Expanded details panel */}
                {isSelected && (
                  <div className="ml-6 mt-1 mb-2 space-y-2">
                    {friendMatch && (
                      <Link
                        href={`/friends`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-deep-sky bg-deep-sky/10 hover:bg-deep-sky/20 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        View Friend Profile
                      </Link>
                    )}

                    {detailsLoading ? (
                      <Card padding="sm">
                        <div className="py-4 text-center">
                          <p className="text-sm text-charcoal/40 animate-pulse">
                            Loading mentions...
                          </p>
                        </div>
                      </Card>
                    ) : personDetails.length === 0 ? (
                      <Card padding="sm">
                        <p className="text-sm text-charcoal/40 py-2 text-center">
                          No detailed mentions found
                        </p>
                      </Card>
                    ) : (
                      personDetails.map((detail) => (
                        <Card key={detail.id} padding="sm">
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-charcoal/30 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              {detail.response ? (
                                <Link
                                  href={`/journal?highlight=${detail.response.id}`}
                                  className="text-sm text-charcoal hover:text-deep-sky transition-colors line-clamp-2"
                                >
                                  {detail.response.response_text.length > 150
                                    ? detail.response.response_text.slice(
                                        0,
                                        150
                                      ) + "..."
                                    : detail.response.response_text}
                                </Link>
                              ) : (
                                <p className="text-sm text-charcoal/50 italic">
                                  Response unavailable
                                </p>
                              )}
                              <p className="text-xs text-charcoal/40 mt-1">
                                {new Date(
                                  detail.created_at
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
