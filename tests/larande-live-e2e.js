'use strict';
/* Real HTTP integration smoke test for the published learning extension.
   Run: node tests/larande-live-e2e.js http://127.0.0.1:8765/ */
const assert = require('node:assert/strict');
const {chromium} = require('playwright');

(async function main() {
  const base = process.argv[2] || 'http://127.0.0.1:8765/';
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:390,height:844},locale:'sv-SE',serviceWorkers:'allow'});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
    if (!localStorage.getItem('matteos.v5')) {
      localStorage.setItem('matteos.v5', JSON.stringify({v:5,active:'grade9',profiles:{
        grade8:{name:'',attempts:[],lessons:{},rests:{},tests:[],tables:{v:1,facts:{},sessions:[]}},
        grade9:{name:'',attempts:[],lessons:{},rests:{},tests:[],tables:{v:1,facts:{},sessions:[]}}
      },settings:{}}));
    }
  });
  const res=await page.goto(base,{waitUntil:'networkidle'});
  assert(res?.ok(),`Matte OS root HTTP ${res?.status()}`);
  const entry=page.locator('a[href="lara/"]');
  await entry.waitFor({state:'visible'});
  assert.match(await entry.innerText(),/Svenska, engelska/);
  await entry.click();
  await page.waitForURL(/\/lara\/($|#)/);
  await page.getByRole('heading',{name:'Vad vill du förstå idag?'}).waitFor();
  assert.equal((await page.locator('a[href="#/sv"]').count())>0,true);
  const firstMath=await page.evaluate(()=>localStorage.getItem('matteos.v5'));
  // The subject entry now opens the full reading workshop; legacy mini-lessons remain under Snabbövningar.
  await page.locator('a[href="#/sv"]').first().click();
  await page.locator('a[href="#/korta/sv"]').click();
  await page.locator('a[href="#/lektion/sv-begrepp"]').click();
  await page.locator('[data-a="go-guided"]').click();
  await page.locator('input[name="answer"][value="1"]').check();
  await page.locator('[data-a="submit-guided"]').click();
  await page.locator('[data-a="go-solo"]').click();
  await page.locator('input[name="answer"][value="0"]').check();
  await page.locator('[data-a="submit-solo"]').click();
  await page.locator('[data-a="go-partner"]').click();
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('matteos.larande.v1')));
  assert.equal(data.profiles.grade9.attempts.length,1);
  assert.equal(data.profiles.grade8.attempts.length,0);
  assert.equal(data.profiles.grade9.attempts[0].ok,true);
  assert.deepEqual(JSON.parse(firstMath).profiles,JSON.parse(await page.evaluate(()=>localStorage.getItem('matteos.v5'))).profiles);
  await page.locator('[data-a="profile"]').click();
  await page.locator('[data-a="choose-profile"][data-p="grade8"]').click();
  data=await page.evaluate(()=>JSON.parse(localStorage.getItem('matteos.larande.v1')));
  assert.equal(data.active,'grade8');
  assert.equal(data.profiles.grade8.attempts.length,0);
  await page.goto(base+'lara/#/duell/sv',{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-a="duel-point"]').count(),0);
  await page.locator('[data-a="reveal-duel"]').click();
  await page.locator('[data-a="duel-point"][data-who="grade8"]').click();
  await page.locator('[data-a="undo-duel"]').click();
  assert.equal((await page.evaluate(()=>window.MOL_DEBUG.getUi().duel.scores.grade8)),0);
  const widths=await page.evaluate(()=>({width:document.documentElement.scrollWidth,screen:innerWidth}));
  assert(widths.width<=widths.screen+1,`Horizontal overflow: ${JSON.stringify(widths)}`);
  assert.deepEqual(errors,[],`Page script errors: ${errors.join('; ')}`);
  const sw=await page.evaluate(async()=>{if(!navigator.serviceWorker)return'unsupported';return(await navigator.serviceWorker.ready).scope;});
  assert(sw.includes('/lara/'),'Learning service worker owns only /lara');
  await context.setOffline(true);
  await page.goto(base+'lara/',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Vad vill du förstå idag?'}).waitFor();
  await context.setOffline(false);
  await browser.close();
  console.log('LÄRANDE LIVE E2E PASS — HTTP root link, lessons, profiles, privacy, duel/undo, mobile, offline');
})().catch(e=>{console.error(e);process.exit(1);});
