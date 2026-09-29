/*
 * กำลังภายใน service worker: makes the game installable and playable offline.
 *
 * - Page navigations: network first (fresh deploys win), cached copy offline.
 * - /_next/static: cache first; file names are content-hashed, so they never go stale.
 *   The cache is versioned per deploy (the ?v= on the registration URL) and old ones are dropped.
 * - Art, maps, sprites, icons: stale-while-revalidate in a shared cache, trimmed to a cap,
 *   so places the player has visited load instantly and keep working offline.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const SHELL = `shell-${VERSION}`;
const STATIC = `static-${VERSION}`;
const ASSETS = "assets-v1";
const ASSET_LIMIT = 900;
const SHELL_URLS = ["/", "/manifest.webmanifest", "/pwa/icon-192.png", "/pwa/icon-512.png"];
const ASSET_PATHS = ["/art/", "/maps/", "/npcs/", "/player/", "/icons/", "/fonts/", "/pwa/", "/progress.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, STATIC, ASSETS]);
    for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(event));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC));
  } else if (ASSET_PATHS.some((path) => url.pathname.startsWith(path)) || url.pathname === "/manifest.webmanifest") {
    event.respondWith(staleWhileRevalidate(event, request));
  }
});

async function navigate(event) {
  const cache = await caches.open(SHELL);
  try {
    const response = (await event.preloadResponse) || await fetch(event.request);
    if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
    return response;
  } catch (error) {
    // Offline: the same page if we have it, otherwise the game itself.
    return (await cache.match(event.request, { ignoreSearch: true })) ||
      (await cache.match("/")) ||
      new Response("ออฟไลน์อยู่ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่", {
        status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
  }
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);
  const network = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
      await trim(cache);
    }
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

// Keep the asset cache bounded: the oldest entries go first.
let trimming = false;
async function trim(cache) {
  if (trimming) return;
  trimming = true;
  try {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - ASSET_LIMIT; i++) await cache.delete(keys[i]);
  } finally {
    trimming = false;
  }
}

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
