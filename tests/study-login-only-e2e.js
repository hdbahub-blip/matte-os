'use strict';
// Synthetic browser acceptance: no account can grant its own mentor role.
// Covers unprovisioned accounts and trusted-admin preprovisioned profiles.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765/';
const engine=process.argv[3]==='webkit'?webkit:chromium;
let checks=0;
function ok(v,msg){assert(v,msg);checks++;}
async function run(browser,role,provisioned){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',locale:'sv-SE'});
 await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* synthetic auth */'}));
 await context.addInitScript(({role,provisioned})=>{
  let session=null,signupCalls=0,loginCalls=0,profileInsertCalls=0;
  const uid=role==='mentor'?'11111111-1111-4111-8111-111111111111':'22222222-2222-4222-8222-222222222222';
  const profile=provisioned?{user_id:uid,role,grade:role==='mentor'?null:'grade9',display_name:'Elevtest'}:null;
  const query=table=>({
   select(){return this},eq(){return this},order(){return this},
   async maybeSingle(){return {data:table==='study_profiles'?profile:null,error:null}},
   then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)},
   insert(){profileInsertCalls++;throw Error('UNTRUSTED PROFILE CREATION');}
  });
  window.supabase={createClient:()=>({
   auth:{
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    async getSession(){return {data:{session},error:null}},
    async signInWithPassword({email,password}){
     loginCalls++;
     if(password==='unconfirmed')return {data:{session:null},error:{message:'Email not confirmed',code:'email_not_confirmed'}};
     if(!email.includes('@')||password!=='test1234')return {data:{session:null},error:{message:'invalid credentials',code:'invalid_credentials'}};
     session={user:{id:uid}};return {data:{session},error:null};
    },
    async signUp(){signupCalls++;throw Error('PUBLIC SIGNUP MUST NOT BE CALLED')},
    async signOut(){session=null;return {error:null}}
   },from:query
  })};
  window.__authQa={get signupCalls(){return signupCalls},get profileInsertCalls(){return profileInsertCalls},get loginCalls(){return loginCalls}};
 },{role,provisioned});
 const p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(new URL('study/',base).href);
  await p.locator('#auth').waitFor();
  ok(await p.locator('[data-mode="signup"]').count()===0,'no public signup');
  await p.locator('#email').fill(role+'@example.test');
  await p.locator('#password').fill('unconfirmed');
  await p.locator('#auth button[type=submit]').click();
  await p.getByText('E-postadressen är inte bekräftad i Supabase.',{exact:false}).waitFor();
  ok(await p.locator('#auth').count()===1,'unconfirmed email stays on login');
  await p.locator('#email').fill(role+'@example.test');
  await p.locator('#password').fill('test1234');
  await p.locator('#auth button[type=submit]').click();
  if(provisioned){
   await p.getByText('Konto och synk',{exact:true}).waitFor();
   if(role==='mentor')ok(await p.locator('[data-action="invite"]').count()===2,'preprovisioned mentor has invitation controls');
   else ok(await p.locator('#redeem').count()===1,'preprovisioned learner may redeem mentor invite');
  }else{
   await p.getByText('Din profil väntar på aktivering.',{exact:true}).waitFor();
   ok(await p.locator('#role,#grade,#create-profile').count()===0,'unprovisioned account cannot elect role or grade');
  }
  const evidence=await p.evaluate(()=>({signup:__authQa.signupCalls,inserts:__authQa.profileInsertCalls,logins:__authQa.loginCalls}));
  ok(evidence.signup===0&&evidence.inserts===0&&evidence.logins===2,'no signUp or client-side role write');
  ok(errors.length===0,'no page errors '+errors.join('|'));
  console.log('PASS '+role+' preprovisioned='+provisioned);
 }finally{await context.close();}
}
(async()=>{
 const browser=await engine.launch({headless:true});
 try{
  for(const role of ['mentor','learner'])for(const p of [false,true])await run(browser,role,p);
  console.log('STUDY AUTH ROLE E2E PASS '+checks+'/'+checks);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
