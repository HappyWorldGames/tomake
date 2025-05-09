const CACHE_NAME = 'my-tasks-v2';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then(response => response || fetch(e.request))
    );
});