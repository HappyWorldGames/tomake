import { DatabaseManager } from './js/core/database_manager.js';
import { TaskStatus } from './js/core/task.js';

const APP_PREFIX = 'tomake'
const VERSION = 2
const CACHE_NAME = `${APP_PREFIX}-v${VERSION}`;
const ASSETS = [
    '/tomake/',
    '/tomake/favicon.ico',
    '/tomake/index.html',

    '/tomake/css/styles.css',
    '/tomake/css/main-side.css',
    '/tomake/css/project-list-side.css',
    '/tomake/css/sync-side.css',
    '/tomake/css/task-view-side.css',

    '/tomake/js/app.js',
    '/tomake/js/core/database_manager.js',
    '/tomake/js/core/project.js',
    '/tomake/js/core/projects_manager.js',
    '/tomake/js/core/task.js',
    '/tomake/js/core/tasks_manager.js',
    '/tomake/js/ui/custom-context-menu.js',
    '/tomake/js/ui/main-side.js',
    '/tomake/js/ui/project-list-side.js',
    '/tomake/js/ui/sync-project-list-side.js',
    '/tomake/js/ui/task-view-side.js',
    '/tomake/js/ui/theme_manager.js',
    '/tomake/js/utils/date_converter.js',
    '/tomake/js/utils/html_functions.js',
    '/tomake/js/utils/uuid.js'
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
                if (key.indexOf(APP_PREFIX) && key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            })
        ))
    );

    chrome.alarms.onAlarm.addListener(async (alarm) => {
        if (alarm.name !== 'next-task-alarm') return;

        self.registration.showNotification('nextTask.title', {
            body: 'nextTask.description',
            icon: '/tomake/icon.ico'
        });
    });
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    // 1. Trying to respond from cache on timeout
    const cachePromise = caches.match(e.request)
        .then(cached => cached || Promise.reject('No cache'));

    // 2. Network request with caching (works in the background)
    const networkFetch = fetch(e.request.clone())
        .then(networkResponse => {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
                .then(cache => cache.put(e.request, responseClone));
            return networkResponse;
        });

    // 3. Timeout for quick response
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject('Timeout'), 1000)
    );

    // 4. Race: Network vs Timeout
    e.respondWith(
        Promise.race([
            networkFetch.catch(() => cachePromise),
            timeoutPromise.then(() => cachePromise, () => cachePromise)
        ])
        .catch(() => cachePromise)
    );

    // 5. Important: force execution of the network request
    e.waitUntil(networkFetch.catch(() => {}));
});

self.addEventListener('message', (event) => {
    console.log(`Message: ${event.type}`);

    if (event.data.type === 'schedule-alarm') {
        setNextAlarmNotification();
    }
});

function setNextAlarmNotification() {
    console.log(`Start set alarm`);

    const dbManager = new DatabaseManager();
    dbManager.initDB().then(() => {
        dbManager.tasksManager.getTasksFromIndex('startDate', IDBKeyRange.lowerBound(new Date().toISOString())).then(tasks => {
            if (!tasks) {
                console.log('Undefined');
                return;
            }
            tasks.forEach(task => {
                console.log(`Check task: ${task.title}, ${task.status}`);

                if (task.status === TaskStatus.Normal, task.startDate.getTime() > Date.now()) {
                    // TODO
                    console.log(`Created alarm on: ${task.startDate}`);
                    return;
                }
            });
        });
    });
}