const CACHE_NAME = 'my-tasks-v1';
const QUEUE_NAME = 'sync-queue';

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Сохраняем запрос в очередь
        caches.open(QUEUE_NAME).then((cache) => cache.add(event.request));
        return new Response(JSON.stringify({ status: 'queued' }));
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(processQueue());
  }
});

async function processQueue() {
  const cache = await caches.open(QUEUE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    await fetch(request);
    await cache.delete(request);
  }
}