/* Matte OS: same authored math/table challenges on separate phones with no saved Joker history. */
'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/$/,'');
const engine=process.argv[3]==='webkit'?'webkit':'chromium';
(async()=>{
 const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true});
 let checks=0;
 try{
  const contexts=await Promise.all([0,1].map(()=>browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'})));
  const pages=await Promise.all(contexts.map(c=>c.newPage()));
  const errors=[];pages.forEach(p=>{p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(15000);});
  const url=BASE+'/tillsammans/?dropin=1&topic=table&ref=table%3A7%3Av1';
  await Promise.all(pages.map(p=>p.goto(url,{waitUntil:'load'})));
  for(const p of pages){
   const start=p.locator('[data-action=quick-solo]');
   await start.waitFor();
   assert.match(await p.locator('main').innerText(),/Vald Joker:/);checks++;
   assert.equal(await p.evaluate(()=>window.MOTogether.dropIns().length),1);checks++;
   await start.click();
   await p.locator('.options [data-action=choose]').first().waitFor();
   const session=await p.evaluate(()=>window.MOTogether.restoreSession());
   assert.equal(session?.phase,'answer');checks++;
   assert.equal(session?.members?.length,1);checks++;
   assert.equal(await p.evaluate(()=>localStorage.getItem(window.MOTogether.SESSION_KEY)),null);checks++;
   assert.ok(await p.evaluate(()=>sessionStorage.getItem(window.MOTogether.SESSION_KEY)));checks++;
  }
  const question=await Promise.all(pages.map(async p=>({
    prompt:await p.locator('.question').innerText(),
    answers:await p.locator('.options [data-action=choose]').allInnerTexts()
  })));
  assert.deepEqual(question[0],question[1],'Identical shared question ordering on distinct mobile sessions');checks++;
  await pages[0].locator('.options [data-action=choose]').first().click();
  await pages[0].locator('[data-action=submit-turn]').click();
  assert.equal(await pages[0].evaluate(()=>localStorage.getItem('matteos.v5')),null);checks++;
  assert.equal(await pages[0].evaluate(()=>localStorage.getItem('matteos.guests.v1')===null),false,'Only legacy default permanent profile seeds; not guest answers');checks++;
  assert.equal(await pages[0].evaluate(()=>window.MOTogether.dropIns().length),1);checks++;
  await pages[0].locator('[data-action=finish-session]').click();
  assert.equal(await pages[0].evaluate(()=>window.MOTogether.dropIns().length),0);checks++;
  assert.deepEqual(errors,[]);checks++;
  await Promise.all(contexts.map(c=>c.close()));
  console.log('GUEST CHALLENGE '+engine+': '+checks+'/'+checks+' PASS (2 phones, deterministic 7-times questions, no school/guest answer history)');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
