const CACHE_NAME = "rr-roast-ritual-v2";
const APP_SHELL = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/rr-icon.svg",
  "./assets/rr-icon-192.png",
  "./assets/rr-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("rr-roast-ritual-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    const networkResponse = fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          return caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).then(() => response);
        }
        return response;
      })
      .catch(async () => {
        const cachedPage = await caches.match(request);
        return cachedPage || caches.match("./index.html");
      });

    event.waitUntil(networkResponse.then(() => undefined));
    event.respondWith(networkResponse);
    return;
  }

  const responsePromise = caches.match(request).then((cachedResponse) => {
    const networkResponse = fetch(request)
      .then((response) => {
        if (response.ok || response.type === "opaque") {
          const copy = response.clone();
          return caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).then(() => response);
        }
        return response;
      })
      .catch(() => cachedResponse || Response.error());

    return cachedResponse || networkResponse;
  });

  event.waitUntil(responsePromise.then(() => undefined));
  event.respondWith(responsePromise);
});
