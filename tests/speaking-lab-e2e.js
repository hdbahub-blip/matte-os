'use strict';
/* Synthetic browser journeys, no real pupil accounts or recordings. */
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.MATTE_BROWSER_EXE?{executablePath:process.env.MATTE_BROWSER_EXE}:{})});
let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++};
try{
for(const width of [320,390,980]){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:width===320?'reduce':'no-preference'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base+'lara/speaking-lab.html',{waitUntil:'networkidle'});
 await page.locator('h1:has-text("Whatever the card")').waitFor();
 ok(await page.locator('button[data-action="mode"]').count()===3,'three ways to practise '+width);
 ok(await page.locator('.sl-pace-step').count()===4,'PACE on first screen '+width);
 if(width===390&&process.env.MATTE_SCREENSHOTS){await page.screenshot({path:'audit-speaking-home-390.png',fullPage:true});await page.locator('[data-action="cheat"]').click();await page.screenshot({path:'audit-speaking-guide-390.png',fullPage:true});await page.locator('[data-action="home"]').click();}
 ok(await page.locator('a[href="./#/studio/en"]').count()>=1,'safe return to English '+width);
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow on start '+width);
 await page.locator('[data-action="mode"][data-value="pair"]').click();
 await page.locator('[data-action="start"]').click();
 await page.locator('.sl-bigcard h1').waitFor();
 const first=await page.locator('.sl-bigcard h1').innerText();
 ok(first.endsWith('?')&&first.length>25,'original speaking prompt '+width);
 ok(await page.locator('.sl-topic').count()===1,'topic card '+width);
 ok(await page.locator('[data-action="clock"]').count()===1,'optional timer '+width);
 ok(await page.locator('[data-action="coach"][data-value="blank"]').count()===1,'blank rescue '+width);
 await page.locator('[data-action="coach"][data-value="blank"]').click();
 ok(await page.locator('.sl-coach').isVisible(),'blank rescue opens '+width);
 await page.locator('[data-action="coach"][data-value="excited"]').click();
 ok((await page.locator('.sl-coach').innerText()).includes('massor att säga'),'off-topic rescue '+width);
 await page.locator('details.sl-support').first().locator('summary').click();
 ok(await page.locator('.sl-support-inner strong').count()===4,'phrase guide visible '+width);
 await page.locator('[data-action="done"]').click();
 await page.locator('.sl-checklist').waitFor();
 ok(await page.locator('input[data-check]').count()===6,'six self-reflection criteria '+width);
 await page.locator('input[data-check="clear"]').check();
 await page.locator('input[data-check="reason"]').check();
 await page.locator('[data-action="feedback"]').click();
 ok(await page.locator('.sl-tip').count()===1,'feedback without grade '+width);
 await page.locator('[data-action="advance"]').click();
 ok((await page.locator('.sl-stepcard h2').innerText()).includes('Person 2'),'listening partner speaks '+width);
 ok((await page.locator('.sl-listenmission').innerText()).includes('Lyssna – och bygg vidare'),'second speaker reacts to partner '+width);
 await page.locator('[data-action="done"]').click();
 await page.locator('[data-action="advance"]').click();
 await page.locator('h1:has-text("Good conversation")').waitFor();
 ok(await page.locator('.sl-finish').count()===1,'both speakers complete before next '+width);
 await page.locator('[data-action="advance"]').click();
 ok((await page.locator('.sl-bigcard h1').innerText())!==first,'new topic without repeat '+width);
 await page.reload({waitUntil:'networkidle'});
 ok(await page.locator('.sl-resume').count()===1,'only session state resumes '+width);
 await page.locator('[data-action="resume"]').click();
 ok(await page.locator('.sl-bigcard').count()===1,'resume works '+width);
 const privatePayload=await page.evaluate(()=>sessionStorage.getItem('matteos.speaking-lab.session.v1')||'');
 ok(!/password|email|transcript|writtenAnswer|audio/.test(privatePayload),'no answers or identity stored '+width);
 const links=await page.locator('a[href]').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));
 ok(links.some(x=>x.includes('#/studio/en')),'return link exists '+width);
 await page.locator('[data-action="theme"]').click();
 ok(await page.locator('html').getAttribute('data-sl-theme')==='dark','dark toggle '+width);
 const contrast=await page.locator('.sl-bigcard h1').evaluate(x=>{const a=getComputedStyle(x),b=getComputedStyle(x.closest('.sl-bigcard'));return{color:a.color,bg:b.backgroundImage}});
 ok(contrast.color==='rgb(249, 249, 255)','light text on dark card '+width);
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow on card '+width);
 ok(errors.length===0,'no JS errors '+width+': '+errors.join(' | '));
 if(width===390&&process.env.MATTE_SCREENSHOTS){await page.screenshot({path:'audit-speaking-card-390.png',fullPage:true});await page.locator('[data-action="cheat"]').count()&&await page.locator('[data-action="cheat"]').first().click();await page.screenshot({path:'audit-speaking-cheat-390.png',fullPage:true});}
 await context.close();
}
const group=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),g=await group.newPage();
await g.goto(base+'lara/speaking-lab.html',{waitUntil:'networkidle'});await g.locator('[data-action="mode"][data-value="group"]').click();await g.locator('[data-action="start"]').click();
for(let i=0;i<4;i++){ok((await g.locator('.sl-stepcard h2').innerText()).includes('Person '+(i+1)),'group voice '+(i+1));await g.locator('[data-action="done"]').click();await g.locator('[data-action="advance"]').click();}
ok(await g.locator('.sl-finish').count()===1,'group finishes after four turns');await group.close();
const single=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),sg=await single.newPage();
await sg.goto(base+'lara/speaking-lab.html',{waitUntil:'networkidle'});await sg.locator('[data-action="start"]').click();
await sg.locator('[data-action="done"]').click();await sg.locator('[data-action="advance"]').click();
ok(await sg.locator('.sl-finish').count()===1,'solo completes in one speaker');await single.close();
console.log('SPEAKING LAB E2E '+checks+'/'+checks+' PASS');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
