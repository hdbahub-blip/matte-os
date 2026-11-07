'use strict';
// Språkverkstad 3.0 browser acceptance on a phone-sized viewport (Chromium; WebKit/Firefox via cross-engine-e2e).
// Solo flow with real answers, hint = support, profile separation, two devices with identical questions,
// pass-and-play with locked answers, listen mode without visible text, backup round trip, offline, touch targets.
const {chromium,devices}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/$/,'')+'/lara/';
let n=0;const ok=(c,m)=>{n++;assert(c,m);};
const SECRET='HEMLIGT-ELEVSVAR-7731';

async function solveCurrent(page,{wrong=false,hint=false}={}){
 // Ask the page which task is shown and what the correct interaction is.
 const info=await page.evaluate(({wrong})=>{const W=window.MO_WORKSHOP,X=W._test,d=W._debug().ui;const p=location.hash.replace('#/verkstad/','').split('/');const t=X.BANK.find(x=>x.lang===p[0]&&x.id===p[1]);const k=X.tasksFor(t,d.mode)[d.i];
  if(!k)return null;if(k.type==='choice'){const o=X.displayOrder(t,k);return {type:k.type,i:wrong?o.indexOf(1):o.indexOf(0)};}
  if(k.type==='evidence'){const L=X.sentenceList(t);return {type:k.type,i:L.findIndex(s=>k.targets.some(g=>s.s.includes(g)))};}
  if(k.type==='order'){const o=X.displayOrder(t,k);return {type:k.type,seq:k.items.map((_,i)=>o.indexOf(i))};}
  if(k.type==='cloze')return {type:k.type,word:wrong?k.options[1]:k.accept[0]};return {type:k.type,crit:k.criteria.length};},{wrong});
 return info;}
async function answer(page,info){
 if(info.type==='choice'||info.type==='evidence')await page.locator(`[data-w=pick][data-i="${info.i}"]`).click();
 else if(info.type==='order'){for(const i of info.seq)await page.locator(`[data-w=order][data-i="${i}"]`).click();}
 else if(info.type==='cloze')await page.locator('#wk-type').fill(info.word);}

(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];const watch=p=>{p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
 const phone={...devices['iPhone 13'],serviceWorkers:'block',acceptDownloads:true};
 try{
  /* ---- A. solo flow, grade 9 ---- */
  const ctx=await browser.newContext(phone),page=await ctx.newPage();watch(page);page.setDefaultTimeout(10000);
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.homegrid').waitFor();
  await page.locator('a[href="#/sv"]').first().click();await page.locator('.wk-book').first().waitFor();
  ok(await page.locator('.wk-book').count()===6,'six Swedish texts listed');
  ok((await page.locator('main').innerText()).includes('Nivå 3 · Utmaning'),'levels shown');
  await page.locator('a.wk-book[href="#/verkstad/sv/buss"]').click();
  await page.locator('.wk-challenge').waitFor();ok((await page.locator('.wk-challenge strong').innerText())==='SV-BUSS · v1','challenge code shown');
  await page.locator('[data-mode=solo]').click();await page.locator('.wk-reading').waitFor();
  ok(await page.locator('.wk-reading p').count()===6,'whole text with numbered paragraphs');
  ok(await page.locator('.wk-gloss[open]').count()===1,'level 1 opens the word help');
  await page.locator('[data-w=start-tasks]').click();
  ok(await page.locator('[data-w=check]').isDisabled(),'cannot check before answering');
  ok((await page.locator('.wk-feedback').count())===0,'no answer key before an answer');
  let total=0,correctAuto=0;
  for(let guard=0;guard<20;guard++){
   const info=await solveCurrent(page);if(!info)break;total++;
   if(info.type==='open'){await page.locator('#wk-open').fill(SECRET+' Han vågar sätta sig bredvid henne.');await page.locator('[data-w=open-done]').click();
    ok(await page.locator('.wk-check').count()===info.crit,'criteria shown for self-assessment');
    await page.locator('[data-w-crit="0"]').check();await page.locator('[data-w-crit="1"]').check();await page.locator('[data-w=model]').click();
    ok(await page.locator('.wk-feedback blockquote').count()===1,'example answer on request');await page.locator('[data-w=open-next]').click();continue;}
   if(total===2){await page.locator('[data-w=hint]').click();ok((await page.locator('.wk-help .wk-note').innerText()).length>20,'hint text shown');}
   await answer(page,info);await page.locator('[data-w=check]').click();
   await page.locator('.wk-feedback').waitFor();ok(await page.locator('.wk-feedback.good').count()===1,'correct answer accepted ('+info.type+')');correctAuto++;
   await page.locator('[data-w=next]').click();}
  await page.locator('[data-w=finish]').click();await page.locator('.wk-result').waitFor();
  const res=await page.locator('.wk-result').innerText();
  ok(res.includes((correctAuto-1)+' av '+correctAuto)&&res.includes('1 rätt med stöd'),'result separates independent and supported answers: '+res.slice(0,120));
  ok(res.includes('inte ett betyg'),'no false grading claim');
  const raw=await page.evaluate(()=>localStorage.getItem('matteos.sprak.v3'));const st=JSON.parse(raw);
  const mine=Object.keys(st.profiles.grade9.tasks).filter(k=>k.startsWith('sv:buss:'));
  ok(mine.length===total,'every task recorded once');ok(st.profiles.grade9.tasks['sv:buss:t2'].help===true,'hint recorded as support');
  ok(!raw.includes(SECRET)&&!raw.includes('vågar sätta'),'free-text answer is never stored');
  ok(Object.keys(st.profiles.grade8.tasks).length===0,'other profile untouched');
  /* restart the same text: first attempt stays the evidence */
  await page.goto(base+'#/sv');await page.locator('a.wk-book[href="#/verkstad/sv/buss"]').click();await page.locator('[data-mode=solo]').click();await page.locator('[data-w=start-tasks]').click();
  const w=await solveCurrent(page,{wrong:true});await answer(page,w);await page.locator('[data-w=check]').click();await page.locator('.wk-feedback.try').waitFor();
  const again=JSON.parse(await page.evaluate(()=>localStorage.getItem('matteos.sprak.v3'))).profiles.grade9.tasks['sv:buss:t1'];
  ok(again.ok===true&&again.n===2,'repeat does not overwrite the first individual result');
  ok((await page.locator('.wk-feedback.try').innerText()).includes('Rätt svar'),'wrong answer shows the correct one with reason');
  await page.goto(base+'#/sv');ok((await page.locator('a.wk-book[href="#/verkstad/sv/buss"] .wk-chip').innerText()).includes('Klarad själv'),'library shows independent result');
  ok((await page.locator('.wk-feature h2').innerText())==='Regler för lån av skoldator','next recommendation is a NEW text on the same level');
  ok((await page.locator('.wk-skilllist li').count())>=4,'skill evidence listed');

  /* ---- B. profile switch ---- */
  await page.locator('[data-a="profile"]').click();await page.locator('[data-a="choose-profile"][data-p="grade8"]').click();
  await page.goto(base+'#/sv');ok((await page.locator('a.wk-book[href="#/verkstad/sv/buss"] .wk-chip').innerText())==='Ny','grade 8 sees its own (empty) progress');
  await page.goto(base+'#/verkstad/sv/buss');ok(await page.locator('[data-mode=solo]').count()===1,'switching profile starts the text afresh');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no horizontal overflow');

  /* ---- C. touch targets on workshop screens ---- */
  for(const route of ['#/sv','#/verkstad/en/shark']){await page.goto(base+route);await page.waitForTimeout(200);
   const small=await page.evaluate(()=>[...document.querySelectorAll('main a,main button,main input,main summary')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.height<43.5&&!e.classList.contains('wk-sent');}).map(e=>(e.innerText||e.tagName).slice(0,30)+' '+Math.round(e.getBoundingClientRect().height)));
   ok(small.length===0,'touch targets ≥ 44 px on '+route+': '+small.join(', '));}

  /* ---- D. backup round trip ---- */
  await page.locator('[data-a="profile"]').click();await page.locator('[data-a="choose-profile"][data-p="grade9"]').click();
  await page.goto(base+'#/installningar');
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-a="export"]').click()]);
  const file=path.join(os.tmpdir(),'sprak3-backup-'+process.pid+'.json');await dl.saveAs(file);
  const backup=JSON.parse(fs.readFileSync(file,'utf8'));ok(backup.sprak&&backup.sprak.v3&&Object.keys(backup.sprak.v3.profiles.grade9.tasks).length===total,'backup contains workshop progress');
  ok(!JSON.stringify(backup).includes(SECRET),'backup contains no free text');
  await page.locator('[data-a="reset-one"]').click();await page.locator('[data-a="reset-one"]').click();
  ok(Object.keys(JSON.parse(await page.evaluate(()=>localStorage.getItem('matteos.sprak.v3'))).profiles.grade9.tasks).length===0,'reset clears workshop progress for this profile');
  await page.setInputFiles('#importfile',file);await page.waitForTimeout(400);
  ok(Object.keys(JSON.parse(await page.evaluate(()=>localStorage.getItem('matteos.sprak.v3'))).profiles.grade9.tasks).length===total,'import restores workshop progress');
  fs.unlinkSync(file);
  await page.goto(base+'#/verkstad/sv/skarmbild/2');ok((await page.locator('main').innerText()).includes('ersatts'),'old 2.0 link is explained');
  await ctx.close();

  /* ---- E. two phones, two profiles: identical questions and order ---- */
  const seen=[];
  for(const prof of ['grade8','grade9']){const c=await browser.newContext(phone),p=await c.newPage();watch(p);p.setDefaultTimeout(10000);
   await p.goto(base);await p.locator('.homegrid').waitFor();await p.locator('[data-a="profile"]').click();await p.locator(`[data-a="choose-profile"][data-p="${prof}"]`).click();
   await p.goto(base+'#/verkstad/en/shark');await p.locator('[data-mode=solo]').click();await p.locator('[data-w=start-tasks]').click();
   const sequence=[];
   for(let g=0;g<12;g++){const info=await solveCurrent(p);if(!info)break;
    sequence.push(await p.locator('.wk-card h2').first().innerText()+' | '+(await p.locator('.wk-card .wk-option,.wk-card .wk-sent').allInnerTexts()).join(' / '));
    if(info.type==='open'){await p.locator('[data-w=open-done]').click();await p.locator('[data-w=open-next]').click();continue;}
    await answer(p,info);await p.locator('[data-w=check]').click();await p.locator('[data-w=next]').click();}
   seen.push(sequence);await c.close();}
  ok(seen[0].length===10&&JSON.stringify(seen[0])===JSON.stringify(seen[1]),'grade 8 and grade 9 phones get identical questions and option order');

  /* ---- F. pass and play ---- */
  const pc=await browser.newContext(phone),pp=await pc.newPage();watch(pp);pp.setDefaultTimeout(10000);
  await pp.goto(base+'#/verkstad/sv/simhall');await pp.locator('[data-mode=pair]').click();await pp.locator('[data-w=start-tasks]').click();
  let first=await solveCurrent(pp);await answer(pp,first);await pp.locator('[data-w=pair-lock]').click();
  await pp.locator('.wk-pass').waitFor();ok(await pp.locator('.wk-option').count()===0,'locked answer and options hidden while the phone is handed over');
  ok((await pp.locator('main').innerText()).includes('Spelare 2'),'hand-over names the next player');
  await pp.locator('[data-w=pair-take]').click();ok(await pp.locator('.wk-option.on').count()===0,'second player starts with no pre-selected answer');
  const second=await solveCurrent(pp,{wrong:true});await answer(pp,second);await pp.locator('[data-w=pair-lock]').click();
  await pp.locator('.wk-compare').waitFor();ok(await pp.locator('.wk-compare > div').count()===2,'both answers revealed together');
  ok((await pp.locator('.wk-pairscore').first().innerText()).replace(/\s+/g,' ').includes('Spelare 1: 2'),'independent correct answer scores 2');
  ok((await pp.locator('.wk-talk').innerText()).includes('förklarar'),'reveal asks the one who was right to explain');
  await pp.locator('[data-w=next]').click();
  for(let g=0;g<12;g++){const info=await solveCurrent(pp);if(!info)break;
   if(info.type==='open'){await pp.locator('[data-w=pair-open-ready]').click();await pp.locator('[data-w-peer="0"]').check();await pp.locator('[data-w=peer-next]').click();await pp.locator('[data-w=peer-next]').click();continue;}
   await answer(pp,info);await pp.locator('[data-w=pair-lock]').click();await pp.locator('[data-w=pair-take]').click();await answer(pp,info);await pp.locator('[data-w=pair-lock]').click();await pp.locator('[data-w=next]').click();}
  await pp.locator('[data-w=finish]').click();await pp.locator('.wk-result').waitFor();
  ok((await pp.locator('.wk-result').innerText()).includes('sparas inte som individuell nivå'),'pair result is not credited as individual mastery');
  const ps=JSON.parse(await pp.evaluate(()=>localStorage.getItem('matteos.sprak.v3')));
  ok(Object.keys(ps.profiles.grade9.tasks).length===0&&ps.profiles.grade9.texts['sv:simhall'].pair===1,'pair mode records only participation');

  /* ---- G. listen mode ---- */
  await pp.goto(base+'#/verkstad/en/bag');await pp.locator('[data-mode=listen]').click();
  ok(await pp.locator('.wk-reading').count()===1,'reader sees the text');await pp.locator('[data-w=listen-done]').click();
  ok(await pp.locator('.wk-reading').count()===0&&await pp.locator('[data-w=toggle-text]').count()===0,'listener cannot open the text');
  const steps=await pp.locator('.wk-steps span').count();ok(steps===7,'evidence task skipped in listen mode ('+steps+')');
  await pc.close();

  /* ---- H. offline after the service worker installed ---- */
  const oc=await browser.newContext({...devices['iPhone 13']}),op=await oc.newPage();watch(op);
  await op.goto(base,{waitUntil:'networkidle'});await op.evaluate(()=>navigator.serviceWorker.ready);await op.reload({waitUntil:'networkidle'});
  await oc.setOffline(true);
  await op.goto(base+'#/verkstad/sv/osagt');await op.locator('h1').waitFor();ok((await op.locator('h1').innerText())==='Det som inte sades','long Swedish text works offline');
  await op.goto(base+'#/verkstad/en/notes');await op.locator('h1').waitFor();ok((await op.locator('h1').innerText())==='The Notes in My Locker','English text works offline');
  await oc.setOffline(false);await oc.close();

  ok(errors.length===0,'no JavaScript errors: '+errors.join(' | '));
  console.log('Språkverkstad 3.0 mobile E2E PASS: '+n+' checks · solo with hint/support · first-attempt evidence · profile separation · identical two-phone questions · locked pass-and-play · listen mode · backup round trip · offline');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
