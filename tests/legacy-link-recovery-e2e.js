'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const engines=process.argv[3]==='chromium'?[['Chromium',chromium]]:process.argv[3]==='webkit'?[['WebKit',webkit]]:[['Chromium',chromium],['WebKit',webkit]];
(async()=>{
 let n=0;const ok=(v,msg)=>{assert(v,msg);n++};
 for(const [name,engine] of engines){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',locale:'sv-SE'});
   const p=await context.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+'uppdatera.html',{waitUntil:'domcontentloaded',timeout:30000});
   await p.evaluate(()=>navigator.serviceWorker.register('./sw.js'));
   await p.waitForFunction(async()=>{
    const r=await navigator.serviceWorker.ready;
    return !!r.active&&!!navigator.serviceWorker.controller;
   },{timeout:25000});
   // An activating SW may cause an automatic navigation. Seed through retries.
   for(let tries=0;tries<8;tries++){
    try{
     await p.waitForLoadState('domcontentloaded');
     await p.evaluate(()=>{
      localStorage.setItem('matteos.recovery.qa-sentinel','PRESERVED');
      localStorage.setItem('matteos.study.workspace.v1.qa','{"keep":"result"}');
     });
     break;
    }catch(e){if(tries===7)throw e;await p.waitForTimeout(180);}
   }
   // Simulate a legacy offline cache without deleting any user progress.
   await p.evaluate(async()=>{
    const c=await caches.open('matte-os-6.8.0-legacy-synthetic');
    await c.put(new Request(new URL('index.html?stale=1',location.href)),new Response('<h1>Old app</h1>',{headers:{'Content-Type':'text/html'}}));
    const l=await caches.open('matte-os-larande-5.0.0-legacy-synthetic');
    await l.put('legacy.txt',new Response('old'));
   });
   await p.goto(base+'uppdatera.html',{waitUntil:'domcontentloaded',timeout:30000});
   ok(await p.title()==='Uppdatera Matte OS',name+' helper is served from normal site origin');
   ok(await p.locator('#update').isVisible(),name+' accessible update control');
   ok((await p.locator('main').innerText()).includes('sparade framsteg raderas inte'),name+' clear non-deletion copy');
   await p.locator('#update').click();
   await p.waitForURL(u=>u.pathname===new URL(base).pathname,{timeout:30000});
   await p.waitForFunction(()=>document.querySelector('meta[name="matte-os-build"]')?.content==='7.0.4-link-recovery-ui',{timeout:30000});
   ok(new URL(p.url()).search==='',name+' finishes at canonical original URL');
   const state=await p.evaluate(async()=>({
    sentinel:localStorage.getItem('matteos.recovery.qa-sentinel'),
    archive:localStorage.getItem('matteos.study.workspace.v1.qa'),
    caches:await caches.keys(),
    version:document.querySelector('meta[name="matte-os-build"]')?.content
   }));
   ok(state.sentinel==='PRESERVED',name+' unrelated local state untouched');
   ok(state.archive==='{"keep":"result"}',name+' archived study workspace untouched');
   ok(!state.caches.some(k=>k.includes('legacy-synthetic')),name+' old release cache removed');
   ok(state.version==='7.0.4-link-recovery-ui',name+' new build is loaded');
   ok(errors.length===0,name+' no unhandled browser errors: '+errors.join(' | '));
   await context.close();
  }finally{await browser.close()}
 }
 console.log('LEGACY LINK RECOVERY '+n+'/'+n+' PASS');
})().catch(e=>{console.error(e);process.exit(1)});
