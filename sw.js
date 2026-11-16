// Koze mache san entènèt: nou kenbe fichye app la sou telefòn nan.
// Chanje VERSION chak fwa ou pibliye yon nouvo vèsyon.
const VERSION = 'koze-v1';
const ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/data.js', './js/lesson.js', './js/srs.js', './js/speech.js', './js/store.js', './js/util.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Bay vèsyon ki sou telefòn nan touswit, epi mete l ajou an aryè plan.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => hit || cache.match('./index.html'));
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }),
  );
});
