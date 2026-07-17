// Bump this version string every time you deploy a change, as a safety net —
// but with the network-first strategy below, index.html updates should now
// show up immediately without needing that anyway.
const CACHE = 'order-mgmt-v2';
const ASSETS = [
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // App shell (the page itself / index.html): always try the network first so
  // deployed code changes show up right away. Only fall back to the cached
  // copy if the network request fails (i.e. you're offline).
  if (e.request.mode === 'navigate' || e.request.url.endsWith('/index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          var resClone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static third-party assets (PDF library, manifest): cache-first is fine,
  // these don't change.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
