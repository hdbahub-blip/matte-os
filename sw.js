/* Matte OS v5 service worker.
   - Allt appinnehåll förcachas vid installation → fungerar offline.
   - Nätverk först för allt (färsk version när nätet finns), cache som reserv.
   - Ny version: CACHE-namnet byts → gamla cachar raderas vid aktivering. */
const VERSION = '5.5.0-20261030';
const CACHE = 'matte-os-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-512.png',
  './css/app.css?v=5.5.0', './js/math.js?v=5.5.0', './js/visuals.js?v=5.5.0', './js/core.js?v=5.5.0',
  './js/content9.js?v=5.5.0', './js/content8.js?v=5.5.0', './js/engine.js?v=5.5.0', './js/tables.js?v=5.5.0', './js/tabell-arena.js?v=5.5.0', './css/tabell-arena.css?v=5.5.0', './js/teach-simple.js?v=5.5.0', './js/qr.js?v=5.5.0', './js/cup-config.js?v=5.5.0', './js/cup-api.js?v=5.5.0', './js/cup.js?v=5.5.0', './css/cup.css?v=5.5.0', './js/app.js?v=5.5.0',
  './affischer/', './affischer/index.html', './affischer/posters.css?v=1.1.0', './affischer/posters.js?v=1.1.0'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('matte-os-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // The learning PWA must not intercept /prov/ or legacy /tabell/ navigations.
  const base = new URL(self.registration.scope).pathname;
  const path = new URL(req.url).pathname;
  if (path.startsWith(base + 'prov/') || path.startsWith(base + 'tabell/')) return;
  const posterNav = req.mode === 'navigate' && (path === base + 'affischer/' || path === base + 'affischer/index.html');
  if (req.mode === 'navigate' && path !== base && path !== base + 'index.html' && !posterNav) return;
  const offlineKey = posterNav ? './affischer/index.html' : './index.html';
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? offlineKey : req, copy)); }
      return res;
    } catch (err) {
      const hit = await caches.match(req.mode === 'navigate' ? offlineKey : req, { ignoreSearch: req.mode === 'navigate' });
      return hit || caches.match(offlineKey);
    }
  })());
});
