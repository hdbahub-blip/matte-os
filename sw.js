/* Matte OS v5 service worker.
   - Allt appinnehåll förcachas vid installation → fungerar offline.
   - Nätverk först för allt (färsk version när nätet finns), cache som reserv.
   - Ny version: CACHE-namnet byts → gamla cachar raderas vid aktivering. */
const VERSION = '5.4.2-20261027';
const CACHE = 'matte-os-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-512.png',
  './css/app.css?v=5.4.2', './js/math.js?v=5.4.2', './js/visuals.js?v=5.4.2', './js/core.js?v=5.4.2',
  './js/content9.js?v=5.4.2', './js/content8.js?v=5.4.2', './js/engine.js?v=5.4.2', './js/tables.js?v=5.4.2', './js/tabell-arena.js?v=5.4.2', './css/tabell-arena.css?v=5.4.2', './js/app.js?v=5.4.2'];
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
  if (req.mode === 'navigate' && path !== base && path !== base + 'index.html') return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy)); }
      return res;
    } catch (err) {
      const hit = await caches.match(req.mode === 'navigate' ? './index.html' : req, { ignoreSearch: req.mode === 'navigate' });
      return hit || caches.match('./index.html');
    }
  })());
});
