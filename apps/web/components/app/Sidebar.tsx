"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, BookOpen, MessageCircle, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Today", href: "/dashboard", icon: Sun },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Ask", href: "/ask", icon: MessageCircle },
  { label: "Profile", href: "/profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-soft-gray flex flex-col">
      <div className="p-6 border-b border-soft-gray">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-deep-sky" />
          <span className="font-heading font-bold text-xl text-twilight">
            Wisdom Journal
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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

      <div className="p-4 border-t border-soft-gray">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium text-charcoal/70 hover:bg-soft-gray hover:text-charcoal transition-colors duration-150 w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
