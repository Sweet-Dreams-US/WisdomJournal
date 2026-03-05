"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useSidebar } from "./SidebarProvider";

const pageTitles: Record<string, string> = {
  "/dashboard": "Today",
  "/journal": "Journal",
  "/ask": "Ask Wisdom",
  "/profile": "Profile",
  "/groups": "Groups",
};

function getTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Dynamic routes
  if (pathname.startsWith("/journal/respond/")) return "Respond";
  if (pathname.startsWith("/journal/")) return "Response Detail";
  if (pathname.startsWith("/groups/")) return "Group Detail";

  return "Wisdom Journal";
}

export default function AppHeader() {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const title = getTitle(pathname);

  return (
    <header className="h-16 border-b border-soft-gray bg-white flex items-center px-4 md:px-8">
      <button
        onClick={toggle}
        className="md:hidden p-2 -ml-2 mr-2 rounded-lg hover:bg-soft-gray transition-colors"
      >
        <Menu className="w-5 h-5 text-charcoal" />
      </button>
      <h1 className="text-xl font-bold text-twilight">{title}</h1>
    </header>
  );
}
