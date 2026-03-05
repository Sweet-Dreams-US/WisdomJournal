export const APP_NAME = "Wisdom Journal";
export const APP_DESCRIPTION =
  "Capture your wisdom, preserve your legacy. A daily guided journaling app that makes your knowledge queryable by loved ones via AI.";

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "1 daily question",
      "Text responses only",
      "30-day history",
      "Basic search",
    ],
  },
  standard: {
    name: "Standard",
    price: 9.99,
    features: [
      "3 daily questions",
      "Text & voice responses",
      "Unlimited history",
      "AI-powered search",
      "Share with 3 people",
    ],
  },
  premium: {
    name: "Premium",
    price: 19.99,
    features: [
      "Unlimited questions",
      "Text, voice & video responses",
      "Unlimited history",
      "Advanced AI queries",
      "Unlimited sharing",
      "Priority support",
      "Custom question categories",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    features: [
      "Everything in Premium",
      "Organization groups",
      "Admin dashboard",
      "SSO integration",
      "Custom branding",
      "Dedicated support",
    ],
  },
} as const;

export const NAV_ITEMS = [
  { label: "Today", href: "/dashboard", icon: "sun" },
  { label: "Journal", href: "/journal", icon: "book-open" },
  { label: "Ask", href: "/ask", icon: "message-circle" },
  { label: "Profile", href: "/profile", icon: "user" },
] as const;
