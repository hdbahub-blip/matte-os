'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const BASE=process.argv[2]||'http://127.0.0.1:8765/';
const UUID='55550000-0000-4000-8000-000000000069';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'sv-SE',serviceWorkers:'block'});
 await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* mock Supabase; injected before navigation */'}));
 await ctx.addInitScript(({UUID})=>{
  localStorage.setItem('matteos-study-auth-v1','synthetic-presence');
  const profile={user_id:UUID,role:'learner',grade:'grade9',display_name:'Syntetisk elev'};
  const session={user:{id:UUID}};
  const db={
   auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
     async getSession(){return {data:{session},error:null}},
     async signOut(){return {error:null}}},
   from(table){
    return {select(){return this},eq(){return this},async maybeSingle(){return {data:table==='study_profiles'?profile:null,error:null}},
      async upsert(){return {error:null}}};
   }
  };
  window.supabase={createClient(){return db}};
 },{UUID});
 let checks=0;const ok=(v,m)=>{assert(v,m);checks++};
 try{
  const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(BASE,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.MO_STUDY?.profile?.()?.grade==='grade9',{timeout:12000});
  await p.waitForTimeout(500);
  const g=await p.evaluate(()=>({grade:window.MO_STUDY.profile().grade,active:window.MOEngine.state().active,status:window.MO_STUDY.info().status,head:document.querySelector('.top-in')?.innerText||''}));
  ok(g.grade==='grade9','Cloud grade is 9');
  ok(g.head.includes('Mitt konto'),'Math header shows own account not profile chooser: '+JSON.stringify(g));
  ok(await p.locator('.top-in [data-a=profile]').count()===0,'No switch button in math');
  const card=await p.locator('.ux-landing').first().count();
  ok(card===1,'Landing available');
  ok(await p.locator('.ux-tile').count()===4,'Four topic tiles');
  await p.goto(new URL('lara/',BASE).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.MO_STUDY?.profile?.()?.grade==='grade9',{timeout:12000});
  await p.waitForTimeout(350);
  const l=await p.evaluate(()=>({grade:window.MOL_ACTIVE?.(),header:document.querySelector('.sitehead')?.innerText||''}));
  ok(l.grade==='grade9','Learning uses signed-in grade 9');
  ok(l.header.includes('Mitt konto'),'Learning header uses account rather than grade switch');
  ok(await p.locator('.sitehead [data-a=profile]').count()===0,'Learning profile chooser removed from authenticated learner');
  ok(errors.length===0,'No browser runtime exceptions: '+errors.join('|'));
  console.log('AUTH LEARNER NAVIGATION '+checks+'/'+checks+' PASS');
 }finally{await ctx.close();await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
