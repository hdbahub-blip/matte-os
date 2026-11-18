'use strict';
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
(async()=>{
let checks=0;
const ok=(v,msg)=>{assert(v,msg);checks++};
const engines=process.argv[3]==='chromium'?[['Chromium',chromium]]:process.argv[3]==='webkit'?[['WebKit',webkit]]:[['Chromium',chromium],['WebKit',webkit]];
for(const [name,engine] of engines){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430,920]){
   const context=await browser.newContext({viewport:{width,height:width===920?680:844},serviceWorkers:'block',locale:'sv-SE'});
   await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* synthetic; no account access */'}));
   const p=await context.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto(new URL('study/',base).href,{waitUntil:'domcontentloaded'});
   await p.locator('form#auth').waitFor();
   ok(await p.locator('form#auth').isVisible(),name+' '+width+' login form visible');
   ok(await p.locator('#email').count()===1&&await p.locator('#password').count()===1,name+' '+width+' original credentials kept');
   ok(await p.locator('form#auth button[type="submit"]').innerText()==='Logga in',name+' '+width+' normal sign-in action');
   ok(await p.getByText('Så kommer du igång').count()===0,name+' '+width+' no giant onboarding section');
   ok(await p.locator('.study-steps').count()===0,name+' '+width+' no administrative steps');
   ok(!((await p.locator('main').innerText()).includes('Authentication → Users')),name+' '+width+' admin console instructions removed');
   ok(await p.locator('#auth .note').count()===1,name+' '+width+' short guidance remains');
   const layout=await p.evaluate(()=>{
     const f=document.querySelector('#auth').getBoundingClientRect();
     const shell=document.querySelector('.auth-layout').getBoundingClientRect();
     const top=document.querySelector('.setup-hero').getBoundingClientRect();
     return {docScrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,form:f.toJSON(),layout:shell.toJSON(),hero:top.toJSON(),grid:getComputedStyle(document.querySelector('.auth-layout')).gridTemplateColumns};
   });
   ok(layout.docScrollWidth<=width+2,name+' '+width+' no horizontal overflow '+JSON.stringify(layout));
   ok(layout.form.width>200&&layout.form.right<=width+2&&layout.form.left>=0,name+' '+width+' form fits screen '+JSON.stringify(layout.form));
   ok(layout.grid.split(' ').length===1,name+' '+width+' one column layout '+layout.grid);
   ok(errors.length===0,name+' '+width+' no errors '+errors.join('|'));
   await context.close();
  }
 }finally{await browser.close()}
}
console.log('COMPACT STUDY LOGIN '+checks+'/'+checks+' PASS');
})().catch(e=>{console.error(e);process.exit(1)});
