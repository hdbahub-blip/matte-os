'use strict';
/* Real browser verification of all four grade/mode palettes across all four app surfaces.
   Uses synthetic profiles and blocks service workers to avoid stale cache interference. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const output=path.join('test-screenshots','color-harmony');
fs.mkdirSync(output,{recursive:true});
function l(hex){const xs=hex.match(/\d+(?:\.\d+)?/g).slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*xs[0]+.7152*xs[1]+.0722*xs[2]}
function contrast(a,b){const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
(async()=>{
 let n=0;const browser=await chromium.launch({headless:true});
 try{
  for(const grade of ['grade8','grade9'])for(const mode of ['light','dark']){
   const context=await browser.newContext({viewport:{width:375,height:812},serviceWorkers:'block'});
   const page=await context.newPage();page.setDefaultTimeout(18000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.locator('[data-p="'+grade+'"]').click();
   await page.locator('nav.nav').waitFor();
   if(mode==='dark')await page.locator('[data-a="appearance"]').first().click();
   await page.locator('html[data-mode="'+mode+'"]').waitFor();
   async function verify(name,readySelector){
     if(readySelector)await page.locator(readySelector).waitFor();
     await page.locator('html[data-mode="'+mode+'"]').waitFor();
     const info=await page.evaluate(()=>{
       const html=document.documentElement,css=getComputedStyle(html),body=getComputedStyle(document.body);
       return {
         bg:body.backgroundColor,ink:body.color,primary:css.getPropertyValue('--ui-primary').trim(),
         surface:css.getPropertyValue('--ui-surface').trim(),muted:css.getPropertyValue('--ui-muted').trim(),
         meta:document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
         canvas:css.getPropertyValue('--ui-canvas').trim(),
         scroll:html.scrollWidth,width:html.clientWidth
       };
     });
     assert.equal(info.canvas,grade==='grade8'?(mode==='dark'?'#10151D':'#F7F9FC'):(mode==='dark'?'#111216':'#F8F8F8'),name+' canvas');
     assert.equal(info.meta,info.canvas,name+' PWA status bar matches mode');
     assert.ok(contrast(info.ink,info.bg)>=7,name+' body text contrast '+contrast(info.ink,info.bg));
     assert.ok(info.scroll<=info.width+2,name+' no sideways scroll '+info.scroll+'/'+info.width);
     n+=4;
     await page.screenshot({path:path.join(output,grade+'-'+mode+'-'+name+'.png'),fullPage:false});
   }
   await verify('mathematics','nav.nav');
   await page.goto(base+'#/tabell/home',{waitUntil:'domcontentloaded'});
   await page.locator('#arena .selected-front').waitFor();
   const table=await page.locator('#arena .selected-front').evaluate(x=>{
     const root=x.closest('.arena-app'),s=getComputedStyle(root);
     return {background:s.backgroundColor,foreground:s.color,accent:s.getPropertyValue('--accent').trim()};
   });
   const bg=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ui-canvas').trim());
   const accent=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ui-primary').trim());
   assert.equal(table.accent,accent,'Table arena inherits selected grade accent');
   assert.ok(contrast(table.foreground,table.background)>=7,'Table arena reading contrast');
   n+=2;
   await page.screenshot({path:path.join(output,grade+'-'+mode+'-tables.png')});
   await page.goto(base+'lara/#/sv',{waitUntil:'domcontentloaded'});
   await page.locator('nav.bottom').waitFor();
   await page.locator('html[data-profile="'+grade+'"]').waitFor();
   await verify('reading','nav.bottom');
   await page.goto(base+'prov/?g='+grade,{waitUntil:'domcontentloaded'});
   await page.locator('html[data-exam-grade="'+grade+'"]').waitFor();
   await verify('exam','.top');
   assert.deepEqual(errors,[],grade+'/'+mode+' JavaScript errors');n++;
   await context.close();
  }
  console.log('Color-system real mobile browser: '+n+'/'+n+' PASS, 16 screenshots');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
