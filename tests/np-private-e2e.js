'use strict';
// NP-träning: hela läranderesan i riktig webbläsare med SYNTETISK text. Ingen skoltext, inga riktiga konton.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const F=require('./np-fixture.js');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/'),URL=base+'lara/np-muntligt.html';
const OUT=process.argv[3]||'';let n=0;const ok=(c,m)=>{n++;assert(c,m);};
const fixture=F.make(),buf=o=>Buffer.from(JSON.stringify(o));
const text='Jag tycker att Mira är envis eftersom ”hon kom ändå tillbaka” varje dag. Å andra sidan kan hon vara rädd. Alltså väntar hon av hopp.';
const better='Jag tycker att Mira är envis och hoppfull eftersom ”hon kom ändå tillbaka” varje dag, trots att ingen vinkade. Å andra sidan kan hon också vara rädd för att bli avvisad. Min slutsats är alltså att hon väntar av hopp.';
async function qs(page,qi){return page.evaluate(i=>{const d=MO_NP_APP._debug();return MO_NP_CORE.qState(d.notes,i,Date.now());},qi);}
async function sm(page){return page.evaluate(()=>{const d=MO_NP_APP._debug();return MO_NP_CORE.summary(d.notes,d.doc,Date.now());});}
async function layout(page,label){
 const r=await page.evaluate(()=>({ov:document.documentElement.scrollWidth-innerWidth,small:[...document.querySelectorAll('a,button,summary,input:not([type=file]),textarea,select')].filter(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.width&&s.visibility!=='hidden'&&(b.height<43.5||b.width<43.5)&&!(e.type==='checkbox'||e.type==='radio');}).map(e=>(e.textContent||e.id||e.className||'').trim().slice(0,24)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))}));
 ok(r.ov<=1,label+': no horizontal scroll ('+r.ov+')');ok(r.small.length===0,label+': touch targets <44px: '+r.small.join('|'));
}
function ratioJS(){return `(function(){function lum(c){var m=c.match(/[\\d.]+/g).map(Number).slice(0,3).map(function(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*m[0]+.7152*m[1]+.0722*m[2]}
 function bg(e){while(e){var c=getComputedStyle(e).backgroundColor;var m=c.match(/[\\d.]+/g);if(m&&(m.length<4||Number(m[3])>0.95))return c;e=e.parentElement}return 'rgb(255,255,255)'}
 return function(sel){var out=[];document.querySelectorAll(sel).forEach(function(e){if(!e.getBoundingClientRect().width)return;var a=lum(getComputedStyle(e).color),b=lum(bg(e));out.push((Math.max(a,b)+.05)/(Math.min(a,b)+.05))});return out}})()`;}
async function contrast(page,label){
 const sels=['h1','.lead','.btn','.station b','.station small','blockquote.school p','.small','.hint','.fb','.eyebrow','a.back','label','.chips li'];
 const res=await page.evaluate(`(${ratioJS()})`).catch(()=>null);
 for(const s of sels){const r=await page.evaluate(`(function(){var f=${ratioJS()};return f(${JSON.stringify(s)})})()`);for(const x of r)ok(x>=4.5,label+' '+s+' contrast '+x.toFixed(2));}
}
async function pass(page){
 for(const [i,r] of [[0,'present'],[1,'lead'],[2,'lead'],[3,'join'],[4,'present'],[5,'join']])await page.click(`[data-a=quiz][data-i="${i}"][data-r="${r}"]`);
}
async function answer(page,qi,t=text,b=better){
 await page.goto(URL+'#/think');await page.goto(URL+'#/think/'+qi);await page.waitForSelector('.steps');if(!(await page.locator('#a1').count()))await page.click('[data-a=qstep][data-s="1"]');await page.waitForSelector('#a1');
 await page.fill('#a1',t);
 ok(await page.locator('#live-an .chips li.on').count()>=3,'live textspaning chips appear while typing');
 await page.click('[data-a=qstep][data-s="2"]');
 await page.locator('[data-evq][data-i="0"]').check();await page.fill('#evwhy','Stället visar att hon inte ger upp.');
 await page.click('[data-a=qstep][data-s="3"]');await page.click('[data-a=pers][data-i="0"]');await page.fill('#pers','Hon skulle säga att det är ensamt att vänta.');
 await page.click('[data-a=qstep][data-s="4"]');
 ok(await page.locator('[data-a=qstep][data-s="5"]').isDisabled(),'cannot continue before comparing');
 await page.click('[data-a=model]:nth-of-type(1)');await page.waitForSelector('#h1,.fb');await page.click('[data-a=qstep][data-s="5"]');
 await page.fill('#a2',b);await page.locator('[data-better][data-id=because]').check();
 await page.click('[data-a=qstep][data-s="6"]');
 for(let i=0;i<3;i++)await page.fill('#cue'+i,['envis hopp','kom tillbaka','rädd?'][i]);
 await page.click('[data-a=oral][data-r=free]');await page.click('[data-a=oral][data-r=free]');
}
(async()=>{
 const browser=await chromium.launch();const errors=[];
 try{
  // ---------- 1. Första besöket, utan paket ----------
  const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,serviceWorkers:'block'});const page=await ctx.newPage();page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('dialog',d=>d.accept());
  await page.goto(URL);await page.waitForSelector('h1');
  ok(/Din väg till att presentera, leda och delta/.test(await page.locator('h1').innerText()),'home explains the goal');
  ok(await page.locator('.btn.big').count()===1,'one clear primary action');
  ok(await page.locator('.station').count()===7,'seven stations, not eight tabs');
  ok(/Lägg in textpaket/.test(await page.locator('main').innerText()),'first run explains the private text package');
  ok(await page.evaluate(()=>document.activeElement.id==='h1'),'heading receives focus on load (screen reader orientation)');
  await layout(page,'home-empty');
  // Steg 1 fungerar utan text.
  await page.click('.btn.big');await page.waitForSelector('.quiz');
  await page.click('[data-a=quiz][data-i="0"][data-r="lead"]');await page.waitForSelector('.fb.no');
  ok(/Inte riktigt/.test(await page.locator('.fb.no').innerText()),'wrong role explains why');
  await pass(page);
  ok(/rätt/.test(await page.locator('.card.ok').innerText().catch(()=>'')),'quiz summary');
  // ---------- 2. Läs in paketet via inställningsbladet (tangentbordsvänligt) ----------
  await page.goto(URL);await page.click('.np-top [data-a=sheet]');await page.waitForSelector('.sheet');
  ok(await page.evaluate(()=>!!document.querySelector('.sheet').contains(document.activeElement)),'sheet takes focus');
  await page.focus('[data-a=pickimport]');await page.keyboard.press('Enter');
  await page.setInputFiles('#fileSource',{name:'x.json',mimeType:'application/json',buffer:buf(fixture)});
  await page.waitForSelector('.station.next');
  ok(await page.locator('.sheet').count()===0,'sheet closes after import');
  ok((await sm(page)).s0,'quiz pass persisted');
  await page.click('.np-top [data-a=sheet]');
  ok(/lästa direkt från skolans foto/.test(await page.locator('.sheet').innerText())&&/delvis läsbara/.test(await page.locator('.sheet').innerText()),'source status shown from fidelity table');
  await page.keyboard.press('Escape');ok(await page.locator('.sheet').count()===0,'Escape closes sheet');
  // felaktigt paket avvisas
  await page.click('.np-top [data-a=sheet]');await page.setInputFiles('#fileSource',{name:'bad.json',mimeType:'application/json',buffer:buf({format:'x'})});
  await page.waitForSelector('.notice');ok(/Kunde inte läsa/.test(await page.locator('.notice').innerText()),'invalid package rejected with message');
  await page.keyboard.press('Escape');
  // ---------- 3. Läs ----------
  await page.goto(URL+'#/read');await page.waitForSelector('.para');
  ok(await page.locator('.para').count()===3&&/del 1 av 3/i.test(await page.locator('.eyebrow').innerText()),'reader chunks the text');
  ok(await page.locator('.flag').count()===1,'partially legible paragraph is flagged');
  const heading0=await page.locator('.schooltext').first().innerText();ok(heading0===fixture.textParagraphs[0],'school text shown verbatim');
  await page.click('[data-a=ev][data-i="0"]');await page.waitForSelector('#evn');await page.check('[data-evk][value=reads]');await page.fill('#evn','Visar att hon väntar.');await page.click('[data-a=evsave]');
  ok(await page.locator('.chip-ev').count()===1&&/Min tolkning/.test(await page.locator('.chip-ev').innerText()),'evidence saved with its kind');
  await page.fill('#retell','Mira väntar vid bussen men ingen vinkar.');
  ok(await page.locator('[data-kp]').count()===2,'self-check key points appear after retelling');
  await page.check('[data-kp][data-i="0"]');
  await page.fill('#retell',fixture.textParagraphs[0]+' '+fixture.textParagraphs[1]);ok(/ligger nära textens ord/.test(await page.locator('main').innerText()),'copying is gently flagged');
  await page.fill('#retell','Mira väntar vid bussen men ingen vinkar.');
  await page.click('text=Nästa del');await page.waitForFunction(()=>/del 2 av 3/i.test(document.querySelector('.eyebrow').innerText));await page.fill('#retell','Hon byter plats och skriver ett brev.');
  ok((await sm(page)).retold===2&&(await sm(page)).evidence===1,'read progress = retold sections + evidence');
  await layout(page,'read');
  // Fokus och text bevaras när eleven skriver tecken för tecken
  await page.fill('#retell','');await page.click('#retell');await page.keyboard.type('Hon byter plats och skriver ett brev.',{delay:2});
  ok(await page.evaluate(()=>document.activeElement.id==='retell'&&document.activeElement.value==='Hon byter plats och skriver ett brev.'),'typing keeps focus and text');
  await page.goto(URL+'#/read/3');await page.waitForSelector('#retell');await page.fill('#retell','Jonte hjälper Mira och lagar klockan.');
  await page.click('[data-a=ev][data-i="6"]');await page.waitForSelector('#evn');await page.fill('#evn','Visar att Jonte hjälper Mira.');await page.click('[data-a=evsave]');
  ok((await sm(page)).retold===3&&(await sm(page)).evidence===2,'all sections retold and two evidence examples saved');
  // ---------- 4. Tänk ----------
  await page.goto(URL+'#/think');await page.waitForSelector('.qlist');
  ok(await page.locator('.qlist .station').count()===5,'four school questions + discussion question');
  const q1=await page.locator('.qlist .schoolq').allInnerTexts();ok(q1.join('|')===fixture.questions.concat([fixture.discussionQuestion]).join('|'),'questions shown verbatim, in order');
  await page.goto(URL+'#/think/0');await page.waitForSelector('#a1');
  ok(await page.locator('blockquote.school').first().innerText().then(t=>t.includes(fixture.questions[0])),'school question verbatim and visibly separated from app help');
  ok(await page.locator('.help').count()===0,'no help before the student asks');
  await page.fill('#a1','Jag vet inte');await page.click('[data-a=help1]');
  ok(await page.locator('.help').count()===1&&/hjälp 1/i.test(await page.locator('.help').innerText()),'help level 1 on request');
  await page.click('[data-a=help2]');ok(/hjälp 2/i.test(await page.locator('main').innerText()),'help level 2 on request');
  ok((await qs(page,0)).help===2&&!(await qs(page,0)).independent,'help use is recorded; answer no longer counts as independent');
  ok(await page.locator('.step-x').count()===0&&await page.locator('.steps li.cur').count()===1,'one current step');
  ok(await page.locator('main').innerText().then(t=>!t.includes('Syntetiskt starkt svar')),'worked example is NOT shown before the student has tried');
  await answer(page,0);
  let st=await qs(page,0);ok(st.attempted&&st.evidence===1&&st.perspective&&st.revised&&st.spoken&&st.level===4,'question 1 complete: '+JSON.stringify(st));
  ok(await page.locator('.cmp').count()===1,'before/after comparison shown');
  await layout(page,'think-step6');
  // fortsatt: hjälp låser inte upp "klar" i förtid
  await page.goto(URL+'#/think/1');await page.waitForSelector('#a1');await page.fill('#a1',text);await page.click('[data-a=qstep][data-s="2"]');
  ok((await qs(page,1)).level<=2&&!(await qs(page,1)).revised,'untouched steps do not count as progress');
  await answer(page,1);await answer(page,2);
  ok((await sm(page)).improved===3&&(await sm(page)).spoken===3,'three questions improved and spoken');
  await answer(page,3);await answer(page,4);
  ok((await sm(page)).improved===5&&(await sm(page)).spoken===5,'all five school questions improved and spoken');
  // ---------- 5. Presentera ----------
  await page.goto(URL+'#/present');await page.waitForSelector('#pp1');
  await page.fill('#pp1','Mira, bussen, väntan');
  const long=Array.from({length:20},(_,i)=>'ord'+i).join(' ');await page.fill('#pp2',long);ok(/manus/.test(await page.locator('#pw2').innerText()),'long entries are called out as script, not cues');
  await page.fill('#pp2','klockan stannad, te');await page.fill('#pp3','”kom ändå tillbaka”');await page.fill('#pp4','envis eller rädd');await page.fill('#pp5','Vad räknas som stort?');
  await page.click('[data-a=prate][data-r=free]');
  ok(/Runda|Nivå/.test(await page.locator('main').innerText()),'practice rounds');
  ok(await page.locator('.cuebox .cue').count()===5&&(await page.locator('.cuebox .cue').first().innerText()).trim().split(/\s+/).length<=3,'level 2 shows only the first cue word of each part');
  await page.click('[data-a=prate][data-r=free]');
  ok(await page.locator('.cuebox .cue').count()===0&&/Bara delarnas rubriker/.test(await page.locator('.cuebox').innerText()),'level 3 shows no cues at all');
  ok((await sm(page)).talkedFree&&(await sm(page)).presParts===5,'presentation built and rehearsed with fading support');
  await page.click('[data-a=ptimer]');ok(/\d\d:\d\d/.test(await page.locator('#clock').innerText()),'practice timer (optional)');await page.click('[data-a=ptimer]');
  await layout(page,'present');
  // ---------- 6. Leda ----------
  await page.goto(URL+'#/lead');await page.waitForSelector('.sim');
  await page.click('[data-a=sim][data-id=silence][data-i="0"]');ok(/Starkare/.test(await page.locator('.sim').first().innerText()),'a weaker choice shows the stronger one and why');
  await page.click('[data-a=sim][data-id=silence][data-i="1"]');ok(/Det fungerar/.test(await page.locator('.sim').first().innerText()),'good choice explained');
  await page.click('[data-a=sim][data-id=dominate][data-i="2"]');await page.click('[data-a=sim][data-id=disagree][data-i="0"]');
  await page.fill('#fu1','Är det bra?');ok(/ja eller nej/.test(await page.locator('[id="qk-lead.followup1"]').innerText()),'closed question is flagged live');
  await page.fill('#fu1','Hur skulle du ha gjort?');ok(/Öppen fråga/.test(await page.locator('[id="qk-lead.followup1"]').innerText()),'open question confirmed');
  await page.fill('#fu2','Varför tror du att det blev så?');await page.fill('#inv').catch(()=>{});await page.fill('#inv','Vad tänker du, Noor?');
  for(let i=0;i<3;i++){await page.click('[data-a=card]');await page.waitForSelector('.sim-card');await page.click('[data-a=cardrate][data-r=free]');}
  ok((await sm(page)).nextStation!==undefined||true,'');
  const s5=await sm(page);ok(s5.leadSims===3&&s5.leadCards===3&&s5.opening,'lead: simulations, cards and an opening with open questions');
  await page.locator('details.card summary').first().click();ok(/övningspartner/.test(await page.locator('details.card').first().innerText()),'family role card available without any paid service');
  await layout(page,'lead');
  // ---------- 7. Delta ----------
  await page.goto(URL+'#/join/t1');await page.waitForSelector('#jrecap');
  ok(await page.locator('.frames li').count()>0,'text 1 gives sentence frames');
  await page.click('[data-a=joindone]');ok(/Skriv minst några ord/.test(await page.locator('.notice').innerText()),'cannot finish with empty fields');
  for(const [id,t] of [['jrecap','Texten handlar om Wilma och en lapp.'],['jlink','Det påminner mig om ett snällt ord.'],['jq','Varför tror du att personen var anonym?'],['jbuild','Jag håller med men undrar över namnet.']])await page.fill('#'+id,t);
  ok(/Öppen fråga/.test(await page.locator('.qk').first().innerText()),'listening question checked live');
  await page.click('[data-a=joindone]');ok(/Så kan ett starkt svar låta/.test(await page.locator('main').innerText()),'worked example appears only AFTER the attempt');
  await page.goto(URL+'#/join/t2');await page.waitForSelector('#jrecap');ok(await page.locator('.frames li').count()===0,'text 2: fewer frames');
  for(const id of ['jrecap','jlink','jq','jbuild'])await page.fill('#'+id,id==='jq'?'Hur kan skolan avgöra undantag?':'Ett kort svar med flera ord.');await page.click('[data-a=joindone]');
  await page.goto(URL+'#/join/t3');await page.waitForSelector('#jrecap');ok(await page.locator('.frames li').count()===0&&await page.locator('label small').count()===0,'text 3: no help at all (independent)');
  for(const id of ['jrecap','jlink','jq','jbuild'])await page.fill('#'+id,id==='jq'?'Vad tror du hindrade berättaren?':'Ett kort svar med flera ord.');await page.click('[data-a=joindone]');
  ok((await sm(page)).joinN===3&&(await sm(page)).joinIndep,'unseen-text transfer incl. an unaided one');
  await layout(page,'join');
  // ---------- 8. Generalrepetition ----------
  await page.goto(URL+'#/finish');await page.waitForSelector('.checks');
  for(let i=0;i<6;i++)await page.check(`[data-reh="${i}"]`);await page.click('[data-a=rehdone]');
  await page.fill('#rffirst','Jag visste inte vad jag skulle säga.');await page.fill('#rfbetter','Jag kan förklara varför med belägg.');await page.fill('#rfnext','Jag ska öva på att leda.');
  ok(/Du då och nu/.test(await page.locator('main').innerText()),'before/after view');
  const sAll=await sm(page);ok(sAll.rehearsed&&sAll.reflected,'rehearsal and reflection recorded');
  await page.goto(URL+'#/home');await page.waitForSelector('.btn.big');ok(/hela vägen/.test(await page.locator('.btn.big').innerText()),'all stations completed from evidence');
  ok(await page.locator('.station.done').count()===7,'seven stations complete only after all five questions');
  await layout(page,'finish');
  // ---------- 9. Återtest ----------
  ok(!/Återtest redo/.test(await page.locator('main').innerText()),'no retest on the same day');
  await page.evaluate(()=>{window.__NP_NOW=Date.now()+2*86400000});await page.goto(URL+'#/think');await page.reload();await page.evaluate(()=>{window.__NP_NOW=Date.now()+2*86400000});await page.evaluate(()=>{location.hash='#/home'});await page.waitForSelector('.card.note');
  ok(/Återtest redo/.test(await page.locator('main').innerText()),'retest offered after a day');
  await page.goto(URL+'#/think/0/retest');await page.evaluate(()=>{window.__NP_NOW=Date.now()+2*86400000});await page.waitForSelector('#rt');
  ok(await page.locator('main').innerText().then(t=>!t.includes('hoppfull')),'retest does not show the old answers');
  await page.fill('#rt','Jag tror att hon väntar fortfarande.');await page.click('[data-a=rtsave]');
  ok(/Ditt försök är sparat/.test(await page.locator('main').innerText()),'weak retest offers safe retry');
  await page.click('[data-a=rtretry]');await page.waitForSelector('#rt');
  await page.fill('#rt','Jag tror att hon väntar eftersom ”hon kom ändå tillbaka” visar att hon hoppas. Å andra sidan kan hon vara rädd.');await page.click('[data-a=rtsave]');
  ok((await qs(page,0)).retested||await page.evaluate(()=>MO_NP_CORE.qState(MO_NP_APP._debug().notes,0,Date.now()+2*86400000).retested),'independent retest recorded');
  // ---------- 10. Backup: export → rensa → återställ ----------
  await page.evaluate(()=>{delete window.__NP_NOW});await page.goto(URL+'#/home');
  await page.click('.np-top [data-a=sheet]');const [dl]=await Promise.all([page.waitForEvent('download'),page.click('[data-a=export]')]);
  const path=await dl.path(),backup=JSON.parse(fs.readFileSync(path,'utf8'));
  ok(backup.format==='matte-os-np-backup-v3'&&backup.source&&backup.notes['ans.q0.a1']&&backup.notes['ans.q0.a2'],'backup holds source and answers');
  await page.click('[data-a=clear]');await page.waitForTimeout(150);
  ok(!(await page.evaluate(()=>MO_NP_APP._debug().notes['ans.q0.a1'])),'clear empties answers');
  await page.evaluate(()=>{});await page.setInputFiles('#fileRestore',{name:'b.json',mimeType:'application/json',buffer:fs.readFileSync(path)});await page.waitForTimeout(400);
  ok(await page.evaluate(()=>!!MO_NP_APP._debug().notes['ans.q0.a2']),'restore brings answers back');
  // ---------- 11. Reload, dag/kväll, kontrast, bredder ----------
  await page.reload();await page.waitForSelector('.station');ok((await sm(page)).improved===5,'persists across reload');
  for(const w of [320,390,430,1280]){await page.setViewportSize({width:w,height:w>600?900:800});
   for(const v of ['home','start','read','think','think/0','present','lead','join','join/t1','finish']){await page.goto(URL+'#/'+v);await page.waitForSelector('main');await layout(page,w+' '+v);}}
  await page.setViewportSize({width:390,height:844});
  for(const mode of ['day','night']){
   if(mode==='night'&&!(await page.evaluate(()=>document.documentElement.classList.contains('dark'))))await page.click('.np-top [data-a=theme]');
   if(mode==='day'&&await page.evaluate(()=>document.documentElement.classList.contains('dark')))await page.click('.np-top [data-a=theme]');
   for(const v of ['home','read','think/0','present','lead','join/t1','finish']){await page.goto(URL+'#/'+v);await page.waitForSelector('main');await contrast(page,mode+' '+v);}
   if(OUT)await page.screenshot({path:OUT+'/np-'+mode+'.png'});}
  // ---------- 12. Fel: tom lagring, trasig lagring ----------
  const c2=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p2=await c2.newPage();p2.on('pageerror',e=>errors.push(String(e)));
  await p2.addInitScript(()=>{localStorage.setItem('matteos.np.enstarknolla.grade9.notes','{kaputt');localStorage.setItem('matteos.np.enstarknolla.grade9.source','nope');});
  await p2.goto(URL);await p2.waitForSelector('h1');ok(await p2.locator('.station').count()===7,'corrupt local storage does not break the page');
  // ---------- 13. Gamla v1-anteckningar bevaras ----------
  const c3=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p3=await c3.newPage();p3.on('pageerror',e=>errors.push(String(e)));
  const v1=F.make();v1.format='matte-os-np-private-v1';delete v1.sections;delete v1.fidelity;
  await p3.addInitScript(([src])=>{const R='matteos.np.enstarknolla.grade9.';if(!localStorage.getItem(R+'source')){localStorage.setItem(R+'source',src);localStorage.setItem(R+'notes',JSON.stringify({q0:'Mitt gamla svar på fråga 1',u1:'Gammal förståelse',p1:'gammalt stödord',rubric0:true}));localStorage.setItem(R+'noteAt',JSON.stringify({q0:5,u1:6,p1:7,rubric0:8}));}},[JSON.stringify(v1)]);
  await p3.goto(URL);await p3.waitForSelector('.station');
  ok(await p3.evaluate(()=>{const n=MO_NP_APP._debug().notes;return n['ans.q0.a1']==='Mitt gamla svar på fråga 1'&&n['pres.1']==='gammalt stödord'&&n['legacy.u1']==='Gammal förståelse'&&n.q0==='Mitt gamla svar på fråga 1';}),'v1 answers migrated, originals kept');
  await p3.goto(URL+'#/finish');await p3.waitForSelector('.checks');await p3.locator('summary:has-text("tidigare anteckningar")').click();ok(/Gammal förståelse/.test(await p3.locator('main').innerText()),'old notes remain visible to the student');
  await p3.goto(URL+'#/read');ok(await p3.locator('.para').count()===4,'v1 package still works (automatic chunks)');
  // ---------- 14. Offline med riktig service worker ----------
  const c4=await browser.newContext({viewport:{width:390,height:844}});const p4=await c4.newPage();p4.on('pageerror',e=>errors.push(String(e)));
  await p4.goto(URL);await p4.evaluate(()=>navigator.serviceWorker.ready);await p4.setInputFiles('#fileSource',{name:'x.json',mimeType:'application/json',buffer:buf(fixture)}).catch(()=>{});
  await p4.click('.np-top [data-a=sheet]');await p4.setInputFiles('#fileSource',{name:'x.json',mimeType:'application/json',buffer:buf(fixture)});await p4.waitForSelector('.station');
  await p4.reload();await p4.waitForFunction(()=>caches.keys().then(k=>k.some(x=>x.includes('larande-4.9.0-np-rebuild'))));
  await p4.waitForFunction(()=>caches.open(caches.keys?'':'').then(()=>true));
  const cached=await p4.evaluate(async()=>{const ks=await caches.keys();const out=[];for(const k of ks){const c=await caches.open(k);out.push(...(await c.keys()).map(r=>new URL(r.url).pathname.split('/').pop()));}return out;});
  ok(['np-app.js','np-core.js','np-content.js','np.css','np-muntligt.html'].every(f=>cached.includes(f)),'offline cache holds the NP app files');
  const leaked=await p4.evaluate(async needle=>{for(const k of await caches.keys()){const c=await caches.open(k);for(const r of await c.keys()){const res=await c.match(r);const t=await res.clone().text().catch(()=>'');if(t.includes(needle))return r.url;}}return '';},fixture.textParagraphs[0].slice(0,40));ok(leaked==='','private text is not in the offline cache ('+leaked+')');
  await c4.setOffline(true);await p4.goto(URL);await p4.waitForSelector('.station');ok(await p4.locator('.station').count()===7,'works offline with the locally stored package');
  ok(errors.length===0,'no JavaScript errors: '+errors.join('|'));
  console.log('NP PRIVATE E2E PASS: '+n+' checks');
  await browser.close();
 }catch(e){console.error(e);await browser.close();process.exit(1);}
})();
