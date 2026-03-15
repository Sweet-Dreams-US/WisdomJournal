import { describe, it, expect } from "vitest";

// Test the notification type -> icon/link mapping logic
type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "group_invite"
  | "query_received"
  | "achievement"
  | "streak_warning"
  | "daily_reminder";

interface MockNotification {
  type: NotificationType;
  data: Record<string, string>;
}

function getNotificationLink(notification: MockNotification): string | null {
  const data = notification.data;
  switch (notification.type) {
    case "friend_request":
    case "friend_accepted":
      return data?.friendship_id
        ? `/friends/${data.friendship_id}`
        : "/friends";
    case "group_invite":
      return data?.group_id ? `/groups/${data.group_id}` : "/groups";
    case "query_received":
      return "/ask";
    case "daily_reminder":
      return "/dashboard";
    default:
      return null;
  }
}

describe("getNotificationLink", () => {
  it("links friend_request to friend detail page", () => {
    const n: MockNotification = {
      type: "friend_request",
      data: { friendship_id: "abc-123" },
    };
    expect(getNotificationLink(n)).toBe("/friends/abc-123");
  });

  it("links friend_request to friends page when no id", () => {
    const n: MockNotification = {
      type: "friend_request",
      data: {},
    };
    expect(getNotificationLink(n)).toBe("/friends");
  });

  it("links friend_accepted to friend detail page", () => {
    const n: MockNotification = {
      type: "friend_accepted",
      data: { friendship_id: "def-456" },
    };
    expect(getNotificationLink(n)).toBe("/friends/def-456");
  });

  it("links group_invite to group detail page", () => {
    const n: MockNotification = {
      type: "group_invite",
      data: { group_id: "grp-789" },
    };
    expect(getNotificationLink(n)).toBe("/groups/grp-789");
  });

  it("links query_received to ask page", () => {
    const n: MockNotification = {
      type: "query_received",
      data: {},
    };
    expect(getNotificationLink(n)).toBe("/ask");
  });

  it("links daily_reminder to dashboard", () => {
    const n: MockNotification = {
      type: "daily_reminder",
      data: {},
    };
    expect(getNotificationLink(n)).toBe("/dashboard");
  });

  it("returns null for unknown types", () => {
    const n: MockNotification = {
      type: "achievement" as NotificationType,
      data: {},
    };
    expect(getNotificationLink(n)).toBeNull();
  });
});
