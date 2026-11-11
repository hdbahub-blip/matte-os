/* Marble Green Study Cloud: mentor-only linked pupil feed; security enforced by Postgres RLS.
   The browser cannot elect to read unlinked students and never receives service_role.
   Snapshot metrics are approximate per latest device; immutable answer ledger keeps each submission.
*/
(function(root){
'use strict';
const S=root.MO_STUDY,MODEL=root.MO_PARENT_MODEL;
const NAMES={math:'Matematik',reading:'Läsförståelse',vocab:'Ordträning',learning:'Språklektioner',memory:'Minnesknep',exam:'Prov'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&amp;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// fixAmp: escape literal angle brackets correctly before rendering untrusted student content.
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const school=g=>g==='grade8'?'Åk 8':'Åk 9';
const stamp=t=>{try{return new Date(t).toLocaleString('sv-SE',{dateStyle:'medium',timeStyle:'short'})}catch{return ''}};
const state={links:[],rows:[],attempts:[],ready:false,loading:false,error:'',expanded:'',module:'all',grade:'all',offset:0,more:false,lastLoad:0,requests:0};
const linked=new Set();
let realtime=null,lastUser=null,interval=null,connecting=false,lastRemoteSignature='',lastFullFetch=0;
function has(g){return state.links.some(x=>x.grade===g);}
function combine(part,current,next){
 if(!current)return next;
 if(part==='exam'){
  const all=[...(current.attempts||[]),...(next.attempts||[])];
  const seen=new Set();
  return {attempts:all.filter(x=>{const key=x.id||JSON.stringify(x);
    if(seen.has(key))return false;seen.add(key);return true;
   }).sort((a,b)=>(a.finishedAt||0)-(b.finishedAt||0)).slice(-120)};
 }
 if(part==='memory')return {records:S.mergeProfile('memory',current.records||{},next.records||{})};
 const merged=S.mergeProfile(part,next,current);
 if(['math','learning'].includes(part)){
  const key=part==='math'?'t':'at';
  merged.attempts=(merged.attempts||[]).sort((a,b)=>(a[key]||0)-(b[key]||0));
 }
 return merged;
}
function reportForGrade(grade){
 if(!has(grade))return null;
 const learnerIds=new Set(state.links.filter(x=>x.grade===grade).map(x=>x.learner_id));
 const parts={};
 const filtered=state.rows.filter(x=>learnerIds.has(x.learner_id))
  .sort((a,b)=>Date.parse(a.updated_at)-Date.parse(b.updated_at));
 for(const r of filtered){
  if(r.payload&&NAMES[r.module])parts[r.module]=combine(r.module,parts[r.module],r.payload);
 }
 return {v:1,grade,sections:parts,createdAt:state.lastLoad?new Date(state.lastLoad).toISOString():null};
}
async function load(reset=true){
 const db=S.client(),p=S.profile();
 if(!db||p?.role!=='mentor')return;
 if(state.loading)return;
 state.loading=true;state.error='';
 try{
  state.links=await S.links();state.links.forEach(l=>linked.add(l.learner_id));
  const ids=state.links.map(x=>x.learner_id);
  if(ids.length){
   // Lightweight RLS-authorized change detection on every 20s refresh.
   // The full passage and answer payload is fetched only when needed,
   // and at most once per five minutes when no changes occur.
   const [headSnapshot,headEvent]=await Promise.all([
    db.from('study_snapshots').select('device_id,updated_at').in('learner_id',ids).order('updated_at',{ascending:false}).limit(1),
    db.from('study_events').select('event_id,received_at').in('learner_id',ids).order('received_at',{ascending:false}).limit(1)
   ]);
   if(headSnapshot.error)throw headSnapshot.error;
   if(headEvent.error)throw headEvent.error;
   const signature=JSON.stringify({
    ids:ids.slice().sort(),
    newestBackup:headSnapshot.data?.[0]?.updated_at||'',
    newestAnswer:headEvent.data?.[0]?.event_id||'',
    page:state.offset
   });
   if(state.ready&&signature===lastRemoteSignature&&Date.now()-lastFullFetch<300000){
    state.lastLoad=Date.now();
    return;
   }
   const [snap,events]=await Promise.all([
    db.from('study_snapshots').select('learner_id,grade,module,device_id,payload,updated_at').in('learner_id',ids).order('updated_at',{ascending:false}).limit(120),
    db.from('study_events').select('event_id,learner_id,grade,module,question_id,question_text,passage_title,passage_text,answer,solution_text,is_correct,help_used,content_version,context,answered_at,received_at').in('learner_id',ids).order('received_at',{ascending:false}).range(0,Math.max(99,state.offset+99))
   ]);
   if(snap.error)throw snap.error;
   if(events.error)throw events.error;
   state.rows=snap.data||[];
   state.attempts=events.data||[];
   state.more=state.attempts.length>=Math.max(100,state.offset+100);
   lastRemoteSignature=signature;lastFullFetch=Date.now();
  }else{state.rows=[];state.attempts=[];state.more=false;}
  state.ready=true;state.lastLoad=Date.now();
  // Authoritative RLS-filtered refresh occurs every 20 seconds and on focus.
  notify();
 }catch(e){state.error='Molnöversikten kunde inte uppdateras: '+e.message;notify();}
 finally{state.loading=false;}
}
function subscribe(){
 const db=S.client(),p=S.profile();
 if(!db||p?.role!=='mentor'||realtime)return;
 realtime=db.channel('study-mentor-'+p.user_id)
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'study_events'},()=>schedule())
 .on('postgres_changes',{event:'*',schema:'public',table:'study_snapshots'},()=>schedule())
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'study_links'},()=>schedule())
 .subscribe();
}
let queued=false;
function schedule(){
 if(queued)return;queued=true;
 setTimeout(()=>{queued=false;load().catch(()=>{})},700);
}
function notify(){
 root.dispatchEvent(new CustomEvent('matte-study-parent-updated'));
}
function stop(){
 if(realtime&&S.client())S.client().removeChannel(realtime).catch(()=>{});
 realtime=null;lastRemoteSignature='';lastFullFetch=0;state.ready=false;state.rows=[];state.attempts=[];state.links=[];state.lastLoad=0;
}
function start(){
 const p=S.profile();
 if(p?.role!=='mentor'){if(lastUser)stop();lastUser=null;return;}
 if(lastUser!==p.user_id){stop();lastUser=p.user_id;state.offset=0;load().catch(()=>{});}
 if(!interval)interval=setInterval(()=>{if(root.document?.visibilityState==='visible'&&S.profile()?.role==='mentor')load().catch(()=>{})},20000);
}
function filtered(){
 const learnerIds=state.grade==='all'?null:new Set(state.links.filter(l=>l.grade===state.grade).map(l=>l.learner_id));
 return state.attempts.filter(a=>(!learnerIds||learnerIds.has(a.learner_id))&&(state.module==='all'||a.module===state.module));
}
function answer(a){
 if(a&&typeof a==='object'){
  if(a.value!==undefined){
   const v=a.value;
   if(typeof v==='string')return v;
   if(v===null)return 'Inget skrivet svar';
   try{return JSON.stringify(v)}catch{return '—'}
  }
  return JSON.stringify(a);
 }
 return String(a??'');
}
function attemptsHTML(){
 const results=filtered();
 if(!results.length)return '<div class="empty">Inga synkade svar finns ännu för detta urval. Kontrollera att eleven är inloggad och har arbetat i appen.</div>';
 return results.map((a,i)=>{
  const title=a.passage_title||a.question_id;
  const verdict=a.is_correct===true?'Rätt':a.is_correct===false?'Behöver öva':'Skriftligt / självbedömt';
  const status=a.is_correct===true?'done':a.is_correct===false?'wait':'';
  return '<details class="detail" id="cloud-answer-'+i+'"><summary><span>'+escape(school(a.grade)+' · '+(NAMES[a.module]||a.module)+' · '+title)+'</span><span class="state '+status+'">'+escape(verdict)+'</span></summary>'+
   '<div><p class="note">'+escape(stamp(a.answered_at))+(a.help_used?' · Med ledtråd':' · Utan registrerad ledtråd')+' · innehållsversion '+escape(a.content_version||'')+'</p>'+
   (a.passage_text?'<details class="detail"><summary>Öppna hela texten: '+escape(a.passage_title||'Läsförståelse')+'</summary><div><p style="white-space:pre-line">'+escape(a.passage_text)+'</p></div></details>':'')+
   '<h3 style="margin:12px 0 5px">Uppgiften</h3><p style="white-space:pre-wrap">'+escape(a.question_text||'Fråga-ID: '+a.question_id)+'</p>'+
   '<h3 style="margin:12px 0 5px">Elevens inlämnade svar</h3><div class="notice" style="white-space:pre-wrap">'+escape(answer(a.answer))+'</div>'+
   (a.solution_text?'<details class="detail"><summary>Facit eller bedömningsstöd</summary><div><p style="white-space:pre-wrap">'+escape(a.solution_text)+'</p></div></details>':'')+
   '<p class="note">Inlämnat svar; inte en inspelning eller ett utkast. Svaret tillhör elevens egen profil.</p></div></details>';
 }).join('');
}
function panel(){
 const p=S.profile();
 if(p?.role!=='mentor')return '<section class="card" style="margin-top:22px"><h2>Automatisk synk</h2><p>För att aktivera automatisk uppdatering: <a href="../study/">logga in med din mentorprofil</a> och koppla elevernas egna konton.</p><p class="note">Din lokala föräldraöversikt fungerar fortfarande utan inloggning.</p></section>';
 const counts=state.links.map(l=>school(l.grade)).join(' · ');
 return '<section class="card" id="cloud-mentor" style="margin-top:22px"><div class="card-head"><div><h2>Molnöversikt · synkar automatiskt</h2><p>Senast uppdaterad: '+escape(state.lastLoad?stamp(state.lastLoad):'Väntar på elevdata')+' · '+escape(counts||'Inga kopplade elevkonton')+'</p></div></div>'+
  (state.error?'<p class="notice error">'+escape(state.error)+'</p>':'')+
  '<p>Studiehistoriken visar de faktiska, inlämnade svaren – även hur eleven valde eller vad hon skrev. Ny information hämtas automatiskt när en elev skickar in sina svar och genom en regelbunden reservkontroll.</p>'+
  '<div class="actions"><a class="btn" href="../study/">Hantera elevkopplingar</a><button class="btn secondary" data-cloud="refresh">Uppdatera nu</button>'+
  '<a class="btn secondary" href="../studera/">Studera tillsammans</a></div>'+
  '<h3 style="margin-top:20px">Starta pass eller öva på egen hand</h3>'+
  '<div class="grid2">'+['grade8','grade9'].map(g=>'<div class="card"><b>'+school(g)+'</b><p class="note">'+(has(g)?'Elevkonto kopplat':'Inväntar koppling')+'</p>'+
  '<a class="btn secondary" href="../studera/?grade='+g+'">'+(has(g)?'Starta gemensamt pass':'Öva själv eller förbered')+'</a></div>').join('')+'</div>'+
  '<h3 style="margin-top:24px">Frågor och inlämnade svar</h3><div class="actions">'+
  '<label class="field">Elev<select id="cloud-grade"><option value="all">Båda årskurserna</option><option value="grade8" '+(state.grade==='grade8'?'selected':'')+'>Åk 8</option><option value="grade9" '+(state.grade==='grade9'?'selected':'')+'>Åk 9</option></select></label>'+
  '<label class="field">Område<select id="cloud-module"><option value="all">Alla områden</option>'+
  Object.entries(NAMES).map(([k,v])=>'<option value="'+k+'" '+(state.module===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label></div>'+
  (state.loading?'<p class="note">Synkroniserar …</p>':'')+
  attemptsHTML()+
  (state.more?'<button class="btn secondary" data-cloud="more" style="margin-top:15px">Visa äldre svar</button>':'')+
  '<p class="note" style="margin-top:15px">Råa svar är privata och visas bara för kopplade elever. Frånkoppling stänger serveråtkomsten omedelbart. Redan exporterade kopior kan inte återkallas.</p></section>';
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-cloud]');if(!b)return;
 if(b.dataset.cloud==='refresh')load().catch(()=>{});
 if(b.dataset.cloud==='more'){state.offset+=100;load(false).catch(()=>{});}
});
document.addEventListener('change',e=>{
 if(e.target.id==='cloud-grade')state.grade=e.target.value;
 if(e.target.id==='cloud-module')state.module=e.target.value;
 if(['cloud-grade','cloud-module'].includes(e.target.id))notify();
});
root.addEventListener('matte-study-status',start);
root.addEventListener('focus',()=>{if(S.profile()?.role==='mentor')load().catch(()=>{});});
if(root.document?.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
root.MO_STUDY_PARENT={has,reportForGrade,panel,load,start,info:()=>({...state})};
})(window);
