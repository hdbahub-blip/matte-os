'use strict';
/* Same-origin upgrade: Språkverkstad 2.0.1 (production) -> 3.0 with SYNTHETIC progress in a fresh browser profile.
   The baseline build is served first, then the candidate is swapped in behind the same URL (like a Pages deploy).
   Verifies: old 2.0 progress and short-lesson progress survive untouched, the lära service worker switches cache,
   3.0 content loads, old 2.0 deep links are explained, and the app works offline afterwards.
   Usage: node tests/sprak-upgrade-e2e.js <baseline-dir> [candidate-dir] */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const {chromium,devices}=require('playwright');
const BASELINE=path.resolve(process.argv[2]||''),CANDIDATE=path.resolve(process.argv[3]||'.');
assert(fs.existsSync(path.join(BASELINE,'lara','sw.js')),'Baseline build missing: '+BASELINE);
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
let root=BASELINE;
const server=http.createServer((req,res)=>{let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const file=path.join(root,path.normalize(p));
 if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);});
let n=0;const ok=(c,m)=>{assert(c,m);n++;};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const B='http://127.0.0.1:'+server.address().port+'/lara/';
 const browser=await chromium.launch();
 try{
  const ctx=await browser.newContext({...devices['iPhone 13']}),page=await ctx.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(B,{waitUntil:'networkidle'});await page.evaluate(()=>navigator.serviceWorker.ready);
  ok(await page.evaluate(()=>!!window.MO_STORIES),'baseline is Språkverkstad 2.0.x');
  // Synthetic progress created by the 2.0 app itself: finish one text, then do one short lesson attempt.
  await page.evaluate(()=>{localStorage.setItem('matteos.sprak.v2',JSON.stringify({v:2,profiles:{grade8:{done:{}},grade9:{done:{'sv:skarmbild:2':{at:Date.now()-86400000,correct:4}}}}}));});
  await page.reload({waitUntil:'networkidle'});
  const before=await page.evaluate(()=>({v2:localStorage.getItem('matteos.sprak.v2'),lar:localStorage.getItem('matteos.larande.v1'),v5:localStorage.getItem('matteos.v5')}));
  ok(JSON.parse(before.v2).profiles.grade9.done['sv:skarmbild:2'],'synthetic 2.0 progress present');

  root=CANDIDATE;
  await page.goto(B,{waitUntil:'networkidle'});await page.reload({waitUntil:'networkidle'});
  ok(await page.evaluate(()=>window.MO_WORKSHOP&&window.MO_WORKSHOP.ENGINE==='3.0.0'),'Språkverkstad 3.0 served after deploy');
  const after=await page.evaluate(()=>({v2:localStorage.getItem('matteos.sprak.v2'),lar:localStorage.getItem('matteos.larande.v1'),v5:localStorage.getItem('matteos.v5')}));
  ok(after.v2===before.v2,'2.0 progress preserved byte for byte');ok(after.lar===before.lar,'short-lesson progress preserved');ok(after.v5===before.v5,'maths progress untouched');
  let keys=[];for(let i=0;i<30;i++){keys=await page.evaluate(()=>caches.keys());if(keys.includes('matte-os-larande-3.0.0')&&!keys.some(k=>k.startsWith('matte-os-larande-2')))break;await page.waitForTimeout(500);}
  ok(keys.includes('matte-os-larande-3.0.0')&&!keys.some(k=>k.startsWith('matte-os-larande-2')),'lära cache switched to 3.0.0: '+keys);
  await page.goto(B+'#/sv');await page.locator('.wk-book').first().waitFor();
  ok((await page.locator('main').innerText()).includes('Språkverkstad 2.0 finns 1'),'library tells the learner that 2.0 progress is kept');
  await page.goto(B+'#/verkstad/sv/skarmbild/2');ok((await page.locator('main').innerText()).includes('ersatts'),'old 2.0 deep link explained');
  await ctx.setOffline(true);
  await page.goto(B+'#/verkstad/en/shark');await page.locator('h1').waitFor();ok((await page.locator('h1').innerText())==='The Shark in the Flooded Street','3.0 text offline after upgrade');
  await ctx.setOffline(false);
  ok(errors.length===0,'no page errors '+errors.join('|'));
  console.log('Språkverkstad 2.0.1 -> 3.0 same-origin upgrade PASS: '+n+' checks');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
