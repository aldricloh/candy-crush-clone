// Orchard Pop service worker: offline play + fast launches.
// Bump VERSION whenever you deploy changes so installed copies refresh their cache.
const VERSION = 'orchard-pop-v1';
const FONT_CACHE = 'orchard-pop-fonts';
const SHELL = [
  '/',
  '/css/style.css',
  '/js/game.js',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: cache-first, so the game font works offline after the first visit.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        } catch {
          return Response.error();
        }
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Same-origin: stale-while-revalidate. Launches instantly from cache and picks up
  // new versions in the background for the next launch.
  const key = req.mode === 'navigate' ? '/' : req;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(key, { ignoreSearch: true });
      const update = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(key, res.clone());
          return res;
        })
        .catch(() => null);
      if (hit) {
        event.waitUntil(update);
        return hit;
      }
      return (await update) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    })
  );
});
