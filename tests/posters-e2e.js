'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,devices}=require('playwright');
const BASE=process.argv[2]||'http://127.0.0.1:8765/';
const OUT=process.argv[3]||'test-screenshots';
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true});
  let checks=0;
  try{
    for(const [name,dev] of [['iphone-se',devices['iPhone SE']],['iphone-13',devices['iPhone 13']],['desktop',{viewport:{width:1365,height:900}}]]){
      const context=await browser.newContext({...dev,serviceWorkers:'block'});
      const page=await context.newPage();page.setDefaultTimeout(9000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(BASE+'affischer/?visa=formler',{waitUntil:'networkidle'});
      assert.equal(await page.locator('.formula-card').count(),8);checks++;
      assert.equal(await page.locator('.formula-card').filter({has:page.locator('.worked')}).count(),8);checks++;
      assert.match(await page.locator('#title-formler').innerText(),/Viktiga formler/);checks++;
      assert(await page.locator('[data-poster=formler]').getAttribute('aria-pressed')==='true');checks++;
      let overflow=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
      assert(overflow.actual<=overflow.viewport+2,name+' formula horizontal overflow '+JSON.stringify(overflow));checks++;
      await page.screenshot({path:OUT+'/'+name+'-formelaffisch.png',fullPage:true});
      await page.click('[data-poster=tabeller]');
      assert(await page.locator('#poster-tabeller').isVisible());checks++;
      assert.equal(await page.locator('.mult-card').count(),10);checks++;
      assert.equal(await page.locator('.mult-row').count(),100);checks++;
      const equations=await page.locator('.mult-row').allTextContents();
      for(let n=1;n<=10;n++){
        for(let m=1;m<=10;m++){
          const actual=equations[(n-1)*10+(m-1)].replace(/\s+/g,'').trim();
          assert.equal(actual,n+'×'+m+'='+(n*m),'Wrong multiplication '+n+' × '+m);
          checks++;
        }
      }
      overflow=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
      assert(overflow.actual<=overflow.viewport+2,name+' multiplication horizontal overflow '+JSON.stringify(overflow));checks++;
      await page.screenshot({path:OUT+'/'+name+'-tabellaffisch.png',fullPage:true});
      assert.equal(await page.locator('a[href="../#/tabell/home"]').count(),1);checks++;
      await page.goto(BASE,{waitUntil:'networkidle'});
      await page.click('[data-p=grade9]');await page.waitForSelector('h1');
      await page.click('.nav [data-h="#/formler"]');await page.waitForSelector('text=Formler och regler');
      assert.equal(await page.locator('a[href="affischer/?visa=formler"]').count(),1,'Formulas CTA missing');checks++;
      await page.click('a[href="affischer/?visa=formler"]');
      await page.waitForSelector('.formula-card');
      assert.match(page.url(),/affischer\/\?visa=formler/);checks++;
      await page.goto(BASE+'#/trana',{waitUntil:'networkidle'});
      assert.equal(await page.locator('a[href="affischer/?visa=tabeller"]').count(),1,'Training poster CTA missing');checks++;
      assert.equal(await page.locator('a[href="#/tabell/home"]').count(),1,'Original table arena CTA missing');checks++;
      assert.deepEqual(errors,[],name+' console errors');checks++;
      console.log(name+': formula, 100 table values, mobile layout and preserved Matte OS routes PASS');
      await context.close();
    }
    // Dedicated offline test: service worker stores poster's own HTML and resources; main app remains intact.
    const c=await browser.newContext({serviceWorkers:'allow'});
    const p=await c.newPage();p.setDefaultTimeout(12000);
    await p.goto(BASE,{waitUntil:'networkidle'});
    await p.evaluate(()=>navigator.serviceWorker.ready);
    await p.waitForFunction(async()=>{const reg=await navigator.serviceWorker.ready;return !!reg.active;});
    await p.waitForFunction(async()=>{const keys=await caches.keys();return keys.some(k=>k.includes('matte-os-5.4.6'));});
    await c.setOffline(true);
    await p.goto(BASE+'affischer/?visa=tabeller',{waitUntil:'domcontentloaded'});
    assert.equal(await p.locator('.mult-card').count(),10,'Offline multiplication poster cannot load');checks++;
    await p.goto(BASE+'affischer/?visa=formler',{waitUntil:'domcontentloaded'});
    assert.equal(await p.locator('.formula-card').count(),8,'Offline formula poster cannot load');checks++;
    await p.goto(BASE,{waitUntil:'domcontentloaded'});
    assert.equal(await p.locator('[data-p=grade9]').count(),1,'Offline original app overwritten by poster');checks++;
    await c.close();
    console.log('Burgundy poster mobile + offline end-to-end: '+checks+'/'+checks+' PASS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
