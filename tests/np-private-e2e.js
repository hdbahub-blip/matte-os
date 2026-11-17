'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async()=>{
  const base = process.argv[2] || 'http://127.0.0.1:8765/';
  const browser = await chromium.launch({headless:true});
  const content = {
    format:'matte-os-np-private-v1',workId:'en-stark-nolla',grade:'grade9',
    schoolIntro:'Syntetisk inledning för QA.',summary:'Syntetisk sammanfattning för QA.',
    questions:['Syntetisk fråga ett?','Syntetisk fråga två?','Syntetisk fråga tre?','Syntetisk fråga fyra?'],
    discussionQuestion:'Syntetisk gruppdiskussion?',discussionInstruction:'Använd exempel.',
    textParagraphs:Array.from({length:8},(_,i)=>'Syntetiskt stycke '+(i+1)+'.'),
    supports:Array.from({length:5},()=>({steps:['Fundera själv','Motivera'],evidence:'Visa var',perspective:'Annat sätt',stem:'Jag tänker'}))
  };
  for(const width of [390,1280]){
    const context=await browser.newContext({viewport:{width,height:844},acceptDownloads:true});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(new URL('lara/np-muntligt.html',base).toString(),{waitUntil:'load'});
    assert.match(await page.locator('#status').innerText(),/privat(a)? JSON|privat textpaket/i);
    await page.locator('#source').setInputFiles({name:'np-private-fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(content),'utf8')});
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('inläst'));
    assert.equal(await page.locator('#passages .text').count(),8);
    for(const tab of ['read','understand','questions','present','lead','join','practice','review']){
      await page.locator('[data-tab="'+tab+'"]').click();
      assert(await page.locator('#'+tab).isVisible(),tab+' panel visible');
      assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),'no horizontal overflow '+width);
    }
    await page.locator('[data-tab="questions"]').click();
    assert.equal(await page.locator('#qlist article').count(),5);
    await page.locator('#q0').fill('Syntetiskt individuellt svar med motivering');
    await page.reload();
    await page.locator('[data-tab="questions"]').click();
    assert.match(await page.locator('#q0').inputValue(),/Syntetiskt individuellt svar/);
    await page.locator('[data-tab="practice"]').click();
    await page.locator('#start').click();await page.waitForTimeout(1100);
    assert.equal(await page.locator('#clock').innerText(),'05:59');
    await page.locator('#stop').click();
    await page.locator('#theme').click();
    assert(await page.evaluate(()=>document.documentElement.classList.contains('dark')));
    // A visited private NP page must not poison the cached Learning home.
    await page.evaluate(async()=>{await navigator.serviceWorker.ready});
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:12000});
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded'});
    assert.match(await page.locator('h1').innerText(),/En stark nolla/);
    assert.equal(await page.locator('#passages .text').count(),8,'offline NP page retains private local text');
    await page.goto(new URL('lara/',base).toString(),{waitUntil:'domcontentloaded'});
    assert.match(await page.locator('h1').first().innerText(),/Vad vill du lära dig\?/,'offline Learning home retains its own shell');
    await context.setOffline(false);
    assert.deepEqual(errors,[]);
    await context.close();
  }
  await browser.close();
  console.log('PASS private NP browser tests on mobile and desktop');
})().catch(e=>{console.error(e);process.exit(1);});