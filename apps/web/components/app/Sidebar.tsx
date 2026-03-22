"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, BookOpen, MessageCircle, User, LogOut, Users, UserPlus, X, Flame, Globe, Shield, Heart, Bell, Activity, Users2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarProvider";
import { useEffect } from "react";
import { useProfile } from "@/lib/hooks/use-profile";

const navItems = [
  { label: "Today", href: "/dashboard", icon: Sun, showStreak: true },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Encyclopedia", href: "/encyclopedia", icon: Globe },
  { label: "Ask", href: "/ask", icon: MessageCircle },
  { label: "Groups", href: "/groups", icon: Users },
  { label: "Friends", href: "/friends", icon: UserPlus },
  { label: "People", href: "/people", icon: Users2 },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Admin", href: "/admin", icon: Shield, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebar();
  const { profile } = useProfile();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close();
  }, [pathname, close]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const streak = profile?.current_streak ?? 0;

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-soft-gray">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-deep-sky" />
          <span className="font-heading font-bold text-xl text-twilight">
            Wisdom Journal
          </span>
        </Link>
      </div>

      {/* Streak indicator */}
      {streak > 0 && (
        <div className="px-4 py-3 border-b border-soft-gray">
          <span className="inline-flex items-center gap-1.5 text-xs text-golden-hour font-medium">
            <Flame className="w-3.5 h-3.5" />
            {streak} day streak
          </span>
        </div>
      )}

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            // Skip admin for non-admin users
            if (item.adminOnly && !profile?.is_admin) return null;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium
                    transition-colors duration-150
                    ${
                      isActive
                        ? "bg-deep-sky/10 text-deep-sky"
                        : "text-charcoal/70 hover:bg-soft-gray hover:text-charcoal"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-soft-gray space-y-1">
        <a
          href="mailto:cole@marcuccilli.com?subject=Wisdom%20Journal%20Beta%20Feedback"
          className="flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium text-charcoal/70 hover:bg-soft-gray hover:text-charcoal transition-colors duration-150 w-full"
        >
          <MessageSquare className="w-5 h-5" />
          Send Feedback
        </a>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium text-charcoal/70 hover:bg-soft-gray hover:text-charcoal transition-colors duration-150 w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-soft-gray flex-col z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-soft-gray flex flex-col z-50
          md:hidden transition-transform duration-200 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-soft-gray transition-colors"
        >
          <X className="w-5 h-5 text-charcoal/60" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
