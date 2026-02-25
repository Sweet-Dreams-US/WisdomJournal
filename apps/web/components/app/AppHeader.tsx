"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Today",
  "/journal": "Journal",
  "/ask": "Ask Wisdom",
  "/profile": "Profile",
};

export default function AppHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Wisdom Journal";

  return (
    <header className="h-16 border-b border-soft-gray bg-white flex items-center px-8">
      <h1 className="text-xl font-bold text-twilight">{title}</h1>
    </header>
  );
}
