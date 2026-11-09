'use strict';
/* Navigation clarity regression on simulated phones. */
const {chromium,webkit,firefox,devices}=require('playwright');
const assert=require('node:assert/strict');
const BASE=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/$/,'');
const engine=process.argv[3]||'chromium';
(async()=>{
 const browser=await ({chromium,webkit,firefox})[engine].launch({headless:true});
 let checks=0;
 try{
  for(const grade of ['grade8','grade9']){
   const device=engine==='firefox'?{viewport:{width:375,height:812},deviceScaleFactor:2}:devices['iPhone 13'];
   const context=await browser.newContext({...device,serviceWorkers:'block'});
   const p=await context.newPage();p.setDefaultTimeout(15000);
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});
   await p.locator('[data-p="'+grade+'"]').click();
   await p.locator('nav.nav').waitFor();
   assert.equal(await p.locator('nav.nav [data-h="#/tabell/home"]').count(),1);checks++;
   assert.equal(await p.locator('nav.nav a[href="lara/"]').count(),1);checks++;
   const cards=p.locator('.calm-choices.learn-grid .calm-choice');
   assert.equal(await cards.count(),5);checks++;
   for(const href of ['#/formler','#/trana','#/tabell/home','lara/#/sv','lara/#/en']){
    assert.equal(await p.locator('.calm-choices.learn-grid .calm-choice[href="'+href+'"]').count(),1,'home choice '+href);checks++;
   }
   assert.equal(await p.locator('.calm-choices [href="#/cup"]').count(),0);checks++;
   await p.locator('nav.nav [data-h="#/tabell/home"]').click();
   await p.locator('#arena .selected-front a[href="#/tabell/selftest"]').waitFor();
   assert.equal(await p.locator('nav.nav [data-h="#/tabell/home"][aria-current="page"]').count(),1);checks++;
   await p.locator('#arena .selected-front a[href="#/tabell/selftest"]').click();
   await p.locator('#arena [data-act="selectedTable"][data-value="3"]').waitFor();checks++;
   await p.goto(BASE+'/#/l/'+(grade==='grade8'?'f8-area':'s9-powers')+'/0');
   await p.locator('.focus-back span').waitFor();
   assert.match(await p.locator('.focus-back').innerText(),/Tillbaka/);checks++;
   await p.locator('.focus-back').click();
   await p.locator('nav.nav').waitFor();checks++;
   await p.goto(BASE+'/#/formler');
   await p.locator('a.knep-entry').waitFor();checks++;
   assert.equal(await p.locator('a.knep-entry').count(),1);checks++;
   await p.goto(BASE+'/lara/',{waitUntil:'domcontentloaded'});
   await p.locator('.homegrid').waitFor();checks++;
   assert.equal(await p.locator('nav.bottom a[href="../"]').count(),1);checks++;
   assert.equal(await p.locator('.homegrid .subjectCard').count(),3);checks++;
   assert.equal(await p.locator('.learning-extra').count(),1);checks++;
   await p.locator('nav.bottom a[href="../"]').click();
   await p.locator('nav.nav').waitFor();checks++;
   const bounds=await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
   assert(bounds[0]<=bounds[1]+2,'horizontal overflow '+bounds);checks++;
   assert.deepEqual(errors,[],grade+' browser errors');checks++;
   await context.close();
  }
  console.log('Navigation UX '+engine+': '+checks+'/'+checks+' PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});