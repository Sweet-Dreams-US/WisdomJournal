"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Check, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";

interface Props {
  initial: string;
}

const USERNAME_REGEX = /^[a-z0-9_]{3,32}$/;

export default function UsernameEditor({ initial }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = value.trim().toLowerCase();
  const dirty = normalized !== initial.toLowerCase();
  const valid = normalized === "" || USERNAME_REGEX.test(normalized);

  async function save() {
    if (saving || !dirty || !valid) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update username.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card padding="md" className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <AtSign className="w-4 h-4 text-deep-sky" />
        <p className="text-sm font-medium text-twilight">Username</p>
      </div>
      <p className="text-xs text-charcoal/55 mb-3">
        How friends find you. Lowercase letters, numbers, and underscores — 3 to 32 characters.
      </p>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center px-3 rounded-button bg-white border border-soft-gray focus-within:border-deep-sky">
          <span className="text-charcoal/45 text-sm">@</span>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="yourname"
            className="flex-1 py-2 bg-transparent text-sm focus:outline-none placeholder:text-charcoal/30"
            maxLength={32}
          />
        </div>
        <button
          onClick={save}
          disabled={saving || !dirty || !valid}
          className="inline-flex items-center gap-1.5 px-4 rounded-button bg-deep-sky text-white text-sm font-medium hover:bg-deep-sky/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5" />
          ) : null}
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>
      {!valid && normalized !== "" && (
        <p className="text-xs text-error mt-2">
          Must be 3–32 characters, lowercase letters, numbers, or underscores.
        </p>
      )}
      {error && <p className="text-xs text-error mt-2">{error}</p>}
    </Card>
  );
}
