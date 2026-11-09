const CACHE='matte-prov-v1.3.1-20261109-harmony';
const CORE=[
 './','./index.html','./css/app.css?v=1.2.5','./css/atelier.css?v=1.3.0','./css/color-system.css?v=6.1.0','./js/color-runtime.js?v=6.1.0','./js/exam-core.js?v=1.2.5','./js/exam-visuals.js?v=1.2.5','./js/app.js?v=1.2.5',
 './manifest.webmanifest','./icon.svg',
 '../js/math.js?v=5.5.6','../js/core.js?v=5.5.6','../js/content9.js?v=5.5.6','../js/content8.js?v=5.5.6'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('matte-prov-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r}).catch(()=>caches.match('./index.html')));
   return;
 }
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r})));
});