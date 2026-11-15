/* Matte OS premium profile chooser: real browser mobile QA, no real student data. */
'use strict';
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const BASE = (process.argv[2] || 'http://127.0.0.1:8765/').replace(/\/$/, '');
const engine = process.argv[3] === 'webkit' ? 'webkit' : 'chromium';
(async () => {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({headless:true});
  let assertions = 0;
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page = await context.newPage();
    page.setDefaultTimeout(16000);
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+'/',{waitUntil:'load'});
    await page.locator('.pc-onboarding #pc-title').waitFor();
    assert.match(await page.locator('#pc-title').innerText(),/Vem pluggar/); assertions++;
    assert.equal(await page.locator('.pc-onboarding .pc-card').count(),6); assertions++;
    assert.equal(await page.locator('.pc-onboarding .pc-grade').count(),2); assertions++;
    assert.equal(await page.locator('.pc-onboarding .pc-guest').count(),3); assertions++;
    assert.equal(await page.locator('.pc-onboarding .pc-parent').count(),1); assertions++;
    assert.equal(await page.locator('nav.nav').count(),0); assertions++;
    await page.locator('.pc-grade9').click();
    await page.locator('nav.nav').waitFor();
    const gradeInitial = await page.evaluate(()=>window.MOEngine.state().active);
    assert.equal(gradeInitial,'grade9'); assertions++;
    await page.evaluate(()=>{
      const s=window.MOEngine.state();
      s.profiles.grade8.rests.pcSentinel='grade8-persist';
      s.profiles.grade9.rests.pcSentinel='grade9-persist';
      window.MOEngine.save();
      localStorage.setItem('matteos.larande.v1','{"pcSentinel":"learning-preserved"}');
    });
    const preserved = await page.evaluate(()=>({
      math:localStorage.getItem('matteos.v5'),
      learning:localStorage.getItem('matteos.larande.v1')
    }));
    await page.locator('.top-in [data-a="profile"]').click();
    const dialog=page.locator('.pc-sheet[role="dialog"][aria-modal="true"]');
    await dialog.waitFor(); assertions++;
    assert.equal(await dialog.locator('.pc-card').count(),6); assertions++;
    assert.equal(await dialog.locator('.pc-grade9[aria-current="true"]').count(),1); assertions++;
    assert.equal(await dialog.locator('.pc-guest').count(),3); assertions++;
    assert.equal(await dialog.locator('.pc-parent').count(),1); assertions++;
    await dialog.locator('[data-a="profilemanage"]').click();
    assert.match(await dialog.locator('h2').innerText(),/Hantera profiler/); assertions++;
    await dialog.locator('#pc-name-grade9').fill('Geometrimästaren');
    await dialog.locator('[data-a="profilenamesave"][data-p="grade9"]').click();
    assert.equal((await page.evaluate(()=>window.MOEngine.prof('grade9').name)),'Geometrimästaren'); assertions++;
    await dialog.locator('[data-a="profileback"]').click();
    assert.match(await dialog.locator('.pc-grade9').innerText(),/Geometrimästaren/); assertions++;
    const jokerHref=await dialog.locator('.pc-guest').first().getAttribute('href');
    const jokerId=new URL(jokerHref,BASE+'/').searchParams.get('guest');
    await dialog.locator('.pc-guest').first().click();
    await page.waitForURL(/tillsammans\/\?guest=/);
    assert.match(await page.locator('main').innerText(),/Vald Joker:/); assertions++;
    assert.equal(await page.evaluate(()=>window.MOTogether.load().activeGuestId),jokerId); assertions++;
    const stateAfterJoker=await page.evaluate(()=>({
      math:JSON.parse(localStorage.getItem('matteos.v5')),
      learning:localStorage.getItem('matteos.larande.v1')
    }));
    assert.equal(stateAfterJoker.math.profiles.grade8.rests.pcSentinel,'grade8-persist'); assertions++;
    assert.equal(stateAfterJoker.math.profiles.grade9.rests.pcSentinel,'grade9-persist'); assertions++;
    assert.equal(stateAfterJoker.learning,preserved.learning); assertions++;
    assert.equal(stateAfterJoker.math.active,'grade9'); assertions++;
    await page.locator('header a.logo').click();
    await page.locator('nav.nav').waitFor();
    await page.locator('.top-in [data-a=profile]').click();
    await page.locator('.pc-sheet [data-a=profilenew]').click();
    await page.waitForURL(/tillsammans\/\?guest=.*&edit=1/);
    assert.match(await page.locator('h1').innerText(),/Jokrarna/); assertions++;
    await page.locator('#guest-name').fill('Nova');
    await page.locator('button[data-action="save-guest"]').click();
    assert.match(await page.locator('main').innerText(),/Nova/); assertions++;
    await page.locator('header a.logo').click();
    await page.locator('.top-in [data-a=profile]').click();
    assert.equal(await page.locator('.pc-sheet .pc-guest').count(),4); assertions++;
    assert.match(await page.locator('.pc-sheet .pc-grid').innerText(),/Nova/); assertions++;
    await page.locator('.pc-sheet .pc-close').click();
    assert.equal(await page.locator('.pc-sheet').count(),0); assertions++;
    await page.locator('.top-in [data-a=profile]').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.pc-sheet').count(),0); assertions++;
    await page.locator('.top-in [data-a=profile]').click();
    const sizes=await page.evaluate(()=>({
      screen:document.documentElement.clientWidth,
      document:document.documentElement.scrollWidth,
      grid:document.querySelector('.pc-sheet .pc-grid').getBoundingClientRect().width,
      card:document.querySelector('.pc-sheet .pc-card').getBoundingClientRect().width
    }));
    assert.ok(sizes.document<=sizes.screen+2,'No horizontal scroll at 390px: '+JSON.stringify(sizes)); assertions++;
    assert.ok(sizes.card>=120,'Clickable profile tiles >=120 CSS px'); assertions++;
    await page.locator('.pc-sheet .pc-parent').click();
    await page.waitForURL(/\/foralder\//);
    assert.ok(page.url().includes('/foralder/')); assertions++;
    assert.deepEqual(errors,[],'Browser JavaScript errors'); assertions++;
    await context.close();
    const narrow=await browser.newContext({viewport:{width:320,height:640},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const p2=await narrow.newPage();p2.setDefaultTimeout(16000);
    await p2.goto(BASE+'/',{waitUntil:'load'});
    await p2.locator('.pc-onboarding .pc-grid').waitFor();
    const widths=await p2.evaluate(()=>({
      client:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth,
      grid:document.querySelector('.pc-grid').getBoundingClientRect().width
    }));
    assert.ok(widths.scroll<=widths.client+2,'No horizontal scroll at 320px: '+JSON.stringify(widths)); assertions++;
    assert.equal(await p2.locator('.pc-onboarding .pc-card').count(),6); assertions++;
    await narrow.close();
    console.log('NETFLIX PROFILE PICKER '+engine+': '+assertions+'/'+assertions+' PASS (grades, Joker deep link, rename, add guest, parent, mobile 320/390, school isolation)');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
