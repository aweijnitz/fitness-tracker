/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { clientsClaim } from 'workbox-core';
import { replayMutations } from './sync';

declare let self: ServiceWorkerGlobalScope;

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate(),
);

registerRoute(
  ({ request }) => ['style', 'script', 'worker', 'image', 'font'].includes(request.destination),
  new CacheFirst(),
);

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(
        () => caches.match('/offline') as Promise<Response>,
      ),
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(replayMutations());
  }
});
