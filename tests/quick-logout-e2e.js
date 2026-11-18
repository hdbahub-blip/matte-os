'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=process.argv[2]||'http://127.0.0.1:8765/';
const ID='12345678-1234-4234-8234-123456789123';
let checks=0;
function ok(value,message){assert(value,message);checks++;}
function seedOffline({ID}){
 if(sessionStorage.getItem('quickLogoutSeeded'))return;
 sessionStorage.setItem('quickLogoutSeeded','1');
 localStorage.setItem('matteos-study-auth-v1',JSON.stringify({user:{id:ID},access_token:'synthetic-not-valid'}));
 localStorage.setItem('matteos.study.identity.v1',JSON.stringify({user_id:ID,grade:'grade9',role:'learner',display_name:'Testperson'}));
 localStorage.setItem('matteos.study.workspace-owner.v1',ID);
 localStorage.setItem('matteos.v5',JSON.stringify({v:5,active:'grade9',profiles:{grade8:{name:'A'},grade9:{name:'B'}}}));
}
function inViewport(rect,width){return rect&&rect.width>=65&&rect.x>=-1&&rect.x+rect.width<=width+1;}
(async()=>{
 const engines=process.argv[3]==='chromium'?[['Chromium',chromium]]:process.argv[3]==='webkit'?[['WebKit',webkit]]:[['Chromium',chromium],['WebKit',webkit]];
 for(const [label,engine] of engines){
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [320,390]){
    for(const pagePath of ['', 'lara/', 'prov/']){
     const context=await browser.newContext({viewport:{width,height:740},locale:'sv-SE',serviceWorkers:'block'});
     await context.route('https://cdn.jsdelivr.net/**',r=>r.abort('failed'));
     await context.addInitScript(seedOffline,{ID});
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     await page.goto(new URL(pagePath,BASE).href,{waitUntil:'domcontentloaded'});
     await page.locator('.quick-logout').first().waitFor({timeout:12000});
     const btn=page.locator('.quick-logout').first(),rect=await btn.boundingBox();
     ok(inViewport(rect,width),label+' '+width+' '+pagePath+' logout visible without clipping '+JSON.stringify(rect));
     ok(await btn.getAttribute('href')===(pagePath?'../study/?logout=1':'study/?logout=1'),label+' '+pagePath+' linked to real account exit');
     if(pagePath===''){
      await btn.click();
      await page.locator('#auth').waitFor({timeout:12000});
      ok(!new URL(page.url()).searchParams.has('logout'),label+' query token cleared');
      const result=await page.evaluate(({ID})=>({
       auth:localStorage.getItem('matteos-study-auth-v1'),
       identity:localStorage.getItem('matteos.study.identity.v1'),
       owner:localStorage.getItem('matteos.study.workspace-owner.v1'),
       archive:localStorage.getItem('matteos.study.workspace.v1.'+ID)
      }),{ID});
      ok(result.auth===null&&result.identity===null&&result.owner===null,label+' local session removed');
      ok(result.archive!==null&&result.archive.includes('matteos.v5'),label+' original progress isolated in owner vault');
      await page.goto(BASE,{waitUntil:'domcontentloaded'});
      ok(await page.locator('.quick-logout').count()===0,label+' logged-out guest sees no logout control');
     }
     ok(errors.length===0,label+' '+pagePath+' no page exceptions '+errors.join('|'));
     await context.close();
    }
   }
   const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* mocked SDK */'}));
   await ctx.addInitScript(({ID})=>{
    localStorage.setItem('matteos-study-auth-v1',JSON.stringify({user:{id:ID},access_token:'synthetic'}));
    localStorage.setItem('matteos.study.identity.v1',JSON.stringify({user_id:ID,role:'learner',grade:'grade9'}));
    localStorage.setItem('matteos.study.workspace-owner.v1',ID);
    let session={user:{id:ID}};
    const profile={user_id:ID,role:'learner',grade:'grade9',display_name:'Syntetisk elev'};
    window.supabase={createClient(){return {
     auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
      async getSession(){return {data:{session}}},
      async signOut({scope}){window.__logoutScope=scope;session=null;localStorage.removeItem('matteos-study-auth-v1');return {error:null}}},
     from(name){return {
      select(){return this},eq(){return this},
      async maybeSingle(){return {data:name==='study_profiles'?profile:null,error:null}},
      async order(){return {data:[],error:null}}}}
    }}};
   },{ID});
   const pg=await ctx.newPage(),errors=[];
   pg.on('pageerror',e=>errors.push(e.message));
   await pg.goto(new URL('study/',BASE).href,{waitUntil:'domcontentloaded'});
   await pg.locator('.topinner .quick-logout').waitFor({timeout:12000});
   await pg.locator('.topinner .quick-logout').click();
   await pg.locator('#auth').waitFor({timeout:12000});
   ok(await pg.evaluate(()=>window.__logoutScope)==='local',label+' online logout scoped to this browser');
   ok(await pg.evaluate(()=>localStorage.getItem('matteos.study.workspace-owner.v1'))===null,label+' online exit protects student workspace');
   ok(errors.length===0,label+' online account no exception '+errors.join('|'));
   await ctx.close();
  }finally{await browser.close()}
 }
 console.log('QUICK LOGOUT '+checks+'/'+checks+' PASS');
})().catch(e=>{console.error(e);process.exit(1)});
