// Sky math utilities — pure functions for time-based sky rendering

export type TimePeriod = "night" | "dawn" | "sunrise" | "day" | "sunset" | "dusk";

export interface PeriodInfo {
  period: TimePeriod;
  progress: number; // 0-1 within the period
}

export interface SkyColors {
  top: string;
  bottom: string;
}

export interface CelestialPosition {
  x: number; // 0-100 viewport percentage
  y: number; // 0-100 viewport percentage
  visible: boolean;
}

// Period boundaries in fractional hours
const PERIODS: { period: TimePeriod; start: number; end: number }[] = [
  { period: "night", start: 21, end: 28.5 },   // 21:00 - 4:30 (next day)
  { period: "dawn", start: 4.5, end: 6 },
  { period: "sunrise", start: 6, end: 7.5 },
  { period: "day", start: 7.5, end: 17 },
  { period: "sunset", start: 17, end: 19 },
  { period: "dusk", start: 19, end: 21 },
];

// Color stops: [topStart, topEnd, bottomStart, bottomEnd]
const PERIOD_COLORS: Record<TimePeriod, [string, string, string, string]> = {
  night:   ["#0a0e1a", "#0a0e1a", "#111b33", "#111b33"],
  dawn:    ["#0a0e1a", "#2C3E6B", "#111b33", "#FF7E6B"],
  sunrise: ["#2C3E6B", "#4A90D9", "#FF7E6B", "#F5A623"],
  day:     ["#4A90D9", "#7CB9E8", "#87CEEB", "#B0E0FF"],
  sunset:  ["#4A90D9", "#2C3E6B", "#F5A623", "#FF7E6B"],
  dusk:    ["#2C3E6B", "#0a0e1a", "#FF7E6B", "#111b33"],
};

export function getTimePeriod(hour: number): PeriodInfo {
  // Normalize hour for night period that wraps around midnight
  const h = hour < 4.5 ? hour + 24 : hour;

  for (const p of PERIODS) {
    if (h >= p.start && h < p.end) {
      return {
        period: p.period,
        progress: (h - p.start) / (p.end - p.start),
      };
    }
  }

  // Fallback (shouldn't happen with correct ranges)
  return { period: "day", progress: 0.5 };
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const [r1, g1, b1] = parseHex(color1);
  const [r2, g2, b2] = parseHex(color2);
  return toHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t
  );
}

export function getSkyColors(hour: number): SkyColors {
  const { period, progress } = getTimePeriod(hour);
  const [topStart, topEnd, bottomStart, bottomEnd] = PERIOD_COLORS[period];
  return {
    top: lerpColor(topStart, topEnd, progress),
    bottom: lerpColor(bottomStart, bottomEnd, progress),
  };
}

export function getSunPosition(hour: number): CelestialPosition {
  // Sun visible from ~5:30 to ~18:30
  const riseHour = 5.5;
  const setHour = 18.5;

  if (hour < riseHour || hour > setHour) {
    return { x: 50, y: 120, visible: false };
  }

  const progress = (hour - riseHour) / (setHour - riseHour); // 0-1
  // x: moves from 10% (east) to 90% (west)
  const x = 10 + progress * 80;
  // y: parabolic arc — 0 at edges, peaks at 0.5
  // y = 85 at horizon, ~10 at zenith
  const y = 85 - 75 * Math.sin(progress * Math.PI);

  return { x, y, visible: true };
}

export function getMoonPosition(hour: number): CelestialPosition {
  // Moon visible from ~18:00 to ~6:00 (next day)
  const riseHour = 18;
  const setHour = 6;
  const totalSpan = 12; // hours of visibility

  let h = hour;
  // Normalize to a 0-12 range from moonrise
  if (h >= riseHour) {
    h = h - riseHour;
  } else if (h <= setHour) {
    h = h + (24 - riseHour);
  } else {
    return { x: 50, y: 120, visible: false };
  }

  const progress = h / totalSpan;
  const x = 10 + progress * 80;
  const y = 85 - 75 * Math.sin(progress * Math.PI);

  return { x, y, visible: true };
}

export function getMoonPhase(date: Date): number {
  // Reference new moon: Jan 6, 2000 18:14 UTC
  const refNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const daysSinceRef = (date.getTime() - refNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const synodicPeriod = 29.53059;
  const phase = ((daysSinceRef % synodicPeriod) + synodicPeriod) % synodicPeriod;
  return phase / synodicPeriod; // 0=new, 0.5=full
}

export function getStarOpacity(hour: number): number {
  // Full stars at night (21:00-4:30), fade during dawn (4:30-6:30), return at dusk (19:00-21:00)
  if (hour >= 21 || hour < 4.5) return 1.0;
  if (hour >= 4.5 && hour < 6.5) {
    // Fade out during dawn
    return 1.0 - (hour - 4.5) / 2;
  }
  if (hour >= 6.5 && hour < 19) return 0;
  if (hour >= 19 && hour < 21) {
    // Fade in during dusk
    return (hour - 19) / 2;
  }
  return 0;
}

export function getCloudOpacity(hour: number): number {
  // Higher during day (0.3-0.5), lower at night (0.05-0.15)
  if (hour >= 7.5 && hour < 17) return 0.4;
  if (hour >= 6 && hour < 7.5) {
    // Dawn to day transition
    return 0.1 + 0.3 * ((hour - 6) / 1.5);
  }
  if (hour >= 17 && hour < 19) {
    // Day to dusk transition
    return 0.4 - 0.3 * ((hour - 17) / 2);
  }
  // Night
  return 0.1;
}

export function getFractionalHour(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}
