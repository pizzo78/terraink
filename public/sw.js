const CACHE_NAME = "posterengine-static-v1";
const TILE_CACHE_NAME = "posterengine-tiles-v1";
const TILE_ORIGINS = ["https://tiles.openfreemap.org"];
const MAX_TILE_CACHE_ENTRIES = 800;
const APP_SHELL_ASSETS = [
  "/",
  "/index.html",
  "/site.webmanifest",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/assets/icon-maskable.png",
  "/assets/favicon-32.png",
  "/assets/favicon-16.png",
  "/assets/apple-touch-icon.png",
];

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) {
    return;
  }

  const deleteCount = keys.length - maxEntries;
  await Promise.all(keys.slice(0, deleteCount).map((key) => cache.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        APP_SHELL_ASSETS.map(async (asset) => {
          const response = await fetch(asset, { cache: "no-cache" });
          if (!response.ok) {
            return;
          }
          await cache.put(asset, response);
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== TILE_CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (TILE_ORIGINS.some((origin) => url.origin === origin)) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              event.waitUntil(
                cache
                  .put(request, response.clone())
                  .then(() => trimCache(cache, MAX_TILE_CACHE_ENTRIES))
                  .catch(() => undefined),
              );
            }
            return response;
          });
        }),
      ),
    );
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
