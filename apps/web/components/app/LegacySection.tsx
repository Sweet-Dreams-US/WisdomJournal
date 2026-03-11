"use client";

import { useState, useEffect } from "react";
import { Heart, Plus, Star, Trash2, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface LegacyContact {
  id: string;
  contact_name: string;
  contact_email: string;
  relationship: string | null;
  is_primary: boolean;
  message: string | null;
}

const RELATIONSHIPS = [
  "Spouse", "Child", "Parent", "Sibling", "Grandchild", "Friend", "Other"
];

export default function LegacySection() {
  const [contacts, setContacts] = useState<LegacyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    try {
      const res = await fetch("/api/legacy");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!name.trim() || !email.trim() || saving) return;
    setSaving(true);

    try {
      const res = await fetch("/api/legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: name.trim(),
          contact_email: email.trim(),
          relationship: relationship || null,
          message: message.trim() || null,
          is_primary: isPrimary,
        }),
      });

      if (res.ok) {
        setName(""); setEmail(""); setRelationship(""); setMessage(""); setIsPrimary(false);
        setShowForm(false);
        fetchContacts();
      }
    } catch {} finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this legacy contact?")) return;
    await fetch(`/api/legacy/${id}`, { method: "DELETE" });
    fetchContacts();
  }

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-5 h-5 text-sunrise-coral" />
        <h3 className="text-lg font-semibold text-twilight">Legacy & Inheritance</h3>
      </div>
      <p className="text-sm text-charcoal/60 mb-6 leading-relaxed">
        Choose who will inherit access to your wisdom. These people will be given access
        to your full journal and can ask questions of your wisdom if something ever happens to you.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-charcoal/50">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          {contacts.length > 0 && (
            <div className="space-y-3 mb-4">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-soft-gray/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-charcoal">{c.contact_name}</p>
                      {c.is_primary && (
                        <span className="flex items-center gap-0.5 text-xs text-golden-hour">
                          <Star className="w-3 h-3 fill-golden-hour" /> Primary
                        </span>
                      )}
                      {c.relationship && (
                        <span className="text-xs text-charcoal/40 bg-white px-2 py-0.5 rounded-full">
                          {c.relationship}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-charcoal/50 mt-0.5">{c.contact_email}</p>
                    {c.message && (
                      <p className="text-xs text-charcoal/40 mt-1 italic">&ldquo;{c.message}&rdquo;</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="p-1.5 rounded-lg hover:bg-white text-charcoal/30 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <div className="p-4 rounded-xl border border-soft-gray space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Name"
                  placeholder="Their name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="their@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-charcoal/60 mb-1 block">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full rounded-xl border border-soft-gray px-3 py-2 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-deep-sky/30"
                >
                  <option value="">Select...</option>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r.toLowerCase()}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-charcoal/60 mb-1 block">
                  Personal message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A message that will be shown to them when they receive access to your wisdom..."
                  className="w-full rounded-xl border border-soft-gray px-3 py-2 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-deep-sky/30 resize-none h-20"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-charcoal/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-soft-gray"
                />
                Primary inheritor (first to be notified)
              </label>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={saving || !name.trim() || !email.trim()} size="sm">
                  {saving ? "Saving..." : "Save Contact"}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)} size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-sm text-deep-sky hover:text-sky-blue transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Legacy Contact
            </button>
          )}
        </>
      )}
    </Card>
  );
}
