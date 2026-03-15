"use client";

import { Heart } from "lucide-react";
import ResponseCard from "@/components/app/ResponseCard";
import EmptyState from "@/components/ui/EmptyState";
import type { JournalResponse } from "@wisdom-journal/shared";

interface FavoritesClientProps {
  favorites: JournalResponse[];
}

export default function FavoritesClient({ favorites }: FavoritesClientProps) {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-twilight mb-2">
          Favorites
        </h2>
        <p className="text-charcoal/60">
          Your most meaningful journal entries, saved for easy access.
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No Favorites Yet"
          description="Tap the heart icon on any journal entry to save it here. Your favorite responses will be collected in one place."
        />
      ) : (
        <div className="space-y-3">
          {favorites.map((response) => (
            <ResponseCard key={response.id} response={response} />
          ))}
        </div>
      )}
    </div>
  );
}
