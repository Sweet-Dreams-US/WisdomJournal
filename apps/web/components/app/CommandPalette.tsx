"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Command, X } from "lucide-react";
import { MOODS } from "@/components/ui/MoodSelector";

interface SearchResult {
  response_id: string;
  excerpt: string;
  created_at: string;
  category_slug?: string | null;
  category_name?: string | null;
}

const QUICK_ACTIONS = [
  { label: "Today's question", href: "/dashboard", key: "t" },
  { label: "Open journal", href: "/journal", key: "j" },
  { label: "Encyclopedia", href: "/encyclopedia", key: "e" },
  { label: "Ask wisdom", href: "/ask", key: "a" },
  { label: "Capsules", href: "/capsules", key: "c" },
  { label: "Friends", href: "/friends", key: "f" },
  { label: "Groups", href: "/groups", key: "g" },
  { label: "Profile", href: "/profile", key: "p" },
  { label: "Year in review", href: "/review", key: "r" },
];

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, "");
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRun = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setResults([]);
    setActiveIdx(0);
  }, []);

  // Global shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }

      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
        return;
      }

      if (!open && !inEditable) {
        if (e.key === "/") {
          e.preventDefault();
          setOpen(true);
          return;
        }
        if (e.key === "?") {
          e.preventDefault();
          setOpen(true);
          setQ("help");
          return;
        }
        // Single-letter jumps (matches QUICK_ACTIONS)
        const match = QUICK_ACTIONS.find((a) => a.key === e.key.toLowerCase());
        if (match && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          router.push(match.href);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close, router]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Live search
  useEffect(() => {
    if (!open) return;
    const now = Date.now();
    const runAt = now + 200;
    lastRun.current = runAt;
    const t = window.setTimeout(async () => {
      if (lastRun.current !== runAt) return;
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(t);
  }, [q, open]);

  const actionsMatching = QUICK_ACTIONS.filter(
    (a) => !q.trim() || a.label.toLowerCase().includes(q.toLowerCase())
  );

  const items: Array<{ type: "action"; label: string; href: string } | { type: "result"; result: SearchResult }> = [
    ...actionsMatching.map((a) => ({ type: "action" as const, label: a.label, href: a.href })),
    ...results.map((r) => ({ type: "result" as const, result: r })),
  ];

  function activate(idx: number) {
    const item = items[idx];
    if (!item) return;
    if (item.type === "action") router.push(item.href);
    else router.push(`/journal/${item.result.response_id}`);
    close();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(activeIdx);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-xl bg-white rounded-card shadow-card-hover overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-soft-gray">
          <Search className="w-4 h-4 text-charcoal/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={onKey}
            placeholder="Jump to, or search your wisdom…"
            className="flex-1 bg-transparent focus:outline-none text-sm"
          />
          <button onClick={close} className="p-1 rounded hover:bg-soft-gray">
            <X className="w-3.5 h-3.5 text-charcoal/45" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && (
            <div className="p-6 text-center text-sm text-charcoal/50">
              {loading ? "searching…" : "no matches"}
            </div>
          )}
          <ul>
            {items.map((item, i) => {
              const active = i === activeIdx;
              if (item.type === "action") {
                return (
                  <li
                    key={`a-${item.href}`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => activate(i)}
                    className={`px-4 py-3 text-sm flex items-center justify-between cursor-pointer ${
                      active ? "bg-deep-sky/10" : "hover:bg-soft-gray/50"
                    }`}
                  >
                    <span className="text-charcoal font-medium">{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-charcoal/40" />
                  </li>
                );
              }
              const r = item.result;
              return (
                <li
                  key={r.response_id}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => activate(i)}
                  className={`px-4 py-3 border-t border-soft-gray cursor-pointer ${
                    active ? "bg-deep-sky/10" : "hover:bg-soft-gray/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-charcoal/50">
                    <span>
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {r.category_name && (
                      <>
                        <span>·</span>
                        <span>{r.category_name}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-charcoal leading-snug line-clamp-2">{stripHtml(r.excerpt)}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-soft-gray/40 text-[11px] text-charcoal/50">
          <span className="inline-flex items-center gap-1">
            <Command className="w-3 h-3" /> K to toggle · ↑↓ navigate · ↵ open
          </span>
          <span>? for help</span>
        </div>
      </div>
    </div>
  );
}
