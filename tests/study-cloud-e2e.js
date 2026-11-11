'use strict';
const {chromium,webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const base=process.argv[2]||'http://127.0.0.1:8765/';
let checks=0;
const mentor='55550000-0000-4000-8000-000000000001';
const pupil='55550000-0000-4000-8000-000000000002';
async function context(browser,role){
 const ctx=await browser.newContext({...devices['iPhone 13'],locale:'sv-SE',serviceWorkers:'block'});
 await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* Supabase stubbed for synthetic QA */'}));
 await ctx.addInitScript(({role,mentor,pupil})=>{
  const me=role==='mentor'?mentor:pupil;
  const identity={user:{id:me}};
  const profile={user_id:me,role,grade:role==='mentor'?null:'grade8',display_name:role==='mentor'?'Mentor':'Åk 8'};
  const linked=[{learner_id:pupil,mentor_id:mentor,grade:'grade8',linked_at:'2026-11-10T17:00:00Z'}];
  const event={event_id:'55550000-0000-4000-8000-000000000099',learner_id:pupil,grade:'grade8',
   module:'reading',question_id:'sv:buss:tema',question_text:'Varför tvekar Elias?',
   passage_title:'Bussen 07.42',passage_text:'Elias såg sig omkring. Han stannade vid dörren.',
   answer:{value:'Han tvekar eftersom platsen är upptagen.'},
   solution_text:'Han känner sig osäker.',is_correct:null,help_used:false,
   content_version:'1',context:{type:'open'},answered_at:'2026-11-10T16:41:00Z',received_at:'2026-11-10T16:42:00Z'};
  const snap={learner_id:pupil,grade:'grade8',module:'math',device_id:'test',payload:{name:'Elev',attempts:[
    {s:'f8-fractions',t:1762820000000,first:true,ok:true,h:0,sol:false,m:'train'}],lessons:{},tests:[],tables:{facts:{},sessions:[]}},
    updated_at:'2026-11-10T17:00:00Z'};
  const sessions=[],answers=[],practices=[],invites=[];
  const storage={profiles:[profile],links:linked,events:[event],snapshots:[snap],sessions,answers,practices,invites};
  function selectData(name){return name==='study_profiles'?storage.profiles:name==='study_links'?storage.links:
   name==='study_events'?storage.events:name==='study_snapshots'?storage.snapshots:
   name==='study_sessions'?storage.sessions:name==='study_session_answers'?storage.answers:[];}
  function q(table){
   const params={};
   const obj={
    select(){return obj},eq(k,v){params[k]=v;return obj},in(k,v){params[k]=v;return obj},
    order(){return obj},range(){return Promise.resolve({data:results(),error:null})},
    limit(){return Promise.resolve({data:results(),error:null})},
    async maybeSingle(){return {data:results()[0]||null,error:null}},
    single(){return Promise.resolve({data:results()[0]||null,error:null})},
    insert(payload){const data={...payload,id:payload.id||'55550000-0000-4000-8000-000000000072'};
     if(table==='study_sessions')sessions.push(data);
     if(table==='study_session_answers')answers.push(data);
     if(table==='study_mentor_practice')practices.push(data);
     if(table==='study_invites')invites.push(data);
     return {select(){return this},single:async()=>({data,error:null}),
      then(resolve,reject){return Promise.resolve({data,error:null}).then(resolve,reject)}};
    },
    async upsert(){return {error:null}},
    then(resolve,reject){return Promise.resolve({data:results(),error:null}).then(resolve,reject)}
   };
   function results(){let arr=selectData(table);for(const [key,val] of Object.entries(params)){
     if(Array.isArray(val))arr=arr.filter(row=>val.includes(row[key]));
     else arr=arr.filter(row=>row[key]===val);
    }return arr;
   }
   return obj;
  }
  window.supabase={createClient(){return {
   auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:identity}}),
     signOut:async()=>({error:null}),signInWithPassword:async()=>({data:{session:identity},error:null})},
   from:q,
   rpc:async(name,args)=>({data:name==='study_session_progress'?answers.filter(x=>x.session_id===args.p_session).length:true,error:null}),
   channel(){const c={on(){return c},subscribe(){return c}};return c},removeChannel:async()=>({error:null})
  }}};
  window.__studyTest=storage;
 },{role,mentor,pupil});
 return ctx;
}
async function assertVisible(page,locator,label){
 await locator.waitFor({timeout:20000});assert.ok(await locator.isVisible(),label);checks++;
}
(async()=>{
 const browser=await (process.argv[3]==='webkit'?webkit:chromium).launch({headless:true,args:process.argv[3]==='webkit'?[]:['--no-sandbox']});
 try{
  const c=await context(browser,'mentor'),p=await c.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(new URL('study/',base).href);
  await assertVisible(p,p.getByText('Koppla en elev',{exact:false}).first(),'mentor setup');
  await p.locator('[data-action="invite"][data-grade="grade8"]').click();
  await assertVisible(p,p.locator('#invite-code'),'grade8 invite');
  assert.equal((await p.locator('#invite-code').innerText()).length,32);checks++;
  await p.goto(new URL('foralder/',base).href);
  await p.locator('#pin').fill('123456');await p.locator('#pin2').fill('123456');
  await p.locator('form#setup button[type=submit]').click();
  await assertVisible(p,p.getByText('Molnöversikt · synkar automatiskt'),'mentor cloud panel');
  const row=p.locator('#cloud-mentor details').filter({hasText:'Varför tvekar Elias?'}).first();
  await assertVisible(p,row.locator('summary').first(),'linked student event is listed');
  await row.locator('summary').first().click();
  await assertVisible(p,p.getByText('Varför tvekar Elias?'),'submitted real question visible after opening');
  await assertVisible(p,p.getByText('Han tvekar eftersom platsen är upptagen.'),'written answer visible');
  await assertVisible(p,p.getByText('Öppna hela texten:',{exact:false}).first(),'full original text available');
  await p.goto(new URL('studera/',base).href);
  await assertVisible(p,p.getByText('Förstå mer, tillsammans.'),'shared study app');
  await p.locator('[data-action="practice"]').click();
  await assertVisible(p,p.locator('#mentor-practice'),'mentor separate practice');
  const field=p.locator('#practice-answer input[name=answer]');
  if(await field.count())await field.first().check();else await p.locator('#practice-answer textarea[name=answer]').fill('4');
  await p.locator('#practice-answer button[type=submit]').click();
  await assertVisible(p,p.getByText('Din lösning'),'mentor own answer');
  assert.equal(await p.evaluate(()=>window.__studyTest.practices.length),1);checks++;
  assert.equal(errors.length,0,'no JavaScript exceptions: '+errors.join('\n'));checks++;
  await c.close();
  const pupilContext=await context(browser,'learner'),e=await pupilContext.newPage();
  const errorsP=[];e.on('pageerror',x=>errorsP.push(x.message));
  await e.goto(new URL('study/',base).href);
  await assertVisible(e,e.getByText('Dela dina studieresultat',{exact:false}).first(),'linked pupil consent view');
  await e.goto(new URL('studera/',base).href);
  await assertVisible(e,e.getByText('Dina gemensamma studiepass',{exact:false}).first(),'learner view');
  assert.equal(errorsP.length,0,'no student JavaScript exceptions: '+errorsP.join('\n'));checks++;
  await pupilContext.close();
  console.log('STUDY CLOUD browser QA PASS '+checks+'/'+checks+' (mentor link, secure answer history, parent read-only, shared study, separate tutor answers, pupil view, mobile)');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
