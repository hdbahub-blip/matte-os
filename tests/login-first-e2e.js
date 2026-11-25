'use strict';
const assert=require('assert'),{chromium}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const exe=process.env.MATTE_BROWSER_EXE;
(async()=>{const browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{})});let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};
for(const width of [320,390,1280]){
 // 1) Not signed in: login first, wrong password gives a calm message, grade cards remain under "utan konto".
 let ctx=await browser.newContext({viewport:{width,height:844}}),p=await ctx.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/study/cloud.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.MO_STUDY={init:async()=>{},profile:()=>null,offlineProfile:()=>null,info:()=>({online:true,status:"signed-out",waiting:0}),needsAccountCheck:()=>false,signIn:async()=>{throw new Error("bad")},links:async()=>[]};'}));
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForSelector('#pc-login',{timeout:15000});
 ok(await p.locator('#pc-email').isVisible(),width+' email visible without scrolling past other content');
 const y=await p.locator('#pc-login').evaluate(e=>e.getBoundingClientRect().top);ok(y<420,width+' login is first block (top='+y+')');
 await p.fill('#pc-email','a@b.se');await p.fill('#pc-pass','x');await p.click('#pc-login button');
 await p.waitForFunction(()=>/stämmer inte/.test(document.getElementById('pc-login-msg').textContent));ok(true,width+' wrong login message');
 ok(await p.locator('.pc-grade').count()===2,width+' local grades remain as fallback');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' no horizontal scroll');
 ok(errs.length===0,errs.join('|'));await ctx.close();
 // 2) Mentor: same grade cards + separate results + read-along entry.
 ctx=await browser.newContext({viewport:{width,height:844}});p=await ctx.newPage();errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/study/cloud.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.MO_STUDY={init:async()=>{},profile:()=>({role:"mentor",user_id:"00000000-0000-4000-8000-000000000001"}),offlineProfile:()=>null,info:()=>({online:true,status:"synced",waiting:0}),needsAccountCheck:()=>false,links:async()=>[]};'}));
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForSelector('.pc-primary-login',{timeout:15000});
 const t=await p.locator('body').innerText();
 ok(await p.locator('.pc-grade').count()===2,width+' mentor sees grade 8 and 9 like students');
 ok(/Se resultat/.test(t)&&/Följ med en elev/.test(t),width+' mentor has separate results + read-along');
 ok(await p.locator('a[href="foralder/"]').count()>=1&&await p.locator('a[href="studera/"]').count()>=1,width+' mentor links');
 ok(errs.length===0,errs.join('|'));await ctx.close();
}
await browser.close();console.log('LOGIN FIRST E2E PASS '+n+'/'+n);})().catch(e=>{console.error(e);process.exit(1)});
