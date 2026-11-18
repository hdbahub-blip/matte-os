'use strict';
// Synthetic browser test. No real users created; no connection to production Supabase.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765/';
const engine=process.argv[3]==='webkit'?webkit:chromium;
let checks=0;
function ok(v,msg){assert(v,msg);checks++;}
async function run(browser,role){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',locale:'sv-SE'});
 await context.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* synthetic auth */'}));
 await context.addInitScript(({role})=>{
  let session=null,profile=null,signupCalls=0,loginCalls=0;
  const uid=role==='mentor'?'11111111-1111-4111-8111-111111111111':'22222222-2222-4222-8222-222222222222';
  const query=(table)=>({
   select(){return this},eq(){return this},order(){return this},
   async maybeSingle(){return {data:table==='study_profiles'?profile:null,error:null}},
   then(resolve,reject){return Promise.resolve({data:table==='study_links'?[]:[],error:null}).then(resolve,reject)},
   insert(row){
    if(table==='study_profiles')profile={...row};
    return {then(resolve,reject){return Promise.resolve({error:null,data:row}).then(resolve,reject)}};
   }
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
    async signUp(){signupCalls++;throw new Error('PUBLIC SIGNUP MUST NOT BE CALLED');},
    async signOut(){session=null;return {error:null}}
   },
   from:query
  })};
  window.__loginOnlyTest={get signupCalls(){return signupCalls},get loginCalls(){return loginCalls},get profile(){return profile}};
 },{role});
 const p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(new URL('study/',base).href);
  await p.locator('form#auth').waitFor();
  ok((await p.locator('form#auth button[type="submit"]').textContent()).includes('Logga in'),'initial screen only shows login');
  ok(await p.locator('[data-mode="signup"]').count()===0,'no signup selector');
  ok(await p.getByText('Har du inget konto än?').count()===1,'admin-created account explanation');
  await p.locator('#email').fill(role+'@example.test');
  await p.locator('#password').fill('unconfirmed');
  await p.locator('form#auth button[type="submit"]').click();
  await p.getByText('E-postadressen är inte bekräftad i Supabase.',{exact:false}).waitFor({timeout:12000});
  ok(await p.locator('form#auth').count()===1,'unconfirmed account remains on login screen and receives recovery instructions');
  await p.locator('#email').fill(role+'@example.test');
  await p.locator('#password').fill('test1234'); // existing admin-created credentials shorter than new-registration policy
  await p.locator('form#auth button[type="submit"]').click();
  await p.locator('form#create-profile').waitFor({timeout:12000});
  ok(await p.locator('h1').first().innerText()==='Ställ in din profil.','authenticated new user selects role');
  await p.locator('#role').selectOption(role);
  if(role==='learner')await p.locator('#grade').selectOption('grade9');
  await p.locator('#name').fill(role==='mentor'?'Testmentor':'Testelev');
  await p.locator('#create-profile input[type="checkbox"]').check();
  await p.locator('#create-profile button[type="submit"]').click();
  await p.getByText('Konto och synk',{exact:true}).waitFor();
  if(role==='mentor')ok(await p.locator('[data-action="invite"]').count()===2,'mentor can issue grade-based invitations');
  else ok(await p.locator('form#redeem').count()===1,'learner can consent to mentor connection');
  const fixture=await p.evaluate(()=>({signupCalls:__loginOnlyTest.signupCalls,loginCalls:__loginOnlyTest.loginCalls,profile:__loginOnlyTest.profile}));
  ok(fixture.signupCalls===0&&fixture.loginCalls===2,'login only, never calls Supabase signup');
  ok(fixture.profile?.role===role,'role persisted via existing study_profiles');
  ok(errors.length===0,'no runtime exceptions: '+errors.join('|'));
  console.log('PASS '+role+' 390px study login-only onboarding');
 }finally{await context.close();}
}
(async()=>{
 const browser=await engine.launch({headless:true});
 try{await run(browser,'mentor');await run(browser,'learner');console.log('STUDY LOGIN-ONLY E2E PASS '+checks+'/'+checks+' '+(process.argv[3]||'chromium'))}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
