/* Matte OS Study Cloud · 1.0. Authenticated learning telemetry, never anonymous uploads.
 * A learner only uploads records explicitly belonging to their signed-in grade.
 * Server RLS decides who can read data, never a query parameter or local parent PIN.
 * On-device data remains authoritative while offline; changes queue until confirmed.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.MO_STUDY=api;
})(typeof window==='undefined'?globalThis:window,function(root){
'use strict';
const CONFIG={url:'https://bjyahpcpthumpbktrxnc.supabase.co',key:'sb_publishable_8ABjgJyALEIqAIT7LjMHeg_AXlyzAzB'};
const VERSION='1.0.0',CACHE='matteos.study.identity.v1',OUTBOX='matteos.study.outbox.v1',DEVICE='matteos.study.device.v1';
const GRADES=['grade8','grade9'],PARTS={math:'matteos.v5',reading:'matteos.sprak.v3',learning:'matteos.larande.v1',vocab:'matteos.ordlek.v1',memory:'matteos.knep.v1',exam:'matte-prov-v1'};
const safe=x=>{try{return JSON.parse(x||'null')}catch{return null}};
const get=k=>{try{return root.localStorage?.getItem(k)||null}catch{return null}};
const set=(k,v)=>{try{root.localStorage?.setItem(k,v);return true}catch{return false}};
const MAX_EVENTS=1200,MAX_TEXT=3000;
const short=(s,n)=>String(s??'').slice(0,n);
const uuid=()=>root.crypto?.randomUUID?.()||'';
const dataURL=()=>new URL('study/',new URL(root.location?.pathname||'/',root.location?.origin||'https://example.test/')).href;
const device=(()=>{const old=get(DEVICE);if(/^[0-9a-f-]{36}$/.test(old||''))return old;const id=uuid();if(id)set(DEVICE,id);return id;})();
let db=null,session=null,member=null,status='offline',lastError='',flushing=false,timer=null,initialized=false,firstSyncFor='';
let cache=safe(get(CACHE)),pending=safe(get(OUTBOX))||{events:[],dirty:[]};
if(!Array.isArray(pending.events))pending.events=[];
if(!Array.isArray(pending.dirty))pending.dirty=[];
function dispatch(){try{root.dispatchEvent(new CustomEvent('matte-study-status',{detail:info()}))}catch{}}
function info(){return {online:!!session,role:member?.role||cache?.role||null,grade:member?.grade||cache?.grade||null,userId:member?.user_id||cache?.user_id||null,status,error:lastError,waiting:pending.events.length,connected:!!member};}
function client(){return db;}
function profile(){return member;}
function validClient(){return root.supabase&&typeof root.supabase.createClient==='function'}
async function initialize(){
 if(initialized&&db)return db;
 if(!validClient()){status='no-sdk';lastError='Synkklienten är inte tillgänglig. Dina lokala uppgifter fungerar ändå.';dispatch();return null;}
 initialized=true;
 db=root.supabase.createClient(CONFIG.url,CONFIG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'matteos-study-auth-v1'}});
 db.auth.onAuthStateChange((_event,s)=>{session=s; if(!s){member=null;status='signed-out';}else status='checking';dispatch();Promise.resolve().then(()=>refresh().catch(()=>{}));});
 try{const r=await db.auth.getSession();session=r.data?.session||null;if(session)await refresh();else{status='signed-out';dispatch();}}
 catch(e){status='offline';lastError=e.message;dispatch();}
 return db;
}
async function refresh(){
 if(!db||!session?.user){member=null;dispatch();return null;}
 const {data,error}=await db.from('study_profiles').select('user_id,role,grade,display_name').eq('user_id',session.user.id).maybeSingle();
 if(error){status='error';lastError=error.message;dispatch();return null;}
 member=data||null;
 if(member){cache=member;set(CACHE,JSON.stringify(member));status='connected';lastError='';dispatch();if(member.role==='learner'&&firstSyncFor!==member.user_id){firstSyncFor=member.user_id;syncAll();}scheduleFlush();}else{status='needs-profile';dispatch();}
 return member;
}
async function signUp(email,password){
 await initialize();if(!db)throw Error('Internetanslutning krävs för att skapa konto.');
 const options={emailRedirectTo:'https://hdbahub-blip.github.io/matte-os/study/'};
 const {data,error}=await db.auth.signUp({email:email.trim().toLowerCase(),password,options});
 if(error)throw error;
 if(data.session){session=data.session;await refresh();}
 return {confirmationNeeded:!data.session};
}
async function signIn(email,password){
 await initialize();if(!db)throw Error('Synkklienten är inte tillgänglig.');
 const {data,error}=await db.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error)throw error;
 session=data.session;await refresh();return member;
}
async function signOut(){
 if(db)await db.auth.signOut();session=null;member=null;cache=null;try{root.localStorage?.removeItem(CACHE)}catch{}
 status='signed-out';dispatch();
}
async function enroll(role,grade,name){
 await initialize();
 if(!db||!session?.user)throw Error('Logga in först.');
 if(!['mentor','learner'].includes(role)||role==='learner'&&!GRADES.includes(grade))throw Error('Ogiltig profil.');
 const {error}=await db.from('study_profiles').insert({user_id:session.user.id,role,grade:role==='mentor'?null:grade,display_name:short(name,48)});
 if(error)throw error;
 return await refresh();
}
async function hashCode(code){
 const bytes=new TextEncoder().encode(code.toLowerCase());
 const h=await root.crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function issueInvite(grade){
 if(member?.role!=='mentor'||!GRADES.includes(grade))throw Error('Endast din mentorprofil kan skapa inbjudan.');
 const bytes=root.crypto.getRandomValues(new Uint8Array(16));
 const code=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 const {error}=await db.from('study_invites').insert({code_hash:await hashCode(code),mentor_id:member.user_id,grade});
 if(error)throw error;return code;
}
async function redeem(code){
 if(member?.role!=='learner')throw Error('Logga in på elevprofilen först.');
 const {data,error}=await db.rpc('study_redeem_invite',{p_code:String(code).replace(/\s/g,'').toLowerCase()});
 if(error)throw error;if(!data)throw Error('Inbjudan är felaktig, redan använd eller utgången.');
 return true;
}
async function links(){
 if(!db||!member)return [];
 const {data,error}=await db.from('study_links').select('learner_id,mentor_id,grade,linked_at').order('linked_at',{ascending:false});
 if(error)throw error;return data||[];
}
async function unlink(learnerId){
 if(!member)throw Error('Logga in först.');
 const {data,error}=await db.rpc('study_unlink',{p_learner:learnerId});
 if(error)throw error;return !!data;
}
function canCapture(grade){
 const p=member||cache;
 // Cached role is only used for offline queueing: the server still enforces authenticated identity and grade.
 return p?.role==='learner'&&p.grade===grade&&/^[0-9a-f-]{36}$/i.test(p.user_id||'');
}
function saveQueue(){
 if(!set(OUTBOX,JSON.stringify(pending))){lastError='Lagringen är full. Exportera en säkerhetskopia och frigör plats.';status='storage-full';dispatch();return false;}
 dispatch();return true;
}
function capture(a){
 const grade=a?.grade||member?.grade||cache?.grade;
 if(!canCapture(grade))return false;
 const qid=short(a.question_id,200);
 if(!qid||!PARTS[a.module])return false;
 const id=uuid();if(!id)return false;
 const evt={
 event_id:id,learner_id:(member||cache).user_id,grade,module:a.module,question_id:qid,
 content_version:short(a.content_version||VERSION,60),question_text:short(a.question_text,3000),
 passage_title:short(a.passage_title,240),passage_text:short(a.passage_text,9000),
 answer:{value:a.answer===undefined?null:a.answer},solution_text:short(a.solution_text,3000),
 is_correct:typeof a.is_correct==='boolean'?a.is_correct:null,
 help_used:!!a.help_used,
 context:{type:short(a.type,40),mode:short(a.mode,40),level:Number(a.level)||0,criteria:a.criteria||null},
 answered_at:new Date().toISOString()
 };
 if(pending.events.length>=MAX_EVENTS){lastError='Synkkön är full. Anslut till internet för att skicka dina sparade svar.';status='queue-full';dispatch();return false;}
 pending.events.push(evt);
 if(!saveQueue()){pending.events.pop();return false;}
 scheduleFlush();return true;
}
function markDirty(part){
 if(!PARTS[part])return false;
 const p=member||cache;if(p?.role!=='learner')return false;
 if(!pending.dirty.includes(part))pending.dirty.push(part);
 if(!saveQueue())return false;scheduleFlush();return true;
}
function compact(part){
 if(!member||member.role!=='learner')return null;
 const raw=safe(get(PARTS[part]));
 if(!raw)return null;
 const m=root.MO_PARENT_MODEL;
 if(!m?.compactModule)return null;
 const value=m.compactModule(part,raw,member.grade);
 if(!value)return null;
 // A complete, grade-isolated copy is kept alongside the parent-safe rollups.
 // This preserves original exercise IDs, feedback, timestamps and retry details.
 if(raw.profiles&&raw.profiles[member.grade]){
  const full=JSON.parse(JSON.stringify(raw.profiles[member.grade]));
  value.backup=full;
 }
 if(part==='exam'){
  // A finished exam already has exact answers/results in localStorage. Preserve that history for recovery.
  value.backup={grade:member.grade,attempts:(Array.isArray(raw.attempts)?raw.attempts:[]).filter(x=>x.grade===member.grade).slice(-50),
   attemptNo:Math.max(0,Number(raw.attemptNo)||0)};
 }
 return value;
}
function scheduleFlush(){
 if(timer)clearTimeout(timer);if(!db||!session||!member||member.role!=='learner')return;
 timer=setTimeout(()=>{timer=null;flush().catch(()=>{})},1000);
}
async function flush(){
 if(flushing||!db||!session?.user||member?.role!=='learner'||!root.navigator?.onLine)return false;
 if(member.user_id!==session.user.id)return false;
 flushing=true;
 try{
  let passes=0;
  while(pending.events.length&&passes++<20){
   const batch=pending.events.filter(x=>x.learner_id===member.user_id&&x.grade===member.grade).slice(0,20);
   if(!batch.length)break;
   const {error}=await db.from('study_events').upsert(batch,{onConflict:'event_id',ignoreDuplicates:true});
   if(error)throw error;
   const sent=new Set(batch.map(x=>x.event_id));
   pending.events=pending.events.filter(x=>!sent.has(x.event_id));saveQueue();
  }
  for(const part of pending.dirty.slice()){
   const val=compact(part);if(!val){pending.dirty=pending.dirty.filter(p=>p!==part);continue;}
   const payload={learner_id:member.user_id,grade:member.grade,module:part,device_id:device,payload:val,updated_at:new Date().toISOString()};
   const {error}=await db.from('study_snapshots').upsert(payload,{onConflict:'learner_id,module,device_id'});
   if(error)throw error;
   pending.dirty=pending.dirty.filter(p=>p!==part);saveQueue();
  }
  status='synced';lastError='';dispatch();return true;
 }catch(e){status='pending';lastError=e.message||'Kunde inte synkronisera.';dispatch();return false;}
 finally{flushing=false;}
}
function syncAll(){
 if(member?.role!=='learner')return false;
 Object.keys(PARTS).forEach(part=>{if(get(PARTS[part]))markDirty(part)});
 scheduleFlush();return true;
}
/* Explicit, reversible recovery. Never auto-replace local state while a learner studies.
   A local pre-restore checkpoint must succeed before a single existing store is changed. */
const mapObj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
function mergedList(a,b,limit){
 const x=[...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])];
 const seen=new Set();
 return x.filter(v=>{const key=JSON.stringify(v);if(seen.has(key))return false;seen.add(key);return true;}).slice(-limit);
}
function mergeProfile(part,local,cloud){
 const a=mapObj(local),b=mapObj(cloud);
 if(part==='math'){
  return {...a,name:a.name||b.name||'',attempts:mergedList(a.attempts,b.attempts,3000),
  lessons:{...mapObj(b.lessons),...mapObj(a.lessons)},
  rests:{...mapObj(b.rests),...mapObj(a.rests)},
  tests:mergedList(a.tests,b.tests,50).sort((x,y)=>(x.t||0)-(y.t||0)),
  tables:{...mapObj(a.tables),
    facts:{...mapObj(b.tables?.facts),...mapObj(a.tables?.facts)},
    sessions:mergedList(a.tables?.sessions,b.tables?.sessions,120)}};
 }
 if(part==='learning')return {...a,attempts:mergedList(a.attempts,b.attempts,1500),
  baseline:{...mapObj(b.baseline),...mapObj(a.baseline)}};
 if(part==='reading'){
  const tasks={...mapObj(b.tasks)};for(const [key,x] of Object.entries(mapObj(a.tasks)))
   if(!tasks[key]||(x.at||0)>=(tasks[key].at||0))tasks[key]=x;
  const texts={...mapObj(b.texts)};for(const [key,x] of Object.entries(mapObj(a.texts))){
   const prev=mapObj(texts[key]);texts[key]={started:Math.min(...[x.started,prev.started].filter(Boolean))||0,
    done:Math.max(x.done||0,prev.done||0),pair:Math.max(x.pair||0,prev.pair||0)};
  }
  return {...a,tasks,texts};
 }
 if(part==='vocab'){
  const attempts={...mapObj(b.attempts)};for(const [key,x] of Object.entries(mapObj(a.attempts)))
   if(!attempts[key]||(x.at||0)>=(attempts[key].at||0))attempts[key]=x;
  return {...a,attempts,rounds:{sv:Math.max(a.rounds?.sv||0,b.rounds?.sv||0),en:Math.max(a.rounds?.en||0,b.rounds?.en||0)}};
 }
 if(part==='memory'){
  const fromCloud=mapObj(b.records);const fromLocal=mapObj(a.records);const clean={...a};
  const prevRecords=Object.keys(fromCloud).length?fromCloud:b;
  const curRecords=Object.keys(fromLocal).length?fromLocal:a;
  const merged={...prevRecords,...curRecords};for(const key of Object.keys({...prevRecords,...curRecords})){
   const prev=mapObj(prevRecords[key]),cur=mapObj(curRecords[key]);merged[key]={};
   for(const field of ['t0','t1','recall']){const old=prev[field],now=cur[field];
    merged[key][field]=(now?.at||0)>=(old?.at||0)?now||old:old||now;
   }
  }
  return merged;
 }
 return {...b,...a};
}
async function recover(){
 if(!db||member?.role!=='learner'||session?.user?.id!==member.user_id)throw Error('Logga in som rätt elev.');
 if(pending.events.some(x=>x.learner_id===member.user_id))throw Error('Synka väntande lokala svar innan återställning.');
 const {data,error}=await db.from('study_snapshots').select('module,grade,payload,updated_at').eq('learner_id',member.user_id).order('updated_at',{ascending:true}).limit(250);
 if(error)throw error;
 const rows=(data||[]).filter(x=>x.grade===member.grade);
 if(!rows.length)throw Error('Inga molnsäkerhetskopior finns att hämta.');
 const before=Object.fromEntries(Object.entries(PARTS).map(([part,key])=>[part,get(key)]));
 const checkpoint='matteos.study.pre-restore.'+Date.now();
 if(!set(checkpoint,JSON.stringify(before)))throw Error('Kunde inte skapa en lokal säkerhetskopia. Inga data har ändrats.');
 const updates={};
 for(const part of Object.keys(PARTS)){
  const relevant=rows.filter(x=>x.module===part);
  if(!relevant.length)continue;
  let raw=safe(before[part]);
  if(part==='exam'){
   raw=mapObj(raw);const a=Array.isArray(raw.attempts)?raw.attempts:[];
   const remote=relevant.flatMap(x=>Array.isArray(x.payload?.backup?.attempts)?x.payload.backup.attempts:[]).filter(x=>x.grade===member.grade);
   updates[part]={...raw,grade:raw.grade||member.grade,attempts:mergedList(a,remote,100),
    attemptNo:Math.max(raw.attemptNo||0,a.length+remote.length)};
  }else{
   raw=mapObj(raw);if(!raw.v)raw.v={math:5,learning:1,reading:3,vocab:1,memory:1}[part];
   if(!raw.profiles)raw.profiles={grade8:{},grade9:{}};
   let merged=mapObj(raw.profiles[member.grade]);
   for(const row of relevant)merged=mergeProfile(part,merged,row.payload.backup||row.payload);
   updates[part]={...raw,profiles:{...raw.profiles,[member.grade]:merged}};
  }
 }
 // Only JSON serialization and localStorage writes; never modify a second pupil's profile.
 const written=[];
 try{
  for(const [part,payload] of Object.entries(updates)){
   const key=PARTS[part];if(!set(key,JSON.stringify(payload)))throw Error('Lagringen är full.');
   written.push(part);
  }
 }catch(e){
  // Roll back every store using the pre-restore checkpoint, including absent keys.
  for(const part of written){const old=before[part];try{if(old===null)root.localStorage.removeItem(PARTS[part]);else set(PARTS[part],old)}catch{}}
  throw Error('Återställningen avbröts och tidigare data återställdes: '+e.message);
 }
 written.forEach(markDirty);
 return {parts:written,checkpoint};
}
function onActiveGrade(grade){
 if((member||cache)?.role==='learner'&&(member||cache).grade!==grade){status='grade-mismatch';dispatch();}
}
function start(){
 if(validClient())initialize().catch(()=>{});
 else if(root.document){const el=root.document.createElement('script');
  el.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.min.js';
  el.async=true;el.crossOrigin='anonymous';el.onload=()=>initialize().catch(()=>{});
  el.onerror=()=>{status='no-sdk';lastError='Molnsynk är offline. Fortsätt öva lokalt.';dispatch();};
  root.document.head.appendChild(el);
 }
 if(root.addEventListener){
 root.addEventListener('online',()=>scheduleFlush());
 root.addEventListener('focus',()=>{refresh().catch(()=>{});scheduleFlush()});
 root.addEventListener('matte-study-saved',e=>markDirty(e.detail?.part));
 }
}
if(typeof root.document!=='undefined')start();
return {CONFIG,PARTS,VERSION,init:initialize,client,info,profile,refresh,signUp,signIn,signOut,enroll,issueInvite,redeem,links,unlink,capture,markDirty,flush,syncAll,recover,onActiveGrade,hashCode,compact,canCapture,mergeProfile};
});
