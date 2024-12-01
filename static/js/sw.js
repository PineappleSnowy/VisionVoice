
if (navigator.serviceWorker != null) {
  navigator.serviceWorker.register('./static/js/sw.js')
    .then(function (registration) {
      // console.log('Registered events at scope: ', registration.scope);
    });
}

var cacheStorageKey = 'minimal-pwa-7'

var cacheList = [
  "./templates/index.html",
  "./static/css/index.css",
  "./index.js",
  "../image/favicon.png",
  "../image/arrow_button.png",
  "../favicon.ico"
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheStorageKey)
      .then(cache => cache.addAll(cacheList))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('fetch', function (e) {
  e.respondWith(
    caches.match(e.request).then(function (response) {
      if (response != null) {
        return response
      }
      return fetch(e.request.url)
    })
  )
})

self.addEventListener('activate', function (e) {
  e.waitUntil(
    Promise.all(
      caches.keys().then(cacheNames => {
        return cacheNames.map(name => {
          if (name !== cacheStorageKey) {
            return caches.delete(name)
          }
        })
      })
    ).then(() => {
      return self.clients.claim()
    })
  )
})

// Handle the mini-player widget updates in another script.
importScripts('./sw-widgets.js');