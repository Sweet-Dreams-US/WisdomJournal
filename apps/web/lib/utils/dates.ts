/**
 * Date helpers that operate in the user's LOCAL timezone.
 *
 * Never use `date.toISOString().split("T")[0]` or
 * `isoString.split("T")[0]` for anything user-facing: both produce the
 * UTC calendar date, so an entry written at 9 PM in Indiana files under
 * "tomorrow". These helpers keep day boundaries local.
 */

/** Format a Date (or ISO timestamp string) as YYYY-MM-DD in local time. */
export function toLocalDateKey(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's YYYY-MM-DD in local time. */
export function todayKey(): string {
  return toLocalDateKey(new Date());
}
