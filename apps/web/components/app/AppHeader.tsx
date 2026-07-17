"use client";

import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { useSidebar } from "./SidebarProvider";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "Today", subtitle: "Your daily reflection" },
  "/journal": { title: "Journal", subtitle: "Your wisdom archive" },
  "/calendar": { title: "Calendar", subtitle: "Your journaling months at a glance" },
  "/achievements": { title: "Achievements", subtitle: "Milestones you have earned" },
  "/ask": { title: "Ask Wisdom", subtitle: "Query your knowledge" },
  "/profile": { title: "Profile", subtitle: "Your identity" },
  "/groups": { title: "Groups", subtitle: "Shared wisdom circles" },
  "/activity": { title: "Activity", subtitle: "Recent happenings" },
  "/people": { title: "People", subtitle: "Mentioned connections" },
  "/favorites": { title: "Favorites", subtitle: "Saved responses" },
  "/notifications": { title: "Notifications", subtitle: "Updates & alerts" },
  "/settings": { title: "Settings", subtitle: "Preferences & privacy" },
  "/encyclopedia": { title: "Encyclopedia", subtitle: "Your knowledge map" },
  "/friends": { title: "Friends", subtitle: "Your connections" },
};

function getPageInfo(pathname: string): { title: string; subtitle?: string } {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Dynamic routes
  if (pathname.startsWith("/journal/respond/"))
    return { title: "Respond", subtitle: "Share your wisdom" };
  if (pathname.startsWith("/journal/"))
    return { title: "Response", subtitle: "View your reflection" };
  if (pathname.startsWith("/groups/"))
    return { title: "Group", subtitle: "Circle details" };
  if (pathname.startsWith("/friends/"))
    return { title: "Friend", subtitle: "Connection details" };

  return { title: "Wisdom Journal" };
}

export default function AppHeader() {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const { title, subtitle } = getPageInfo(pathname);

  return (
    <header className="h-14 bg-white/70 backdrop-blur-xl border-b border-charcoal/[0.06] flex items-center px-4 md:px-8 sticky top-0 z-30">
      <button
        onClick={toggle}
        className="md:hidden p-2 -ml-2 mr-3 rounded-xl hover:bg-soft-gray active:scale-95 transition-all duration-200"
      >
        <Menu className="w-5 h-5 text-charcoal/70" />
      </button>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-br from-deep-sky/10 to-sky-blue/5 items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-deep-sky/60" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-twilight tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-charcoal/40 font-medium tracking-wide hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
