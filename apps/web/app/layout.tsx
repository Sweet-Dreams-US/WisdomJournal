import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisdom Journal — Preserve Your Legacy",
  description:
    "Capture your wisdom, preserve your legacy. A daily guided journaling app that makes your knowledge queryable by loved ones via AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
