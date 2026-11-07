'use strict';
// Språkverkstad 3.0 smoke test in WebKit (Safari engine, iPhone emulation) and Firefox.
// Covers the parts most likely to differ between engines: sentence buttons, typed cloze, locked pair turns,
// localStorage, and identical option order across engines.
const {webkit,firefox,devices}=require('playwright');
const assert=require('node:assert/strict');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/$/,'')+'/lara/';
let n=0;const ok=(c,m)=>{n++;assert(c,m);};
// Scroll the target to the middle first, as a learner would; the fixed bottom menu can cover the viewport edge.
async function tap(page,selector){const l=page.locator(selector).first();await l.evaluate(e=>e.scrollIntoView({block:'center'}));await l.click();}
async function run(name,engine,ctxOpts){
 const browser=await engine.launch();const errors=[];
 try{
  const ctx=await browser.newContext({...ctxOpts,serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'#/verkstad/sv/somn',{waitUntil:'domcontentloaded'});await page.locator('[data-mode=solo]').waitFor();
  await tap(page,'[data-mode=solo]');await tap(page,'[data-w=start-tasks]');
  const orders=[];
  for(let g=0;g<12;g++){
   const info=await page.evaluate(()=>{const W=window.MO_WORKSHOP,X=W._test,d=W._debug().ui;const t=X.BANK.find(x=>x.lang==='sv'&&x.id==='somn');const k=X.tasksFor(t,d.mode)[d.i];if(!k)return null;
    if(k.type==='choice')return {type:k.type,i:X.displayOrder(t,k).indexOf(0)};if(k.type==='evidence')return {type:k.type,i:X.sentenceList(t).findIndex(s=>k.targets.some(x=>s.s.includes(x)))};if(k.type==='cloze')return {type:k.type,word:k.accept[0]};return {type:k.type};});
   if(!info)break;
   orders.push((await page.locator('.wk-card .wk-option').allInnerTexts()).join('/'));
   if(info.type==='open'){await page.locator('#wk-open').fill('Ett svar');await tap(page,'[data-w=open-done]');await tap(page,'[data-w=open-next]');continue;}
   if(info.type==='cloze')await page.locator('#wk-type').fill(info.word);else await tap(page,`[data-w=pick][data-i="${info.i}"]`);
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),name+': no horizontal overflow on '+info.type);
   await tap(page,'[data-w=check]');ok(await page.locator('.wk-feedback.good').count()===1,name+': '+info.type+' accepted');await tap(page,'[data-w=next]');}
  await tap(page,'[data-w=finish]');await page.locator('.wk-result').waitFor();
  const st=await page.evaluate(()=>JSON.parse(localStorage.getItem('matteos.sprak.v3')));
  ok(Object.keys(st.profiles.grade9.tasks).length===9,name+': progress stored');
  await page.goto(base+'#/verkstad/en/hostel');await tap(page,'[data-mode=pair]');await tap(page,'[data-w=start-tasks]');
  await tap(page,'[data-w=pick]');await tap(page,'[data-w=pair-lock]');
  ok(await page.locator('.wk-pass').count()===1&&await page.locator('.wk-option').count()===0,name+': pair answer hidden during hand-over');
  ok(errors.length===0,name+': no JavaScript errors '+errors.join('|'));
  await ctx.close();return orders;
 }finally{await browser.close();}
}
(async()=>{
 const a=await run('WebKit iPhone',webkit,devices['iPhone 13']);
 const b=await run('Firefox',firefox,{viewport:{width:1024,height:800}});
 ok(JSON.stringify(a)===JSON.stringify(b),'identical option order in WebKit and Firefox');
 console.log('Språkverkstad cross-engine PASS: '+n+' checks (WebKit iPhone emulation + Firefox)');
})().catch(e=>{console.error(e);process.exit(1);});
