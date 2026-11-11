/**
 * The service worker for the installed ETEN app (PWA phase 2), served at
 * /sw.js. Built once per deploy with that deploy's version inside, so every
 * deploy is a byte-different file: the browser notices, installs the new one,
 * and the app offers "A new version is ready" (see
 * components/shared/service-worker-manager.tsx).
 *
 * What it does, deliberately little:
 *   - Pages always come from the network. They are never stored on the
 *     device, because they hold personal data (CVs, contacts, payments).
 *     If the network is down, a page request gets the offline page instead.
 *   - Versioned app files (/_next/static, icons, the offline page) are kept,
 *     so the app opens fast. Each deploy starts a fresh store and deletes
 *     the old one.
 *   - Everything else (API calls, data, uploads, other sites) is untouched.
 */
export const dynamic = "force-static";

const VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  new Date().toISOString();

const SOURCE = `/* ETEN service worker, version ${VERSION} */
const VERSION = ${JSON.stringify(VERSION)};
const CACHE = "eten-static-" + VERSION;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("eten-static-") && k !== CACHE)
          .map((k) => caches.delete(k)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

// The page asks the waiting worker to take over (after "Refresh").
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

function isAppFile(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === OFFLINE_URL)
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    cache.put(request, response.clone());
  }
  return response;
}

async function pageOrOffline(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    const cache = await caches.open(CACHE);
    return (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

// Push notifications (PWA phase 4): show what the server sent.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "ETEN", {
      body: data.body || "You have a new update.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag || undefined,
      data: { url: data.url || "/launch" },
    }),
  );
});

// Tapping one opens its page, reusing an open ETEN window when there is one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/launch",
    self.location.origin,
  ).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) return client.navigate(target);
          return;
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(pageOrOffline(event));
    return;
  }
  if (isAppFile(new URL(request.url))) {
    event.respondWith(cacheFirst(request));
  }
});
`;

export function GET() {
  return new Response(SOURCE, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Always re-checked, so a new deploy is seen straight away.
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'",
    },
  });
}
