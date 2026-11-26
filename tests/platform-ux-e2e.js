'use strict';
/* Synthetic mobile+desktop learner journeys. Never authenticates or writes backend data. */
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.MATTE_BROWSER_EXE?{executablePath:process.env.MATTE_BROWSER_EXE}:{})});
let n=0;const ok=(x,m)=>{assert.ok(x,m);n++};
const surfaces=[
 ['welcome',''],['study-login','study/'],['parent-login','foralder/'],['learn-home','lara/'],
 ['swedish-studio','lara/#/studio/sv'],['english-studio','lara/#/studio/en'],['game-hub','lara/#/spel'],
 ['english-solo-quiz','lara/#/studio-game/en/quiz/solo'],['english-solo-match','lara/#/studio-game/en/match/solo'],
 ['english-solo-order','lara/#/studio-game/en/order/solo'],['english-solo-talk','lara/#/studio-game/en/talk/solo'],
 ['speak-quest','lara/speaking-lab.html'],['speaking-guide','lara/speaking-lab.html#guide'],
 ['english-debate','lara/debatt.html?lang=en'],['swedish-debate','lara/debatt.html?lang=sv'],['swedish-oral','lara/np-muntligt.html'],
 ['math-exams','prov/'],['together','tillsammans/'],['together-live','tillsammans/live.html'],['study-together','studera/'],
 ['study-tips','smart/'],['formula-posters','affischer/'],['math-table','tabell/'],['updater','uppdatera.html']
];
try{
 for(const width of [320,390,980]){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
  for(const [name,path] of surfaces){
   const p=await context.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));
   const response=await p.goto(base+path,{waitUntil:'domcontentloaded',timeout:15000});
   await p.waitForTimeout(70);
   ok(response?.status()===200,'HTTP 200 '+name+' '+width);
   ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal scrolling '+name+' '+width);
   ok(errs.length===0,'no runtime JS errors '+name+' '+width+': '+errs.join(';'));
   ok(await p.locator('link[href*="unified-student-ui.css"]').count()===1,'shared input/focus design '+name+' '+width);
   if(name.startsWith('english-')&&name!=='english-debate'||name==='speak-quest'||name==='speaking-guide'){
    ok(await p.locator('html').getAttribute('lang')==='en','correct English document lang '+name+' '+width);
   }
   if(name==='english-studio'){
    ok(await p.getByText('Speak Quest – play and speak').count()===1,'English featured call to action '+width);
    ok(await p.getByText('Year 9').count()>=1,'English school year '+width);
    ok(await p.locator('.ls-shelf-grid > a').count()===7,'all 7 English skills preserved '+width);
    ok(await p.locator('.ls-game-grid > a').count()===4,'4 minigames preserved '+width);
    ok(await p.locator('.ls-more').count()===1,'extra study options collapsed by default '+width);
    ok(!/Årskurs|Börja här|Ingen tidspress|Fler sätt att öva/.test(await p.locator('.ls-root').innerText()),'no Swedish on English learning hub '+width);
    const gameHref=await p.getByText('Quick five',{exact:true}).first().evaluate(x=>x.closest('a')?.getAttribute('href'));
    ok(gameHref?.endsWith('/quiz/solo'),'English quiz launches directly '+width);
   }
   if(name==='speak-quest'){
    ok(await p.locator('.sp-choices .sp-choice').count()===2,'first game step visible instantly '+width);
    ok(await p.locator('.sp-sample-body').count()===0,'long examples not forced on student '+width);
    const visible=await p.locator('main').innerText();
    ok(!/Lyssna|Nästa kort|Visa en ledtråd|Jag vill svara|Fastnat|Till Engelska/.test(visible),'no Swedish main English screen '+width);
   }
   if(name==='speaking-guide')ok((await p.locator('.sp-guide h1').innerText())==='Talk about almost anything','English guide '+width);
   if(name==='english-debate')ok(await p.locator('html').getAttribute('lang')==='en','debate English semantics '+width);
   if(name==='swedish-debate')ok(await p.locator('html').getAttribute('lang')==='sv','Swedish game unaffected '+width);
   if(name==='swedish-studio')ok(await p.locator('html').getAttribute('lang')==='sv','Swedish remains Swedish '+width);
   await p.close();
  }
  await context.close();
 }
 for(const width of [390,980]){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),p=await context.newPage();
  await p.goto(base+'lara/#/studio/en',{waitUntil:'domcontentloaded'});
  await p.getByText('Speak Quest – play and speak').click();
  await p.locator('.sp-question h1').waitFor();
  ok((await p.locator('html').getAttribute('lang'))==='en','hub to speaking preserves English '+width);
  await p.locator('[data-action="help"]').click();
  ok((await p.locator('.sp-helpbody').innerText()).includes('Mind went blank'),'English context help '+width);
  await p.locator('[data-action="guide"]').click();
  ok((await p.locator('.sp-guide').innerText()).includes('Talk about almost anything'),'guide English '+width);
  await p.locator('[data-action="close-guide"]').first().click();
  await p.locator('[data-action="examples"]').click();
  ok(await p.locator('.sp-sample-paragraph').count()===1,'one optional sample at a time '+width);
  await p.locator('.sp-back').click();
  await p.locator('.ls-root[data-ls-screen="hub"]').waitFor();
  ok((await p.locator('html').getAttribute('lang'))==='en','return to English hub '+width);
  await p.locator('.ls-game-grid a[href*="/quiz/solo"]').click();
  await p.locator('[data-ls-screen="game-quiz"]').waitFor();
  ok(await p.locator('html').getAttribute('lang')==='en','one tap directly to mini game '+width);
  ok(await p.locator('.ls-answer').count()===4,'real quiz answer options '+width);
  await p.goto(base+'lara/#/studio/sv',{waitUntil:'domcontentloaded'});
  ok((await p.locator('html').getAttribute('lang'))==='sv','back to Swedish restores semantics '+width);
  await p.goto(base+'tillsammans/',{waitUntil:'domcontentloaded'});
  await p.locator('[data-action="choose-topic"][data-topic="en"]').click();
  ok(await p.locator('html').getAttribute('lang')==='en','Together switches to English '+width);
  ok((await p.locator('main').innerText()).includes('What would you like to practise?'),'Together welcome English '+width);
  await p.locator('[data-action="quick-solo"]').click();
  ok((await p.locator('main').innerText()).includes('Submit my answer'),'Together game actions in English '+width);
  ok(!(await p.locator('main').innerText()).includes('Lämna mitt svar'),'no Swedish submit in English game '+width);
  await p.locator('[data-action="home"]').first().click();
  await p.locator('[data-action="choose-topic"][data-topic="sv"]').click();
  ok(await p.locator('html').getAttribute('lang')==='sv','Together returns to Swedish language '+width);
  ok((await p.locator('main').innerText()).includes('Vad vill ni öva?'),'Swedish restored, no translated contamination '+width);
  await p.close();await context.close();
 }
 console.log('PLATFORM UX E2E '+n+'/'+n+' PASS · '+surfaces.length+' routes × 3 viewports + real English/Swedish navigation');
}finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
