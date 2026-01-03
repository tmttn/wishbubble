/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Push notification event handler
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("Push event received but no data");
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192x192.png",
      badge: data.badge || "/icons/icon-72x72.png",
      vibrate: [100, 50, 100] as number[],
      data: {
        url: data.url || "/",
        timestamp: Date.now(),
      },
      tag: data.tag || "wishbubble-notification",
      renotify: true,
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "WishBubble", options)
    );
  } catch (error) {
    console.error("Error processing push event:", error);
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data as { url?: string })?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Navigate to the URL and focus
            (client as WindowClient).navigate(url);
            return (client as WindowClient).focus();
          }
        }
        // If no existing window, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Handle push subscription change (if browser rotates keys)
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(
        (event as PushSubscriptionChangeEvent).oldSubscription?.options || {
          userVisibleOnly: true,
        }
      )
      .then((subscription) => {
        // Re-subscribe with the server
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription.toJSON()),
        });
      })
      .catch((error) => {
        console.error(
          "Failed to resubscribe after pushsubscriptionchange:",
          error
        );
      })
  );
});
