/* Matte OS · Joker without account: real reading workshop, two simulated phones.
 * No permanent guest stats, school progress, or Study Cloud capture. */
'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/$/,'');
const which=process.argv[3]==='webkit'?'webkit':'chromium';
(async()=>{
 const browser=await (which==='webkit'?webkit:chromium).launch({headless:true});let n=0;
 try{
  const a=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const b=await browser.newContext({viewport:{width:360,height:780},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const one=await a.newPage(),two=await b.newPage();
  const errors=[];for(const p of [one,two]){p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(18000);}
  await one.goto(BASE+'/lara/',{waitUntil:'load'});
  const id=await one.evaluate(()=>window.MO_WORKSHOP._test.BANK.find(t=>t.lang==='sv'&&t.tasks[0]?.type==='choice')?.id);
  assert.ok(id,'Authored Swedish reading with a choice question');n++;
  await one.goto(BASE+'/lara/#/verkstad/sv/'+id,{waitUntil:'load'});
  const link=await one.locator('[data-w=share][data-link*="guest=1"]').getAttribute('data-link');
  assert.ok(link&&link.includes('?guest=1#/verkstad/sv/'+id));n++;
  await Promise.all([one.goto(link,{waitUntil:'load'}),two.goto(link,{waitUntil:'load'})]);
  for(const p of [one,two]){
    await p.locator('[data-w=start-tasks]').waitFor();
    const data=await p.evaluate(()=>window.MO_WORKSHOP._debug().ui);
    assert.equal(data.mode,'guest');n++;
    assert.equal(data.view,'read');n++;
    await p.evaluate(()=>{window.__guestCaptures=0;if(window.MO_STUDY)window.MO_STUDY.capture=()=>{window.__guestCaptures++};});
  }
  const before=await one.evaluate(()=>({
    maths:localStorage.getItem('matteos.v5'),
    language:localStorage.getItem('matteos.larande.v1'),
    workshop:localStorage.getItem('matteos.sprak.v3'),
    guests:localStorage.getItem('matteos.guests.v1')
  }));
  await Promise.all([one.locator('[data-w=start-tasks]').click(),two.locator('[data-w=start-tasks]').click()]);
  const options1=await one.locator('[data-w=pick]').allInnerTexts(),options2=await two.locator('[data-w=pick]').allInnerTexts();
  assert.deepEqual(options1,options2,'Exact question/option order on different phones');n++;
  assert.ok(options1.length>=2);n++;
  await one.locator('[data-w=pick]').first().click();
  await one.locator('[data-w=check]').click();
  assert.equal((await one.evaluate(()=>window.MO_WORKSHOP._debug().ui)).checked,true);n++;
  assert.equal(await one.evaluate(()=>window.__guestCaptures),0,'Never capture guest answers to Study Cloud');n++;
  const after=await one.evaluate(()=>({
    maths:localStorage.getItem('matteos.v5'),
    language:localStorage.getItem('matteos.larande.v1'),
    workshop:localStorage.getItem('matteos.sprak.v3'),
    guests:localStorage.getItem('matteos.guests.v1')
  }));
  assert.deepEqual(after,before,'Guest play must not touch any academic or permanent guest storage');n++;
  assert.deepEqual(errors,[],'No browser runtime errors');n++;
  console.log('GUEST READING '+which+': '+n+'/'+n+' PASS — 2 phones, deterministic challenge, zero saved answers, no cloud capture');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
