self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
