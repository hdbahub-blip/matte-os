'use strict';
// Full HTTP smoke check of the integrated /lara/ language workshop on mobile.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/$/,'')+'/lara/';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',err=>errors.push(String(err)));
 const click=async sel=>{await page.locator(sel).first().click();};
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.homegrid').waitFor();
  await click('a[href="#/sv"]');await page.locator('.wk-book').first().waitFor();
  assert.equal(await page.locator('.wk-book').count(),4);
  await click('a[href="#/verkstad/sv/skarmbild/2"]');await page.locator('.wk-reading').waitFor();
  assert.equal(await page.locator('.wk-reading p').count(),1);
  for(let i=0;i<2;i++)await click('[data-w="next-paragraph"]');
  await click('[data-w="next-stage"]');
  for(let i=0;i<4;i++){
   await page.locator('input[name="wk-answer"][value="0"]').check();
   assert(!(await page.locator('[data-w="check-question"]').isDisabled()));
   await click('[data-w="check-question"]');await page.locator('.wk-feedback').waitFor();
   await click('[data-w="next-question"]');
  }
  for(let i=0;i<3;i++){await click('[data-w="reveal-word"]');await click('[data-w="next-word"]');}
  for(const term of ['slutsats','hyllning','misstänka']){
   await page.locator('#wk-input').fill(term);
   assert(!(await page.locator('[data-w="check-blank"]').isDisabled()));
   await click('[data-w="check-blank"]');await click('[data-w="next-blank"]');
  }
  await click('[data-w="reveal-retell"]');await click('[data-w="next-stage"]');
  for(let i=0;i<4;i++){
   await page.locator('input[name="wk-partner-a"][value="0"]').check();
   await page.locator('input[name="wk-partner-b"][value="1"]').check();
   assert(!(await page.locator('[data-w="partner-reveal"]').isDisabled()));
   await click('[data-w="partner-reveal"]');await click('[data-w="partner-next"]');
  }
  await click('[data-w="finish"]');
  assert((await page.locator('main').innerText()).includes('Ni har tränat på flera sätt'));
  assert(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('matteos.sprak.v2')).profiles.grade9.done['sv:skarmbild:2']));
  await click('[data-a="profile"]');await click('[data-a="choose-profile"][data-p="grade8"]');
  assert(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('matteos.sprak.v2')).profiles.grade8.done).length===0));
  assert((await page.locator('main').innerText()).includes('Läs eller lyssna'),'profile switch resets workshop to reading step');
  await click('a[href="#/en"]');await page.locator('.wk-book').first().waitFor();
  assert.equal(await page.locator('.wk-book').count(),4);
  await click('a[href="#/verkstad/en/screenshot/3"]');await page.locator('.wk-reading').waitFor();
  assert((await page.locator('h1').innerText()).includes('class chat'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  // Same daily challenge and lesson text independent of the selected grade.
  await click('a[href="#/en"]');
  const feature8=await page.locator('.wk-feature a').getAttribute('href');
  await click('[data-a="profile"]');await click('[data-a="choose-profile"][data-p="grade9"]');
  const feature9=await page.locator('.wk-feature a').getAttribute('href');
  assert.equal(feature8,feature9);
  assert.equal(errors.length,0,'JavaScript errors: '+errors.join(';'));
  console.log('Language workshop HTTP mobile E2E PASS: reading, 4 questions, 3 words, 3 typed blanks, retell, partner duel, separate progress, English, same daily link, no overflow');
 }finally{await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
