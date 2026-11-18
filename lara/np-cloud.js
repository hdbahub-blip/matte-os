/* Matte OS · En stark nolla. Private learner-backed sync. No public book content.
 * Uses existing Study Cloud study_snapshots RLS, with a distinct device_id and a
 * marker payload. Never overwrites the Workshop's own reading snapshots.
 */
(function(root){
'use strict';
const S=root.MO_STUDY, APP=root.MO_NP_APP;
if(!S||!APP)return;
const DEVICE_KEY='matteos.np.enstarknolla.cloud-device.v1';
let activeUser='',connecting=false,saving=false,dirty=false,connected=false,queued=null,lastRead=0,changedWhileSaving=false;
function status(message){
 root.MO_NP_STATUS=message;
 const a=root.document.getElementById('cloudStatus');if(a)a.textContent=message;
 const b=root.document.getElementById('syncMini');if(b)b.textContent=message.split(/(?<=[.!?])\s/)[0];
}
function newUuid(){
 if(root.crypto?.randomUUID)return root.crypto.randomUUID();
 if(!root.crypto?.getRandomValues)return '';
 const b=new Uint8Array(16);root.crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
 const h=Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');
 return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
function device(){
 try{let v=localStorage.getItem(DEVICE_KEY);if(/^[a-f0-9-]{36}$/i.test(v||''))return v;
 v=newUuid();if(v)localStorage.setItem(DEVICE_KEY,v);return v;}
 catch(e){return ''}
}
function member(){
 const m=S.profile();
 return m?.role==='learner'&&m.grade==='grade9'&&S.info().online&&/^[a-f0-9-]{36}$/i.test(m.user_id||'')?m:null;
}
function current(){const m=member();return m&&m.user_id===activeUser&&APP.accountId()===activeUser?m:null}
async function push(){
 if(saving){dirty=true;changedWhileSaving=true;return false}
 const m=current(),db=S.client();
 if(!m||!db){dirty=true;status('Sparas lokalt. Logga in på elevkontot för molnsynk.');return false}
 const snap=APP.snapshot();
 if(!snap.source&&!Object.keys(snap.entries).length)return false;
 const key=device();if(!key){status('Sparas lokalt; enhetsidentifierare kunde inte skapas.');return false}
 saving=true;dirty=false;status('Sparar dina ändringar i Study Cloud …');
 try{
  const row={learner_id:m.user_id,grade:'grade9',module:'reading',device_id:key,
   payload:snap,updated_at:new Date().toISOString()};
  const {error}=await db.from('study_snapshots').upsert(row,{onConflict:'learner_id,module,device_id'});
  if(error)throw error;
  status('Synkat med elevkontot. Öppna samma sida och logga in på en annan enhet för att hämta uppgifterna.');
  return true;
 }catch(e){
  dirty=true;status('Lokalt sparat, men molnsynk misslyckades: '+String(e?.message||e).slice(0,180));
  return false;
 }finally{
  saving=false;if(changedWhileSaving&&current()&&root.navigator.onLine){changedWhileSaving=false;schedule();}
 }
}
function schedule(){
 dirty=true;if(queued)clearTimeout(queued);
 queued=setTimeout(()=>{queued=null;push().catch(()=>{})},900);
}
async function connect(force){
 const now=Date.now();
 if(connecting||(!force&&connected&&activeUser===member()?.user_id))return false;
 if(force&&now-lastRead<1500)return false;
 const m=member();
 if(!m){
  const p=S.profile();
  status(p?'Endast inloggat elevkonto i årskurs 9 kan synka detta material.':'Lokalt sparat. För att använda andra enheter: öppna Elevkonto, logga in som åk 9 och återvänd hit.');
  connected=false;return false;
 }
 const db=S.client();if(!db){status('Lokalt sparat. Anslut till nätverket för synk.');return false}
 connecting=true;activeUser=m.user_id;
 try{
  if(!APP.switchAccount(activeUser))throw Error('Kontot kunde inte bindas till privat profil.');
  status('Hämtar din privata text och anteckningar från Study Cloud …');
  const {data,error}=await db.from('study_snapshots').select('device_id,payload,updated_at')
   .eq('learner_id',activeUser).eq('module','reading').order('updated_at',{ascending:true}).limit(250);
  if(error)throw error;
  if(member()?.user_id!==activeUser)throw Error('Kontot ändrades under synken.');
  const rows=(data||[]).filter(r=>(r.payload?.kind==='matteos-private-np-1'||r.payload?.kind==='matteos-private-np-2')&&r.payload?.workId==='en-stark-nolla');
  APP.mergeCloud(rows);
  lastRead=Date.now();connected=true;
  status('Privat studiepaket anslutet till elevkontot. Text, svar och framsteg sparas över enheter.');
  await push();
  return true;
 }catch(e){
  connected=false;dirty=true;status('Lokalt sparat. Molnet kan inte läsas just nu: '+String(e?.message||e).slice(0,180));
  return false;
 }finally{connecting=false;}
}
root.document.addEventListener('click',e=>{if(e.target&&e.target.id==='syncNow'){if(connected)connect(true);else connect(false)}});
root.MO_NP_SYNC={schedule:schedule,connect:connect};
root.addEventListener('matte-study-status',()=>{
 if(!member()&&activeUser){APP.lockAccount();activeUser='';connected=false;dirty=false;status('Elevkontot är utloggat. Privat studietext visas igen efter inloggning.');}
 else if(member()&&!connected&&!connecting)connect(false).catch(()=>{});
});
root.addEventListener('online',()=>{if(connected&&dirty)schedule();else connect(true).catch(()=>{});});
root.addEventListener('focus',()=>{if(connected)connect(true).catch(()=>{});else if(member())connect(false).catch(()=>{});});
if(member())connect(false).catch(()=>{});
else{
 const hasAuth=!!root.localStorage?.getItem('matteos-study-auth-v1');
 if(hasAuth)status('Kontrollerar inloggningen till Study Cloud …');
 else status('Sparas lokalt. Logga in i elevkontot för att synka text, svar och anteckningar mellan dina enheter.');
}
})(window);