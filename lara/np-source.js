/* Matte OS NP · private source bootstrap.
   No novel text, access code or admin credential is embedded in this public file.
   One private claim link binds the school text to exactly one signed-in grade-9
   learner. Other devices then fetch it directly from a row protected by RLS. */
(function(root){
'use strict';
const S=root.MO_STUDY, APP=root.MO_NP_APP, K=root.MO_NP_CORE;
if(!S||!APP||!K)return;
const PENDING='matteos.np.private-claim.v1', COURSE='en-stark-nolla';
let inflight=false,claimed=false,attemptUser='',lastAttempt=0,lastStatus='';
function notify(message){
 lastStatus=message;root.MO_NP_SOURCE_STATUS=message;
 root.document.querySelectorAll('[data-source-status]').forEach(element=>{element.textContent=message});
}
function takePrivateLink(){
 const hash=root.location.hash||'';
 const match=hash.match(/^#activate=([A-Za-z0-9_-]{40,90})$/);
 if(!match)return;
 try{root.sessionStorage.setItem(PENDING,match[1])}catch(e){notify('Din webbläsare kan inte bevara aktiveringslänken. Öppna samma privata länk igen efter inloggning.');return}
 // Fragment-only private key is never sent to GitHub Pages or placed in the source code.
 root.history.replaceState(null,'',root.location.pathname+root.location.search+'#/home');
}
function pending(){try{return root.sessionStorage.getItem(PENDING)||''}catch(e){return ''}}
function clearPending(){try{root.sessionStorage.removeItem(PENDING)}catch(e){}}
function eligible(){
 const m=S.profile(),info=S.info();
 return m?.role==='learner'&&m.grade==='grade9'&&info.online&&/^[0-9a-f-]{36}$/i.test(m.user_id||'')?m:null;
}
async function load(force){
 if(inflight)return false;
 const member=eligible(),db=S.client();
 if(!member||!db){
  notify('Skoltexten är förberedd. Logga in med elevkontot för årskurs 9; därefter öppnas texten automatiskt.');
  return false;
 }
 const uid=member.user_id;
 if(root.MO_NP_SYNC?.ready&&!root.MO_NP_SYNC.ready()){
  notify('Återställer tidigare svar från elevkontot innan skoltexten hämtas …');
  return false;
 }
 if(!force&&claimed&&attemptUser===uid&&APP.hasSource())return true;
 if(!force&&Date.now()-lastAttempt<900&&attemptUser===uid)return false;
 attemptUser=uid;lastAttempt=Date.now();inflight=true;
 try{
  if(!APP.switchAccount(uid))throw Error('Elevkontot kunde inte aktiveras på den här enheten.');
  let secret=pending();
  if(secret){
   notify('Aktiverar det privata skolmaterialet för elevkontot …');
   const result=await db.rpc('np_claim_school_source',{p_secret:secret});
   if(result.error)throw result.error;
   // A previously redeemed key may return false. In that case the SELECT
   // below still succeeds for the rightful account; it never reassigns access.
  }
  notify('Hämtar skoltext och frågor från ditt skyddade konto …');
  const {data,error}=await db.from('np_private_school_source')
   .select('source_key,material,material_sha256').eq('source_key',COURSE).maybeSingle();
  if(error)throw error;
  if(eligible()?.user_id!==uid||APP.accountId()!==uid)return false;
  if(!data||!K.sourceOK(data.material)){
   claimed=false;
   notify(secret?'Aktiveringslänken kunde inte knytas till elevkontot. Kontrollera att du valt elev årskurs 9 och att länken inte redan används av ett annat konto.':'Skolmaterialet är inte aktiverat för detta elevkonto ännu. Öppna din privata aktiveringslänk en enda gång.');
   return false;
  }
  const installed=APP.installSource(data.material,data.material_sha256);
  if(!installed)throw Error('Texten kunde inte sparas på enheten. Kontrollera ledigt lagringsutrymme.');
  claimed=true;clearPending();
  notify('Skoltext och samtliga frågor är klara. Dina svar och framsteg synkas med samma elevkonto på andra enheter.');
  root.MO_NP_SYNC?.schedule();
  // A Study Cloud session may become ready before the initial remote snapshot
  // list is populated. After a fresh private-source install, reconcile again;
  // per-field timestamp merge preserves new local edits and old cloud answers.
  if(!Object.keys(APP.snapshot().entries||{}).length&&root.MO_NP_SYNC?.connect){
   root.setTimeout(()=>{if(eligible()?.user_id===uid)root.MO_NP_SYNC.connect(true).catch(()=>{})},1800);
  }
  return true;
 }catch(e){
  claimed=false;
  notify('Skoltexten kunde inte hämtas från molnet: '+String(e?.message||e).slice(0,180)+'. Försök med knappen Hämta skoltext igen.');
  return false;
 }finally{inflight=false}
}
function accountState(){
 if(eligible())load(false).catch(()=>{});
 else{
  claimed=false;attemptUser='';
  notify('Logga in med elevkonto för årskurs 9 för att hämta det privata skolmaterialet. Ingen fil behövs.');
 }
}
takePrivateLink();
root.MO_NP_AUTO_SOURCE={retry:()=>load(true),pending:()=>!!pending()};
root.document.addEventListener('click',e=>{
 if(e.target?.closest('[data-a="loadsource"]'))load(true).catch(()=>{});
});
root.addEventListener('matte-study-status',accountState);
root.addEventListener('np-cloud-ready',()=>load(false).catch(()=>{}));
root.addEventListener('online',()=>load(true).catch(()=>{}));
root.addEventListener('focus',()=>{if(eligible())load(true).catch(()=>{})});
root.addEventListener('np-sheet',()=>{if(lastStatus)notify(lastStatus)});
if(eligible())load(false).catch(()=>{});
else accountState();
})(window);