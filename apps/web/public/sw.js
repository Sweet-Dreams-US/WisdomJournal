// Wisdom Journal service worker — tombstone / kill-switch.
//
// A previous version (v1) was incorrectly caching navigation responses,
// which caused users to see stale or wrong pages when clicking sidebar
// links. Rather than try to repair it in place (which requires users to
// hard-refresh), this version takes over, deletes every cache, unregisters
// itself, and reloads any open tabs so the browser falls back to normal
// (no-SW) behavior.
//
// We will re-add PWA/offline support later with a carefully-scoped worker
// that never touches navigations.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge every cache this origin has.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));

      // Take control of any currently-open tabs so the next navigation
      // goes through this (pass-through) worker rather than the old one.
      await self.clients.claim();

      // Reload every controlled tab so the browser re-evaluates its
      // registration and drops the old controller.
      const tabs = await self.clients.matchAll({ type: "window" });
      for (const tab of tabs) {
        try {
          tab.postMessage({ type: "SW_TOMBSTONE_RELOAD" });
        } catch {}
      }

      // Unregister self so future navigations go directly to the network.
      try {
        await self.registration.unregister();
      } catch {}
    })()
  );
});

// Pass-through for every fetch. Do NOT serve anything from the SW.
self.addEventListener("fetch", () => {
  // Intentionally empty — respondWith not called, so the browser handles
  // the request as if no service worker existed.
});
