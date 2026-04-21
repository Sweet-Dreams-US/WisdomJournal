"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  Users,
  UserCheck,
  UserX,
  Clock,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TrustColorBadge from "@/components/ui/TrustColorBadge";
import type { FriendsResult } from "@/lib/data/get-friends";

type Tab = "friends" | "requests" | "search";

interface SearchResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  current_streak: number;
  total_responses: number;
  friendship: { id: string; status: string } | null;
}

export default function FriendsClient({ friends }: { friends: FriendsResult }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const requestCount = friends.pending_received.length;

  async function handleSearch() {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await res.json();
      setSearchResults(data.users ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(userId: string) {
    setActionLoading(userId);
    try {
      await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      // Update local state to show "Pending"
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, friendship: { id: "", status: "pending" } }
            : u
        )
      );
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAccept(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      await fetch(`/api/friends/${friendshipId}/accept`, { method: "POST" });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      await fetch(`/api/friends/${friendshipId}/decline`, { method: "POST" });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  function getInitials(name: string | null) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "friends", label: "My Friends" },
    { key: "requests", label: "Requests", count: requestCount },
    { key: "search", label: "Find People" },
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-twilight">
          Friends
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-soft-gray/50 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? "bg-white text-twilight shadow-sm"
                : "text-charcoal/60 hover:text-charcoal"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-deep-sky text-white rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My Friends Tab */}
      {activeTab === "friends" && (
        <div className="space-y-3">
          {friends.accepted.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
                <p className="text-charcoal/60 font-medium">No friends yet</p>
                <p className="text-sm text-charcoal/40 mt-1">
                  Search for people you know to start connecting
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab("search")}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Find People
                </Button>
              </div>
            </Card>
          ) : (
            friends.accepted.map((friend) => (
              <Link key={friend.id} href={`/friends/${friend.id}`}>
                <Card padding="md" className="hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-deep-sky">
                        {getInitials(friend.friend_profile.full_name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">
                        {friend.friend_profile.full_name ?? "Unknown"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-charcoal/50 mt-0.5">
                        <span>
                          {friend.friend_profile.total_responses} responses
                        </span>
                        {friend.friend_profile.current_streak > 0 && (
                          <span>
                            {friend.friend_profile.current_streak} day streak
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {friend.their_access_summary && (
                        <TrustColorBadge
                          color={friend.their_access_summary.trust_color}
                          showLabel
                        />
                      )}
                      <ChevronRight className="w-4 h-4 text-charcoal/30" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}

          {/* Pending sent requests */}
          {friends.pending_sent.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-charcoal/50 mt-6 mb-2">
                Pending Sent
              </h3>
              {friends.pending_sent.map((f) => (
                <Card key={f.id} padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-soft-gray flex items-center justify-center">
                      <span className="text-xs font-bold text-charcoal/50">
                        {getInitials(f.friend_profile.full_name)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">
                        {f.friend_profile.full_name ?? "Unknown"}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-charcoal/40">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="space-y-3">
          {friends.pending_received.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
                <p className="text-charcoal/60 font-medium">No pending requests</p>
                <p className="text-sm text-charcoal/40 mt-1">
                  When someone sends you a friend request, it&apos;ll show up here
                </p>
              </div>
            </Card>
          ) : (
            friends.pending_received.map((f) => (
              <Card key={f.id} padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-deep-sky">
                      {getInitials(f.friend_profile.full_name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal">
                      {f.friend_profile.full_name ?? "Unknown"}
                    </p>
                    {f.message && (
                      <p className="text-xs text-charcoal/50 mt-0.5 flex items-start gap-1">
                        <MessageCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{f.message}</span>
                      </p>
                    )}
                    <p className="text-xs text-charcoal/40 mt-0.5">
                      {f.friend_profile.total_responses} responses
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDecline(f.id)}
                      disabled={actionLoading === f.id}
                      className="text-charcoal/50 hover:text-charcoal hover:bg-soft-gray"
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(f.id)}
                      disabled={actionLoading === f.id}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === "search" && (
        <div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                variant="light"
                placeholder="Search by name, @username, or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              size="md"
              onClick={handleSearch}
              disabled={searching || searchQuery.trim().length < 2}
            >
              <Search className="w-4 h-4 mr-1" />
              {searching ? "..." : "Search"}
            </Button>
          </div>

          <div className="space-y-3">
            {searchResults.length === 0 && !searching && searchQuery && (
              <p className="text-sm text-charcoal/50 text-center py-4">
                No users found
              </p>
            )}

            {searchResults.map((u) => (
              <Card key={u.id} padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-deep-sky/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-deep-sky">
                      {getInitials(u.full_name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {u.full_name ?? u.username ?? "Unknown"}
                    </p>
                    {u.username && (
                      <p className="text-xs text-deep-sky/80 truncate">@{u.username}</p>
                    )}
                    {u.bio && (
                      <p className="text-xs text-charcoal/50 truncate">{u.bio}</p>
                    )}
                  </div>
                  {u.friendship?.status === "accepted" ? (
                    <span className="text-xs text-deep-sky font-medium">
                      Friends
                    </span>
                  ) : u.friendship?.status === "pending" ? (
                    <span className="text-xs text-charcoal/40">Pending</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendRequest(u.id)}
                      disabled={actionLoading === u.id}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
