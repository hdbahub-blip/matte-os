/* Matte OS Together: real Chromium/mobile smoke, isolation and 3-person answers. */
'use strict';
const assert=require('node:assert/strict');
const { chromium, webkit }=require('playwright');
const url=process.argv[2]||'http://127.0.0.1:8765/';
(async()=>{
  const engine=process.argv[3]==='webkit'?'webkit':'chromium';
  const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{headless:true,args:['--no-sandbox']}:{headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(new URL('tillsammans/',url).href,{waitUntil:'load'});
    await page.locator('h1').first().waitFor();
    assert.match(await page.locator('body').innerText(),/En text\. Flera tankar\./);
    assert.equal(await page.locator('.guest').count(),3);
    await page.evaluate(()=>localStorage.setItem('matteos.v5','{"grade8":"must preserve"}'));
    await page.evaluate(()=>localStorage.setItem('matteos.larande.v1','{"grade9":"must preserve"}'));
    await page.locator('button[data-action=guests]').first().click();
    assert.match(await page.locator('main').innerText(),/Joker One/);
    await page.locator('button[data-action=edit]').first().click();
    await page.locator('#guest-name').fill('Wildcard Ace');
    await page.locator('#guest-theme').selectOption('plum');
    await page.locator('#guest-mode').selectOption('dark');
    await page.locator('button[data-action=save-guest]').click();
    assert.match(await page.locator('main').innerText(),/Wildcard Ace/);
    assert.equal(await page.locator('html').getAttribute('data-mode'),'dark');
    await page.locator('button[data-action=home]').first().click();
    await page.locator('button[data-action=setup]').first().click();
    assert.equal(await page.locator('input[data-role=participant]:checked').count(),3);
    await page.locator('select[data-role=topic]').selectOption('sv');
    const chosen=await page.locator('select[data-role=source]').inputValue();
    assert.ok(chosen.startsWith('sv:'));
    await page.locator('button[data-action=start-session]').click();
    assert.match(await page.locator('main').innerText(),/NU ÄR DET DIN TUR/);
    for(let i=0;i<3;i++){
      assert.equal(await page.locator('main').getByText('Rätt svar:').count(),0);
      await page.locator('button[data-action=begin-turn]').click();
      await page.locator('button[data-action=choose]').first().click();
      await page.locator('button[data-action=submit-turn]').click();
    }
    assert.match(await page.locator('main').innerText(),/ALLA HAR SVARAT/);
    assert.match(await page.locator('main').innerText(),/Rätt svar:/);
    await page.locator('button[data-action=next-round]').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('matteos.together.session.v1')));
    assert.equal(saved.round,1);
    await page.reload();
    await page.locator('button[data-action=resume]').click();
    assert.match(await page.locator('main').innerText(),/Fråga 2/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('matteos.v5')),'{"grade8":"must preserve"}');
    assert.equal(await page.evaluate(()=>localStorage.getItem('matteos.larande.v1')),'{"grade9":"must preserve"}');
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('button[data-action=finish-session]').first().click();
    await page.goto(new URL('tillsammans/?text=sv:buss:v1',url).href,{waitUntil:'load'});
    await page.locator('h1').first().waitFor();
    assert.match(await page.locator('main').innerText(),/Bussen 07\.42/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=2,'No horizontal mobile overflow; actual extra '+overflow+'px');
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller,{timeout:15000});
    if(engine==='chromium') {
      await context.setOffline(true);
      await page.reload({waitUntil:'load'});
      assert.match(await page.locator('main').innerText(),/Bussen 07\.42/,'Offline exact reading link must work');
      await context.setOffline(false);
    } else {
      // Playwright WebKit's context-offline reload throws an internal engine error.
      // Check precache here; physical Safari offline navigation remains a RELEASE GATE.
      const hasCachedHtml=await page.evaluate(async()=>!!(await caches.match(new URL('./index.html',location.href).href)));
      assert.ok(hasCachedHtml,'WebKit should precache the exact Together HTML document');
    }
    assert.deepEqual(errors,[],'No page JavaScript errors');
    console.log('Matte OS Together '+engine+' mobile: profiles, themes, 3-person hidden answers, resume, offline cache + school isolation PASS'+(engine==='webkit'?' (physical Safari offline reload unverified)':''));
    await context.close();
  } finally{await browser.close();}
})().catch(err=>{console.error(err);process.exit(1)});
