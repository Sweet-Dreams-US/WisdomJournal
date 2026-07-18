import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/app/ServiceWorkerRegister";
import ErrorTrackingProvider from "@/components/app/ErrorTrackingProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  // Full variable axes: optical size makes display sizes dramatically more
  // characterful, SOFT rounds the letterforms toward warmth, and italics
  // are the brand's signature accent for names and precious words.
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "Wisdom Journal — Preserve Your Legacy",
    template: "%s · Wisdom Journal",
  },
  description:
    "Answer one thoughtful question a day. Build a living archive of your stories, values, and hard-won knowledge that your loved ones can ask anything — even when you're not there.",
  keywords: [
    "journaling",
    "legacy",
    "family stories",
    "wisdom",
    "memoir",
    "knowledge transfer",
  ],
  openGraph: {
    title: "Wisdom Journal — Your Wisdom Lives Forever",
    description:
      "Answer daily questions. Build a living archive of your knowledge, stories, and values. Let your loved ones ask your wisdom anything.",
    url: "/",
    siteName: "Wisdom Journal",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wisdom Journal — Your Wisdom Lives Forever",
    description:
      "Answer daily questions. Build a living archive of your knowledge, stories, and values.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Wisdom",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${plexMono.variable}`}
    >
      <body>
        <ServiceWorkerRegister />
        <ErrorTrackingProvider>{children}</ErrorTrackingProvider>
      </body>
    </html>
  );
}
