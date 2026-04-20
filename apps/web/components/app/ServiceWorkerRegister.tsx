"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production and, on every mount, purges
 * any stale HTML caches a previous worker may have saved. We also force a
 * check-for-update so a new SW version takes over quickly after a deploy.
 *
 * If the user has an older v1 SW that was caching navigations, this will
 * purge all its caches on next activation (see sw.js 'activate' handler)
 * and the user will get fresh pages from the network.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const controller = new AbortController();

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Force an update check immediately so a new deploy takes effect.
        reg.update().catch(() => null);

        // When a waiting worker exists, skip it forward without a hard reload.
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });

        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              // A new SW is installed and an old one is active — switch over.
              next.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((err) => console.warn("SW registration failed:", err));

    // Also proactively clear any runtime cache that might hold HTML from a
    // buggy previous version. Safe because the new SW never writes there.
    if (typeof caches !== "undefined") {
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => k.startsWith("wj-v1") || k.startsWith("wj-v2"))
              .map((k) => caches.delete(k))
          )
        )
        .catch(() => null);
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_DRAIN") {
        window.dispatchEvent(new CustomEvent("wj-sync-drain"));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage, {
      signal: controller.signal,
    });

    return () => controller.abort();
  }, []);

  return null;
}
