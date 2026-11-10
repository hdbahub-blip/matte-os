'use strict';
/* Parent E2E: grade 8 vs grade 9, local-only reading, code lock, dark, offline routes and cross-device snapshot.
   Synthetic progress only. Service workers disabled for browser determinism (SW content separately tested). */
const assert=require('node:assert/strict'),{chromium,devices}=require('playwright');
const rootURL=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const now=Date.now();let n=0;
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const setting of ['iPhone 13','Desktop Chrome']){
   const device=setting==='iPhone 13'?devices['iPhone 13']:{viewport:{width:1150,height:850}};
   const context=await browser.newContext({...device,serviceWorkers:'block',acceptDownloads:true});
   const p=await context.newPage();p.setDefaultTimeout(18000);
   const errs=[];p.on('pageerror',e=>errs.push(e.message));
   await p.goto(rootURL,{waitUntil:'domcontentloaded'});
   const before=await p.evaluate(now=>{
     const math={v:5,active:'grade8',profiles:{grade8:{name:'Elev 8',attempts:[],lessons:{},rests:{},tests:[],tables:{facts:{},sessions:[]}},grade9:{name:'Elev 9',attempts:[],lessons:{},rests:{},tests:[],tables:{facts:{},sessions:[]}}}};
     localStorage.setItem('matteos.v5',JSON.stringify(math));
     localStorage.setItem('matteos.larande.v1',JSON.stringify({v:1,active:'grade8',profiles:{grade8:{attempts:[],baseline:{}},grade9:{attempts:[],baseline:{}}}}));
     localStorage.setItem('matte-prov-v1',JSON.stringify({grade:'grade8',attempts:[{grade:'grade8',chapter:'f8-geo',mode:'prov',correct:7,total:10,percent:70,finishedAt:now,results:[{raw:'CONFIDENTIAL_EXAM_ANSWER'}]}],attemptNo:1}));
     return localStorage.getItem('matteos.v5');
   },now);
   await p.locator('a.parent-profile-card[href="foralder/"]').click();
   await p.waitForURL(/\/foralder\//);
   await p.locator('form#setup').waitFor();n++;
   await p.locator('#pin').fill('384729');await p.locator('#pin2').fill('384729');
   await p.locator('form#setup button[type=submit]').click();
   await p.locator('nav.seg button[data-view="grade8"]').waitFor();n++;
   assert.equal(await p.locator('.student').count(),2);n++;
   await p.locator('nav.seg button[data-view="grade8"]').click();
   await p.locator('h1').filter({hasText:/Elev 8/}).waitFor();n++;
   assert.match(await p.locator('#exams').innerText(),/7 av 10|7\s*\/\s*10|70%/);n++;
   const after=await p.evaluate(()=>localStorage.getItem('matteos.v5'));
   assert.equal(before,after,'Opening parent must not modify learner records');n++;
   await p.locator('[data-action="theme"]').click();
   assert.equal(await p.locator('html').getAttribute('data-mode'),'dark');n++;
   const noOverflow=await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2);
   assert(noOverflow,'Parent 375px width cannot overflow');n++;
   await p.locator('button[data-action=lock]').click();
   await p.locator('form#unlock').waitFor();n++;
   await p.locator('#pin').fill('123456');await p.locator('form#unlock button[type=submit]').click();
   await p.locator('.notice.error').filter({hasText:'Koden stämmer inte.'}).waitFor(); // Authenticate completes asynchronously before retry.
   assert.equal(await p.locator('form#unlock').count(),1,'Wrong PIN does not unlock');n++;
   await p.locator('#pin').fill('384729');await p.locator('form#unlock button[type=submit]').click();
   await p.locator('.student').first().waitFor({timeout:20000}).catch(()=>{});
   await p.locator('nav.seg').waitFor();n++;
   // Guest /dela export is grade-scoped, bounded, and excludes raw exam answers.
   await p.goto(rootURL+'foralder/#/dela/grade8',{waitUntil:'domcontentloaded'});
   await p.locator('button[data-action="download-report"]').waitFor();n++;
   const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('[data-action="download-report"]').click()]);
   const stream=await dl.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
   const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   assert.equal(data.grade,'grade8');n++;
   assert(!JSON.stringify(data).includes('CONFIDENTIAL_EXAM_ANSWER'));n++;
   // New phone starts with no student progress: import resulting private report.
   const context2=await browser.newContext({...device,serviceWorkers:'block'});
   const other=await context2.newPage();other.setDefaultTimeout(20000);
   await other.goto(rootURL+'foralder/',{waitUntil:'domcontentloaded'});
   await other.locator('#pin').fill('111222');await other.locator('#pin2').fill('111222');await other.locator('#setup button[type=submit]').click();
   await other.locator('button[data-action="pickfile"]').click();
   await other.locator('input#importInput').setInputFiles({name:'rapport.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
   await other.locator('[data-action="confirm-import"]').waitFor();n++;
   await other.locator('[data-action="confirm-import"]').click();
   await other.locator('nav.seg button[data-view="grade8"]').click();
   await other.locator('#exams').waitFor();
   assert.match(await other.locator('#exams').innerText(),/7 av 10|7\s*\/\s*10|70%/,'Imported exam results visible on other device');n++;
   assert.equal(await other.evaluate(()=>localStorage.getItem('matte-prov-v1')),null,'Import never overwrites original exam history');n++;
   assert.equal(await other.locator('body').textContent().then(x=>x.includes('CONFIDENTIAL_EXAM_ANSWER')),false,'Raw exam answers are never presented');n++;
   await context2.close();
   assert.deepEqual(errs,[],'No browser JS errors');n++;
   await context.close();
  }
  console.log('Parent Insights browser E2E '+n+'/'+n+' PASS — mobile/desktop, profiles, PIN, dark, export, import and privacy');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
