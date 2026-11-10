/* Shared-study / mentor own practice: independent answers, database-controlled review phase.
 * No user's practice or group answers are written into the pupils' individual achievement stores.
 */
(function(){
'use strict';
const S=window.MO_STUDY,root=document.getElementById('app');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Q=(g,subject)=>{
 const content=g==='grade8'?window.MO_CONTENT8:window.MO_CONTENT9;
 const all=window.MO_BANK3||[],lessons=window.MOL_CONTENT?.lessons||[],words=window.MO_ORDLEK?._test?.WORDS||[];
 const r=[];
 if(subject==='math'){
  for(const s of content.slice(0,14)){
   const x=s.p?.find(q=>q.type==='choice'&&q.opts?.length>1)||s.p?.[0];if(!x)continue;
   r.push({id:'math:'+s.id+':'+(x.lv||'p'),kind:x.type==='choice'?'choice':'text',title:s.title,
    prompt:x.q,options:x.type==='choice'?x.opts:[],correct:typeof x.a==='string'?x.a:String(x.a??''),
    explanation:(x.sol||[]).join(' · '),subject:'math'});
   if(r.length>=8)break;
  }
 }
 if(subject==='sv'||subject==='en'){
  const books=all.filter(t=>t.lang===subject);
  for(const t of books.slice(0,3)){
   for(const k of t.tasks){
    if(k.type!=='choice'&&k.type!=='open'&&k.type!=='cloze')continue;
    r.push({id:subject+':'+t.id+':'+k.id,kind:k.type==='choice'?'choice':'text',
     title:t.title,prompt:k.ask||k.sentence||'',options:k.options||[],
     correct:k.type==='choice'?k.options[0]:k.type==='open'?k.model:(k.accept||[])[0],
     explanation:k.why||'',passage:t.paragraphs.join('\n\n'),subject});
    if(r.length>=8)break;
   }
   if(r.length>=8)break;
  }
 }
 if(subject==='study'){
  for(const l of lessons.filter(x=>x.subject==='study').slice(0,8)){
   const x=l.guided;r.push({id:'study:'+l.id,kind:'choice',title:l.title,prompt:x.prompt,
    options:x.options,correct:x.options[x.correct],explanation:x.why||l.explain,subject:'study'});
  }
 }
 if(subject==='vocab'){
  for(const w of words.slice(0,12)){
   const others=words.filter(x=>x.lang===w.lang&&x.word!==w.word).slice(0,2).map(x=>x.meaning);
   r.push({id:'vocab:'+w.lang+':'+w.word,kind:'choice',title:w.word,
    prompt:'Vad betyder '+w.word+'?',options:[w.meaning,...others],correct:w.meaning,
    explanation:w.sentence,subject:'vocab'});if(r.length>=8)break;
  }
 }
 return r.map(x=>({...x,prompt:String(x.prompt||'').slice(0,600),
  passage:String(x.passage||'').slice(0,3500),explanation:String(x.explanation||'').slice(0,500)}));
};
const GRADE=g=>g==='grade8'?'Åk 8':'Åk 9',name=s=>({math:'Matematik',sv:'Svenska',en:'Engelska',study:'Studieteknik',vocab:'Ordträning'})[s]||s;
let links=[],sessions=[],current=null,answers=[],practice=null,subject='math',grade=new URLSearchParams(location.search).get('grade')==='grade8'?'grade8':'grade9';
let busy=false,error='',notice='',me=null,ready=false,channel=null,lastSession='',loading=false;
const db=()=>S.client(),profile=()=>S.profile(),isMentor=()=>profile()?.role==='mentor';
const text=v=>typeof v==='string'?v:JSON.stringify(v??'');
function header(){return '<header class="topbar"><div class="topinner"><a class="brand" href="../"><span class="monogram">M</span><span><b>MATTE OS</b><small>STUDERA TILLSAMMANS</small></span></a><a class="tiny" href="../foralder/">Marble Green</a></div></header>'}
function shell(x){root.innerHTML=header()+'<main class="container study-pass">'+(error?'<p class="notice error" role="alert">'+esc(error)+'</p>':'')+(notice?'<p class="notice" role="status">'+esc(notice)+'</p>':'')+x+
 '<footer>Övningspass, inte betyg eller officiella prov. Era svar lagras separat och syns för varandra efter att passet öppnats för jämförelse. Föräldern skriver inte i elevens individuella resultathistorik. <a href="../study/">Konto & synk</a></footer></main>';}
function navbar(){return '<div class="seg"><a class="tiny" href="../foralder/">Min översikt</a><a class="tiny" href="../study/">Mitt konto</a><a class="tiny" href="../">Matematik</a><a class="tiny" href="../lara/">Språk</a></div>';}
function stateScreen(){
 if(!ready)return shell('<div class="card">Kontrollerar ditt konto …</div>');
 if(!profile())return shell('<section class="hero"><h1>Studera tillsammans.</h1><p>Logga in som mentor eller elev för att se era gemensamma studiepass. Var och en får sin egen svarshistorik.</p></section><p><a class="btn" href="../study/">Logga in eller skapa konto</a></p>');
 if(current){shell(sessionPage());return;}
 shell(home());
}
function pick(){
 return '<div class="card"><h2>'+ (isMentor()?'Välj ett studiepass':'Dina gemensamma studiepass')+'</h2>'+
 (isMentor()?'<div class="grade-picker"><button class="tiny" data-grade="grade8" aria-pressed="'+(grade==='grade8')+'">Åk 8</button><button class="tiny" data-grade="grade9" aria-pressed="'+(grade==='grade9')+'">Åk 9</button></div>'+
 '<div class="field"><label for="topic">Välj ämne</label><select id="topic">'+[['math','Matematik'],['sv','Svenska · läsförståelse'],['en','Engelska · reading'],['study','Studieteknik'],['vocab','Ordträning']].map(([k,v])=>'<option value="'+k+'" '+(subject===k?'selected':'')+'>'+v+'</option>').join('')+'</select></div>'+
 '<div class="tutor-actions"><button class="btn" data-action="practice">Öva själv som mentor</button>'+
 (links.some(l=>l.grade===grade)?'<button class="btn secondary" data-action="create">Börja med '+GRADE(grade)+'</button>':
 '<a class="btn secondary" href="../study/">Koppla elev i '+GRADE(grade)+' för gemensamt pass</a>')+'</div>':
 '<p>Du kan öppna en uppgift när din mentor startar ett pass. Du svarar själv, och era svar visas när båda lämnat in.</p>')+'</div>';
}
function home(){
 let h='<section class="hero"><span class="eyebrow">'+(isMentor()?'Din mentorprofil':'Elevprofil')+'</span><h1>Förstå mer, tillsammans.</h1><p>Öva på samma innehåll på varsin telefon. Svara själv först och jämför sedan. Den som vägleder kan också provlösa egna uppgifter.</p></section>'+navbar()+pick();
 if(practice)h+=practiceScreen();
 if(sessions.length)h+='<div class="card" style="margin-top:16px"><h2>Studiepass</h2>'+
 sessions.map(s=>'<div class="student-row"><div><b>'+esc(s.title)+'</b><small style="display:block">'+GRADE(s.grade)+' · '+esc(s.phase==='answering'?'Väntar på svar':s.phase==='review'?'Dags att jämföra':'Avslutat')+'</small></div>'+
 '<button class="btn secondary" data-action="open" data-id="'+esc(s.id)+'">Öppna</button></div>').join('')+'</div>';
 else h+='<div class="card" style="margin-top:16px"><p class="note">Inga gemensamma pass ännu. De syns här så snart ett pass skapas åt en kopplad elev.</p></div>';
 return h;
}
function practiceScreen(){
 const q=practice.questions[practice.index];
 if(!q)return '<div class="card"><h2>Klart!</h2><p>Du har provat '+practice.questions.length+' uppgifter. Dina svar har sparats under ditt eget mentorkonto, inte i elevernas resultat.</p><button class="btn secondary" data-action="end-practice">Tillbaka</button></div>';
 const checked=practice.checked;
 return '<section class="card" id="mentor-practice" style="margin-top:19px"><span class="studykicker">Öva själv · '+name(subject)+' · '+GRADE(grade)+'</span><h2>Fråga '+(practice.index+1)+' av '+practice.questions.length+'</h2>'+questionHTML(q,checked?practice.answer:null,checked)+
 (checked?'<div class="tutorresult"><strong>Din lösning</strong><p>'+esc(practice.answer)+'</p><strong>Facit / stöd</strong><p>'+esc(q.correct)+'</p><small>'+esc(q.explanation)+'</small></div><button class="btn" data-action="next-practice">Nästa uppgift</button>':
 '<form id="practice-answer">'+inputHTML(q)+'<button class="btn" type="submit">Kontrollera mitt svar</button></form>')+
 '</section>';
}
function questionHTML(q,ans,showCorrect){
 return (q.passage?'<details class="detail" open><summary>Öppna hela texten: '+esc(q.title)+'</summary><div class="passage">'+esc(q.passage)+'</div></details>':'')+
 '<div class="question-box"><p class="studykicker">'+esc(q.title||q.subject)+'</p><h3 class="study-question">'+esc(q.prompt)+'</h3>'+
 (showCorrect?'<p class="note">Svar inlämnat.</p>':'')+'</div>';
}
function inputHTML(q){
 if(q.kind==='choice')return '<div class="study-options">'+(q.options||[]).map((o,i)=>'<label><input required type="radio" name="answer" value="'+esc(o)+'"><span>'+esc(o)+'</span></label>').join('')+'</div>';
 return '<div class="field"><label for="study-answer">Skriv ditt svar</label><textarea id="study-answer" name="answer" maxlength="1800" required placeholder="Skriv ditt svar eller resonemang …"></textarea></div>';
}
function ownAnswer(q){return answers.find(a=>a.actor_id===profile()?.user_id&&a.question_id===q.id);}
function otherAnswer(q){return answers.find(a=>a.actor_id!==profile()?.user_id&&a.question_id===q.id);}
function sessionPage(){
 const s=current,me=profile()?.user_id,isParent=s.mentor_id===me,review=s.phase!=='answering';
 const answered=new Set(answers.map(x=>x.actor_id+'|'+x.question_id));
 const required=s.questions.length*2,finished=answered.size;
 let html='<section class="hero"><span class="eyebrow">'+(isParent?'Du leder passet':'Du studerar med din mentor')+' · '+esc(s.phase)+'</span><h1>'+esc(s.title)+'</h1><p>Arbeta utan att titta på varandras svar. När alla har lämnat in öppnas jämförelsen.</p></section>'+
 '<div class="actions"><button class="btn secondary" data-action="back">Alla pass</button><button class="btn secondary" data-action="refresh">Uppdatera</button></div>'+
 '<div class="card" style="margin-top:15px"><h2>Framsteg</h2><p>'+finished+' av '+required+' inlämnade svar</p><div class="study-progress"><i style="width:'+Math.round(finished/required*100)+'%"></i></div>'+
 (isParent&&s.phase==='answering'?'<button class="btn" data-action="reveal" style="margin-top:12px" '+(finished<required?'disabled':'')+'>Visa och jämför svaren</button>':'')+
 (isParent&&s.phase==='review'?'<button class="btn secondary" data-action="close">Avsluta studiepasset</button>':'')+'</div>';
 for(const [i,q] of s.questions.entries()){
  const own=ownAnswer(q),other=otherAnswer(q);
  html+='<section class="question-box"><span class="studykicker">Fråga '+(i+1)+' av '+s.questions.length+'</span>'+
   questionHTML(q,own?.answer?.value||null,false)+
   (own?'<div class="tutorresult"><strong>Ditt inlämnade svar</strong><p>'+esc(text(own.answer.value))+'</p></div>':
   s.phase==='answering'?'<form class="session-answer" data-q="'+esc(q.id)+'">'+inputHTML(q)+'<button type="submit" class="btn">Lämna in mitt svar</button></form>':'<p class="note">Du lämnade inte in något svar.</p>')+
   (review?'<div class="tutorresult" style="margin-top:10px"><strong>'+ (isParent?'Elevens':'Mentorns')+' svar</strong><p>'+esc(other?.answer?.value?text(other.answer.value):'Inget svar inlämnat')+'</p>'+
   '<strong>Facit eller exempelsvar</strong><p>'+esc(q.correct||'Öppen fråga – använd bedömningskriterier')+'</p>'+
   '<small>'+esc(q.explanation||'')+'</small></div>':'<p class="note">Den andras svar och förklaringen visas först när ni båda är färdiga.</p>')+
   '</section>';
 }
 return html;
}
async function load(){
 if(!profile()||!db()||loading)return;loading=true;
 try{
  const out=await Promise.all([S.links(),db().from('study_sessions').select('id,mentor_id,learner_id,grade,title,questions,phase,created_at,updated_at').order('created_at',{ascending:false}).limit(30)]);
  links=out[0];if(out[1].error)throw out[1].error;sessions=out[1].data||[];
  if(current){const next=sessions.find(x=>x.id===current.id);if(next)current=next;await loadAnswers();}
  if(!channel)subscribe();
  error='';
 }catch(e){error='Kunde inte läsa studiepass: '+e.message;}
 finally{loading=false;stateScreen();}
}
async function loadAnswers(){
 if(!current)return;
 const {data,error:e}=await db().from('study_session_answers').select('id,session_id,actor_id,question_id,answer,submitted_at').eq('session_id',current.id).order('submitted_at',{ascending:true}).limit(50);
 if(e)throw e;answers=data||[];
}
function subscribe(){
 if(!db()||channel)return;
 channel=db().channel('study-together-'+profile().user_id)
 .on('postgres_changes',{event:'*',schema:'public',table:'study_sessions'},()=>queueReload())
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'study_session_answers'},()=>queueReload())
 .subscribe();
}
let reloadTimer=null;
function queueReload(){if(reloadTimer)clearTimeout(reloadTimer);reloadTimer=setTimeout(()=>{reloadTimer=null;load().catch(()=>{})},800);}
async function create(){
 const l=links.find(x=>x.grade===grade);
 if(!l)throw Error('Den valda elevprofilen är inte kopplad till din mentorprofil.');
 const questions=Q(grade,subject).slice(0,6);
 if(!questions.length)throw Error('Inga frågor finns för detta område.');
 const payload={mentor_id:profile().user_id,learner_id:l.learner_id,grade,title:name(subject)+' · '+GRADE(grade),questions,phase:'answering'};
 const {data,error:e}=await db().from('study_sessions').insert(payload).select().single();
 if(e)throw e;current=data;answers=[];notice='Studiepasset är startat. Eleven hittar det på sin telefon efter inloggning.';
 await load();
}
function verdict(q,v){
 if(q.kind!=='choice')return null;
 return String(v).trim()===String(q.correct).trim();
}
async function send(session,q,answer){
 if(!db()||!session)throw Error('Internetanslutning krävs för gemensamma studiepass.');
 const {error:e}=await db().from('study_session_answers').insert({
 session_id:session.id,actor_id:profile().user_id,question_id:q.id,answer:{value:answer}
 });if(e)throw e;
 await loadAnswers();stateScreen();
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-action],[data-grade]');if(!b)return;
 if(b.dataset.grade){grade=b.dataset.grade;stateScreen();return;}
 const action=b.dataset.action;if(busy)return;busy=true;error='';notice='';
 try{
  if(action==='practice'){const qs=Q(grade,subject);if(!qs.length)throw Error('Inga övningar hittades.');practice={questions:qs,index:0,checked:false,answer:''};}
  if(action==='next-practice'){practice.index++;practice.checked=false;practice.answer='';}
  if(action==='end-practice')practice=null;
  if(action==='create')await create();
  if(action==='open'){current=sessions.find(s=>s.id===b.dataset.id)||null;answers=[];await loadAnswers();}
  if(action==='back'){current=null;answers=[];await load();}
  if(action==='refresh')await load();
  if(action==='reveal'){const {data,error:e}=await db().rpc('study_advance',{p_session:current.id,p_phase:'review'});if(e)throw e;if(!data)throw Error('Det saknas svar från någon deltagare.');await load();}
  if(action==='close'){const {data,error:e}=await db().rpc('study_advance',{p_session:current.id,p_phase:'closed'});if(e)throw e;if(!data)throw Error('Passet kunde inte avslutas.');await load();}
 }catch(x){error=x.message||'Det gick inte att genomföra åtgärden.';}
 finally{busy=false;stateScreen();}
});
document.addEventListener('change',e=>{if(e.target.id==='topic'){subject=e.target.value;practice=null;stateScreen();}});
document.addEventListener('submit',async e=>{
 if(!['practice-answer'].includes(e.target.id)&&!e.target.classList.contains('session-answer'))return;e.preventDefault();if(busy)return;busy=true;error='';notice='';
 try{
  const f=new FormData(e.target),v=String(f.get('answer')??'').slice(0,1800);
  if(!v.trim())throw Error('Skriv eller välj ett svar först.');
  if(e.target.id==='practice-answer'){
   const q=practice.questions[practice.index],p=profile();
   practice.checked=true;practice.answer=v;
   const {error:e}=await db().from('study_mentor_practice').insert({mentor_id:p.user_id,grade,question_id:q.id,answer:{value:v},correct:verdict(q,v)});
   if(e)throw e;
  }else{
   const q=current.questions.find(x=>x.id===e.target.dataset.q);if(!q)throw Error('Frågan saknas.');
   await send(current,q,v);
  }
 }catch(ex){error=ex.message||'Svaret kunde inte skickas. Försök igen vid uppkoppling.';}
 finally{busy=false;stateScreen();}
});
window.addEventListener('matte-study-status',async e=>{
 const p=S.profile();if(p?.user_id!==me){me=p?.user_id||null;
 if(channel&&db()){db().removeChannel(channel).catch(()=>{});channel=null;}sessions=[];links=[];current=null;answers=[];
 if(p)await load();
 }
 ready=true;stateScreen();
});
window.addEventListener('focus',()=>{if(profile())load().catch(()=>{})});
setInterval(()=>{if(profile()&&document.visibilityState==='visible')load().catch(()=>{})},5000);
S.init().then(async()=>{me=profile()?.user_id||null;ready=true;if(me)await load();stateScreen();}).catch(e=>{error=e.message;ready=true;stateScreen();});
})();
