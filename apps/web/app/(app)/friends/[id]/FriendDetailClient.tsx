"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserMinus,
  MessageCircle,
  Eye,
  EyeOff,
  BookOpen,
  Flame,
  ChevronRight,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TrustColorBadge from "@/components/ui/TrustColorBadge";
import CategoryAccessGrid from "@/components/ui/CategoryAccessGrid";
import type { FriendDetail } from "@/lib/data/get-friend";
import { plural } from "@/lib/utils/plural";

interface Props {
  friend: FriendDetail;
}

export default function FriendDetailClient({ friend }: Props) {
  const router = useRouter();
  const { friend_profile, categories } = friend;

  // My sharing state (what I share with them)
  const [myCategoryAccess, setMyCategoryAccess] = useState(() =>
    categories.map((c) => {
      const access = friend.my_category_access.find(
        (a) => a.category_id === c.id
      );
      return {
        slug: c.slug,
        name: c.name,
        enabled: access?.is_enabled ?? false,
      };
    })
  );

  // What they share with me (read-only)
  const theirCategoryAccess = categories.map((c) => {
    const access = friend.their_category_access.find(
      (a) => a.category_id === c.id
    );
    return {
      slug: c.slug,
      name: c.name,
      enabled: access?.is_enabled ?? false,
    };
  });

  const initials = friend_profile.full_name
    ? friend_profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  async function handleCategoryToggle(slug: string, enabled: boolean) {
    setMyCategoryAccess((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, enabled } : c))
    );

    const category = categories.find((c) => c.slug === slug);
    if (category) {
      await fetch(`/api/friends/${friend.friendship.id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toggles: [{ category_id: category.id, is_enabled: enabled }],
        }),
      });
    }
  }

  async function handleUnfriend() {
    if (
      !confirm(
        `Remove ${friend_profile.full_name ?? "this person"} as a friend? This will revoke all shared access.`
      )
    )
      return;

    await fetch(`/api/friends/${friend.friendship.id}`, { method: "DELETE" });
    router.push("/friends");
    router.refresh();
  }

  const sharedCategories = theirCategoryAccess.filter((c) => c.enabled);

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        href="/friends"
        className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Friends
      </Link>

      {/* Friend profile header */}
      <Card padding="lg" className="mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-deep-sky">{initials}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-twilight">
              {friend_profile.full_name ?? "Unknown"}
            </h2>
            {friend_profile.bio && (
              <p className="text-sm text-charcoal/60 mt-1">
                {friend_profile.bio}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-charcoal/50">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {plural(friend_profile.total_responses, "response")}
              </span>
              {friend_profile.current_streak > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-golden-hour" />
                  {friend_profile.current_streak} day streak
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {friend.their_access_summary && (
              <TrustColorBadge
                color={friend.their_access_summary.trust_color}
                showLabel
              />
            )}
          </div>
        </div>
      </Card>

      {/* What I'm Sharing */}
      <h3 className="text-lg font-bold text-twilight mb-2 flex items-center gap-2">
        <Eye className="w-5 h-5" />
        What I&apos;m Sharing
      </h3>
      <p className="text-sm text-charcoal/60 mb-3">
        Control which categories of your wisdom{" "}
        {friend_profile.full_name?.split(" ")[0] ?? "they"} can see.
      </p>
      <Card padding="md" className="mb-6">
        <CategoryAccessGrid
          categories={myCategoryAccess}
          onChange={handleCategoryToggle}
        />
        {friend.my_access_summary && (
          <div className="mt-3 pt-3 border-t border-soft-gray flex items-center gap-2 text-xs text-charcoal/50">
            Sharing {friend.my_access_summary.enabled_count} of{" "}
            {friend.my_access_summary.total_count} categories
            <TrustColorBadge
              color={friend.my_access_summary.trust_color}
              showLabel
            />
          </div>
        )}
      </Card>

      {/* What They Share */}
      <h3 className="text-lg font-bold text-twilight mb-2 flex items-center gap-2">
        <EyeOff className="w-5 h-5" />
        What They Share With You
      </h3>
      <p className="text-sm text-charcoal/60 mb-3">
        {friend_profile.full_name?.split(" ")[0] ?? "They"} control which
        categories you can see.
      </p>
      <Card padding="md" className="mb-6">
        <CategoryAccessGrid
          categories={theirCategoryAccess}
          onChange={() => {}}
          disabled
        />
      </Card>

      {/* Ask Their Wisdom */}
      {sharedCategories.length > 0 && (
        <Link href={`/ask?friend=${friend.friendship.id}`}>
          <Card padding="lg" className="mb-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-deep-sky/20 hover:border-deep-sky/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-deep-sky" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-twilight">
                  Ask {friend_profile.full_name?.split(" ")[0] ?? "Their"}&apos;s Wisdom
                </h3>
                <p className="text-sm text-charcoal/60 mt-0.5">
                  Ask questions and get answers based on {sharedCategories.length} shared {sharedCategories.length === 1 ? "category" : "categories"} of their journal entries
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-charcoal/30" />
            </div>
          </Card>
        </Link>
      )}

      {sharedCategories.length === 0 && (
        <Card padding="lg" className="mb-6">
          <div className="text-center py-4">
            <EyeOff className="w-10 h-10 text-charcoal/20 mx-auto mb-2" />
            <p className="text-sm text-charcoal/60">
              {friend_profile.full_name?.split(" ")[0] ?? "They"} hasn&apos;t
              shared any categories with you yet
            </p>
          </div>
        </Card>
      )}

      {/* Unfriend */}
      <div className="flex justify-end mt-8 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnfriend}
          className="text-error hover:bg-error/10 hover:text-error"
        >
          <UserMinus className="w-4 h-4 mr-1" />
          Remove Friend
        </Button>
      </div>
    </div>
  );
}
