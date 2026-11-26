'use strict';
// Debattspelet i riktig webbläsare: två spelare, sololäge, joker (byt sida, fakta), paus/återupptagning, dag/kväll, reducerad rörelse, offline.
const assert=require('node:assert/strict');global.window=global;
const {chromium}=require('playwright');const D=require('../lara/debatt-core.js');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/'),URL=base+'lara/debatt.html';let n=0;const ok=(c,m)=>{n++;assert(c,m);};
function seedFor(lang,mode,topic,effect){for(let i=1;i<500;i++){const s='e'+i,g=D.newGame({lang,mode,topicId:topic,seed:s,length:3});const c=D.drawJoker(g,'A');if(c.effect===effect&&(effect!=='task'||c.scope==='me'))return s;}throw Error('no seed');}
async function layout(page,label){const r=await page.evaluate(()=>({ov:document.documentElement.scrollWidth-innerWidth,small:[...document.querySelectorAll('a,button,summary,input:not([type=checkbox]),label.chipcheck')].filter(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.width&&s.visibility!=='hidden'&&(b.height<43.5||b.width<43.5);}).map(e=>(e.textContent||e.id||'').trim().slice(0,20)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))}));
 ok(r.ov<=1,label+': no horizontal scroll');ok(r.small.length===0,label+': targets <44px '+r.small.join('|'));}
const lumJS=`(function(sel){function lum(c){var m=c.match(/[\\d.]+/g).map(Number).slice(0,3).map(function(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*m[0]+.7152*m[1]+.0722*m[2]}function bg(e){while(e){var c=getComputedStyle(e).backgroundColor,m=c.match(/[\\d.]+/g);if(m&&(m.length<4||Number(m[3])>0.95))return c;e=e.parentElement}return 'rgb(255,255,255)'}var o=[];document.querySelectorAll(sel).forEach(function(e){if(!e.getBoundingClientRect().width)return;var a=lum(getComputedStyle(e).color),b=lum(bg(e));o.push((Math.max(a,b)+.05)/(Math.min(a,b)+.05))});return o})`;
(async()=>{
 const browser=await chromium.launch();const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const swap=seedFor('sv','duo','mobil','swap');
  await page.goto(URL+'?seed='+swap);await page.waitForSelector('h1');
  ok(/Debattspelet/.test(await page.locator('h1').innerText()),'title');
  ok(await page.evaluate(()=>document.activeElement.id==='h1'),'heading focus');
  await layout(page,'home step 1');
  // Steg 1-3
  await page.click('[data-a=mode][data-m=duo]');ok(await page.locator('[data-a=mode][data-m=duo]').getAttribute('aria-pressed')==='true','mode pressed state');
  await page.click('[data-a=step][data-s="2"]');await layout(page,'home step 2');
  ok(await page.locator('.topic').count()===10,'ten topics');
  await page.click('[data-a=topic][data-t=mobil]');ok(await page.locator('[data-a=topic][data-t=mobil]').getAttribute('aria-pressed')==='true','topic selected');
  await page.click('[data-a=step][data-s="3"]');await page.fill('#nA','Ada');await page.fill('#nB','Bo');
  ok(/Ada[\s\S]*FÖR[\s\S]*Bo[\s\S]*EMOT/.test(await page.locator('.sidesrow').innerText()),'sides shown with names (text, not only colour)');
  await layout(page,'home step 3');
  await page.click('[data-a=prep]');await page.waitForSelector('.args');ok(await page.locator('.args li').count()===3,'prep shows three arguments');await page.click('[data-a=preptab][data-s=against]');ok(await page.locator('.args.against li').count()===3,'prep other side');await layout(page,'prep');
  await page.click('[data-a=start]');await page.waitForSelector('.turncard');
  ok(/Ada/.test(await page.locator('.who').innerText())&&/FÖR/.test(await page.locator('.who').innerText()),'A speaks first on FÖR');
  ok(/Runda 1 av 3/.test(await page.locator('.matchbar').innerText()),'round indicator');
  await layout(page,'play');
  // Hjälp utan facit
  await page.click('[data-a=idea]');await page.click('[data-a=ideapick][data-n="2"]');ok(/Argumentkort/i.test(await page.locator('.help').innerText())&&/inte facit/i.test(await page.locator('.help').innerText()),'argument card labelled as suggestion');
  // Pausa och återuppta
  await page.click('[data-a=pause]');await page.waitForSelector('.card.note');ok(/pausad match/i.test(await page.locator('.card.note').innerText()),'paused match offered on home');
  await page.reload();await page.waitForSelector('.card.note');await page.click('[data-a=resume]');await page.waitForSelector('.turncard');ok(/Runda 1 av 3/.test(await page.locator('.matchbar').innerText()),'resume after reload');
  // Joker: byt sida (seed ger swap som första kort)
  await page.goto(URL+'?seed='+swap);await page.waitForSelector('[data-a=resume]');await page.click('[data-a=discard]');await page.click('[data-a=step][data-s="2"]').catch(()=>{});
  await page.goto(URL+'?seed='+swap);await page.click('[data-a=step][data-s="2"]');await page.click('[data-a=topic][data-t=mobil]');await page.click('[data-a=step][data-s="3"]');await page.fill('#nA','Ada');await page.fill('#nB','Bo');await page.click('[data-a=start]');await page.waitForSelector('.turncard');
  await page.focus('[data-a=joker]');await page.keyboard.press('Enter');await page.waitForSelector('.jcard');
  ok(await page.locator('.jcard').getAttribute('aria-pressed')==='false'&&await page.locator('.sheet').evaluate(e=>e.contains(document.activeElement)),'joker card starts face-down, dialog takes focus');
  ok(await page.locator('[data-a=jclose]').count()===0,'cannot dismiss before turning the card');
  await page.keyboard.press('Enter');await page.waitForSelector('.jcard.flipped');ok(/Byt sida/.test(await page.locator('.jcard').innerText())&&/Sidorna byttes/.test(await page.locator('.sheet').innerText()),'flipped card says switch sides');
  await layout(page,'joker');
  await page.click('[data-a=jclose]');ok(/Ada/.test(await page.locator('.who').innerText())&&/EMOT/.test(await page.locator('.who').innerText()),'after the swap Ada argues the other side');
  ok(/Joker \(1\)/.test(await page.locator('[data-a=joker]').innerText()),'one joker used');
  // Tur klar → lyssnaren bockar av
  await page.click('[data-a=done]');await page.waitForSelector('.listencheck');ok(/Vad hörde du/.test(await page.locator('.listencheck').innerText()),'listener check');
  await page.locator('[data-heard=reason]').check();await page.locator('[data-heard=example]').check();await layout(page,'check');
  await page.click('[data-a=submit]');await page.waitForSelector('.turncard');ok(/Bo/.test(await page.locator('.who').innerText())&&/FÖR/.test(await page.locator('.who').innerText()),'Bo is next, now FÖR');
  await page.click('[data-a=done]');await page.locator('[data-heard=rebut]').check().catch(()=>{});await page.click('[data-a=submit]');
  await page.waitForSelector('[data-a=star]');ok(await page.locator('[data-a=star]').count()===3,'star question after both turns');await layout(page,'star');await page.click('[data-a=star][data-w="A"]');
  for(let r=0;r<2;r++){for(let t=0;t<2;t++){await page.click('[data-a=done]');await page.click('[data-a=submit]');}await page.waitForSelector('[data-a=star],.eyebrow',{timeout:3000}).catch(()=>{});if(await page.locator('[data-a=star]').count())await page.click('[data-a=star][data-w=N]');}
  await page.waitForFunction(()=>/Matchen är slut/i.test(document.body.innerText));
  ok(/Ada/.test(await page.locator('main').innerText())&&/Bo/.test(await page.locator('main').innerText()),'summary names both');
  ok(/Skäl/.test(await page.locator('main').innerText()),'summary lists skills heard');ok(/Prata om det efteråt/i.test(await page.locator('main').innerText()),'reflection prompts');
  await layout(page,'end');
  const store=await page.evaluate(()=>({p:localStorage.getItem('matteos.debatt.v1'),s:localStorage.getItem('matteos.debatt.save.v1')}));
  ok(store.p&&JSON.parse(store.p).profiles.guest.games===1&&!/Ada|Bo\b/.test(store.p),'progress stored as counts only, no names');ok(store.s===null,'saved match cleared at the end');
  await page.goto(URL);ok(await page.locator('.card.note').count()===0,'no resume card after the match');
  await page.click('details:has-text("Dina färdigheter") summary');ok(await page.locator('.skills li').count()===8,'skill meters');
  // Spela igen: sidor byts
  // ---------- Sololäge ----------
  const fact=seedFor('sv','solo','ai','fact');
  await page.goto(URL+'?seed='+fact);await page.click('[data-a=mode][data-m=solo]');await page.click('[data-a=step][data-s="2"]');await page.click('[data-a=topic][data-t=ai]');await page.click('[data-a=step][data-s="3"]');await page.click('[data-a=start]');await page.waitForSelector('.oppcard');
  ok(/motspelarens kort/i.test(await page.locator('.oppcard').innerText())&&/EMOT/.test(await page.locator('.oppcard').innerText()),'solo: opponent card from the other side');
  await page.click('[data-a=joker]');await page.click('[data-a=flip]');await page.waitForSelector('[data-a=factpick]');
  ok(/Fakta eller åsikt/.test(await page.locator('.jcard').innerText()),'fact joker');ok(await page.locator('[data-a=jclose]').count()===0,'cannot skip the fact question');
  await page.click('[data-a=factpick][data-k=opinion]');await page.waitForSelector('.fb');ok(/Fakta|Åsikt|Överdrift/.test(await page.locator('.fb').innerText()),'explains the kind');await page.click('[data-a=jclose]');
  await page.click('[data-a=done]');ok(/Hur gick det/.test(await page.locator('.listencheck').innerText()),'solo self check');await page.click('[data-a=submit]');
  await page.waitForSelector('.oppcard');const c1=await page.locator('.oppcard p').innerText();
  await page.click('[data-a=idea]');await page.click('[data-a=ideapick][data-n="3"]');ok(/Angrip|Titta på|Håll med/.test(await page.locator('.help').innerText()),'rebuttal pattern help');
  // ---------- Engelska ----------
  await page.goto(URL+'?lang=en');await page.waitForSelector('h1');ok(/The Debate Game/.test(await page.locator('h1').innerText()),'English UI');
  await page.click('[data-a=step][data-s="2"]');ok(/Phones should be locked/.test(await page.locator('.topic').first().innerText()),'English topics');await page.click('[data-a=step][data-s="3"]');await page.click('[data-a=start]');await page.waitForSelector('.turncard');
  ok(/Say what you think/.test(await page.locator('.turncard').innerText())&&/FOR/.test(await page.locator('.who').innerText()),'English turn');
  ok(await page.locator('a.back-svenska').innerText().then(t=>/English/.test(t)),'back link goes to English');
  // ---------- Dag/kväll, kontrast ----------
  for(const dark of [false,true]){
   await page.goto(URL+'?seed='+swap);await page.evaluate(d=>{document.documentElement.classList.toggle('dark',d);},dark);
   await page.click('[data-a=step][data-s="2"]');await page.click('[data-a=topic][data-t=mobil]');await page.click('[data-a=step][data-s="3"]');await page.click('[data-a=start]');await page.waitForSelector('.turncard');
   for(const sel of ['h1','.side','.turncard h1','.chip','.btn','.who b','.small']){const r=await page.evaluate(`(${lumJS})(${JSON.stringify(sel)})`);for(const x of r)ok(x>=4.5,(dark?'night ':'day ')+sel+' contrast '+x.toFixed(2));}
   await page.click('[data-a=joker]');await page.click('[data-a=flip]');await page.waitForSelector('.jcard.flipped');
   for(const sel of ['.jcard','.jcard b','.sheet p']){const r=await page.evaluate(`(${lumJS})(${JSON.stringify(sel)})`);for(const x of r)ok(x>=4.5,(dark?'night ':'day ')+sel+' contrast '+x.toFixed(2));}
  }
  await page.setViewportSize({width:320,height:640});await page.evaluate(()=>{document.documentElement.classList.remove('dark');});await page.goto(URL);await layout(page,'320 home');
  for(const w of [375,430,1280]){await page.setViewportSize({width:w,height:w>500?900:800});await page.goto(URL);await layout(page,w+' home');}
  // ---------- Reducerad rörelse ----------
  const rc=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),rp=await rc.newPage();rp.on('pageerror',e=>errors.push(String(e)));
  await rp.goto(URL+'?seed='+swap);await rp.click('[data-a=step][data-s="2"]');await rp.click('[data-a=topic][data-t=mobil]');await rp.click('[data-a=step][data-s="3"]');await rp.click('[data-a=start]');await rp.click('[data-a=joker]');
  ok(await rp.locator('.jback').isVisible()&&!(await rp.locator('.jfront').isVisible()),'reduced motion: back shown first');await rp.click('[data-a=flip]');
  ok(await rp.locator('.jfront').isVisible()&&!(await rp.locator('.jback').isVisible()),'reduced motion: front shown without animation');
  // ---------- Offline ----------
  const oc=await browser.newContext({viewport:{width:390,height:844}}),op=await oc.newPage();op.on('pageerror',e=>errors.push(String(e)));
  await op.goto(URL);await op.evaluate(()=>navigator.serviceWorker.ready);await op.reload();await op.waitForFunction(()=>caches.keys().then(k=>k.some(x=>x.includes('larande-5.4.0-simple'))));
  const cached=await op.evaluate(async()=>{const o=[];for(const k of await caches.keys()){const c=await caches.open(k);o.push(...(await c.keys()).map(r=>new URL(r.url).pathname.split('/').pop()));}return o;});
  ok(['debatt.html','debatt-app.js','debatt-core.js','debatt-content.js','debatt.css'].every(f=>cached.includes(f)),'offline cache holds the game');
  await oc.setOffline(true);await op.goto(URL);await op.waitForSelector('h1');ok(/Debattspelet/.test(await op.locator('h1').innerText()),'works offline');
  ok(errors.length===0,'no JavaScript errors: '+errors.join('|'));
  console.log('DEBATT E2E PASS: '+n+' checks');await browser.close();
 }catch(e){console.error(e);await browser.close();process.exit(1);}
})();
