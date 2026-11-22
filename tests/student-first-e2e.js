'use strict';
const assert=require('assert'),{chromium}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const exe=process.env.MATTE_BROWSER_EXE;
(async()=>{const browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{})});
let checks=0;
for(const [role,grade,paired,width] of [['learner','grade8',true,390],['learner','grade9',true,320],['learner','grade8',false,390],['mentor','',true,390]]){
const ctx=await browser.newContext({viewport:{width,height:844}}),page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/supabase.min.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:'window.supabase={};'}));
const user='00000000-0000-4000-8000-000000000008';
const linkRows=role==='mentor'?[{learner_id:user,grade:'grade8'},{learner_id:'00000000-0000-4000-8000-000000000009',grade:'grade9'}]:paired?[{learner_id:user,grade:grade}]:[];
const mock='window.MO_STUDY={init:async()=>{},profile:()=>('+JSON.stringify({role,grade,user_id:user,display_name:'Syntetisk profil'})+'),info:()=>({online:true,status:"synced",waiting:0}),links:async()=>('+JSON.stringify(linkRows)+'),syncAll:()=>true,flush:async()=>{},signOut:async()=>{},recover:async()=>({parts:[]}),unlink:async()=>true,issueInvite:async()=>""};';
await page.route('**/study/cloud.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:mock}));
await page.goto(base+'study/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector(role==='mentor'?'.study-main-card':'.study-quick-grid',{timeout:15000});
assert.strictEqual(errors.length,0,errors.join(' | '));checks++;
assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)));checks++;
const visible=await page.locator('body').innerText();
assert.ok(!visible.includes('Synkronisera nu')&&!visible.includes('Uppdatera kopplingar')&&!visible.includes('Koppla min profil'));checks++;
if(role==='mentor'){assert.equal(await page.locator('.study-grade .done').count(),2);checks++;
 assert.ok(visible.includes('Se deras framsteg'));checks++;
 assert.equal(await page.locator('button[data-action="invite"]:visible').count(),0);checks++;}
else {assert.equal(await page.locator('.study-subject').count(),4);checks++;
 assert.ok(visible.includes('Matematik')&&visible.includes('Svenska')&&visible.includes('Engelska')&&visible.includes('Spela'));checks++;
 assert.equal(await page.locator('input[type="checkbox"]:visible').count(),0);checks++;
 await page.locator('.study-advanced>summary').click();
 if(paired){assert.equal(await page.locator('button[data-action="unlink"]').count(),1);checks++;}
 else{assert.equal(await page.locator('button[data-action="unlink"]').count(),0);checks++;}
}
if(process.env.MATTE_SCREENSHOTS)await page.screenshot({path:'audit-student-'+role+'-'+grade+'-'+(paired?'linked':'new')+'.png',fullPage:true});
await ctx.close();
}
await browser.close();console.log('STUDENT FIRST E2E PASS '+checks+'/'+checks);
})().catch(e=>{console.error(e);process.exit(1)});
