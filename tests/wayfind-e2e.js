'use strict';
// Wayfinding: one colour per area, active tab, no focus box on headings, one typeface, dark mode on account pages.
const assert=require('assert'),{chromium}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const exe=process.env.MATTE_BROWSER_EXE;let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};
const lum=h=>{const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(c=>c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4));return .2126*v[0]+.7152*v[1]+.0722*v[2]};
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
(async()=>{
 // Colour tokens readable as small text on light (#FFFFFF/#F6F4F8) and dark (#1D1E24/#141018) surfaces.
 const css=require('fs').readFileSync(__dirname+'/../css/wayfind.css','utf8');
 const light=css.match(/:root\{--wf-math[^}]+\}/)[0],dark=css.match(/\[data-mode="dark"\]\{[^}]+\}/)[0];
 for(const [blk,bgs] of [[light,['#FFFFFF','#F6F4F8']],[dark,['#1D1E24','#141018']]])
  for(const [,k,v] of blk.matchAll(/--wf-([a-z]+):(#[0-9A-Fa-f]{6})/g))for(const bg of bgs)ok(cr(v,bg)>=4.5,k+' '+v+' AA on '+bg+' ('+cr(v,bg).toFixed(2)+')');
 const browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(base);await p.click('.pc-grade9');await p.waitForSelector('.pl-strip');
 const subj=()=>p.evaluate(()=>document.documentElement.dataset.subject);
 ok(await subj()==='home','home area');
 await p.goto(base+'#/trana');await p.waitForSelector('h1');ok(await subj()==='math','math area on Träna');
 ok(await p.evaluate(()=>getComputedStyle(document.querySelector('#app > header')).boxShadow.includes('inset')),'coloured line under top bar');
 ok(await p.locator('nav.nav [aria-current="page"]').innerText().then(t=>/Matte/.test(t)),'Matte tab active');
 const h1=await p.evaluate(()=>{const h=document.querySelector('h1');h.setAttribute('tabindex','-1');h.focus();const s=getComputedStyle(h);return s.outlineStyle+'|'+s.boxShadow});
 ok(/^none\|none$/.test(h1),'focused heading shows no box: '+h1);
 await p.goto(base+'#/installningar');await p.waitForSelector('h1');
 ok(!/Matte/.test(await p.locator('nav.nav [aria-current="page"]').allInnerTexts().then(a=>a.join(' '))),'settings does not pretend to be Matte');
 for(const [url,want,tab] of [['lara/#/studio/sv','sv','Svenska'],['lara/#/studio/en','en','Engelska'],['lara/#/spel','play','Spela']]){
  await p.goto(base+url);await p.waitForSelector('nav.bottom',{state:'attached'});await p.waitForTimeout(300);
  ok(await subj()===want,url+' → '+want);
  ok(/ /.test(' ')&&(await p.locator('nav.bottom [aria-current="page"]').innerText()).includes(tab),url+' active tab '+tab);
  if(want!=='play'){ok((await p.locator('.ls-back').getAttribute('href'))==='../#/','back goes straight to Start');}
 }
 for(const [url,want] of [['lara/debatt.html','sv'],['lara/debatt.html?lang=en','en'],['tillsammans/','play'],['smart/','smart'],['study/','account'],['foralder/','account']]){
  await p.goto(base+url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(400);ok(await subj()===want,url+' → '+want);
 }
 const fam=await p.evaluate(()=>getComputedStyle(document.querySelector('h1')).fontFamily);ok(!/Iowan|Baskerville|Georgia/.test(fam),'overview uses the app typeface: '+fam);
 ok(errs.length===0,'no errors '+errs.join('|'));await ctx.close();
 // Dark mode follows the app on account pages.
 const c2=await browser.newContext({viewport:{width:390,height:844}});await c2.addInitScript(()=>localStorage.setItem('matteos.appearance.v1','dark'));
 const q=await c2.newPage();
 for(const url of ['study/','foralder/']){await q.goto(base+url,{waitUntil:'domcontentloaded'});await q.waitForTimeout(600);
  const bg=await q.evaluate(()=>getComputedStyle(document.body).backgroundColor);const [r,g,b]=bg.match(/\d+/g).map(Number);ok(r+g+b<180,url+' dark background '+bg);}
 await c2.close();await browser.close();console.log('WAYFIND E2E PASS '+n+'/'+n);
})().catch(e=>{console.error(e);process.exit(1)});
