'use strict';
// Actual browser interaction for the book-based Tal route (Chromium mobile emulation).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const OUT = process.argv[3] || 'test-screenshots';
fs.mkdirSync(OUT,{recursive:true});
(async () => {
  const browser=await chromium.launch({headless:true});
  let cases=0;
  try {
    for(const [name,device] of [['iphone-se',devices['iPhone SE']],['iphone-13',devices['iPhone 13']],['desktop',{viewport:{width:1280,height:800}}]]) {
      const context=await browser.newContext({...device,serviceWorkers:'block'});
      await context.addInitScript(()=>{window.__MO_NOW='2026-10-28T15:00:00';});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      page.setDefaultTimeout(9000);
      await page.goto(BASE,{waitUntil:'networkidle'});
      await page.click('[data-p="grade9"]');
      await page.waitForSelector('.hero h2');
      assert.match(await page.locator('.hero h2').innerText(),/Förbered Tal inför restprovet/);
      assert.equal(await page.locator('.hero .btn').count(),1);
      assert.equal(await page.locator('.fold').count()>=1,true);
      const width=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
      assert(width[0]<=width[1]+2,'Home horizontal overflow: '+width);
      cases+=4;
      await page.screenshot({path:OUT+'/'+name+'-home.png',fullPage:true});
      await page.click('.hero [data-h="#/rest/rest-s9-tal"]');
      await page.waitForSelector('text=Matte Direkt 9');
      for(const id of ['s9-scientific','s9-sci-calc','s9-prefix','s9-sqrt','s9-number-sets']){
        assert.equal(await page.locator('a[href="#/l/'+id+'/0"]').count(),1,'Missing book link '+id);
        cases++;
      }
      await page.screenshot({path:OUT+'/'+name+'-book.png',fullPage:true});
      await page.click('a[href="#/l/s9-sqrt/0"]');
      assert.match(await page.locator('.focus h1').innerText(),/Kvadrat och kvadratrot/);cases++;
      await page.click('[data-h="#/l/s9-sqrt/1"]');
      for(let i=0;i<8 && await page.locator('[data-a=reveal]').count();i++)await page.click('[data-a=reveal]');
      // Lektionen kan öppnas direkt från en sparad position, även utan exemplens animation.
      await page.goto(BASE+'#/l/s9-sqrt/2');
      await page.waitForSelector('#ans');
      assert.equal(await page.locator('[data-a=gsr]').count(),0,'Guided step has redundant clicks');
      assert.match(await page.locator('.gsr').first().innerText(),/Vet/);
      assert.match(await page.locator('.gsr').first().innerText(),/Söker/);
      cases+=3;
      await page.fill('#ans','14');
      await page.click('form[data-form=answer] button[type=submit]');
      assert.equal(await page.locator('.box.good').count()>0,true,'Correct 14 was not accepted');cases++;
      await page.screenshot({path:OUT+'/'+name+'-guided.png',fullPage:true});
      await page.goto(BASE+'#/k/s9-tal');
      await page.waitForSelector('h1');
      assert.equal(await page.locator('text=Något gick fel').count(),0,'Chapter route renders an error');
      assert.match(await page.locator('h1').first().innerText(),/Tal/);
      cases+=2;
      await page.goto(BASE+'#/formler');
      await page.click('[data-a=fch][data-ch=s9-tal]');
      await page.click('[data-a=ftoggle][data-sid=s9-sqrt]');
      assert.match(await page.locator('#f-s9-sqrt .fbody').innerText(),/icke-negativa/);
      cases++;
      await page.goto(BASE+'#/trana');
      assert.equal(await page.locator('text=Rekommenderat nu').count()>0,true);
      cases++;
      assert.deepEqual(errors,[],name+': runtime errors');
      await page.goto(BASE+'prov/?g=grade9&ch=s9-tal');
      assert.match(await page.title(),/Matte Prov/);cases++;
      console.log(name+': book, home, lesson, guidance, chapter, formulas, train and prov PASS');
      await context.close();
    }
    console.log('Visual mobile-emulation tests: '+cases+'/'+cases+' PASS');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
