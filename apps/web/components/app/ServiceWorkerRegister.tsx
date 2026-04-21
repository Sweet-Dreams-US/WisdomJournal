"use client";

import { useEffect } from "react";

/**
 * Cleanup-only component.
 *
 * We briefly shipped a service worker that cached navigation responses and
 * caused stale/wrong pages. Rather than try to push a replacement into the
 * user's browser (SW updates can lag behind), this component:
 *
 *   1. Registers /sw.js (now a tombstone that unregisters itself on activate)
 *   2. Unregisters any lingering SW registrations proactively
 *   3. Purges all caches on this origin
 *   4. Listens for a reload message from the tombstone and refreshes once
 *
 * Once every user has rotated through at least one page load with this in
 * place, we can delete this component and sw.js entirely.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const controller = new AbortController();

    // 1. Let the tombstone SW take over (if one is present).
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => null);

    // 2. Proactively unregister every SW for this origin.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister().catch(() => null))))
      .catch(() => null);

    // 3. Purge any caches left behind by the old worker.
    if (typeof caches !== "undefined") {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => null);
    }

    // 4. If the tombstone asks us to reload, do it exactly once.
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_TOMBSTONE_RELOAD") {
        const already = sessionStorage.getItem("wj-sw-reloaded");
        if (already) return;
        sessionStorage.setItem("wj-sw-reloaded", "1");
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage, {
      signal: controller.signal,
    });

    return () => controller.abort();
  }, []);

  return null;
}
