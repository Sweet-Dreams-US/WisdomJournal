"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import CalendarStrip from "@/components/ui/CalendarStrip";
import SearchInput from "@/components/ui/SearchInput";
import FilterBar from "@/components/ui/FilterBar";
import EmptyState from "@/components/ui/EmptyState";
import ResponseCard from "@/components/app/ResponseCard";
import { CATEGORIES } from "@wisdom-journal/shared";
import type { JournalResponse } from "@wisdom-journal/shared";
import { toLocalDateKey } from "@/lib/utils/dates";

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) return "Today";
  if (dateOnly.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

interface JournalClientProps {
  initialResponses: JournalResponse[];
  initialTotal: number;
}

export default function JournalClient({
  initialResponses,
  initialTotal,
}: JournalClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [responses, setResponses] = useState(initialResponses);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  // null = no date filter (show everything)
  const [selectedDate, setSelectedDate] = useState<string | null>(
    searchParams.get("date")
  );

  // Build set of dates that have entries
  const datesWithEntries = useMemo(() => {
    const dates = new Set<string>();
    responses.forEach((r) => {
      dates.add(toLocalDateKey(r.created_at));
    });
    return dates;
  }, [responses]);

  // Filter responses client-side (for category filtering on already-loaded data)
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      // Category filter (uses join data)
      if (selectedCategory) {
        const primaryCategory = (r as any).categories?.[0]?.category;
        if (primaryCategory?.slug !== selectedCategory) return false;
      }

      // Date filter (from calendar strip; toggling the same day clears it)
      if (selectedDate && toLocalDateKey(r.created_at) !== selectedDate) {
        return false;
      }

      // Text search (client-side refinement)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const text = (r.response_text ?? "").toLowerCase();
        const tags = (r.tags ?? []).join(" ").toLowerCase();
        if (!text.includes(q) && !tags.includes(q)) return false;
      }

      return true;
    });
  }, [responses, selectedCategory, searchQuery, selectedDate]);

  // Group by date
  const groupedResponses = useMemo(() => {
    const groups: Record<string, typeof filteredResponses> = {};
    filteredResponses.forEach((r) => {
      const date = toLocalDateKey(r.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(r);
    });
    // Sort dates descending
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredResponses]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("offset", String(responses.length));
      params.set("limit", "20");
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/responses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.responses?.length > 0) {
          setResponses((prev) => [...prev, ...data.responses]);
          setTotalCount(data.total);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [responses.length, searchQuery]);

  // Reset and re-fetch when filters change significantly
  const resetAndFetch = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("offset", "0");
        params.set("limit", "20");
        if (query) params.set("q", query);

        const res = await fetch(`/api/responses?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResponses(data.responses ?? []);
          setTotalCount(data.total ?? 0);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  function updateParams(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/journal?${params.toString()}`, { scroll: false });
  }

  const hasMore = responses.length < totalCount;

  const filterItems = CATEGORIES.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="max-w-4xl">
      <div className="mb-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-twilight mb-1.5 tracking-tight">
          Your Wisdom Journal
        </h2>
        <p className="text-sm text-charcoal/50 font-medium">
          Browse and revisit your past responses.
        </p>
      </div>

      {/* Calendar strip */}
      <div className="mb-4">
        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            const next = date === selectedDate ? null : date;
            setSelectedDate(next);
            updateParams("date", next);
          }}
          datesWithEntries={datesWithEntries}
        />
      </div>

      {/* Search + Filter */}
      <div className="space-y-3 mb-6">
        <SearchInput
          placeholder="Search your entries..."
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            updateParams("q", val || null);
            // Re-fetch from API when search changes
            if (val.length === 0 || val.length >= 2) {
              resetAndFetch(val);
            }
          }}
        />
        <FilterBar
          items={filterItems}
          selected={selectedCategory}
          onSelect={(slug) => {
            setSelectedCategory(slug);
            updateParams("category", slug);
          }}
        />
      </div>

      {/* Count indicator */}
      {filteredResponses.length > 0 && (
        <p className="text-xs text-charcoal/50 mb-4">
          Showing {filteredResponses.length} of {totalCount} responses
        </p>
      )}

      {/* Response list */}
      {groupedResponses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Entries Yet"
          description={
            searchQuery || selectedCategory
              ? "No entries match your current filters. Try adjusting your search or category."
              : "Once you start answering daily questions, your responses will appear here as a searchable archive of your wisdom."
          }
        />
      ) : (
        <div className="space-y-8">
          {groupedResponses.map(([date, responses]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-charcoal/50 uppercase tracking-wider mb-3">
                {formatDateHeading(date)}
              </h3>
              <div className="space-y-3">
                {responses.map((response) => (
                  <ResponseCard key={response.id} response={response} />
                ))}
              </div>
            </div>
          ))}

          {/* Load More button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-deep-sky bg-deep-sky/10 hover:bg-deep-sky/20 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
