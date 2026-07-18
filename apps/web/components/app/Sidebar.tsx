"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  BookOpen,
  MessageCircle,
  User,
  LogOut,
  Users,
  UserPlus,
  Building2,
  X,
  Flame,
  Globe,
  Shield,
  Heart,
  Bell,
  Activity,
  Users2,
  CalendarDays,
  Award,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarProvider";
import { useCallback, useEffect, useState } from "react";
import { useProfile } from "@/lib/hooks/use-profile";

const navSections: {
  heading: string | null;
  items: { label: string; href: string; icon: LucideIcon; adminOnly?: boolean }[];
}[] = [
  {
    heading: null,
    items: [
      { label: "Today", href: "/dashboard", icon: Sun },
      { label: "Journal", href: "/journal", icon: BookOpen },
      { label: "Calendar", href: "/calendar", icon: CalendarDays },
      { label: "Encyclopedia", href: "/encyclopedia", icon: Globe },
      { label: "Ask", href: "/ask", icon: MessageCircle },
    ],
  },
  {
    heading: "Connect",
    items: [
      { label: "Groups", href: "/groups", icon: Users },
      { label: "Organizations", href: "/organizations", icon: Building2 },
      { label: "Friends", href: "/friends", icon: UserPlus },
      { label: "People", href: "/people", icon: Users2 },
      { label: "Activity", href: "/activity", icon: Activity },
    ],
  },
  {
    heading: "You",
    items: [
      { label: "Achievements", href: "/achievements", icon: Award },
      { label: "Favorites", href: "/favorites", icon: Heart },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Profile", href: "/profile", icon: User },
      { label: "Admin", href: "/admin", icon: Shield, adminOnly: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebar();
  const { profile } = useProfile();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    close();
  }, [pathname, close]);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/inbox");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count ?? 0);
      }
    } catch {
      // Silently fail - non-critical
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Reset count when visiting notifications page
  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const streak = profile?.current_streak ?? 0;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-charcoal/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-deep-sky to-sky-blue flex items-center justify-center shadow-button group-hover:shadow-glow transition-shadow duration-300">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-lg text-twilight">
            Wisdom
          </span>
        </Link>
      </div>

      {/* Streak indicator */}
      {streak > 0 && (
        <div className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-golden-hour/10 to-sunrise-coral/5 border border-golden-hour/15">
          <span className="inline-flex items-center gap-2 text-xs text-golden-hour font-semibold">
            <Flame className="w-4 h-4 animate-breathe" />
            {streak} day streak
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {navSections.map((section, sectionIdx) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || profile?.is_admin
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.heading ?? sectionIdx} className={sectionIdx > 0 ? "mt-5" : ""}>
              {section.heading && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-charcoal/35">
                  {section.heading}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const isNotifications = item.href === "/notifications";
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                          transition-all duration-200 relative
                          ${
                            isActive
                              ? "nav-item-active [border-left:none] text-deep-sky font-semibold"
                              : "text-charcoal/55 hover:text-charcoal hover:bg-charcoal/[0.03]"
                          }
                        `}
                      >
                        {/* Sliding active indicator: persists in every link so the
                            scaleY transition plays as active state moves between items */}
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-deep-sky transition-transform duration-[250ms] ease-out ${
                            isActive ? "scale-y-100" : "scale-y-0"
                          }`}
                        />
                        <item.icon
                          className={`w-[18px] h-[18px] transition-colors ${
                            isActive ? "text-deep-sky animate-scale-in" : ""
                          }`}
                        />
                        <span className="flex-1">{item.label}</span>
                        {isNotifications && unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-sunrise-coral text-white text-[11px] font-bold leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Feedback + Sign out */}
      <div className="p-3 border-t border-charcoal/[0.06] space-y-0.5">
        <button
          onClick={() => {
            // Trigger the floating feedback widget
            window.dispatchEvent(new CustomEvent("open-feedback"));
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-charcoal/50 hover:text-charcoal hover:bg-charcoal/[0.03] transition-all duration-200 w-full"
        >
          <MessageSquare className="w-[18px] h-[18px]" />
          Send Feedback
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-charcoal/50 hover:text-charcoal hover:bg-charcoal/[0.03] transition-all duration-200 w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 sidebar-gradient border-r border-charcoal/[0.06] flex-col z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-twilight/20 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={close}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-64 sidebar-gradient border-r border-charcoal/[0.06] flex flex-col z-50
          md:hidden transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-charcoal/5 transition-colors"
        >
          <X className="w-5 h-5 text-charcoal/40" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
