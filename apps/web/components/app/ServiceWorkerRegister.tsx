"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const controller = new AbortController();

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => console.warn("SW registration failed:", err));

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
