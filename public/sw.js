self.__proofPactCacheVersion = "offline-v1";

const offlineCacheName = `proof-pact-${self.__proofPactCacheVersion}`;
const offlineCreateUrl = "/offline/create.html";
const offlineFallbackUrl = "/offline/offline.html";
const offlineAssets = [
  offlineCreateUrl,
  offlineFallbackUrl,
  "/manifest.json",
  "/icon.svg",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(offlineCacheName).then((cache) => cache.addAll(offlineAssets)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((cacheName) => cacheName.startsWith("proof-pact-") && cacheName !== offlineCacheName).map((cacheName) => caches.delete(cacheName))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(offlineCacheName);
      const url = new URL(request.url);

      if (url.pathname === "/create" || url.pathname === "/create/") {
        return (await cache.match(offlineCreateUrl)) || Response.error();
      }

      return (await cache.match(offlineFallbackUrl)) || Response.error();
    }),
  );
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "Proof update",
    body: "Open the app to check your latest proof request.",
    url: "/",
  };

  let data = fallback;

  try {
    data = event.data ? { ...fallback, ...event.data.json() } : fallback;
  } catch (_error) {
    data = fallback;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existingClient = clientList.find((client) => "focus" in client);

      if (existingClient) {
        existingClient.navigate(url);
        return existingClient.focus();
      }

      return clients.openWindow(url);
    }),
  );
});
