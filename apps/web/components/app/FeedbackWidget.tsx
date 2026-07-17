"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Bug, Lightbulb, Heart, MessageCircle, Check } from "lucide-react";

const TYPES = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "idea", label: "Idea", icon: Lightbulb },
  { value: "praise", label: "Praise", icon: Heart },
  { value: "other", label: "Other", icon: MessageCircle },
] as const;

type FeedbackType = (typeof TYPES)[number]["value"];

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, page_url: pathname }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      setSent(true);
      setMessage("");
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Send beta feedback"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-twilight text-white text-[13px] font-semibold shadow-card-hover hover:bg-deep-sky transition-all duration-300 hover:scale-105"
      >
        {open ? <X className="w-4 h-4" /> : <MessageSquarePlus className="w-4 h-4" />}
        <span className="hidden sm:inline">{open ? "Close" : "Feedback"}</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl bg-white border border-charcoal/[0.08] shadow-card-hover p-5 animate-scale-in">
          {sent ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-success" />
              </div>
              <p className="font-semibold text-twilight">Thank you!</p>
              <p className="text-sm text-charcoal/50 mt-1">
                Your feedback shapes what we build next.
              </p>
            </div>
          ) : (
            <>
              <p className="font-semibold text-twilight mb-1">Beta feedback</p>
              <p className="text-xs text-charcoal/50 mb-4">
                Spotted a bug? Have an idea? Tell us — it goes straight to the
                team.
              </p>

              <div className="flex gap-1.5 mb-3">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-medium transition-all duration-200 ${
                      type === t.value
                        ? "border-deep-sky/40 bg-deep-sky/5 text-deep-sky"
                        : "border-charcoal/[0.08] text-charcoal/50 hover:border-charcoal/20"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "What happened? What did you expect instead?"
                    : type === "idea"
                      ? "What would make Wisdom Journal better for you?"
                      : "Tell us what's on your mind..."
                }
                rows={4}
                maxLength={4000}
                className="w-full rounded-xl border border-charcoal/[0.1] p-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-deep-sky/30 focus:border-deep-sky/40 resize-none"
              />

              {error && (
                <p className="text-xs text-error mt-2">{error}</p>
              )}

              <button
                onClick={submit}
                disabled={!message.trim() || sending}
                className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-deep-sky to-sky-blue text-white text-sm font-semibold shadow-button hover:shadow-glow transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Feedback"}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
