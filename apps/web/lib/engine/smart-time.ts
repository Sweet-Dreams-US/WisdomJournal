/**
 * Smart-time learning.
 *
 * Derives a "most likely to journal" hour-of-day from response history.
 * Uses a KDE-ish rolling weighted histogram: more recent entries count more.
 *
 * Returns null when we don't have enough signal (< 5 entries).
 */

export function learnPreferredHour(
  responseTimestamps: string[],
  opts: { tzOffsetMinutes?: number } = {}
): { hour: number; confidence: number; count: number } | null {
  if (!responseTimestamps || responseTimestamps.length < 5) return null;

  const buckets = new Array<number>(24).fill(0);
  const now = Date.now();
  const halfLifeMs = 21 * 86_400_000; // 3 weeks

  for (const ts of responseTimestamps) {
    const t = new Date(ts);
    if (Number.isNaN(t.getTime())) continue;
    // Shift to local hour using provided offset (or machine-local)
    const offsetMin = opts.tzOffsetMinutes ?? -t.getTimezoneOffset();
    const local = new Date(t.getTime() + offsetMin * 60_000);
    const hour = local.getUTCHours();
    const ageMs = now - t.getTime();
    const weight = Math.pow(0.5, ageMs / halfLifeMs);
    buckets[hour] += weight;
  }

  // Smooth with 3-bucket rolling mean so single outliers don't dominate
  const smoothed = buckets.map((_, i) => {
    const a = buckets[(i + 23) % 24];
    const b = buckets[i];
    const c = buckets[(i + 1) % 24];
    return a * 0.25 + b * 0.5 + c * 0.25;
  });

  let bestHour = 0;
  let bestVal = -1;
  for (let i = 0; i < 24; i++) {
    if (smoothed[i] > bestVal) {
      bestVal = smoothed[i];
      bestHour = i;
    }
  }

  const total = smoothed.reduce((a, b) => a + b, 0) || 1;
  const confidence = bestVal / total; // 0..1 roughly; higher = more concentrated

  return { hour: bestHour, confidence, count: responseTimestamps.length };
}

export function nextReminderTime(opts: {
  now?: Date;
  preferredHour: number;
  quietStart?: number | null;
  quietEnd?: number | null;
}): Date {
  const now = opts.now ?? new Date();
  const target = new Date(now);
  target.setHours(opts.preferredHour, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  if (opts.quietStart != null && opts.quietEnd != null) {
    const hour = target.getHours();
    const inQuiet =
      opts.quietStart <= opts.quietEnd
        ? hour >= opts.quietStart && hour < opts.quietEnd
        : hour >= opts.quietStart || hour < opts.quietEnd;
    if (inQuiet) {
      target.setHours(opts.quietEnd, 0, 0, 0);
      if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    }
  }

  return target;
}
