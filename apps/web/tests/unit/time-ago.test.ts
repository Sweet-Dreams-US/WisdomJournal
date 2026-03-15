import { describe, it, expect, vi } from "vitest";

// Extract the timeAgo logic that's used in notifications and activity feed
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

describe("timeAgo", () => {
  it("returns 'just now' for recent timestamps", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("returns minutes ago for timestamps within an hour", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago for timestamps within a day", () => {
    const threeHoursAgo = new Date(
      Date.now() - 3 * 60 * 60 * 1000
    ).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago for timestamps within a week", () => {
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000
    ).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });

  it("returns formatted date for older timestamps", () => {
    const oldDate = new Date("2025-01-15T12:00:00Z").toISOString();
    const result = timeAgo(oldDate);
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});
