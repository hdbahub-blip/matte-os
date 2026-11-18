'use strict';
/* Private source and cross-device bootstrap: synthetic content, two users,
 * one single-use claim, and NO production accounts or real school text. */
const assert=require('node:assert/strict'),{chromium}=require('playwright'),F=require('./np-fixture.js');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const url=base+'lara/np-muntligt.html';
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
const token='synthetic_activation_token_0123456789abcdefghijklmno';
const fixture=F.make(),sourceSha='ab'.repeat(32);let claimedBy=null,writes=[],claimCount=0;
const ok=(value,message)=>assert(value,message);
async function attach(page,uid,grade='grade9'){
 await page.exposeFunction('__privateSourceRead',()=>claimedBy===uid?structuredClone(fixture):null);
 await page.exposeFunction('__claimPrivateSource',secret=>{
  claimCount++;if(secret!==token||claimedBy)return false;claimedBy=uid;return true;
 });
 await page.exposeFunction('__privateSnapshots',()=>structuredClone(writes.filter(r=>r.learner_id===uid)));
 await page.exposeFunction('__privateWrite',row=>{
  const ix=writes.findIndex(r=>r.learner_id===row.learner_id&&r.device_id===row.device_id&&r.module===row.module);
  if(ix<0)writes.push(structuredClone(row));else writes[ix]=structuredClone(row);return true;
 });
 await page.addInitScript(({userId,learnerGrade})=>{
  localStorage.setItem('matteos-study-auth-v1','{"testOnly":true}');
  window.supabase={createClient:()=>({
   auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getSession:async()=>({data:{session:{user:{id:userId}}}})},
   rpc:async(name,args)=>name==='np_claim_school_source'?{data:await window.__claimPrivateSource(args?.p_secret),error:null}:{data:null,error:{message:'unknown synthetic RPC'}},
   from:(t)=>({
    select(){return this},eq(){return this},order(){return this},
    async maybeSingle(){return {data:t==='study_profiles'?{user_id:userId,role:'learner',grade:learnerGrade,display_name:'Testkonto'}:t==='np_private_school_source'?(await window.__privateSourceRead())?{source_key:'en-stark-nolla',material:await window.__privateSourceRead(),material_sha256:'ab'.repeat(32)}:null:null,error:null}},
    async limit(){return {data:t==='study_snapshots'?await window.__privateSnapshots():[],error:null}},
    async upsert(row){await window.__privateWrite(row);return {error:null}}
   })
  })};
 },{userId:uid,learnerGrade:grade});
}
async function wait(page,fn,max=15000){await page.waitForFunction(fn,null,{timeout:max})}
(async()=>{
const browser=await chromium.launch();let A,B,C;
try{
 A=await browser.newContext({serviceWorkers:'block'});const a=await A.newPage();await attach(a,alice);
 const failures=[];a.on('pageerror',e=>failures.push('A:'+e.message));
 await a.goto(url+'#activate='+token);
 await wait(a,()=>window.MO_NP_APP?.hasSource());
 ok(claimedBy===alice,'single-use claim belongs to learner A');
 ok(await a.evaluate(()=>location.hash==='#/home'),'activation token removed from browser URL');
 ok(await a.evaluate(()=>!sessionStorage.getItem('matteos.np.private-claim.v1')),'activation secret not retained after claim');
 ok((await a.locator('main').innerText()).includes('Läs och förstå'),'auto content loaded without import');
 await a.goto(url+'#/think/0');await a.waitForSelector('#a1');await a.fill('#a1','Min första reflektion med flera egna ord.');
 await a.waitForFunction(async()=>!!(await window.__privateSnapshots()).find(r=>r.payload?.entries?.['ans.q0.a1']?.value==='Min första reflektion med flera egna ord.'),null,{timeout:12000});
 B=await browser.newContext({serviceWorkers:'block'});const b=await B.newPage();await attach(b,alice);
 b.on('pageerror',e=>failures.push('B:'+e.message));
 await b.goto(url+'#/think/0');
 try{await wait(b,()=>window.MO_NP_APP?.hasSource()&&!!MO_NP_APP._debug().notes['ans.q0.a1']);}
 catch(e){
  console.error('Second device diagnostics',JSON.stringify(await b.evaluate(()=>({study:MO_STUDY?.info(),profile:MO_STUDY?.profile(),np:window.MO_NP_STATUS,source:window.MO_NP_SOURCE_STATUS,ready:window.MO_NP_SYNC?.ready?.(),account:window.MO_NP_APP?.accountId(),hasSource:window.MO_NP_APP?.hasSource(),noteKeys:Object.keys(window.MO_NP_APP?._debug()?.notes||{}).slice(0,12)}))));
  throw e;
 }
 ok(await b.locator('blockquote.school').first().innerText().then(t=>t.includes(fixture.questions[0])),'same account on device B retrieves exact synthetic question without uploading file');
 ok((await b.locator('#a1').inputValue()).includes('första reflektion'),'answers follow learner A to device B');
 ok(claimCount===1,'claim only attempted once; other device reads entitled source directly');
 C=await browser.newContext({serviceWorkers:'block'});const c=await C.newPage();await attach(c,bob);
 c.on('pageerror',e=>failures.push('C:'+e.message));
 await c.goto(url);await c.waitForFunction(()=>window.MO_STUDY?.profile()?.user_id==='22222222-2222-4222-8222-222222222222');
 await c.waitForTimeout(500);
 ok(!(await c.evaluate(()=>MO_NP_APP.hasSource())),'unentitled learner B cannot see the private source');
 ok((await c.locator('main').innerText()).includes('Du behöver inte ladda upp någon text.'),'unentitled learner receives account-based instructions, not file import CTA');
 ok(failures.length===0,'no runtime browser errors: '+failures.join('|'));
 console.log('NP PRIVATE AUTO SOURCE E2E PASS: private one-use claim, no-file import, account separation, two devices, answer sync');
}finally{await Promise.all([A?.close(),B?.close(),C?.close()].filter(Boolean));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
