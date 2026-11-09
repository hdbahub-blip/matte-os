'use strict';
const assert=require('assert').strict;
const {chromium}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
(async()=>{
  const browser=await chromium.launch({headless:true});
  let checks=0;
  try {
    for (const grade of ['grade8','grade9']) {
      const context=await browser.newContext({viewport:{width:320,height:700}});
      const page=await context.newPage();
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.locator('[data-a="pickprofile"][data-p="'+grade+'"]').click();
      await page.locator('nav.nav').waitFor();
      await page.locator('html[data-theme="'+(grade==='grade8'?'navy':'burgundy')+'"]').waitFor({timeout:12000});
      assert.equal(await page.locator('nav.nav button,nav.nav a').count(),5);checks++;
      assert.equal(await page.locator('html').getAttribute('data-theme'),grade==='grade8'?'navy':'burgundy');checks++;
      if(grade==='grade8'){
        assert.equal((await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--acc2').trim())),'#6F579F');checks++;
      }
      await page.locator('[data-a="appearance"]').first().click();
      await page.locator('html[data-mode="dark"]').waitFor({timeout:12000});
      assert.equal(await page.locator('html').getAttribute('data-mode'),'dark');checks++;
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks++;
      await page.locator('nav.nav a[href="lara/"]').click();
      await page.locator('nav.bottom').waitFor();
      await page.locator('html[data-mode="dark"][data-profile="'+grade+'"]').waitFor({timeout:12000});
      assert.equal(await page.locator('html').getAttribute('data-mode'),'dark');checks++;
      assert.equal(await page.locator('html').getAttribute('data-profile'),grade);checks++;
      const cols=await page.locator('nav.bottom').evaluate(x=>getComputedStyle(x).gridTemplateColumns.split(' ').filter(Boolean).length);
      assert.equal(cols,5);checks++;
      await page.goto(base+'lara/#/sv',{waitUntil:'domcontentloaded'});
      await page.locator('nav.bottom a[href="#/sv"][aria-current="page"]').waitFor();checks++;
      await page.goto(base+'lara/#/verkstad/sv/buss',{waitUntil:'domcontentloaded'});
      await page.locator('nav.bottom a[href="#/sv"][aria-current="page"]').waitFor();checks++;
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks++;
      await page.locator('nav.bottom a[href="../"]').click();
      await page.locator('nav.nav').waitFor();
      await page.locator('html[data-mode="dark"]').waitFor({timeout:12000});
      assert.equal(await page.locator('html').getAttribute('data-mode'),'dark');checks++;
      await page.goto(base+'prov/',{waitUntil:'domcontentloaded'});
      await page.locator('[data-mode-toggle]').waitFor();
      await page.locator('html[data-mode="dark"]').waitFor({timeout:12000});
      assert.equal(await page.locator('html').getAttribute('data-mode'),'dark');checks++;
      await page.locator('[data-mode-toggle]').click();
      await page.locator('html[data-mode="light"]').waitFor({timeout:12000});
      assert.equal(await page.locator('html').getAttribute('data-mode'),'light');checks++;
      await context.close();
    }
    console.log('FULLSPEC responsive, cross-app and mode navigation: '+checks+'/'+checks+' PASS');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
