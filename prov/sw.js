const CACHE='matte-prov-v1.2.0-20261027';
const CORE=[
 './','./index.html','./css/app.css?v=1.2.0','./js/exam-core.js?v=1.2.0','./js/exam-visuals.js?v=1.2.0','./js/app.js?v=1.2.0',
 './manifest.webmanifest','./icon.svg',
 '../js/math.js?v=5.1.0','../js/core.js?v=5.1.0','../js/content9.js?v=5.1.0','../js/content8.js?v=5.1.0'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r}).catch(()=>caches.match('./index.html')));
   return;
 }
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r})));
});