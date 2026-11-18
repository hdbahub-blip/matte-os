'use strict';
// Cached session regression: when the SDK CDN is unavailable, the exact owner
// may continue offline, but a different session must never inherit local data.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765/';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
(async()=>{
 const browser=await chromium.launch({headless:true});let n=0;
 const ok=(v,msg)=>{assert(v,msg);n++};
 try{
  for(const [user,shouldWork] of [[A,true],[B,false]]){
   const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   await ctx.route('https://cdn.jsdelivr.net/**',r=>r.abort('failed'));
   await ctx.addInitScript(({user,A})=>{
    localStorage.setItem('matteos-study-auth-v1',JSON.stringify({user:{id:user},access_token:'fake'}));
    localStorage.setItem('matteos.study.identity.v1',JSON.stringify({user_id:A,grade:'grade9',role:'learner',display_name:'Offline test'}));
    localStorage.setItem('matteos.study.workspace-owner.v1',A);
   },{user,A});
   const p=await ctx.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base,{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.MO_STUDY?.info?.()?.status==='no-sdk',{timeout:12000});
   if(shouldWork){
    ok(await p.evaluate(()=>window.MO_STUDY.canWriteLocal()),'Verified returning learner writes offline');
    ok(await p.evaluate(()=>window.MO_STUDY.offlineProfile()?.grade==='grade9'),'Offline fallback uses exact cached grade9 owner');
    ok(await p.locator('h1').first().count()===1,'Offline home is visible');
    ok(await p.locator('[data-a=profile]').count()===0,'Authenticated offline pupil never receives grade switch');
    ok(await p.evaluate(()=>window.MO_STUDY.capture({grade:'grade9',module:'reading',question_id:'offline-q',answer:'offline attempt'})),'Offline capture queues pending answer');
    await p.goto(new URL('lara/',base).href,{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>window.MO_STUDY?.info?.()?.status==='no-sdk',{timeout:12000});
    ok(await p.evaluate(()=>window.MOL_ACTIVE?.()==='grade9'),'Language uses same account grade while offline');
    ok(await p.locator('.sitehead [data-a=profile]').count()===0,'Language hides grade switching offline');
   }else{
    const allowed=await p.evaluate(()=>window.MO_STUDY.canWriteLocal());
    ok(!allowed,'Unmatched account cannot write to previous owner progress');
    ok(await p.evaluate(()=>window.MO_STUDY.offlineProfile())===null,'Wrong user denied cached offline identity');
    ok((await p.locator('h1').first().innerText()).includes('Öppnar din studieprofil'),'Wrong user only sees neutral account-check screen');
   }
   ok(errors.length===0,'No uncaught browser error '+errors.join('|'));
   await ctx.close();
  }
  {
   const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   await ctx.addInitScript(({A})=>{
    localStorage.setItem('matteos.study.identity.v1',JSON.stringify({user_id:A,role:'learner',grade:'grade9'}));
    localStorage.setItem('matteos.study.workspace-owner.v1',A);
    localStorage.setItem('matteos.v5',JSON.stringify({v:5,active:'grade9',profiles:{grade9:{name:'Previously signed in'}}}));
   },{A});
   const p=await ctx.newPage();await p.goto(base,{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>Boolean(window.MO_STUDY?.info?.()),{timeout:10000});
   ok(await p.evaluate(()=>localStorage.getItem('matteos.study.workspace-owner.v1'))===null,'Signed-out device releases previous owner marker');
   ok(await p.evaluate(()=>localStorage.getItem('matteos.v5')===null),'Signed-out device does not display old learner local data');
   ok(await p.locator('[data-a=pickprofile]').count()>0,'Signed-out page offers anonymous practice instead');
   await ctx.close();
  }
  console.log('OFFLINE ACCOUNT BOUNDARY '+n+'/'+n+' PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
