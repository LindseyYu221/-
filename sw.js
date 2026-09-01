const CACHE_NAME = 'lindsey-planner-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// Cache-first for same-origin requests (the app shell); network-first fallback
// for everything else (e.g. Google Fonts), with a cached fallback when offline.
self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isSameOrigin = new URL(req.url).origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        return (
          cached ||
          fetch(req)
            .then(function (res) {
              return caches.open(CACHE_NAME).then(function (cache) {
                cache.put(req, res.clone());
                return res;
              });
            })
            .catch(function () { return caches.match('./index.html'); })
        );
      })
    );
  } else {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          return caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, res.clone());
            return res;
          });
        })
        .catch(function () { return caches.match(req); })
    );
  }
});
