// Atlas Quest service worker: makes the game playable offline after the first visit.
const CACHE = "atlas-quest-v2";
const PRECACHE = ["/atlas", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await cache.addAll(PRECACHE);
        // Every flag, so quizzes show them offline even if they were never seen online.
        // allSettled: one missing flag shouldn't stop the game from installing.
        const codes = await fetch("/flags/list.json").then((r) => r.json()).catch(() => []);
        await Promise.allSettled(codes.map((code) => cache.add(`/flags/${code}.svg`)));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Build assets and flags never change under the same URL: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/flags/") || url.pathname.startsWith("/icon-")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Pages and everything else: network first, fall back to the cache when offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && (request.mode === "navigate" || url.pathname.startsWith("/_next/"))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(request, { ignoreSearch: request.mode === "navigate" })
          .then((hit) => hit || (request.mode === "navigate" ? caches.match("/atlas") : Response.error())),
      ),
  );
});
