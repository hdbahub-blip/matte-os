/* Independent offline worker. Never deletes student learning, math or prov caches. */
const CACHE='matte-parent-1.1.1-private-history';
const ASSETS=['./','./index.html','./style.css?v=1.0.0','./model.js?v=1.0.0','./app.js?v=1.1.0-cloud','./study-cloud.js?v=1.0.0','./cloud-parent.js?v=1.0.1',
 '../js/core.js?v=5.5.6','../js/content9.js?v=5.5.6','../js/content8.js?v=5.5.6','../js/knep.js?v=5.5.6',
 '../lara/content.js?v=1.1.0','../lara/texts-extra-sv.js?v=4.0.1','../lara/texts-sv.js?v=4.0.1',
 '../lara/texts-extra-en.js?v=4.0.1','../lara/texts-en.js?v=4.0.1','../lara/words-extra.js?v=1.1.0','../lara/ordlek.js?v=1.1.0'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x.startsWith('matte-parent-')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith((async()=>{const url=new URL(e.request.url),base=new URL(self.registration.scope);
 try{const response=await fetch(e.request);if(response.ok){const dest=e.request.mode==='navigate'?'./index.html':e.request;
 caches.open(CACHE).then(c=>c.put(dest,response.clone())).catch(()=>{});}return response;}
 catch{const offline=e.request.mode==='navigate'?'./index.html':e.request;return await caches.match(offline,{ignoreSearch:true})||await caches.match('./index.html');}})());});
