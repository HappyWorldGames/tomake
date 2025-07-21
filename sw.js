const VERSION = 2
const CACHE_NAME = `tomake-cache-v${VERSION}`;
const ASSETS = [
    '/',
    '/favicon.ico',
    '/index.html',

    '/css/styles.css',
    '/css/main-side.css',
    '/css/project-list-side.css',
    '/css/sync-side.css',
    '/css/task-view-side.css',

    '/js/app.js',
    '/js/core/database_manager.js',
    '/js/core/project.js',
    '/js/core/projects_manager.js',
    '/js/core/task.js',
    '/js/core/tasks_manager.js',
    '/js/ui/custom-context-menu.js',
    '/js/ui/main-side.js',
    '/js/ui/project-list-side.js',
    '/js/ui/sync-project-list-side.js',
    '/js/ui/task-view-side.js',
    '/js/ui/theme_manager.js',
    '/js/utils/date_converter.js',
    '/js/utils/html_functions.js',
    '/js/utils/uuid.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS);
            })
            .catch(err => {
                console.error('[SW] Error while caching:', err);
            })
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            })
        ))
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        fetch(e.request.clone()) // First access to the network
            .then(networkResponse => {
                const responseClone = networkResponse.clone();
                // Response Caching
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(e.request, responseClone);
                    });
                return networkResponse;
            })
            .catch(err => {
                console.error('[SW] Network error:', err);
                // If the network is unavailable, return the cache
                return caches.match(e.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                    });
            })
    );
});