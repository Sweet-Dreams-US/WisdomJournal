"use client";

import { useState } from "react";
import { Clock, Lock, Unlock, Plus, Send, Calendar as CalendarIcon } from "lucide-react";
import Card from "@/components/ui/Card";

interface Capsule {
  id: string;
  title: string;
  body: string;
  open_on_date: string | null;
  open_on_event: string | null;
  recipient_email: string | null;
  is_opened: boolean;
  opened_at: string | null;
  unlocked_now: boolean;
  created_at: string;
}

export default function CapsulesClient({ initial }: { initial: Capsule[] }) {
  const [capsules, setCapsules] = useState<Capsule[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [openEvent, setOpenEvent] = useState("");
  const [recipient, setRecipient] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    if (!title.trim() || !body.trim()) return;
    if (!openDate && !openEvent.trim()) {
      setErr("Choose a date or describe an event.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/capsules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          open_on_date: openDate || null,
          open_on_event: openEvent.trim() || null,
          recipient_email: recipient.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCapsules((prev) => [{ ...data.capsule, unlocked_now: false }, ...prev]);
        setTitle(""); setBody(""); setOpenDate(""); setOpenEvent(""); setRecipient("");
        setShowForm(false);
      } else {
        const err = await res.json();
        setErr(err.error || "Could not create capsule.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function openCapsule(id: string) {
    const res = await fetch(`/api/capsules/${id}/open`, { method: "POST" });
    if (res.ok) {
      setCapsules((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, is_opened: true, opened_at: new Date().toISOString(), unlocked_now: true } : c
        )
      );
    }
  }

  const locked = capsules.filter((c) => !c.is_opened && !c.unlocked_now);
  const readyToOpen = capsules.filter((c) => !c.is_opened && c.unlocked_now);
  const opened = capsules.filter((c) => c.is_opened);

  return (
    <div className="max-w-3xl">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-twilight">Time capsules</h1>
          <p className="text-charcoal/60 text-sm mt-1">
            Letters to your future self, or to someone else — sealed until a date or an event.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-deep-sky text-white text-sm font-medium hover:bg-deep-sky/90"
        >
          <Plus className="w-4 h-4" />
          New capsule
        </button>
      </header>

      {showForm && (
        <Card padding="lg" className="mb-6 border border-deep-sky/30">
          <p className="text-sm font-medium text-twilight mb-3">Seal a message in time</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. For my future self)"
            className="w-full px-3 py-2 rounded-button bg-white border border-soft-gray mb-2 text-sm focus:outline-none focus:border-deep-sky"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="What do you want to say when this is opened?"
            className="w-full px-3 py-2 rounded-button bg-white border border-soft-gray text-sm resize-none focus:outline-none focus:border-deep-sky"
          />
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-charcoal/55">Open on date</label>
              <input
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="w-full px-3 py-2 mt-1 rounded-button bg-white border border-soft-gray text-sm focus:outline-none focus:border-deep-sky"
              />
            </div>
            <div>
              <label className="text-xs text-charcoal/55">Or event</label>
              <input
                value={openEvent}
                onChange={(e) => setOpenEvent(e.target.value)}
                placeholder="On my 50th birthday"
                className="w-full px-3 py-2 mt-1 rounded-button bg-white border border-soft-gray text-sm focus:outline-none focus:border-deep-sky"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-charcoal/55">Recipient email (optional)</label>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Leave blank to open it yourself"
              className="w-full px-3 py-2 mt-1 rounded-button bg-white border border-soft-gray text-sm focus:outline-none focus:border-deep-sky"
            />
          </div>
          {err && <p className="text-xs text-error mt-2">{err}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="text-sm text-charcoal/55 hover:text-charcoal px-4 py-2">
              Cancel
            </button>
            <button
              onClick={create}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-deep-sky text-white text-sm font-medium disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {busy ? "Sealing..." : "Seal capsule"}
            </button>
          </div>
        </Card>
      )}

      {readyToOpen.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm uppercase tracking-wide text-golden-hour font-medium mb-2 flex items-center gap-2">
            <Unlock className="w-4 h-4" /> Ready to open
          </h2>
          <div className="space-y-3">
            {readyToOpen.map((c) => (
              <Card key={c.id} padding="md" className="border-golden-hour/30 bg-golden-hour/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-twilight">{c.title}</p>
                    <p className="text-xs text-charcoal/55 mt-0.5">
                      Sealed {new Date(c.created_at).toLocaleDateString()} ·{" "}
                      {c.open_on_date ? `Unlocked ${c.open_on_date}` : c.open_on_event}
                    </p>
                  </div>
                  <button
                    onClick={() => openCapsule(c.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-golden-hour text-white text-xs font-medium"
                  >
                    <Unlock className="w-3 h-3" /> Open
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm uppercase tracking-wide text-charcoal/55 font-medium mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Sealed
          </h2>
          <div className="space-y-3">
            {locked.map((c) => (
              <Card key={c.id} padding="md">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-twilight">{c.title}</p>
                    <div className="flex items-center gap-3 text-xs text-charcoal/55 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> sealed {new Date(c.created_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {c.open_on_date ?? c.open_on_event}
                      </span>
                      {c.recipient_email && <span>→ {c.recipient_email}</span>}
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-charcoal/30" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {opened.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-deep-sky font-medium mb-2">Opened</h2>
          <div className="space-y-3">
            {opened.map((c) => (
              <Card key={c.id} padding="md">
                <p className="font-medium text-twilight mb-1">{c.title}</p>
                <p className="text-sm text-charcoal whitespace-pre-wrap leading-relaxed">{c.body}</p>
                <p className="text-[11px] text-charcoal/45 mt-2">
                  opened {c.opened_at ? new Date(c.opened_at).toLocaleDateString() : ""}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {capsules.length === 0 && !showForm && (
        <Card padding="lg" className="text-center">
          <Clock className="w-10 h-10 text-charcoal/20 mx-auto mb-2" />
          <p className="text-charcoal/60 text-sm">
            Nothing sealed yet. Capsules are small letters — to yourself or someone else — revealed at a moment you choose.
          </p>
        </Card>
      )}
    </div>
  );
}
