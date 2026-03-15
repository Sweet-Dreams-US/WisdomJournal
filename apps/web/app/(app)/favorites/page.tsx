import { Suspense } from "react";
import { getFavorites } from "@/lib/data/get-favorites";
import FavoritesClient from "./FavoritesClient";

export default async function FavoritesPage() {
  const favorites = await getFavorites();

  return (
    <Suspense
      fallback={
        <div className="max-w-4xl animate-pulse">
          <div className="h-8 w-48 bg-soft-gray rounded mb-2" />
          <div className="h-5 w-64 bg-soft-gray rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-soft-gray rounded-card" />
            ))}
          </div>
        </div>
      }
    >
      <FavoritesClient favorites={favorites} />
    </Suspense>
  );
}
