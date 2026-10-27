/* Tabellarenan v1.0.0 – offline shell within /tabell/ */
const CACHE='matte-tabellarena-v1.0.0-20261027';
const ASSETS=['./','./index.html','./arena.js?v=1.0.0','./arena.css?v=1.0.0',
  '../js/core.js?v=5.2.1','../js/content9.js?v=5.2.1','../js/content8.js?v=5.2.1',
  '../js/engine.js?v=5.2.1','../js/tables.js?v=5.2.1'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(x=>new Request(x,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('matte-tabellarena-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   e.respondWith(fetch(req).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy))}return resp}).catch(()=>caches.match('./index.html')));
   return;
 }
 e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(resp=>{if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return resp})));
});