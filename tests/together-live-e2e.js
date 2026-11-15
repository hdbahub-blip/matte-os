/* Two isolated mobiles against a deterministic mocked transport.
   DB security is tested separately by tests/together-live-backend.js on REAL Postgres. */
'use strict';
const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=process.argv[2]||'http://127.0.0.1:8765/';
const engine=process.argv[3]==='webkit'?'webkit':'chromium';
const hostId='11111111-1111-4111-8111-111111111111',guestId='22222222-2222-4222-8222-222222222222';
let room=null;
const code='aabbccddeeff00112233445566778899';
const rid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const byUser=(uid,fn,p)=>{
 if(fn==='together_live_create'){
  if(uid!==hostId||room)throw Error('invalid state');
  room={id:rid,invite:code,ref:p.p_ref,deck:p.p_deck,host:uid,phase:'lobby',round:0,answers:[{},...p.p_deck.slice(1).map(()=>({}))],members:[{id:uid,name:p.p_alias}],rev:0};
  return {room_id:rid,invite:code,expires_in_minutes:240};
 }
 if(fn==='together_live_join'){
  if(!room||p.p_invite.toLowerCase()!==code||room.phase!=='lobby')return {error:'INVALID_INVITE'};
  if(!room.members.find(m=>m.id===uid))room.members.push({id:uid,name:p.p_alias});room.rev++;
  return {room_id:rid};
 }
 if(!room||p.p_room!==rid||!room.members.some(m=>m.id===uid))throw Error('NOT_FOUND');
 if(fn==='together_live_state'){
  const q=room.deck[room.round],visible=room.phase!=='lobby'&&room.phase!=='answering';
  return {room_id:rid,owner_id:hostId,me:uid,phase:room.phase,round:room.round,total:room.deck.length,
   revision:room.rev,content_ref:room.ref,answer_count:Object.keys(room.answers[room.round]).length,
   my_answered:room.answers[room.round][uid]!==undefined,
   members:room.members.map(m=>({id:m.id,name:m.name,score:room.answers.reduce((n,round,i)=>n+((i<room.round||visible)&&round[m.id]===room.deck[i].correct?1:0),0)})),
   question:visible?q:((({correct,why,...safe})=>safe)(q)),
   answers:visible?Object.entries(room.answers[room.round]).map(([id,choice])=>({id,choice})):[]};
 }
 if(fn==='together_live_start'){
  if(uid!==hostId||room.phase!=='lobby')return false;room.phase='answering';room.rev++;return true;
 }
 if(fn==='together_live_answer'){
  if(room.phase!=='answering'||p.p_round!==room.round)return false;
  const r=room.answers[room.round];if(r[uid]!==undefined)return r[uid]===p.p_choice;
  r[uid]=p.p_choice;room.rev++;if(Object.keys(r).length===room.members.length)room.phase='reveal';
  return true;
 }
 if(fn==='together_live_next'){
  if(uid!==hostId||room.phase!=='reveal'||room.round!==p.p_expected_round)return false;
  if(room.round+1>=room.deck.length)room.phase='done';else{room.round++;room.phase='answering';}
  room.rev++;return true;
 }
 if(fn==='together_live_leave'){
  if(uid===hostId)room=null;else room.members=room.members.filter(m=>m.id!==uid);
  return true;
 }
 throw Error('Unknown '+fn);
};
(async()=>{
 const b=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,args:['--no-sandbox']});
 try{
  async function phone(id,label){
   const context=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',x=>errors.push(x.message));
   await page.exposeFunction('__testRpc',(name,args)=>byUser(id,name,args));
   await page.addInitScript(({uid,alias})=>{
    // No real network, Supabase accounts or DB data in the browser test.
    window.supabase={createClient:()=>({
     auth:{getUser:async()=>({data:{user:{id:uid}},error:null})},
     from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{user_id:uid,display_name:alias,role:'learner'},error:null})})})}),
     rpc:async(name,args)=>({data:await window.__testRpc(name,args),error:null})
    })};
    try{localStorage.setItem('matteos.v5','{\"school\":\"untouched\"}');}catch(_){}
   },{uid:id,alias:label});
   await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.min.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* mocked SDK */'}));
   return {page,context,errors};
  }
  const host=await phone(hostId,'Owner'),guest=await phone(guestId,'Guest');
  const start=new URL('tillsammans/live.html',root).href;
  await host.page.goto(start,{waitUntil:'load'});
  await host.page.locator('[data-action=create]').waitFor();
  await host.page.locator('#live-alias').fill('Joker One');
  await host.page.locator('[data-action=create]').click();
  await host.page.locator('#live-link').waitFor();
  const invite=await host.page.locator('#live-link').inputValue();
  assert.ok(invite.endsWith('#join='+code),'Secret only in URL fragment');
  assert.ok(room.deck.length>=1,'Using real authored exercise source');
  await guest.page.goto(start,{waitUntil:'load'});
  await guest.page.locator('#join-code').fill('0'.repeat(32));
  await guest.page.locator('[data-action=join]').click();
  await guest.page.getByRole('alert').first().waitFor();
  assert.match(await guest.page.locator('main').innerText(),/INVALID_INVITE/,
    'Denied RPC payload should be visible, never open an undefined room');
  await guest.page.goto(invite,{waitUntil:'load'});
  await guest.page.locator('#invited-alias').waitFor();
  assert.equal(new URL(guest.page.url()).hash,'','Immediately clear secret from address bar');
  await guest.page.reload({waitUntil:'load'});
  await guest.page.locator('#invited-alias').waitFor();
  assert.equal(new URL(guest.page.url()).hash,'','Pending invite survives reload only in sessionStorage');
  await guest.page.locator('#invited-alias').fill('Joker Two');
  await guest.page.locator('[data-action=accept-invite]').click();
  await guest.page.getByText('Joker Two').first().waitFor();
  await host.page.locator('[data-action=refresh]').click();
  assert.match(await host.page.locator('main').innerText(),/Joker Two/);
  await host.page.locator('[data-action=start]').click();
  await host.page.locator('.choice').first().waitFor();
  await guest.page.locator('[data-action=refresh]').click();
  await guest.page.locator('.choice').first().waitFor();
  assert.equal(await guest.page.locator('main').getByText('Rätt svar:').count(),0);
  await host.page.locator('.choice').first().click();
  await host.page.locator('[data-action=answer]').click();
  await host.page.getByText('Ditt svar är inskickat').first().waitFor();
  await host.page.reload({waitUntil:'load'});
  await host.page.locator('.live-answer-note').first().waitFor();
  assert.match(await host.page.locator('main').innerText(),/Ditt svar är inskickat/,
    'Host reconnect must retain submitted state while guest has not answered');
  assert.equal(await host.page.locator('[data-action=answer]').count(),0);
  await guest.page.locator('[data-action=refresh]').click();
  assert.equal(await guest.page.locator('main').getByText('Rätt svar:').count(),0,'Hidden until ALL answer');
  await guest.page.locator('.choice').first().click();
  await guest.page.locator('[data-action=answer]').click();
  await guest.page.getByText('Rätt svar:').first().waitFor();
  await host.page.locator('[data-action=refresh]').click();
  assert.match(await host.page.locator('main').innerText(),/Rätt svar:/);
  assert.match(await guest.page.locator('main').innerText(),/Rätt svar:/);
  await host.page.locator('[data-action=next]').click();
  await host.page.getByText('Fråga 2').first().waitFor();
  assert.equal(room.round,1);
  await guest.page.locator('[data-action=refresh]').click();
  assert.match(await guest.page.locator('main').innerText(),/Fråga 2/);
  assert.equal(await guest.page.locator('main').getByText('Rätt svar:').count(),0);
  for(const {page,errors} of [host,guest]){
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=2,'No mobile horizontal overflow '+overflow);
   assert.equal(await page.evaluate(()=>localStorage.getItem('matteos.v5')),'{\"school\":\"untouched\"}');
   assert.deepEqual(errors,[],'No JS page errors');
  }
  await host.context.close();await guest.context.close();
  console.log('Together Live '+engine+' 2 mobile UX: host, invite, join, answer privacy, reveal, next, isolation PASS (mock transport; real SQL separately)');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
