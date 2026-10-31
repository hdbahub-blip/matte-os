/* Quickmatch UX integration, synthetic two-device Chromium on disposable local REST/Postgres. */
'use strict';
const {chromium,devices}=require('playwright');
const assert=require('node:assert/strict');
const APP=process.argv[2]||'http://127.0.0.1:8765/',API=process.argv[3]||'http://127.0.0.1:8787';
const url=(hash='')=>APP+'?cupserver='+encodeURIComponent(API)+'#/cup'+hash;
(async()=>{
 const browser=await chromium.launch({headless:true}),contexts=[];
 const open=async(dev,hash='')=>{
   const ctx=await browser.newContext({...dev,serviceWorkers:'block'});contexts.push(ctx);
   const page=await ctx.newPage();await page.goto(url(hash),{waitUntil:'domcontentloaded'});
   await page.locator('[data-p=grade9]').click();
   return page;
 };
 try{
  const h=await open(devices['iPhone 13']);
  await h.locator('#cup >> css=[data-v=host]').click();
  assert.equal(await h.locator('#cup >> css=[data-act=cmode][data-v=quick]').getAttribute('aria-pressed'),'true');
  await h.locator('#cup >> css=[data-act=ct69]').click();
  await h.locator('#cup >> css=[data-act=ctab][data-v="6"]').click();
  await h.locator('#cup >> css=[data-act=ctab][data-v="9"]').click();
  await h.locator('#cup >> css=[data-act=cq][data-v="5"]').click();
  await h.locator('#cup >> css=[data-act=crounds][data-v="1"]').click();
  await h.locator('#cup >> css=[data-act=cs][data-v="15"]').click();
  assert.match(await h.locator('#cup >> css=.card').last().innerText(),/Tabeller: 7, 8.*5 frågor × 1 omgång/);
  await h.locator('#cup >> css=[data-act=create]').click();
  const code=(await h.locator('#cup >> css=.bigcode').innerText()).trim();
  assert.match(code,/^[A-HJ-NP-Z2-9]{5}$/);
  const players=[];
  for(let i=0;i<2;i++){
   const p=await open(i===0?devices['iPhone SE']:devices['Pixel 5'],'/join/'+code);
   await p.locator('#cup >> css=#jn').fill('QuickPlayer'+i);
   await p.locator('#cup >> css=button[type=submit]').click();
   await p.locator('#cup >> css=.plist').waitFor();
   await p.locator('#cup >> css=[data-act=ready]').click();
   players.push(p);
  }
  await h.locator('#cup >> css=[data-act=start]').click();
  async function drive(p,correct){
   for(let i=0;i<5;i++){
    await p.waitForFunction(idx=>{
      const r=document.querySelector('#cup')?.shadowRoot;
      return !!r?.querySelector('#ai') && !!r?.querySelector('.eyebrow')?.textContent.includes('fråga '+(idx+1)+' av');
    },i,{timeout:45000});
    const remaining=await p.locator('#cup >> css=.cup-countdown strong').innerText();
    assert(Number(remaining)>0,'visible numeric Cup round countdown');
    const eq=await p.locator('#cup >> css=.eq').innerText();
    const m=/(\d+)\s*×\s*(\d+)/.exec(eq);assert(m,'equation rendered');
    assert([7,8].includes(+m[1])||[7,8].includes(+m[2]),'selected tables only');
    await p.locator('#cup >> css=#ai').fill(String(correct?(+m[1])*(+m[2]):(+m[1])*(+m[2])+1));
    await p.locator('#cup >> css=#ab').click();
   }
  }
  await Promise.all([drive(players[0],true),drive(players[1],false)]);
  await h.locator('#cup >> css=[data-act=next]').waitFor({timeout:45000});
  assert.match(await h.locator('#cup >> css=.note').first().innerText(),/Omgång 1 av 1 klar/);
  await h.locator('#cup >> css=[data-act=next]').click();
  await h.locator('#cup >> css=h1').filter({hasText:'QuickPlayer0 vinner!'}).waitFor({timeout:15000});
  assert.match(await h.locator('#cup >> css=.rank').innerText(),/5\s*\/\s*5/);
  for(const p of players){await p.locator('#cup >> css=h1').filter({hasText:'QuickPlayer0 vinner!'}).waitFor({timeout:15000})}
  console.log('CUP QUICKMATCH MOBILE 2 DEVICE UI PASS: choices, join, simultaneous game, automatic answer validation, final winner');
 }finally{await Promise.allSettled(contexts.map(c=>c.close()));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
