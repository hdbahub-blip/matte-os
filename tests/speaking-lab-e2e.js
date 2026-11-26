'use strict';
/* Screenshot / navigation / learning-journey tests with synthetic settings only. */
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.MATTE_BROWSER_EXE?{executablePath:process.env.MATTE_BROWSER_EXE}:{})});
let n=0;const ok=(v,label)=>{assert.ok(v,label);n++};
try{
 for(const width of [320,390,980]){
  const context=await browser.newContext({viewport:{width,height:820},serviceWorkers:'block',reducedMotion:width===320?'reduce':'no-preference'});
  const p=await context.newPage(),errors=[];p.on('pageerror',x=>errors.push(x.message));
  await p.goto(base+'lara/speaking-lab.html',{waitUntil:'networkidle'});
  await p.locator('.ss-card h1').waitFor();
  const first=await p.locator('.ss-card h1').innerText();
  ok(first.endsWith('?'),'topic question shown without any setup click '+width);
  ok(await p.locator('.ss-example').count()===2,'two concrete examples immediately displayed '+width);
  ok(await p.locator('.ss-example li').count()===8,'each example has four explicit PACE lines '+width);
  const firstModel=await p.locator('.ss-example').first().locator('li [lang=en]').first().innerText();
  ok((await p.locator('.ss-rescueitem').first().innerText()).includes(firstModel),'help uses a complete sentence about the actual card '+width);
  ok(await p.locator('[data-act="next-card"]').count()===1,'one-click next topic '+width);
  ok(await p.locator('[data-act="turn"]').count()===1,'one-click next turn '+width);
  ok(await p.locator('.ss-guidehero').count()===0,'no separate guide screen before speaking '+width);
  ok(await p.locator('input').count()===0,'no mandatory input or six-point checklist '+width);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal scroll on start '+width);
  await p.locator('[data-act="guide"]').click();
  await p.locator('.ss-guidehero h1').waitFor();
  ok(await p.locator('.ss-guidegrid .ss-guidestep').count()===4,'four understandable steps '+width);
  ok(await p.locator('.ss-guideexample').count()===2,'two distinct worked topics on universal guide '+width);
  ok(await p.locator('.ss-guideexample .ss-example').count()===4,'both worked answers per demonstration topic '+width);
  await p.locator('[data-act="back"]').first().click();
  await p.locator('.ss-card h1').waitFor();
  ok((await p.locator('.ss-card h1').innerText())===first,'return to same question without losing progress '+width);
  await p.locator('[data-act="builder"]').click();
  await p.locator('#sentence-builder').waitFor();
  ok(await p.locator('.ss-buildstep').count()===4,'one in-place sentence-building panel '+width);
  const before=await p.locator('.ss-built p[lang=en]').innerText();
  await p.locator('[data-act="pick"][data-part="0"][data-choice="1"]').click();
  const after=await p.locator('.ss-built p[lang=en]').innerText();
  ok(before!==after,'real sentence swaps to meaningful alternative '+width);
  ok((await p.locator('.ss-card h1').innerText())===first,'builder does not change topic '+width);
  await p.locator('[data-act="mode"][data-mode="pair"]').click();
  ok((await p.locator('.ss-turnhead h2').innerText()).includes('Person 1'),'pair starts at person one '+width);
  await p.locator('[data-act="turn"]').click();
  ok((await p.locator('.ss-turnhead h2').innerText()).includes('Person 2'),'second partner without reflection gate '+width);
  ok((await p.locator('.ss-card h1').innerText())===first,'both partners work on same card '+width);
  ok(await p.locator('.ss-reply').count()===1,'second speaker reminded to listen and answer '+width);
  await p.locator('[data-act="turn"]').click();
  const second=await p.locator('.ss-card h1').innerText();
  ok(second!==first,'completed card moves to fresh card in one click '+width);
  await p.reload({waitUntil:'networkidle'});
  ok((await p.locator('.ss-card h1').innerText())===second,'temporary card restored automatically '+width);
  const store=await p.evaluate(()=>sessionStorage.getItem('matteos.speaking-lab.session.v1')||'');
  ok(!/audio|email|transcript|answerText|password/i.test(store),'no answer recordings or personal data persisted '+width);
  await p.locator('.ss-details summary').click();
  await p.locator('#ss-topic-filter').selectOption('society');
  ok((await p.locator('.ss-category').innerText()).includes('Samhälle'),'optional category changes topic without setup wizard '+width);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal scroll after interactions '+width);
  ok(errors.length===0,'no script errors '+width+':'+errors.join(';'));
  if(width===390&&process.env.MATTE_SCREENSHOTS)await p.screenshot({path:'speaking-simple-390.png',fullPage:true});
  await context.close();
 }
 const group=await browser.newContext({viewport:{width:390,height:820},serviceWorkers:'block'}),g=await group.newPage();
 await g.goto(base+'lara/speaking-lab.html',{waitUntil:'networkidle'});
 await g.locator('[data-act="mode"][data-mode="group"]').click();
 const firstG=await g.locator('.ss-card h1').innerText();
 for(let i=1;i<=4;i++){ok((await g.locator('.ss-turnhead h2').innerText()).includes('Person '+i),'group participant '+i);await g.locator('[data-act="turn"]').click();}
 ok((await g.locator('.ss-card h1').innerText())!==firstG,'group proceeds after all have spoken');await group.close();
 const light=await browser.newContext({viewport:{width:390,height:820},serviceWorkers:'block'}),d=await light.newPage();
 await d.addInitScript(()=>localStorage.setItem('matteos.appearance.v1','dark'));
 await d.goto(base+'lara/speaking-lab.html',{waitUntil:'networkidle'});
 ok(await d.locator('html').getAttribute('data-ss-theme')==='dark','dark theme follows app preference');
 const color=await d.locator('.ss-card h1').evaluate(x=>getComputedStyle(x).color);
 ok(color==='rgb(248, 250, 255)','high-contrast light text in dark mode');
 await light.close();
 console.log('SPEAKING SIMPLE E2E '+n+'/'+n+' PASS');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
