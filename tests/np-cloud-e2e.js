'use strict';
// Browser integration test with a synthetic Supabase interface and two isolated devices.
// All data stays in the in-memory fixture; NO real student auth, database, or copyrighted text.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765/';
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
const rows=[];
const fixture={format:'matte-os-np-private-v1',workId:'en-stark-nolla',grade:'grade9',
 schoolIntro:'Syntetisk skolinledning',summary:'Syntetisk sammanfattning',
 questions:['Fråga A?','Fråga B?','Fråga C?','Fråga D?'],discussionQuestion:'Öppen diskussionsfråga?',
 discussionInstruction:'Använd exempel.',textParagraphs:Array.from({length:8},(_,i)=>'Syntetisk paragraf '+i),
 supports:Array.from({length:5},()=>({steps:['Vad tänker du?'],evidence:'Ett textbevis',perspective:'Ett motperspektiv',stem:'Jag anser'}))};
function contrast(fg,bg){
 const col=x=>{const n=x.match(/[0-9.]+/g).map(Number).slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*n[0]+.7152*n[1]+.0722*n[2]};
 const a=col(fg),b=col(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
async function attach(page,userId){
 await page.exposeFunction('__npFakeRead',async uid=>rows.filter(r=>r.learner_id===uid).map(r=>structuredClone(r)));
 await page.exposeFunction('__npFakeWrite',async row=>{const i=rows.findIndex(r=>r.learner_id===row.learner_id&&r.module===row.module&&r.device_id===row.device_id);if(i>=0)rows[i]=structuredClone(row);else rows.push(structuredClone(row));return true});
 await page.addInitScript(({uid})=>{
  localStorage.setItem('matteos-study-auth-v1','{"testOnly":true}');
  window.supabase={createClient:()=>({
   auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    getSession:async()=>({data:{session:{user:{id:uid}}}})},
   from:(table)=>{
    const q={
     select(){return this},eq(){return this},order(){return this},
     async maybeSingle(){return {data:table==='study_profiles'?{user_id:uid,role:'learner',grade:'grade9',display_name:'Syntetisk elev'}:null,error:null}},
     async limit(){return {data:table==='study_snapshots'?await window.__npFakeRead(uid):[],error:null}},
     async upsert(payload){await window.__npFakeWrite(payload);return {error:null}}
    };
    return q;
   }
  })};
 },{uid:userId});
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const A=await browser.newContext({viewport:{width:390,height:844}});
  const pa=await A.newPage();await attach(pa,alice);
  const errs=[];pa.on('pageerror',e=>errs.push(String(e)));
  await pa.goto(new URL('lara/np-muntligt.html',base).toString());
  await pa.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('Synkat')||document.querySelector('#cloudStatus').textContent.includes('anslutet'));
  await pa.locator('#source').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
  await pa.waitForFunction(()=>document.querySelector('#passages .text')?.textContent.includes('Syntetisk paragraf 0'));
  await pa.locator('[data-tab="questions"]').click();
  await pa.locator('#q0').fill('Mitt första syntetiska resonemang, med egna skäl.');
  await pa.waitForFunction(async uid=>(await window.__npFakeRead(uid)).some(r=>r.payload?.entries?.q0?.value?.includes('första')),alice,{timeout:12000});
  assert(rows.some(r=>r.learner_id===alice&&r.payload?.source?.workId==='en-stark-nolla'&&r.payload.entries.q0?.value?.includes('första')),'source and notes must upload to owned snapshot');
  const B=await browser.newContext({viewport:{width:1280,height:880}});
  const pb=await B.newPage();await attach(pb,alice);
  await pb.goto(new URL('lara/np-muntligt.html',base).toString());
  await pb.waitForFunction(()=>document.querySelector('#passages .text')?.textContent.includes('Syntetisk paragraf 0'),{timeout:12000});
  await pb.locator('[data-tab="questions"]').click();
  assert.match(await pb.locator('#q0').inputValue(),/Mitt första syntetiska resonemang/,'second device recovers note');
  await pb.locator('#q0').fill('Mitt andra och senare syntetiska svar från datorn.');
  await pb.waitForFunction(async uid=>(await window.__npFakeRead(uid)).some(r=>r.payload?.entries?.q0?.value?.includes('andra och senare')),alice,{timeout:12000});
  await pa.reload();await pa.locator('[data-tab="questions"]').click();
  await pa.waitForFunction(()=>document.querySelector('#q0')?.value.includes('Mitt andra och senare'),null,{timeout:12000});
  assert.match(await pa.locator('#q0').inputValue(),/andra och senare/,'first device receives newer per-field edit');
  const C=await browser.newContext({viewport:{width:390,height:844}});
  const pc=await C.newPage();await attach(pc,bob);
  await pc.goto(new URL('lara/np-muntligt.html',base).toString());
  await pc.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('Synkat')||document.querySelector('#cloudStatus').textContent.includes('anslutet'),{timeout:12000});
  assert.equal(await pc.locator('#passages .text').count(),0,'different learner must not see the other learner source');
  for(const night of [false,true]){
   if(night)await pa.locator('#theme').click();
   for(const tab of ['read','questions','understand','present','lead','join','practice','review']){
    const computed=await pa.locator('[data-tab="'+tab+'"]').evaluate(el=>{const s=getComputedStyle(el);return {fg:s.color,bg:s.backgroundColor}});
    const ratio=contrast(computed.fg,computed.bg);
    assert(ratio>=4.5,'button '+tab+' contrast '+ratio.toFixed(2)+' in '+(night?'night':'day'));
   }
  }
  assert.deepEqual(errs,[],'no client-side runtime errors');
  console.log('PASS: two isolated browser devices synced source, edits, learner isolation, and contrast in both themes');
  await Promise.all([A.close(),B.close(),C.close()]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
