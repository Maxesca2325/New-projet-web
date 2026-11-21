// Koze mache san entènèt: nou kenbe fichye app la sou telefòn nan.
// - Kòd la (HTML, JS, CSS, JSON): entènèt an premye, pou chak korije rive touswit;
//   kopi a sèlman si pa gen entènèt (oswa si rezo a pran plis pase 4 s).
// - Medya yo (odyo, imaj, polis): kopi a an premye, nan yon cache ki pa efase
//   lè app la mete ajou, pou moun nan pa telechaje vwa yo ankò.
// Chanje VERSION chak fwa ou pibliye yon nouvo vèsyon.
const VERSION = 'koze-v25';
const MEDIA = 'koze-media-v2';
const ASSETS = [
  './', './index.html', './tokens.css', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/icons.js', './js/sfx.js', './js/audio.js', './js/cloud.js', './js/config.js', './js/pages.js', './js/data.js', './js/lesson.js', './js/srs.js', './js/speech.js', './js/store.js', './js/util.js',
  './audio/index.json',
];
const MEDIA_ASSETS = [
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './img/maskot.webp', './img/maskot-kontan.webp', './img/maskot-ankouraje.webp', './img/maskot-dodo.webp',
  './fonts/nunito.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(Promise.all([
    caches.open(VERSION).then((c) => c.addAll(ASSETS)),
    caches.open(MEDIA).then((c) => c.addAll(MEDIA_ASSETS)),
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isMedia = (url) => /\.(mp3|wav|webp|png|svg|woff2)$/.test(url.pathname);
const save = (cacheName, req, res) => { if (res.status === 200) caches.open(cacheName).then((c) => c.put(req, res.clone())).catch(() => {}); };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (isMedia(url)) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => { save(MEDIA, req, res); return res; })));
    return;
  }

  e.respondWith((async () => {
    try {
      const res = await Promise.race([
        fetch(req),
        new Promise((_, reject) => setTimeout(() => reject(new Error('slow')), 4000)),
      ]);
      save(VERSION, req, res);
      return res;
    } catch {
      return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('./index.html'));
    }
  })());
});
