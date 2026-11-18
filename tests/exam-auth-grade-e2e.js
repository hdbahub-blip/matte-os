'use strict';
// Synthetic authenticated pupil cannot change Prov grade via direct link or UI.
// Verifies old cross-account in-progress exams are quarantined, not resumed.
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
const BASE=process.argv[2]||'http://127.0.0.1:8765/';
const OTHER='99999999-9999-4999-8999-999999999999';
let checks=0;
function ok(value,description){assert(value,description);checks++}
(async()=>{
 const browser=await (process.argv[3]==='webkit'?webkit:chromium).launch({headless:true});
 try{
  for(const grade of ['grade8','grade9']){
   const wrong=grade==='grade8'?'grade9':'grade8';
   const user=grade==='grade8'?'88888888-8888-4888-8888-888888888888':'99999999-9999-4999-8999-999999999998';
   const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'sv-SE',serviceWorkers:'block'});
   await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* mock Supabase SDK */'}));
   await ctx.addInitScript(({grade,wrong,user,OTHER})=>{
    const profile={user_id:user,role:'learner',grade,display_name:'Syntetisk elev'};
    const session={user:{id:user}};
    localStorage.setItem('matteos-study-auth-v1',JSON.stringify({user:{id:user},access_token:'synthetic-only'}));
    localStorage.setItem('matteos.study.identity.v1',JSON.stringify(profile));
    localStorage.setItem('matteos.study.workspace-owner.v1',user);
    localStorage.setItem('matte-prov-v1',JSON.stringify({grade:wrong,attempts:[{grade:wrong,chapter:'old-test',id:123}],attemptNo:1}));
    sessionStorage.setItem('matte-prov-v1-active',JSON.stringify({items:[{sid:'legacy'}],index:0,review:false,accountId:OTHER,grade:wrong}));
    const table=()=>({select(){return this},eq(){return this},async maybeSingle(){return {data:profile,error:null}},async upsert(){return {error:null}}});
    window.supabase={createClient(){return {auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},async getSession(){return {data:{session},error:null}},async signOut(){return {error:null}}},from:table}}};
   },{grade,wrong,user,OTHER});
   const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(new URL('prov/?g='+wrong,BASE).href,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(g=>document.documentElement.dataset.examGrade===g,grade,{timeout:15000});
   ok(await page.locator('.top .grade').count()===1,'Authenticated exam has grade indicator');
   ok(await page.locator('.top [data-grade]').count()===0,'Authenticated exam grade switch absent');
   ok(await page.locator('.top .grade[href="../study/"]').count()===1,'Authenticated grade points to own account');
   ok(await page.locator('[data-pick]').count()===0,'Authenticated exam grade cards absent');
   const current=await page.evaluate(()=>JSON.parse(localStorage.getItem('matte-prov-v1')));
   ok(current.grade===grade,'Query parameter cannot reassign authenticated grade');
   ok(current.attempts.length===1&&current.attempts[0].grade===wrong,'Existing old-grade attempt remains preserved, not fabricated into current grade');
   ok(await page.evaluate(()=>sessionStorage.getItem('matte-prov-v1-active'))===null,'Stale in-progress exam not shown to current account');
   ok(await page.evaluate(()=>Object.keys(sessionStorage).some(k=>k.startsWith('matte-prov-v1-active-quarantined.'))),'Stale exam kept as quarantine copy for recovery');
   await page.locator('[data-start=diagnos]').first().click();
   await page.locator('.question-sheet').waitFor();
   const active=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('matte-prov-v1-active')));
   ok(active.grade===grade&&active.accountId===user,'New exam bound to verified account and grade');
   ok(errors.length===0,'No runtime exceptions '+errors.join('|'));
   await ctx.close();
   console.log('AUTH PROV '+grade+' PASS');
  }
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await ctx.newPage();
  await page.goto(new URL('prov/?g=grade8',BASE).href,{waitUntil:'domcontentloaded'});
  await page.locator('.home-head').waitFor();
  ok(await page.locator('html').getAttribute('data-exam-grade')==='grade8','Guest can still choose grade8 through link');
  ok(await page.locator('.top [data-grade]').count()===1,'Guest still has practice-grade selector');
  await ctx.close();
  console.log('PROV ACCOUNT-GRADE REGRESSION '+checks+'/'+checks+' PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
