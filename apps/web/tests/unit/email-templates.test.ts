import { describe, it, expect } from "vitest";
import {
  dailyReminderEmail,
  friendRequestEmail,
  friendAcceptedEmail,
  streakWarningEmail,
  groupInviteEmail,
} from "@/lib/email/templates";

describe("email templates", () => {
  describe("dailyReminderEmail", () => {
    it("includes user name in html", () => {
      const { html, subject } = dailyReminderEmail("Cole");
      expect(html).toContain("Cole");
      expect(subject).toContain("daily wisdom");
    });

    it("includes dashboard link", () => {
      const { html } = dailyReminderEmail("Cole");
      expect(html).toContain("/dashboard");
    });
  });

  describe("friendRequestEmail", () => {
    it("includes sender name", () => {
      const { html, subject } = friendRequestEmail("Cole", "Alice");
      expect(html).toContain("Alice");
      expect(subject).toContain("Alice");
    });

    it("includes optional message", () => {
      const { html } = friendRequestEmail("Cole", "Alice", "Hey friend!");
      expect(html).toContain("Hey friend!");
    });

    it("omits message block when no message", () => {
      const { html } = friendRequestEmail("Cole", "Alice");
      expect(html).not.toContain("italic");
    });
  });

  describe("friendAcceptedEmail", () => {
    it("includes accepter name", () => {
      const { html, subject } = friendAcceptedEmail("Cole", "Alice");
      expect(html).toContain("Alice");
      expect(subject).toContain("Alice");
    });
  });

  describe("streakWarningEmail", () => {
    it("includes streak count", () => {
      const { html, subject } = streakWarningEmail("Cole", 7);
      expect(html).toContain("7");
      expect(subject).toContain("7");
    });
  });

  describe("groupInviteEmail", () => {
    it("includes group name and inviter", () => {
      const { html, subject } = groupInviteEmail(
        "Cole",
        "Alice",
        "Book Club"
      );
      expect(html).toContain("Book Club");
      expect(html).toContain("Alice");
      expect(subject).toContain("Book Club");
    });
  });
});
