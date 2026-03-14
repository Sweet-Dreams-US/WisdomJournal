"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isOnboardingPage = pathname === "/onboarding";

  useEffect(() => {
    // If already on onboarding page, no need to check
    if (isOnboardingPage) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function checkOnboarding() {
      try {
        const res = await fetch("/api/onboarding/progress");
        if (!res.ok) {
          // API error (e.g. not logged in) — don't block
          if (!cancelled) setReady(true);
          return;
        }
        const progress = await res.json();
        if (!cancelled) {
          if (!progress.completed_at) {
            router.replace("/onboarding");
          } else {
            setReady(true);
          }
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    }

    checkOnboarding();
    return () => {
      cancelled = true;
    };
  }, [isOnboardingPage, router]);

  // Always render onboarding page immediately
  if (isOnboardingPage) return <>{children}</>;

  // For other pages, wait for onboarding check
  if (!ready) return null;

  return <>{children}</>;
}
