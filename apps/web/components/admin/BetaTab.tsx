"use client";

import { useState } from "react";
import {
  Plus, Copy, Check, Key, Mail, Send,
  ToggleLeft, ToggleRight, Users,
} from "lucide-react";
import { GlassCard, StatusBadge, formatDateShort } from "./AdminShared";

interface BetaTabProps {
  stats: any;
  onRefresh: () => void;
}

export default function BetaTab({ stats, onRefresh }: BetaTabProps) {
  const [newCode, setNewCode] = useState("");
  const [newCodeMax, setNewCodeMax] = useState("15");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ code: string; email: string } | null>(null);

  async function createCode() {
    if (!newCode.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim(), max_uses: parseInt(newCodeMax) || 15 }),
      });
      if (res.ok) {
        setNewCode("");
        onRefresh();
      }
    } catch {} finally {
      setCreating(false);
    }
  }

  async function toggleCode(id: string, active: boolean) {
    await fetch("/api/admin/codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: active }),
    });
    onRefresh();
  }

  async function sendInvite() {
    if (!inviteEmail.trim() || inviting) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setInviteResult({ code: data.code, email: data.email });
        setInviteEmail("");
        onRefresh();
      }
    } catch {} finally {
      setInviting(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const codes = stats.beta_codes || [];

  // Map users to codes
  const codeUsers: Record<string, any[]> = {};
  (stats.all_users || []).forEach((u: any) => {
    if (u.beta_code_used) {
      if (!codeUsers[u.beta_code_used]) codeUsers[u.beta_code_used] = [];
      codeUsers[u.beta_code_used].push(u);
    }
  });

  return (
    <div className="space-y-4">
      {/* Create Code + Invite Side by Side */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Create Code */}
        <GlassCard>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-400" />
            Create Invite Code
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="CODE-NAME"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700/30 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 font-body"
            />
            <input
              type="number"
              placeholder="Max"
              value={newCodeMax}
              onChange={(e) => setNewCodeMax(e.target.value)}
              className="w-20 px-3 py-3 rounded-xl bg-slate-700/30 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 text-center font-body"
            />
            <button
              onClick={createCode}
              disabled={creating || !newCode.trim()}
              className="px-5 py-3 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 disabled:opacity-40 transition-all"
            >
              {creating ? "..." : "Create"}
            </button>
          </div>
        </GlassCard>

        {/* Invite by Email */}
        <GlassCard>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-400" />
            Invite by Email
          </h2>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700/30 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            <button
              onClick={sendInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="px-5 py-3 rounded-xl bg-amber-500 text-slate-900 text-sm font-bold hover:bg-amber-400 disabled:opacity-40 transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {inviting ? "..." : "Invite"}
            </button>
          </div>
          {inviteResult && (
            <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-green-300">
                  Code <span className="font-bold font-body">{inviteResult.code}</span> generated for {inviteResult.email}
                </p>
              </div>
              <button onClick={() => copyCode(inviteResult.code)} className="text-green-400 hover:text-green-300">
                {copiedCode === inviteResult.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </GlassCard>
      </div>

      {/* All Codes */}
      <GlassCard padding="p-0">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            All Codes ({codes.length})
          </h2>
        </div>

        <div className="divide-y divide-white/5">
          {codes.map((code: any) => {
            const usagePercent = code.max_uses > 0
              ? Math.round((code.used_count / code.max_uses) * 100)
              : 0;
            const isFull = code.used_count >= code.max_uses;
            const users = codeUsers[code.code] || [];

            return (
              <div key={code.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  {/* Code + Copy */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => copyCode(code.code)}
                      className="group flex items-center gap-2"
                    >
                      <code className="text-sm font-bold text-white font-body group-hover:text-sky-300 transition-colors">
                        {code.code}
                      </code>
                      {copiedCode === code.code ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 transition-colors" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Usage bar */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull ? "bg-rose-500" :
                            usagePercent > 70 ? "bg-amber-500" :
                            "bg-sky-500"
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-body w-14">
                        {code.used_count}/{code.max_uses}
                      </span>
                    </div>

                    {/* Date */}
                    <span className="text-[10px] text-slate-500 hidden sm:inline font-body">
                      {formatDateShort(code.created_at)}
                    </span>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleCode(code.id, !code.is_active)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        code.is_active
                          ? "bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25"
                          : "bg-slate-700/30 text-slate-500 border border-white/5 hover:border-white/10"
                      }`}
                    >
                      {code.is_active ? (
                        <ToggleRight className="w-3.5 h-3.5" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                      {code.is_active ? "Active" : "Off"}
                    </button>
                  </div>
                </div>

                {/* Users who used this code */}
                {users.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Users className="w-3 h-3 text-slate-600" />
                    {users.map((u: any) => (
                      <span key={u.id} className="text-[10px] text-slate-500 bg-slate-700/30 px-2 py-0.5 rounded-md border border-white/5">
                        {u.full_name || u.email}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {codes.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No invite codes yet. Create one above.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
