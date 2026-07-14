/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(new NetworkFirst(), {
    denylist: [/^\/api/],
  }),
);

self.addEventListener('push', (event) => {
  const data = event.data?.json() as { title?: string; body?: string } | undefined;
  const title = data?.title ?? 'Kaloriim';
  const body  = data?.body  ?? '';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((c) =>
          c.url.includes(self.location.origin),
        );
        if (existing) return existing.focus();
        return self.clients.openWindow('/');
      }),
  );
});
