'use strict';
// Two real browser tabs, fake Auth/DB. Reproduces same-origin storage changes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const URL=process.argv[2]||'http://127.0.0.1:8765/';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* mock supabase */'}));
 const pages=[];
 try{
  for(const id of [A,B]){
   const page=await context.newPage();
   await page.addInitScript(({id})=>{
    localStorage.setItem('matteos-study-auth-v1','synthetic-e2e');
    const p={user_id:id,role:'learner',grade:'grade8',display_name:'Synthetic'};
    const session={user:{id}};
    const client={auth:{
      onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
      async getSession(){return {data:{session},error:null}},
      async signOut(){return {error:null}}
     },from(table){return {
      select(){return this},eq(){return this},order(){return this},
      async maybeSingle(){return {data:table==='study_profiles'?p:null,error:null}},
      async upsert(){return {error:null}}
     }}};
    window.supabase={createClient(){return client}};
   },{id});
   pages.push(page);
  }
  let checks=0;
  const ok=(condition,label)=>{assert(condition,label);checks++};
  await pages[0].goto(URL);
  await pages[0].waitForFunction((id)=>window.MO_STUDY?.profile?.()?.user_id===id&&localStorage.getItem('matteos.study.workspace-owner.v1')===id,A,{timeout:15000});
  ok(await pages[0].evaluate(()=>window.MO_STUDY.canWriteLocal()),'A can own local study state');
  await pages[1].goto(URL);
  await pages[1].waitForFunction((id)=>window.MO_STUDY?.profile?.()?.user_id===id&&localStorage.getItem('matteos.study.workspace-owner.v1')===id,B,{timeout:15000});
  ok(await pages[1].evaluate(()=>window.MO_STUDY.canWriteLocal()),'B can own separate local state');
  await pages[0].waitForFunction(()=>window.MO_STUDY?.info?.()?.status==='workspace-changed',{timeout:10000});
  ok(!(await pages[0].evaluate(()=>window.MO_STUDY.canWriteLocal())),'Old A tab can no longer write');
  ok(await pages[0].locator('h1').first().innerText()==='Vi behöver bekräfta ditt konto','Old tab shows safe recovery message');
  const result=await pages[0].evaluate(async()=>{
   try{await window.MO_STUDY.signOut();return 'unexpected success';}
   catch(e){return e.message}
  });
  ok(/Kan inte bevara väntande svar/.test(result),'Stale tab cannot sign out newer owner or erase local content');
  const owner=await pages[1].evaluate(()=>localStorage.getItem('matteos.study.workspace-owner.v1'));
  ok(owner===B,'B owner marker remains after old-tab signout attempt');
  ok(await pages[1].evaluate(()=>window.MO_STUDY.capture({grade:'grade8',module:'reading',question_id:'b:1',answer:'B response'})),'B may queue private study data');
  ok(!(await pages[0].evaluate(()=>window.MO_STUDY.capture({grade:'grade8',module:'reading',question_id:'a:1',answer:'A should not write'}))),'A cannot queue stale private data');
  console.log('CROSS-TAB WORKSPACE SECURITY '+checks+'/'+checks+' PASS');
 }finally{for(const p of pages)await p.close().catch(()=>{});await context.close();await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
