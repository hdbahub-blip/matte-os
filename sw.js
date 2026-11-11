/* Matte OS v5 service worker.
   - Allt appinnehåll förcachas vid installation → fungerar offline.
   - Nätverk först för allt (färsk version när nätet finns), cache som reserv.
   - Ny version: CACHE-namnet byts → gamla cachar raderas vid aktivering. */
const VERSION = '6.3.2-20261111-private-history';
const CACHE = 'matte-os-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-512.png',
  './css/app.css?v=5.5.9-fullspec', './css/atelier.css?v=6.2.0-parent', './css/color-system.css?v=6.1.0', './js/color-runtime.js?v=6.1.0', './js/math.js?v=5.5.6', './js/visuals.js?v=5.5.6', './js/core.js?v=5.5.6',
  './js/content9.js?v=5.5.6', './js/content8.js?v=5.5.6', './js/engine.js?v=5.5.6', './js/tables.js?v=5.5.6', './js/tabell-arena.js?v=5.5.9-fullspec', './css/tabell-arena.css?v=5.5.9-fullspec', './css/atelier-arena.css?v=6.0.0', './css/color-arena.css?v=6.1.0', './js/teach-simple.js?v=5.5.6', './js/knep.js?v=5.5.6', './js/qr.js?v=5.5.6', './js/cup-config.js?v=5.5.6', './js/cup-api.js?v=5.5.6', './js/cup.js?v=5.5.6', './css/cup.css?v=5.5.4', './js/app.js?v=6.3.0-cloud', './study/cloud.js?v=1.0.0',
  './study/', './study/index.html', './study/style.css?v=1.0.0', './study/setup.js?v=1.0.1',
  './studera/', './studera/index.html', './studera/app.js?v=1.0.2', './studera/style.css?v=1.0.1',
  './foralder/', './foralder/index.html', './foralder/style.css?v=1.0.0', './foralder/model.js?v=1.0.0', './foralder/app.js?v=1.1.0-cloud', './foralder/cloud-parent.js?v=1.0.1', './lara/content.js?v=1.1.0', './lara/texts-extra-sv.js?v=4.0.1', './lara/texts-sv.js?v=4.0.1', './lara/texts-extra-en.js?v=4.0.1', './lara/texts-en.js?v=4.0.1', './lara/words-extra.js?v=1.1.0', './lara/ordlek.js?v=1.1.0', './affischer/', './affischer/index.html', './affischer/posters.css?v=1.1.0', './affischer/posters.js?v=1.1.0'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('matte-os-') && !k.startsWith('matte-os-larande-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // The learning PWA must not intercept /prov/ or legacy /tabell/ navigations.
  const base = new URL(self.registration.scope).pathname;
  const path = new URL(req.url).pathname;
  if (path.startsWith(base + 'prov/') || path.startsWith(base + 'tabell/') || path.startsWith(base + 'lara/')) return;
  const posterNav = req.mode === 'navigate' && (path === base + 'affischer/' || path === base + 'affischer/index.html');
  const parentNav = req.mode === 'navigate' && (path === base + 'foralder/' || path === base + 'foralder/index.html');
  if (req.mode === 'navigate' && path !== base && path !== base + 'index.html' && !posterNav && !parentNav) return;
  const offlineKey = parentNav ? './foralder/index.html' : posterNav ? './affischer/index.html' : './index.html';
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
