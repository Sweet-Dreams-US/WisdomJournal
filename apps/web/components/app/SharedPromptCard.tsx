"use client";

import { useEffect, useState } from "react";
import { Users, Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import Card from "@/components/ui/Card";
import CategoryBadge from "@/components/ui/CategoryBadge";

interface PromptData {
  id: string;
  question_id: string | null;
  custom_question_text: string | null;
  created_by: string;
  active_until: string;
  question?: { id: string; text: string; category?: { slug: string; name: string } };
}

interface LinkedResponse {
  id: string;
  response_text: string | null;
  created_at: string;
  mood?: string | null;
  user_id: string;
  profiles?: { full_name?: string; avatar_url?: string };
}

interface Props {
  groupId: string;
  isAdmin: boolean;
  currentUserId: string;
}

export default function SharedPromptCard({ groupId, isAdmin, currentUserId }: Props) {
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [responses, setResponses] = useState<LinkedResponse[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/shared-prompt`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setPrompt(d?.prompt ?? null);
        setResponses(d?.responses ?? []);
      })
      .catch(() => null);
  }, [groupId]);

  async function createPrompt() {
    if (!customQuestion.trim() || creating) return;
    setCreating(true);
    const res = await fetch(`/api/groups/${groupId}/shared-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_question_text: customQuestion.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setPrompt(data.prompt);
      setCustomQuestion("");
    }
    setCreating(false);
  }

  async function submitAnswer() {
    if (!prompt || !draft.trim() || saving) return;
    setSaving(true);
    const res = await fetch(`/api/groups/${groupId}/shared-prompt/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared_prompt_id: prompt.id, response_text: draft.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setResponses((prev) => [
        ...prev,
        {
          id: data.response.id,
          response_text: draft.trim(),
          created_at: new Date().toISOString(),
          user_id: currentUserId,
          profiles: { full_name: "You" },
        },
      ]);
      setDraft("");
    }
    setSaving(false);
  }

  if (!prompt && !isAdmin) {
    return null;
  }

  if (!prompt && isAdmin) {
    return (
      <Card padding="md" className="mb-6 border border-golden-hour/30 bg-golden-hour/5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-golden-hour" />
          <span className="text-sm font-medium text-twilight">Start a shared prompt</span>
        </div>
        <p className="text-xs text-charcoal/60 mb-3">
          Write a question for everyone in the group. Each member's answer shows up here together.
        </p>
        <div className="flex gap-2">
          <input
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="What moment this week made you feel most alive?"
            className="flex-1 px-3 py-2 rounded-button bg-white border border-soft-gray focus:border-golden-hour focus:outline-none text-sm"
          />
          <button
            onClick={createPrompt}
            disabled={!customQuestion.trim() || creating}
            className="px-4 py-2 rounded-button bg-golden-hour text-white text-sm font-medium hover:bg-golden-hour/90 disabled:opacity-50"
          >
            {creating ? "Posting..." : "Post"}
          </button>
        </div>
      </Card>
    );
  }

  if (!prompt) return null;

  const promptText = prompt.custom_question_text ?? prompt.question?.text ?? "";
  const hasMyAnswer = responses.some((r) => r.user_id === currentUserId);

  return (
    <Card padding="lg" className="mb-6 border border-deep-sky/30 bg-deep-sky/5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-deep-sky" />
          <span className="text-sm font-medium text-deep-sky">This week&apos;s shared prompt</span>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1 rounded hover:bg-white"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <p className="mt-2 text-lg text-twilight font-semibold leading-relaxed">{promptText}</p>

      {prompt.question?.category && (
        <div className="mt-2">
          <CategoryBadge slug={prompt.question.category.slug} name={prompt.question.category.name} size="sm" />
        </div>
      )}

      {expanded && (
        <>
          {!hasMyAnswer && (
            <div className="mt-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder="Your answer will be visible to the group..."
                className="w-full p-3 rounded-button bg-white border border-soft-gray focus:border-deep-sky focus:outline-none text-sm resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={submitAnswer}
                  disabled={!draft.trim() || saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-deep-sky text-white text-sm font-medium hover:bg-deep-sky/90 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {saving ? "Posting..." : "Share with group"}
                </button>
              </div>
            </div>
          )}

          {responses.length > 0 && (
            <div className="mt-5 pt-4 border-t border-deep-sky/20 space-y-3">
              <p className="text-xs uppercase tracking-wider text-charcoal/50">
                {responses.length} {responses.length === 1 ? "answer" : "answers"}
              </p>
              {responses.map((r) => (
                <div key={r.id} className="bg-white rounded-button p-3 border border-soft-gray">
                  <div className="flex items-center gap-2 mb-1 text-xs text-charcoal/55">
                    <span className="font-medium">{r.profiles?.full_name ?? "A member"}</span>
                    <span>·</span>
                    <span>
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {r.mood && <span className="ml-auto">{r.mood}</span>}
                  </div>
                  <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
                    {r.response_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
