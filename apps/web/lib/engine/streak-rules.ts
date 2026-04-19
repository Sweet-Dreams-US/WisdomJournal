/**
 * Streak grace token rules.
 *
 * Decision (change freely): one auto-granted grace per ISO week, silently applied
 * to the most recent missed day that otherwise would have broken the streak. We
 * never announce "you broke your streak" — we announce "we held your streak with
 * an ember". This makes the app feel like a companion, not a drill sergeant.
 *
 * Invariants:
 * - Tokens are never consumed for days the user answered.
 * - A token can't be applied to a future date.
 * - A token applied once is permanent; no refunds.
 * - Milestone bonuses (day 30, 100, 365) grant extra tokens without expiration.
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface GraceToken {
  id: string;
  user_id: string;
  granted_at: string;
  applied_for_date: string | null;
  applied_at: string | null;
  reason: "weekly_grace" | "milestone_bonus" | "admin_gift";
  expires_at: string | null;
}

export interface StreakState {
  current_streak: number;
  longest_streak: number;
  last_answered_date: string | null;
  unused_tokens: number;
  applied_grace_dates: string[];
}

export function isoDateUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const aD = new Date(a + "T00:00:00Z").getTime();
  const bD = new Date(b + "T00:00:00Z").getTime();
  return Math.round((bD - aD) / 86_400_000);
}

/**
 * Should a grace token be applied for a specific missed date?
 * Applied only to the MOST RECENT missed day at the tail of the streak,
 * and only one token per week.
 */
export function shouldApplyGrace(opts: {
  missedDate: string;
  lastAnsweredDate: string | null;
  appliedThisWeek: number;
}): boolean {
  if (opts.appliedThisWeek >= 1) return false;
  if (!opts.lastAnsweredDate) return false;
  const gap = daysBetween(opts.lastAnsweredDate, opts.missedDate);
  // Only fill a single-day gap, not multi-day abandonment
  return gap === 1;
}

/**
 * Count tokens granted this ISO week and consumed in that same week.
 */
export function tokensAppliedThisWeek(tokens: GraceToken[], today: string): number {
  const weekStart = getWeekStart(today);
  return tokens.filter((t) => t.applied_at && t.applied_at.slice(0, 10) >= weekStart).length;
}

export function getWeekStart(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday-start weeks
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Grant a weekly grace token if the user doesn't already have one this week.
 */
export async function ensureWeeklyGrace(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data } = await supabase.rpc("ensure_weekly_grace_token", { p_user_id: userId });
  // RPC handles idempotency; we ignore the return value
  void data;
}

/**
 * Apply a token to close a one-day gap. Returns the applied-for date or null.
 */
export async function applyGraceIfNeeded(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const today = isoDateUTC(new Date());

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, current_streak")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  const { data: latest } = await supabase
    .from("responses")
    .select("created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const lastAnsweredDate = latest?.[0]?.created_at?.slice(0, 10) ?? null;
  if (!lastAnsweredDate) return null;
  if (lastAnsweredDate === today) return null;

  const yesterday = isoDateUTC(new Date(Date.now() - 86_400_000));

  // Only consider applying when the streak would break (gap == 1 day from now)
  if (lastAnsweredDate !== yesterday) return null;

  const { data: tokenList } = await supabase
    .from("streak_grace_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("granted_at", { ascending: true });

  const tokens = (tokenList ?? []) as GraceToken[];
  if (tokensAppliedThisWeek(tokens, today) >= 1) return null;

  const unused = tokens.find((t) => !t.applied_at);
  if (!unused) return null;

  await supabase
    .from("streak_grace_tokens")
    .update({ applied_for_date: today, applied_at: new Date().toISOString() })
    .eq("id", unused.id);

  return today;
}

/**
 * Compute the sidebar streak label, giving ember-glow when grace is active.
 */
export function streakDisplay(state: { current_streak: number; unused_tokens: number; grace_active: boolean }) {
  const { current_streak, unused_tokens, grace_active } = state;
  if (grace_active) {
    return { label: `${current_streak} day ember`, tone: "ember" as const, tooltip: "Grace held your streak today." };
  }
  if (current_streak === 0 && unused_tokens > 0) {
    return { label: `${unused_tokens} ember ready`, tone: "rest" as const, tooltip: "You have a grace token waiting." };
  }
  return { label: `${current_streak} day streak`, tone: "flame" as const };
}
