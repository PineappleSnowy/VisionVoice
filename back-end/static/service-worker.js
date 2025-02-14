// 放置于根目录，使service-worker 的作用域（scope）能覆盖其他页面的路径
const CACHE_NAME = 'visionvoice-cache-v1';
const urlsToCache = [
    "https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/socket.io/4.4.1/socket.io.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet",
    "https://kit.fontawesome.com/11023f265d.js",
    "/static/js/vudio.js"
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
