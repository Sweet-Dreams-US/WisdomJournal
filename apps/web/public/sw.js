// Wisdom Journal service worker — minimal, safe.
//
// Decision: do NOT intercept navigations. App Router pages depend on live
// cookies/auth, and a cached nav response served to a different session can
// leak (or show) the wrong user's page. We only:
//   - precache a tiny shell so icons/manifest work offline
//   - stale-while-revalidate /_next/static and /icons assets
//   - deliver web-push notifications
//
// Anything navigation-ish goes straight to the network. If the network is
// offline, the browser shows its standard offline page.

const CACHE_VERSION = "wj-v3";
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(ASSET_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge ALL previous caches (including old page caches from wj-v1/v2)
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch navigations — always let the network handle them.
  if (request.mode === "navigate") return;
  // Never cache API, auth, or Next.js data routes.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  // Stale-while-revalidate for versioned static assets only.
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});

// Web push notification handling
self.addEventListener("push", (event) => {
  let payload = { title: "Wisdom Journal", body: "Your question is ready." };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: payload.tag || "daily-question",
    requireInteraction: false,
    data: { url: payload.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((list) => {
      for (const c of list) {
        if (c.url.includes(target) && "focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

// Message-driven triggers
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "DRAIN_QUEUE") {
    self.clients.matchAll({ includeUncontrolled: true }).then((list) => {
      for (const client of list) client.postMessage({ type: "SYNC_DRAIN" });
    });
  }
});
