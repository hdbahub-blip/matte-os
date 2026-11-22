'use strict';
// UX overhaul 5.6: shared dock on Studera/Study, one-column subject tiles, 44 px targets, no overflow at 320–430 and desktop.
const assert=require('node:assert/strict');const eng=process.argv[3]||'chromium';
const {chromium,webkit,firefox}=require('playwright');const E={chromium,webkit,firefox}[eng];
const B=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');let n=0;const ok=(c,m)=>{n++;assert(c,m);};
const small=()=>[...document.querySelectorAll('a,button,summary')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(!r.width||s.visibility==='hidden'||e.closest('li'))return false;return r.height<43||r.width<43;}).map(e=>(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,24));
(async()=>{const b=await E.launch(eng==='chromium'&&process.env.MATTE_BROWSER_EXE?{executablePath:process.env.MATTE_BROWSER_EXE}:{});
 for(const w of [320,375,390,430,1280]){const ctx=await b.newContext({viewport:{width:w,height:w>500?800:844},hasTouch:w<500,serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  for(const [name,u] of [['lara','lara/'],['sv','lara/#/sv'],['till','tillsammans/'],['studera','studera/'],['study','study/']]){
   await p.goto(B+u);await p.waitForTimeout(500);
   ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,w+' '+name+': no horizontal scroll');
   const s=await p.evaluate(small);ok(s.length===0,w+' '+name+': tap targets under 44 px: '+s);
   if(name==='study'){
    ok(await p.locator('a.brand[href="../"]').count()===1,w+': account header leads back to learning');
    ok(await p.locator('.mo-dock').evaluate(el=>getComputedStyle(el).display==='none'),w+': redundant student-account dock intentionally hidden');
    ok(await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom))>=36,w+': account content has safe bottom padding');
   }else{
    ok(await p.locator('nav').count()>=1,w+' '+name+': navigation to Start/Matte/Svenska/Engelska/Spela present');
    if(name==='studera'){const links=await p.locator('.mo-dock a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));ok(links.length===5&&links[0]==='../'&&links[4]==='../tillsammans/',w+' '+name+': shared dock links');
     const r=await p.locator('.mo-dock').boundingBox();ok(r.y+r.height<=(await p.evaluate(()=>innerHeight))+1,w+' '+name+': dock inside viewport');ok(await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('main')||document.body).paddingBottom))>=80,w+' '+name+': content not hidden behind dock');}
   }
   if(name==='lara'&&w<650){const t=await p.locator('.homegrid .subjectCard').evaluateAll(a=>a.map(x=>Math.round(x.getBoundingClientRect().top)));ok(t.length===2&&t[1]>t[0]+60,w+': subject tiles stack in one column');ok(await p.locator('.homegrid .subjectCard').first().evaluate(x=>x.getBoundingClientRect().height)<130,w+': subject tile not stretched');}
   if(name==='till'){ok(await p.locator('.logo').evaluate(x=>x.getBoundingClientRect().height)<=60,w+': Tillsammans brand on one line');}
  }
  ok(errs.length===0,w+': no JS errors '+errs);await ctx.close();}
 await b.close();console.log('UX POLISH E2E '+eng+' '+n+'/'+n+' PASS');})().catch(e=>{console.error(e);process.exit(1);});
