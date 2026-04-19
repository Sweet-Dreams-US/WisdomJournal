"use client";

import { useEffect, useState } from "react";
import { Shield, Trash2, Plus, UserCheck } from "lucide-react";
import Card from "@/components/ui/Card";

interface Contact {
  id: string;
  contact_name: string;
  contact_email: string;
  relationship: string | null;
  can_manage_access: boolean;
  can_download_archive: boolean;
  can_delete_account: boolean;
  is_verified: boolean;
}

export default function DigitalExecutor() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [canManage, setCanManage] = useState(true);
  const [canDownload, setCanDownload] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/executor")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setContacts(d?.contacts ?? []))
      .catch(() => null);
  }, []);

  async function add() {
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/executor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_name: name,
        contact_email: email,
        relationship,
        can_manage_access: canManage,
        can_download_archive: canDownload,
        can_delete_account: canDelete,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setContacts((prev) => [data.contact, ...prev]);
      setName(""); setEmail(""); setRelationship(""); setCanDelete(false);
      setOpen(false);
    } else {
      const d = await res.json();
      setErr(d.error ?? "Could not add contact.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("Remove this executor contact?")) return;
    const res = await fetch(`/api/executor?id=${id}`, { method: "DELETE" });
    if (res.ok) setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-deep-sky" />
          <div>
            <p className="font-medium text-twilight">Digital executor</p>
            <p className="text-xs text-charcoal/55">
              Designate someone to manage your encyclopedia if you become unavailable. They receive access only after verification.
            </p>
          </div>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-deep-sky text-white text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {open && (
        <div className="mb-4 p-4 rounded-card border border-deep-sky/30 bg-deep-sky/5 space-y-3">
          <div className="grid md:grid-cols-2 gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="px-3 py-2 rounded-button bg-white border border-soft-gray text-sm focus:outline-none focus:border-deep-sky"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="px-3 py-2 rounded-button bg-white border border-soft-gray text-sm focus:outline-none focus:border-deep-sky"
            />
          </div>
          <input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Relationship (daughter, lawyer, etc.)"
            className="w-full px-3 py-2 rounded-button bg-white border border-soft-gray text-sm focus:outline-none focus:border-deep-sky"
          />
          <div className="space-y-1 text-sm text-charcoal/75">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={canManage} onChange={(e) => setCanManage(e.target.checked)} />
              Can manage who has access to my categories
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={canDownload} onChange={(e) => setCanDownload(e.target.checked)} />
              Can download a full archive (memorial book)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={canDelete} onChange={(e) => setCanDelete(e.target.checked)} />
              Can permanently delete the account (destructive)
            </label>
          </div>
          {err && <p className="text-xs text-error">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="text-sm text-charcoal/55 px-3 py-1.5">
              Cancel
            </button>
            <button
              onClick={add}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-deep-sky text-white text-sm font-medium disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Designate
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {contacts.length === 0 && (
          <li className="text-xs text-charcoal/45 italic">No executors designated yet.</li>
        )}
        {contacts.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2 border-t border-soft-gray first:border-t-0">
            <div>
              <p className="text-sm font-medium text-charcoal">{c.contact_name}</p>
              <p className="text-xs text-charcoal/50">
                {c.contact_email}
                {c.relationship ? ` · ${c.relationship}` : ""}
              </p>
              <p className="text-[11px] text-charcoal/45 mt-0.5">
                {c.can_manage_access && "Manage access · "}
                {c.can_download_archive && "Download archive · "}
                {c.can_delete_account && "Delete account"}
              </p>
            </div>
            <button
              onClick={() => remove(c.id)}
              className="p-1.5 rounded hover:bg-error/10 text-charcoal/40 hover:text-error"
              aria-label="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
