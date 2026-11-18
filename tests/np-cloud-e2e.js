'use strict';
// NP-synk: två isolerade webbläsare + syntetisk Supabase-gränssnittsmock. Inga riktiga konton, ingen riktig databas, ingen skoltext.
const assert=require('node:assert/strict');const {chromium}=require('playwright');const F=require('./np-fixture.js');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/'),URL=base+'lara/np-muntligt.html';
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
const rows=[];let n=0;const ok=(c,m)=>{n++;assert(c,m);};const fixture=F.make();
async function until(fn,msg,max=15000){const s=Date.now();while(!fn()){if(Date.now()-s>max)throw Error('timeout: '+msg);await new Promise(r=>setTimeout(r,100));}}
async function attach(page,uid){
 await page.exposeFunction('__npRead',async u=>rows.filter(r=>r.learner_id===u).map(r=>structuredClone(r)));
 await page.exposeFunction('__npWrite',async row=>{const i=rows.findIndex(r=>r.learner_id===row.learner_id&&r.module===row.module&&r.device_id===row.device_id);if(i>=0)rows[i]=structuredClone(row);else rows.push(structuredClone(row));return true;});
 await page.addInitScript(({uid})=>{localStorage.setItem('matteos-study-auth-v1','{"testOnly":true}');
  window.supabase={createClient:()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getSession:async()=>({data:{session:{user:{id:uid}}}})},
   from:t=>({select(){return this},eq(){return this},order(){return this},async maybeSingle(){return {data:t==='study_profiles'?{user_id:uid,role:'learner',grade:'grade9',display_name:'Syntetisk elev'}:null,error:null};},
    async limit(){return {data:t==='study_snapshots'?await window.__npRead(uid):[],error:null};},async upsert(p){await window.__npWrite(p);return {error:null};}})})};},{uid});
}
const entry=(uid,key)=>rows.filter(r=>r.learner_id===uid&&r.payload&&r.payload.entries&&r.payload.entries[key]).map(r=>r.payload.entries[key]);
const val=(uid,key)=>entry(uid,key).sort((a,b)=>b.at-a.at)[0]?.value;
async function a1(page,qi){await page.goto(URL+'#/think');await page.goto(URL+'#/think/'+qi);await page.waitForSelector('.steps',{timeout:15000});if(!(await page.locator('#a1').count()))await page.click('[data-a=qstep][data-s="1"]');await page.waitForSelector('#a1');}
const status=p=>p.evaluate(()=>window.MO_NP_STATUS||'');
(async()=>{
 const browser=await chromium.launch();const errs=[];
 try{
  const A=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),pa=await A.newPage();await attach(pa,alice);pa.on('pageerror',e=>errs.push(String(e)));
  await pa.goto(URL);await pa.waitForFunction(()=>/anslutet|Synkat/.test(window.MO_NP_STATUS||''));
  ok(/elevkontot|Study Cloud/.test(await status(pa)),'device A connects to the learner account');
  await pa.click('.np-top [data-a=sheet]');await pa.setInputFiles('#fileSource',{name:'s.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await pa.waitForSelector('.station.next');
  await a1(pa,0);await pa.fill('#a1','Första svar från enhet A med flera ord.');
  await until(()=>val(alice,'ans.q0.a1')==='Första svar från enhet A med flera ord.','answer uploaded');
  const row=rows.find(r=>r.learner_id===alice);ok(row.module==='reading'&&row.payload.kind==='matteos-private-np-2'&&row.payload.workId==='en-stark-nolla'&&row.payload.source&&row.payload.source.workId==='en-stark-nolla','snapshot uses the existing study_snapshots shape with a private np-2 marker');
  ok(JSON.stringify(row.payload).length<120000,'payload well under the 900 kB jsonb guard');
  ok(rows.every(r=>r.learner_id===alice),'only the signed-in learner owns rows');
  // Enhet B hämtar text och svar utan att något importerats där
  const B=await browser.newContext({viewport:{width:1280,height:880},serviceWorkers:'block'}),pb=await B.newPage();await attach(pb,alice);pb.on('pageerror',e=>errs.push(String(e)));
  await pb.goto(URL+'#/think/0');await pb.waitForSelector('.steps',{timeout:15000});if(!(await pb.locator('#a1').count()))await pb.click('[data-a=qstep][data-s="1"]');await pb.waitForSelector('#a1');
  ok(await pb.inputValue('#a1')==='Första svar från enhet A med flera ord.','device B recovers school text and A\'s answer');
  ok(await pb.locator('blockquote.school').first().innerText().then(t=>t.includes(fixture.questions[0])),'device B shows the verbatim school question');
  // B redigerar → A får senare version (per fält, senaste ändring vinner)
  await pb.fill('#a1','Senare svar från enhet B med andra ord.');await until(()=>val(alice,'ans.q0.a1')==='Senare svar från enhet B med andra ord.','B edit uploaded');
  await pa.reload();await pa.waitForFunction(()=>window.MO_NP_APP&&(MO_NP_APP._debug().notes['ans.q0.a1']||'').includes('Senare svar'),null,{timeout:15000});await a1(pa,0);ok((await pa.inputValue('#a1')).includes('Senare svar'),'x');
  ok(true,'device A receives the newer per-field edit');
  // Olika fält på olika enheter slås ihop utan förlust
  await pa.goto(URL+'#/lead');await pa.waitForSelector('#inv');await pb.goto(URL+'#/present');await pb.waitForSelector('#pp1');
  await pa.fill('#inv','Vad tänker du, Noor?');await pb.fill('#pp1','Mira, bussen, väntan');
  await until(()=>val(alice,'lead.invite')==='Vad tänker du, Noor?'&&val(alice,'pres.1')==='Mira, bussen, väntan','both fields uploaded');
  await pa.reload();await pa.waitForFunction(()=>MO_NP_APP&&MO_NP_APP._debug().notes['pres.1']==='Mira, bussen, väntan',null,{timeout:15000});
  ok(await pa.evaluate(()=>MO_NP_APP._debug().notes['lead.invite']==='Vad tänker du, Noor?'),'edits to different fields on two devices both survive');
  // Gammal (äldre) kopia får inte skriva över nyare svar
  rows.push({learner_id:alice,grade:'grade9',module:'reading',device_id:'old-device',updated_at:'2020-01-01',payload:{kind:'matteos-private-np-2',workId:'en-stark-nolla',source:null,sourceAt:1,entries:{'ans.q0.a1':{value:'GAMMALT SVAR SOM INTE SKA VINNA',at:5}}}});
  await pa.waitForTimeout(1700);await pa.evaluate(()=>MO_NP_SYNC.connect(true));await pa.waitForTimeout(700);
  ok(await pa.evaluate(()=>!/GAMMALT/.test(MO_NP_APP._debug().notes['ans.q0.a1'])),'older cloud copy never overwrites newer local answer');
  // v1-rad från gamla appen migreras
  rows.push({learner_id:alice,grade:'grade9',module:'reading',device_id:'v1-device',updated_at:'2026-11-17',payload:{kind:'matteos-private-np-1',workId:'en-stark-nolla',source:null,sourceAt:1,entries:{q3:{value:'Svar på fråga 4 från den gamla appen',at:Date.now()},u2:{value:'Gammal anteckning',at:Date.now()}}}});
  await pa.waitForTimeout(1700);await pa.evaluate(()=>MO_NP_SYNC.connect(true));await pa.waitForFunction(()=>MO_NP_APP._debug().notes['ans.q3.a1']==='Svar på fråga 4 från den gamla appen',null,{timeout:8000});
  ok(await pa.evaluate(()=>MO_NP_APP._debug().notes['legacy.u2']==='Gammal anteckning'),'np-1 cloud rows migrate into the new model (no answers lost)');
  // Synk avbryter inte pågående skrivande
  await a1(pa,2);
  await pa.click('#a1');await pa.keyboard.type('Jag skriver just nu ',{delay:5});
  await pa.evaluate(()=>MO_NP_APP.mergeCloud([{payload:{kind:'matteos-private-np-2',workId:'en-stark-nolla',source:null,sourceAt:1,entries:{'reflect.next':{value:'Från enhet B',at:Date.now()+1000}}}}]));
  ok(await pa.evaluate(()=>document.activeElement.id==='a1'&&document.activeElement.value==='Jag skriver just nu '),'incoming sync does not steal focus or erase text while typing');
  await pa.keyboard.type('fortfarande');ok(await pa.inputValue('#a1')==='Jag skriver just nu fortfarande','typing continues uninterrupted');
  await pa.click('h1').catch(()=>{});await pa.evaluate(()=>document.activeElement.blur());await pa.waitForTimeout(300);
  ok(await pa.evaluate(()=>MO_NP_APP._debug().notes['reflect.next']==='Från enhet B'&&MO_NP_APP._debug().notes['ans.q2.a1']==='Jag skriver just nu fortfarande'),'after typing, the merged value is present and the typed answer kept');
  // Annan elev isolerad
  const Cx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),pc=await Cx.newPage();await attach(pc,bob);pc.on('pageerror',e=>errs.push(String(e)));
  await pc.goto(URL);await pc.waitForFunction(()=>/anslutet|Synkat/.test(window.MO_NP_STATUS||''),null,{timeout:15000});
  ok(await pc.locator('.warn').count()>=1&&!(await pc.evaluate(()=>MO_NP_APP.hasSource())),'a different learner sees none of the first learner\'s text');
  ok(!rows.some(r=>r.learner_id===bob&&r.payload&&r.payload.source),'no source uploaded for the other learner');
  // Utloggning döljer, kontobyte på samma enhet blandar inte
  await pa.goto(URL+'#/read');await pa.waitForSelector('.para');await pa.evaluate(()=>MO_NP_APP.lockAccount());
  ok(!(await pa.locator('main').innerText()).includes(fixture.textParagraphs[0].slice(0,30)),'sign-out hides the private text');
  await pa.evaluate(uid=>MO_NP_APP.switchAccount(uid),bob);await pa.goto(URL+'#/think/0');
  ok(!(await pa.evaluate(()=>MO_NP_APP.hasSource())),'account switch on the same device keeps content isolated');
  ok(errs.length===0,'no runtime errors: '+errs.join('|'));
  console.log('NP CLOUD E2E PASS: '+n+' checks (synthetic accounts, mocked client)');
  await browser.close();
 }catch(e){console.error(e);await browser.close();process.exit(1);}
})();
