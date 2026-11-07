/* Isolated offline cache. Does not intercept original Maths, Prov or Cup routes. */
const VERSION='larande-matteos-1.0.0';
const FILES=['./','./index.html','./style.css?v=1.0.0','./content.js?v=1.0.0','./logic.js?v=1.0.0','./app.js?v=1.0.0'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('larande-matteos-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request.mode==='navigate'?'./index.html':e.request,copy));}return r;}).catch(()=>caches.match(e.request.mode==='navigate'?'./index.html':e.request,{ignoreSearch:e.request.mode==='navigate'})));});
