/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { clientsClaim } from 'workbox-core';
import { replayMutations } from './sync';
import { sendMutationViaFetch } from './serverSync';

declare let self: ServiceWorkerGlobalScope;

interface SyncEvent extends ExtendableEvent {
  tag: string;
}

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
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === 'sync-mutations') {
    syncEvent.waitUntil(replayMutations({ sendMutation: sendMutationViaFetch }));
  }
});
