/* Production-shaped mobile Chromium regression for new language workshop, no real student data. */
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const site=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(site+'lara/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>{localStorage.setItem('matteos.v5',JSON.stringify({v:5,active:'grade9',profiles:{grade8:{name:'',attempts:[],lessons:{},rests:{},tests:[]},grade9:{name:'',attempts:[],lessons:{},rests:{},tests:[]}}}));});
 await page.reload();
 assert.match(await page.locator('h1').first().innerText(),/Vad vill du förstå idag/);
 await page.locator('a[href="#/sv"]').first().click();
 await page.locator('.wk-book').first().waitFor();
 assert.ok(await page.locator('.wk-book').count()>=9,'9 Swedish story themes incl. originals');
 const orig=page.locator('a[href="#/verkstad/sv/original4/3"]');assert.equal(await orig.count(),1,'full original story visible');
 await orig.click();await page.locator('.wk-reading').waitFor();
 assert.match(await page.locator('.wk-reading').innerText(),/Jessica/);
 await page.locator('[data-w="toggle-all"]').click();await page.locator('[data-w="next-stage"]').click();
 assert.equal(await page.locator('[data-w="check-question"]').isDisabled(),true);
 await page.locator('input[name="wk-answer"]').first().check();assert.equal(await page.locator('[data-w="check-question"]').isEnabled(),true);
 await page.locator('[data-w="check-question"]').click();assert.equal(await page.locator('.wk-feedback blockquote').count(),1);
 for(let i=0;i<3;i++){await page.locator('[data-w="next-question"]').click();if(i<2){await page.locator('input[name="wk-answer"]').first().check();await page.locator('[data-w="check-question"]').click();}}
 for(let i=0;i<3;i++){await page.locator('[data-w="reveal-word"]').click();await page.locator('[data-w="next-word"]').click();}
 await page.locator('#wk-input').fill('misstänksam');assert.equal(await page.locator('[data-w="check-blank"]').isEnabled(),true);await page.locator('[data-w="check-blank"]').click();
 for(let i=0;i<3;i++){await page.locator('[data-w="next-blank"]').click();if(i<2){await page.locator('#wk-input').fill('test');await page.locator('[data-w="check-blank"]').click();}}
 await page.locator('[data-w="reveal-retell"]').click();await page.locator('[data-w="next-stage"]').click();
 assert.equal(await page.locator('.wk-original-questions ol').first().locator('li').count(),10,'10 original questions');
 await page.locator('input[name="wk-partner-a"]').first().check();await page.locator('input[name="wk-partner-b"]').first().check();
 await page.locator('[data-w="partner-reveal"]').click();await page.locator('[data-w="finish"]').click();
 assert.match(await page.locator('h1').last().innerText(),/Ni har tränat/);
 const p9=await page.evaluate(()=>JSON.parse(localStorage.getItem('matteos.sprak.v2')).profiles.grade9.done);assert.ok(Object.keys(p9).length>=1);
 const math=await page.evaluate(()=>JSON.parse(localStorage.getItem('matteos.v5')));assert.equal(math.profiles.grade9.attempts.length,0);
 await page.locator('[data-a="profile"]').click();await page.locator('[data-p="grade8"]').click();
 await page.locator('a[href="#/sv"]').first().click();await page.locator('a[href="#/verkstad/sv/original4/3"]').click();await page.locator('.wk-reading').waitFor();
 assert.equal(await page.locator('.wk-steps .active').count(),1);
 const a=await page.locator('.wk-reading').innerText();await page.locator('[data-a="profile"]').click();await page.locator('[data-p="grade9"]').click();assert.equal(await page.locator('.wk-reading').innerText(),a);
 const sizes=await page.evaluate(()=>({w:document.documentElement.scrollWidth,v:innerWidth}));assert.ok(sizes.w<=sizes.v+1,JSON.stringify(sizes));
 assert.deepEqual(errors,[]);
 await browser.close();console.log('LANGUAGE WORKSHOP LIVE E2E PASS: originals, questions, cloze, retell, paired mode, separate profiles and mobile.');
})().catch(e=>{console.error(e);process.exit(1)});
