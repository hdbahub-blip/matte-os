'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const modes=process.argv[3]==='chromium'?[['Chromium',chromium]]:process.argv[3]==='webkit'?[['WebKit',webkit]]:[['Chromium',chromium],['WebKit',webkit]];
(async()=>{
let checks=0;const ok=(value,message)=>{assert(value,message);checks++};
for(const [engineName,engine] of modes){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430,920]){
   const context=await browser.newContext({viewport:{width,height:width===920?635:844},locale:'sv-SE',serviceWorkers:'block'});
   const p=await context.newPage();const errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base,{waitUntil:'domcontentloaded'});
   await p.locator('.pc-onboarding #pc-title').waitFor();
   ok(await p.locator('.pc-primary-login').isVisible(),engineName+' '+width+' has prominent account sign in');
   ok(await p.locator('#pc-login #pc-email').isVisible()&&await p.locator('#pc-login #pc-pass').isVisible(),engineName+' '+width+' login-first: inline account sign in (same account system)');
   ok(await p.locator('.pc-school-grid .pc-grade').count()===2,engineName+' '+width+' two local school choices');
   ok(await p.locator('.pc-advanced .pc-guest').first().isHidden(),engineName+' '+width+' joker extras collapsed');
   const first=await p.evaluate(()=>({
    rootOverflow:document.documentElement.scrollWidth-innerWidth,
    login:document.querySelector('.pc-primary-login').getBoundingClientRect().toJSON(),
    grade:document.querySelector('.pc-grade').getBoundingClientRect().toJSON()
   }));
   ok(first.rootOverflow<=1&&first.login.width>100&&first.grade.width>=120,engineName+' '+width+' entry fits width '+JSON.stringify(first));
   await p.locator('.pc-advanced > summary').click();
   ok(await p.locator('.pc-advanced .pc-guest').first().isVisible(),engineName+' '+width+' all extra modes accessible');
   await p.locator('.pc-grade8').first().click();
   await p.locator('.ux-tiles').waitFor();
   ok(await p.locator('.ux-tiles .ux-tile').count()===4,engineName+' '+width+' four immediate destinations');
   ok((await p.locator('.ux-kicker').textContent()).trim()==='Årskurs 8 · Utan konto',engineName+' '+width+' mode is not misleading');
   ok(await p.locator('nav.nav').isHidden(),engineName+' '+width+' no duplicate bottom navigation on home');
   ok(await p.locator('.top-in .quick-login').isVisible(),engineName+' '+width+' guest can sign in');
   const home=await p.evaluate(()=>({
    rootOverflow:document.documentElement.scrollWidth-innerWidth,
    tiles:[...document.querySelectorAll('.ux-tiles .ux-tile')].map(x=>x.getBoundingClientRect().toJSON()),
    login:document.querySelector('.top-in .quick-login').getBoundingClientRect().toJSON()
   }));
   ok(home.rootOverflow<=1&&home.tiles.every(t=>t.height<=175&&t.width>0)&&home.login.width>=65,engineName+' '+width+' home compact fit '+JSON.stringify(home));
   await p.locator('.top-in [data-a=profile]').click();
   await p.locator('.pc-sheet #pc-title').waitFor();
   ok(await p.locator('.pc-sheet .pc-primary-login').isVisible(),engineName+' '+width+' profile sheet retains login');
   await p.locator('.pc-sheet .pc-grade9').click();
   await p.locator('.ux-kicker').waitFor();
   ok((await p.locator('.ux-kicker').textContent()).trim()==='Årskurs 9 · Utan konto',engineName+' '+width+' safe local switch');
   ok(errors.length===0,engineName+' '+width+' no JavaScript errors: '+errors.join('|'));
   await context.close();
  }
 }finally{await browser.close()}
}
console.log('SIMPLE FIRST USE '+checks+'/'+checks+' PASS');
})().catch(e=>{console.error(e);process.exit(1)});
