'use strict';
// Språkverkstad 3.0 smoke test in WebKit (Safari engine, iPhone emulation) and Firefox.
// Covers the parts most likely to differ between engines: sentence buttons, typed cloze, locked pair turns,
// localStorage, and identical option order across engines.
const {webkit,firefox,devices}=require('playwright');
const assert=require('node:assert/strict');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/$/,'')+'/lara/';
let n=0;const ok=(c,m)=>{n++;assert(c,m);};
async function diag(page,selector){return page.evaluate(sel=>{const el=document.querySelector(sel);const r=el?.getBoundingClientRect();const cw=document.documentElement.clientWidth;
 const wide=[...document.querySelectorAll('body *')].filter(x=>{const b=x.getBoundingClientRect();return b.width&&b.right>cw+1;}).slice(0,5).map(x=>x.tagName+'.'+String(x.className).slice(0,30)+' right='+Math.round(x.getBoundingClientRect().right));
 const d=window.MO_WORKSHOP?._debug?.().ui;return {sel,innerW:innerWidth,innerH:innerHeight,clientW:cw,scale:window.visualViewport?.scale,vvH:window.visualViewport?.height,scrollY,docH:document.documentElement.scrollHeight,rect:r&&[Math.round(r.top),Math.round(r.bottom)],task:d&&d.i,view:d&&d.view,wide};},selector);}
// Tap like a learner: scroll the control to the middle, prove it is the topmost element at its centre
// (nothing such as the fixed bottom menu covers it), then press exactly there.
async function tap(page,selector){const l=page.locator(selector).first();await l.waitFor();
 const pt=await l.evaluate(e=>{e.scrollIntoView({block:'center'});const rs=[...e.getClientRects()];const r=rs.sort((a,b)=>b.width-a.width)[0]||e.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;const hit=document.elementFromPoint(x,y);return {x,y,ok:!!hit&&(hit===e||e.contains(hit))};});
 if(!pt.ok){console.error('TAP BLOCKED',JSON.stringify(await diag(page,selector)));}
 ok(pt.ok,'control is visible and not covered: '+selector);
 await page.mouse.click(pt.x,pt.y);}
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
   const vw=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth,scale:window.visualViewport?.scale||1}));
   ok(vw.s<=vw.w+1&&vw.w===(ctxOpts.viewport?.width||vw.w)&&Math.abs(vw.scale-1)<0.01,name+': no horizontal overflow or zoom-out on '+info.type+' '+JSON.stringify(vw));
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
