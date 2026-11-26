/* Matte OS v5 service worker.
   - Allt appinnehåll förcachas vid installation → fungerar offline.
   - Nätverk först för allt (färsk version när nätet finns), cache som reserv.
   - Ny version: CACHE-namnet byts → gamla cachar raderas vid aktivering. */
const VERSION = '6.12.1-20261126-ux';
const CACHE = 'matte-os-' + VERSION;
const CORE = ['./', './index.html', './css/unified-student-ui.css?v=1.0.0', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-512.png',
  './css/joy-study.css?v=1.0.4-simple-entry', './css/clarity-20261122.css?v=1.0.0', './css/play.css?v=1.1.0', './css/wayfind.css?v=1.1.0', './js/wayfind.js?v=1.1.0', './js/play.js?v=1.1.0', './js/smart-content.js?v=1.0.0', './smart/', './smart/smart.css?v=1.1.0', './smart/smart.js?v=1.1.0', './css/refined-ui.css?v=1.0.0', './css/surface-harmony.css?v=1.0.0', './css/app.css?v=5.5.9-fullspec', './css/atelier.css?v=6.2.0-parent', './css/color-system.css?v=6.1.0', './css/profile-chooser.css?v=1.0.3-simple-entry', './css/flow-home.css?v=1.0.0', './css/study-room-v2.css?v=1.0.0', './css/simple-navigation.css?v=1.0.0', './js/color-runtime.js?v=6.1.0', './js/math.js?v=5.5.6', './js/visuals.js?v=5.5.6', './js/core.js?v=5.5.6',
  './js/content9.js?v=5.5.6', './js/content8.js?v=5.5.6', './js/engine.js?v=5.5.6', './js/tables.js?v=5.5.6', './js/tabell-arena.js?v=5.5.9-fullspec', './css/tabell-arena.css?v=5.5.9-fullspec', './css/atelier-arena.css?v=6.0.0', './css/color-arena.css?v=6.1.0', './js/teach-simple.js?v=5.5.6', './js/knep.js?v=5.5.6', './js/qr.js?v=5.5.6', './js/cup-config.js?v=5.5.6', './js/cup-api.js?v=5.5.6', './js/cup.js?v=5.6.0-one-tap', './css/cup.css?v=5.6.0-one-tap', './js/app.js?v=7.0.7-student-first', './js/profile-chooser.js?v=1.2.2-simple-entry', './study/cloud.js?v=1.2.2-local-signout',
  './tillsammans/', './tillsammans/index.html', './tillsammans/style.css?v=1.0.0', './tillsammans/flow.css?v=1.0.0', './tillsammans/model.js?v=2.0.0-dropin', './tillsammans/app.js?v=2.2.0-english', './tillsammans/english-context.js?v=1.0.0',
  './study/', './study/index.html', './css/ux-polish.css?v=5.6.0', './js/ux-nav.js?v=5.6.0', './study/style.css?v=1.0.1-compact-login', './study/setup.js?v=1.3.0-student-first',
  './studera/', './studera/index.html', './studera/app.js?v=1.0.2', './studera/style.css?v=1.0.1',
  './foralder/', './foralder/index.html', './foralder/style.css?v=1.0.0', './foralder/model.js?v=1.0.0', './foralder/app.js?v=1.2.1-offline-account', './foralder/cloud-parent.js?v=1.0.2-student-first', './lara/', './lara/index.html', './lara/language-studio-content.js?v=1.0.0', './lara/language-studio.js?v=1.4.0-english', './lara/studio-experience.css?v=2.0.0', './lara/app.js?v=5.0.5-english', './lara/language-studio.css?v=1.0.0', './lara/content.js?v=1.1.0', './lara/texts-immersive-20261116.js?v=1.0.0', './lara/texts-extra-sv.js?v=4.0.1', './lara/texts-sv.js?v=4.0.2-immersive', './lara/texts-extra-en.js?v=4.0.1', './lara/texts-en.js?v=4.0.2-immersive', './lara/words-extra.js?v=1.1.0', './lara/ordlek.js?v=1.1.0', './affischer/', './affischer/index.html', './affischer/posters.css?v=1.1.1-mobile', './affischer/posters.js?v=1.1.0'];
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
  const togetherNav = req.mode === 'navigate' && (path === base + 'tillsammans/' || path === base + 'tillsammans/index.html');
  if (req.mode === 'navigate' && path !== base && path !== base + 'index.html' && !posterNav && !parentNav && !togetherNav) return;
  const offlineKey = togetherNav ? './tillsammans/index.html' : parentNav ? './foralder/index.html' : posterNav ? './affischer/index.html' : './index.html';
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? offlineKey : req, copy)); }
      return res;
    } catch (err) {
      // Use only the active release cache: old roots must never shadow newer offline builds.
      const activeCache=await caches.open(CACHE);
      const hit = await activeCache.match(req.mode === 'navigate' ? offlineKey : req, { ignoreSearch: req.mode === 'navigate' });
      return hit || activeCache.match(offlineKey) || Response.error();
    }
  })());
});
