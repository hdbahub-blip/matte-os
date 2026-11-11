/* Marble Green · parent dashboard (read-only). No student storage keys are written here.
   Device-only code guard is a convenience lock, not remote identity/authentication. */
(function(){
'use strict';
const M=window.MO_PARENT_MODEL,root=document.getElementById('app'),K=M.KEY,AUTH='matteos.parent.unlocked.v1',PREF='matteos.parent.mode.v1';
const names={math:'Matematik',learning:'Korta språklektioner',reading:'Läsförståelse',vocab:'Ordträning',memory:'Minnesknep',exam:'Matte Prov'};
const safeParse=(s,fallback)=>{try{return JSON.parse(s)||fallback}catch{return fallback}};
const getState=()=>{try{const a=safeParse(localStorage.getItem(K),null);return a?.v===1&&a?.snapshots?{v:1,pin:a.pin||null,snapshots:a.snapshots}:newState()}catch{return newState()}};
const newState=()=>({v:1,pin:null,snapshots:{}});
let state=getState(),ui={view:'both',sources:{},notice:'',error:false,pending:null,preview:{},theme:readTheme(),busy:false,confirmReset:false};
function readTheme(){try{return localStorage.getItem(PREF)==='dark'?'dark':'light'}catch{return 'light'}}
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const pct=(n,d)=>d?Math.round(100*n/d):0;
const digits=n=>new Intl.NumberFormat('sv-SE').format(n);
function latest(ts){return ts?new Date(ts).toLocaleDateString('sv-SE',{day:'numeric',month:'short',year:'numeric'}):'Ingen aktivitet registrerad';}
const grName=g=>g==='grade8'?'Åk 8':'Åk 9';
const gLabel=g=>g==='grade8'?'8':'9';
const label=k=>names[k]||k;
const imported=g=>state.snapshots?.[g]&&M.hasActivity(state.snapshots[g]);
const selected=g=>ui.sources[g]||(window.MO_STUDY_PARENT?.has(g)?'cloud':imported(g)?'imported':'local');
function localReport(g){return M.readLocal(g,localStorage)}
function currentReport(g){
 const v=selected(g);
 return v==='cloud'&&window.MO_STUDY_PARENT?.has(g)?window.MO_STUDY_PARENT.reportForGrade(g):v==='imported'&&imported(g)?state.snapshots[g]:localReport(g);
}
function report(g){return M.summary(currentReport(g),M.metaFrom(window));}
function save(){
 try{localStorage.setItem(K,JSON.stringify(state));return true}catch{note('Kunde inte spara föräldraöversikten. Kontrollera lagringsutrymmet och försök igen.',true);return false}
}
function note(t,error=false){ui.notice=t;ui.error=error;render();}
function unlocked(){try{return sessionStorage.getItem(AUTH)==='yes'}catch{return false}}
function setUnlocked(value){try{if(value)sessionStorage.setItem(AUTH,'yes');else sessionStorage.removeItem(AUTH)}catch{}}
function mode(){document.documentElement.dataset.mode=ui.theme;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=ui.theme==='dark'?'#101B17':'#F7F9F5'}
function header({share=false,locked=false}={}){
 return '<header class="topbar"><div class="topinner"><a class="brand" href="../" aria-label="Till Matte OS"><span class="monogram">M</span><span><b>MATTE OS</b><small>MARBLE · MIN ÖVERSIKT</small></span></a>'+
 '<button type="button" class="tiny" data-action="theme" title="Byt dag- och nattläge" aria-label="'+(ui.theme==='dark'?'Växla till dagläge':'Växla till nattläge')+'">'+(ui.theme==='dark'?'☀':'☾')+'</button>'+
 (locked||share?'':'<button type="button" class="tiny" data-action="lock">Lås</button>')+'</div></header>';
}
function wrap(content,mode){return header(mode)+ '<div class="container wrap">'+(ui.notice?'<div role="status" class="notice'+(ui.error?' error':'')+'">'+esc(ui.notice)+'</div>':'')+content+
 '<footer><strong>Privat översikt på den här enheten.</strong> Ingen automatisk synk, inget konto, inga elevtexter uppladdas. En lokal kod döljer översikten för nyfikna blickar men ersätter inte riktig åtkomstkontroll. Resultaten gäller enbart vad Matte OS faktiskt sparat, inte skolans omdömen eller läxor. <a href="../">Till matematiken</a>.</footer></div>';}
function boxKpi(label,value,sub){return '<div class="kpi"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><em>'+esc(sub||'')+'</em></div>'}
function track(n,all){return '<div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="'+(all||0)+'" aria-valuenow="'+n+'"><i style="width:'+pct(n,all)+'%"></i></div>';}
function statRow(text,n,all){return '<div class="metric"><div class="metric-head"><span>'+esc(text)+'</span><b>'+digits(n)+' / '+digits(all)+'</b></div>'+track(n,all)+'</div>'}
function status(l,kind){return '<span class="state '+(kind||'')+'">'+esc(l)+'</span>'}
function line(name,desc,tag,kind=''){return '<div class="rowline"><div><strong>'+esc(name)+'</strong>'+(desc?'<small>'+esc(desc)+'</small>':'')+'</div>'+status(tag,kind)+'</div>'}
function disclosure(title,summary,body){return '<details class="detail"><summary><span>'+esc(title)+'</span><small>'+esc(summary||'')+'</small></summary><div>'+body+'</div></details>'}
function empty(txt){return '<div class="empty">'+esc(txt)+'</div>'}
function segmented(){return '<nav class="seg" aria-label="Välj profil">'+[['both','Båda'],['grade8','Åk 8'],['grade9','Åk 9']].map(([k,v])=>'<button type="button" data-action="view" data-view="'+k+'" aria-pressed="'+(ui.view===k)+'">'+v+'</button>').join('')+'</nav>'}
function sourceSwitch(g){
 const here=localReport(g),there=imported(g),cloud=window.MO_STUDY_PARENT?.has(g),s=selected(g);
 return '<div class="actions" style="margin:8px 0 17px"><span class="note">Datakälla för '+grName(g)+':</span>'+
 '<button type="button" class="tiny" data-action="source" data-grade="'+g+'" data-source="local" aria-pressed="'+(s==='local')+'" style="'+(s==='local'?'border-color:var(--forest)':'')+'">Den här enheten</button>'+
 (cloud?'<button type="button" class="tiny" data-action="source" data-grade="'+g+'" data-source="cloud" aria-pressed="'+(s==='cloud')+'">Automatisk molnsynk</button>':'')+
 (there?'<button type="button" class="tiny" data-action="source" data-grade="'+g+'" data-source="imported" aria-pressed="'+(s==='imported')+'" style="'+(s==='imported'?'border-color:var(--forest)':'')+'">Inläst rapport</button>':'')+
 '</div><p class="note">'+(s==='imported'&&there?'Inläst: '+latest(Date.parse(state.snapshots[g].createdAt))+'. Uppdateras först när en ny fil läses in.':s==='cloud'?'Synkade elevresultat uppdateras automatiskt från kopplad profil. Äldre lokala resultat från andra enheter kan finnas separat.':'Visar bara resultat som sparats i den här webbläsaren.')+'</p>';
}
function sourceHealth(data){
 const absent=Object.entries(data.sectionsPresent).filter(([,present])=>!present).map(([k])=>label(k));
 return absent.length?'<div class="notice"><strong>Underlag saknas:</strong> '+esc(absent.join(' · '))+'. Avsaknad av underlag betyder inte att eleven inte arbetat där.</div>':'';
}
function compare(){
 const cards=M.GRADES.map(g=>{
  const s=report(g);
  const totalPresent=Object.values(s.sectionsPresent).filter(Boolean).length;
  const last=s.lastActivity;
  return '<button type="button" class="student" data-action="view" data-view="'+g+'">'+
   '<div class="student-title"><b>'+esc(s.name||grName(g))+'</b><span class="student-mark '+(g==='grade8'?'g8':'g9')+'">'+grName(g)+'</span></div>'+
   '<div class="student-stats"><div><strong>'+s.math.independent+' / '+s.math.total+'</strong><small>Matte självständigt</small></div><div><strong>'+s.reading.done+' / '+s.reading.total+'</strong><small>Lästa texter klart</small></div><div><strong>'+s.vocabulary.started+' / '+s.vocabulary.total+'</strong><small>Ord övade</small></div></div>'+
   statRow('Mattemoment påbörjade',s.math.started,s.math.total)+
   '<div class="note">'+esc(latest(last))+' · '+totalPresent+' av 6 datakällor · '+(selected(g)==='imported'?'inläst rapport':'den här enheten')+'</div><div style="margin-top:15px;color:var(--forest);font-weight:750">Se hela översikten →</div></button>';
 }).join('');
 return '<section class="hero"><span class="eyebrow">En lugnare överblick</span><h1>Deras resa, tydligt samlad.</h1><p>Två separata elevprofiler. Se vad som har påbörjats, avslutats eller behöver mer träning — utan jämförelser och utan att ändra deras resultat.</p><span class="hero-tag">Marble Green · Skrivskyddad översikt</span></section>'+
 '<div class="meta"><span class="pill"><span class="dot"></span> Lokala eller inlästa data</span><span class="pill">6 ämnes- och resultatkällor</span></div>'+
 '<section><div class="card-head"><div><h2>Eleverna</h2><p>Välj en profil för att öppna alla områden.</p></div></div><div class="grid2">'+cards+'</div></section>'+
 '<div class="card" style="margin-top:22px"><div class="card-head"><div><h2>Samla resultat från deras mobiler</h2><p>Om de arbetar på andra enheter måste du läsa in deras rapporter manuellt.</p></div></div>'+importControls()+'</div>';
}
function recentActivity(s){
 const max=Math.max(1,...s.activity14.map(x=>x.count)),n=s.activity14.reduce((a,b)=>a+b.count,0);
 const bars=s.activity14.map((a,i)=>'<span title="'+esc(a.date+': '+a.count+' registrerade händelser')+'" role="img" aria-label="'+esc(a.date+': '+a.count+' händelser')+'"><i style="height:'+Math.round(a.count/max*100)+'%"></i>'+([0,6,13].includes(i)?'<em>'+esc(a.day)+'</em>':'')+'</span>').join('');
 return '<div class="card"><div class="card-head"><div><h2>Senaste två veckorna</h2><p>'+n+' registrerade aktiviteter · inte studietid</p></div></div>'+(n?'<div class="chart">'+bars+'</div><p class="note" style="margin-top:35px">Aktiviteter summerar sparade försök i matte, språk, ord, minnesträning och prov. En dag utan registrering betyder inte att eleven inte studerat.</p>':empty('Ingen aktivitet registrerad under de senaste 14 dagarna.'))+'</div>';
}
function nextMoves(s){
 const notes=[];
 if(s.math.present){
  const k=s.math.needsSupport.slice(0,1)[0];if(k)notes.push('Fortsätt med '+k.title+' i matematik; momentet har övats men är ännu inte självständigt befäst.');
  else {const x=s.math.notStarted[0];if(x)notes.push('Börja gärna med '+x.title+' i matematik när det passar skolplaneringen.');}
 }
 if(s.reading.present){
  const started=s.reading.books.find(x=>x.started&&!x.done);const unstarted=s.reading.books.find(x=>!x.started);const x=started||unstarted;
  if(x)notes.push((started?'Färdigställ ':'Prova ')+x.title+' i '+(x.lang==='sv'?'svensk':'engelsk')+' läsförståelse (nivå '+x.level+').');
 }
 if(s.vocabulary.present&&s.vocabulary.pending.length)notes.push('Repetera ord där senaste försöket var fel; '+s.vocabulary.pending.length+' ordmoment är markerade för repetition.');
 if(s.memory.present&&s.memory.due)notes.push('Repetera '+s.memory.due+' minnesknep som är mogna för återhämtning ur minnet.');
 return '<div class="card"><div class="card-head"><div><h2>Tre möjliga nästa steg</h2><p>Förslag från registrerade aktiviteter, inte en skoluppgift eller diagnos.</p></div></div>'+(notes.length?'<ol class="quick">'+notes.slice(0,3).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>':empty('Läs in en rapport eller gör några övningar på elevens enhet för att få relevanta förslag.'))+'</div>';
}
function mathView(s){
 const m=s.math;
 if(!m.present)return sectionMissing('Matematik');
 let html='<div class="grid3">'+boxKpi('Moment påbörjade',m.started+' / '+m.total,'Övat minst en gång eller öppnat en lektion')+
 boxKpi('Klarar själv',m.independent+' / '+m.total,'Självständiga försök enligt appens nivåmodell')+
 boxKpi('Lektioner genomförda',m.lessonDone,'Har markerats avslutade i Matte OS')+'</div>';
 html+='<div class="card" style="margin-top:15px"><div class="card-head"><div><h2>Kapitel för kapitel</h2><p>Visa även enskilda moment — inklusive dem som inte påbörjats.</p></div></div>';
 for(const c of m.chapters){
  html+=statRow(c.title+' · självständigt',c.independent,c.total);
  const all=m.skills.filter(x=>x.chapter===c.id);
  html+=disclosure(c.title,c.started+' / '+c.total+' påbörjade',
    all.map(x=>line(x.title,x.lessonDone?'Lektion markerad genomförd':x.started?'Lektion inte färdigmarkerad':'Inget sparat försök',
     x.lv>=3?'Klarar själv':x.started?'Öva vidare':'Ej påbörjat',x.lv>=3?'done':x.started?'wait':'')).join(''));
 }
 html+='</div>';
 html+='<div class="grid2" style="margin-top:16px"><div class="card"><h3>Multiplikation</h3>'+statRow('Talpar påbörjade',m.table.started,m.table.total)+statRow('Säkra talpar',m.table.secure,m.table.total)+'<p class="note">'+m.table.sessions+' registrerade träningspass.</p></div><div class="card"><h3>Matte OS-tester</h3><p class="note">'+m.tests.length+' sparade kapiteltester.</p>'+m.tests.slice(-4).reverse().map(t=>line(labelChapter(s.grade,t.ch),latest(t.t),t.ok+'/'+t.n+' rätt')).join('')+'</div></div>';
 return html;
}
function labelChapter(g,id){return (window.MO_CORE?.profiles?.[g]?.chapters||[]).find(x=>x.id===id)?.name||id}
function sectionMissing(name){return empty('Inget '+name.toLowerCase()+'-underlag har sparats i den valda datakällan. Detta betyder inte att eleven inte gjort något.')}
function readingView(s){
 const r=s.reading;if(!r.present)return sectionMissing('Läsförståelse');
 let html='<div class="grid2">'+boxKpi('Texter färdiga',r.done+' / '+r.total,'Markerats genomförda')+boxKpi('Texter påbörjade',r.started+' / '+r.total,'Påbörjade eller genomförda')+'</div>';
 html+='<div class="card" style="margin-top:14px"><div class="card-head"><div><h2>Texter och svårighetsgrader</h2><p>Tre nivåer i svenska respektive engelska. Ett genomfört textpass är inte samma sak som självständig behärskning.</p></div></div>';
 for(const lang of r.forLang){
  html+='<h3>'+(lang.lang==='sv'?'Svenska':'Engelska')+'</h3>';
  for(const group of lang.byLevel){
   const list=r.books.filter(x=>x.lang===lang.lang&&x.level===group.level);
   html+=statRow('Nivå '+group.level+' · avslutade',group.done,group.total);
   html+=disclosure('Nivå '+group.level,group.started+' / '+group.total+' påbörjade',
     list.map(x=>line(x.title,x.attemptedTasks+' av '+x.total+' deluppgifter provade',x.done?'Genomförd':x.started?'Påbörjad':'Ej påbörjad',x.done?'done':x.started?'wait':'')).join(''));
  }
 }
 return html+'</div>';
}
function learningView(s){
 const a=s.language;if(!a.present)return sectionMissing('Korta språklektioner');
 let html='<div class="grid3">'+boxKpi('Påbörjade',a.started+' / '+a.total,'Kortlektioner')+boxKpi('Registrerade försök',a.attempts,'Sparade elevsvar, inte textinnehållet')+boxKpi('Startkoll',a.baseline+' / 8','Besvarade frågor')+'</div>';
 html+='<div class="card" style="margin-top:14px"><h2>Kortlektioner</h2>';
 for(const sub of a.subjects){html+=statRow(({sv:'Svenska',en:'Engelska',study:'Studieteknik'})[sub.subject],sub.started,sub.total);
 const ls=a.lessons.filter(x=>x.subject===sub.subject);
 html+=disclosure(({sv:'Svenska',en:'Engelska',study:'Studieteknik'})[sub.subject],sub.repeated+' repeterade',
  ls.map(x=>line(x.title,x.last?latest(x.last):'Ingen registrerad övning',x.lv>=3?'Repeterad':x.lv>=2?'Klarat en gång':x.lv===1?'Behöver öva':'Ej påbörjad',x.lv>=3?'done':x.lv>0?'wait':'')).join(''));}
 return html+'</div>';
}
function wordsView(s){
 const w=s.vocabulary;if(!w.present)return sectionMissing('Ordträning');
 let html='<div class="grid3">'+boxKpi('Olika ord provade',w.started+' / '+w.total,'Svenska och engelska')+boxKpi('Orduppgiftsförsök',w.attempts,'Försök i betydelse eller mening')+boxKpi('Öva på nytt',w.pending.length,'Moment där senaste svar var fel')+'</div>';
 html+='<div class="card" style="margin-top:14px"><h2>Ordförråd, nivå för nivå</h2>';
 for(const lang of w.forLang){
  const labelLang=lang.lang==='sv'?'Svenska':'Engelska';
  html+=statRow(labelLang+' · ord provade',lang.started,lang.total);
  for(const level of [1,2,3]){
   const pool=w.words.filter(x=>x.lang===lang.lang&&x.level===level);
   html+=disclosure(labelLang+' · nivå '+level,pool.filter(x=>x.started).length+' / '+pool.length+' övade',
   '<div class="detail-grid">'+pool.map(x=>line(x.word,'',x.needsRepeat?'Repetera':x.started?'Övat':'Ej påbörjat',x.started&&!x.needsRepeat?'done':x.needsRepeat?'wait':'')).join('')+'</div>');
  }
 }
 return html+'</div>';
}
function memoryView(s){
 const m=s.memory;if(!m.present)return sectionMissing('Minnesknep');
 return '<div class="grid3">'+boxKpi('Påbörjade knep',m.started+' / '+m.total,'Övade minst en gång')+
 boxKpi('Befästa',m.remembered,'Korrekt efter minst ett dygn')+
 boxKpi('Dags att repetera',m.due,'Utifrån tidigare träning')+'</div>'+
 '<div class="card" style="margin-top:14px"><h2>Knep och uppföljning</h2>'+m.items.map(x=>line(x.title,'',x.status,x.status.includes('Befäst')?'done':x.status.includes('Dags')?'wait':'')).join('')+'</div>';
}
function examsView(s){
 const e=s.exams;if(!e.present)return sectionMissing('Matte Prov');
 return '<div class="grid3">'+boxKpi('Prov/diagnoser',e.attempts,'Avslutade testomgångar')+
 boxKpi('Senaste omgång',e.last?e.last.correct+' / '+e.last.total:'—',e.last?latest(e.last.finishedAt):'Inget test sparat')+
 boxKpi('Genomsnitt',e.mean===null?'—':e.mean+'%','Enbart sparade övningstest')+'</div>'+
 '<div class="card" style="margin-top:14px"><h2>Senaste tester</h2>'+(e.history.length?e.history.map(x=>line(labelChapter(s.grade,x.chapter)+' · '+(x.mode==='diagnos'?'Diagnos':'Prov'),latest(x.finishedAt)+' · '+x.correct+' av '+x.total+' rätt',x.percent+'%')).join(''):empty('Inga avslutade prov har registrerats.'))+
 '<p class="note">Procenttalen beskriver dessa konkreta övningstest. De är inte skolbetyg, nationella prov eller en prognos om betyg.</p></div>';
}
function importControls(){
 return '<p class="note">På varje elevs telefon: öppna Matte OS → byt till rätt elevprofil → välj <b>Dela framstegsrapport</b>. Filen innehåller enbart sparade övningsdata och provsammanfattningar för den årskursen. Öppna sedan filen här. Den ersätter inte elevens egna framsteg.</p>'+
 '<div class="actions"><button type="button" class="btn" data-action="pickfile">Läs in rapportfil</button><a class="btn secondary" href="../">Till Matte OS</a></div>'+
 '<input class="fileInput" type="file" id="importInput" accept=".json,application/json" aria-label="Välj lokal resultatrapport">'+
 (ui.pending?importPreview():'')+
 '<p class="note" style="margin-top:12px">Rapporter stannar i den här webbläsaren. Läs in en ny fil när du vill uppdatera; ingen automatisk synk eller dold åtkomst till deras mobiler.</p>';
}
function importPreview(){
 return '<div class="notice" style="margin-top:16px"><h3>Granska innan import</h3><p>Välj vilka årskurser som ska uppdateras. Endast avsnitt med registrerad aktivitet ersätts; tomma avsnitt raderar ingenting.</p>'+
 ui.pending.map((x,i)=>'<label class="checkbox-row"><input type="checkbox" data-choose-import="'+i+'" '+(ui.preview[i]?'checked':'')+'><span><b>'+grName(x.grade)+'</b><br><small>'+esc(x.kind)+' · '+Object.keys(x.report.sections).map(label).join(', ')+'</small></span></label>').join('')+
 '<div class="actions"><button class="btn" type="button" data-action="confirm-import">Läs in valda</button><button class="btn secondary" type="button" data-action="cancel-import">Avbryt</button></div></div>';
}
function pupil(g){
 const s=report(g),has=Object.values(s.sectionsPresent).some(Boolean);
 return '<section class="hero"><span class="eyebrow">En profil · hela resan</span><h1>'+esc(s.name||grName(g))+' – så går det.</h1><p>Vad som är gjort, vad som återstår och vad som kan vara klokt att öva vidare på. Resultat från de här övningarna — inte från skolan.</p><span class="hero-tag">'+grName(g)+' · Marble Green</span></section>'+
 sourceSwitch(g)+sourceHealth(s)+
 (has?'<div class="grid4">'+boxKpi('Matte självständigt',s.math.present?s.math.independent+' / '+s.math.total:'—','Moment som kan lösas själv')+
 boxKpi('Läsförståelse',s.reading.present?s.reading.done+' / '+s.reading.total:'—','Texter färdigmarkerade')+
 boxKpi('Ordträning',s.vocabulary.present?s.vocabulary.started+' / '+s.vocabulary.total:'—','Olika ord som provats')+
 boxKpi('Provresultat',s.exams.present?s.exams.attempts:'—','Registrerade övningsprov')+'</div>'+
 '<div class="grid2" style="margin-top:17px">'+recentActivity(s)+nextMoves(s)+'</div>'+
 '<section id="math" style="margin-top:25px"><h2>Matematik</h2>'+mathView(s)+'</section>'+
 '<section id="reading" style="margin-top:25px"><h2>Läsförståelse</h2>'+readingView(s)+'</section>'+
 '<section id="vocabulary" style="margin-top:25px"><h2>Ordträning</h2>'+wordsView(s)+'</section>'+
 '<section id="language" style="margin-top:25px"><h2>Språklektioner & studieteknik</h2>'+learningView(s)+'</section>'+
 '<section id="memory" style="margin-top:25px"><h2>Minnesknep</h2>'+memoryView(s)+'</section>'+
 '<section id="exams" style="margin-top:25px"><h2>Prov & diagnoser</h2>'+examsView(s)+'</section>'
 :empty('Det finns ingen sparad aktivitet från '+grName(g)+' i den valda datakällan. Använd rapportimport från elevens enhet.'))+
 '<div class="card" style="margin-top:26px"><h2>Uppdatera underlaget</h2>'+importControls()+'</div>';
}
function dashboard(){
 return wrap('<div class="meta"><span class="pill"><span class="dot"></span> Skrivskyddat</span><span class="pill">Åk 8 & 9</span><span class="pill">Marble Green</span></div>'+
 segmented()+(ui.view==='both'?compare():pupil(ui.view))+
 (window.MO_STUDY_PARENT?.panel()||'')+
 '<div class="card" style="margin-top:25px"><div class="card-head"><div><h2>Integritet och inställningar</h2><p>Lokala rapporter sparas på din enhet. Med kopplade elevkonton hämtas deras skyddade molnresultat automatiskt. Ingen elevprofil ändras när du läser översikten.</p></div></div><div class="actions"><button class="btn secondary" data-action="change-pin">Byt åtkomstkod</button><button class="btn warning" data-action="reset-parent">'+(ui.confirmReset?'Bekräfta: radera enbart föräldraöversikten':'Rensa enbart föräldraöversikten')+'</button></div><p class="note">Rensning tar bort din lokala kod och importerade filkopior. Molnkontot och elevernas resultat påverkas inte. Ändra molnkopplingar i Konto & synk.</p></div>');
}
function access(){const setup=!state.pin;
 return wrap('<section class="hero"><span class="eyebrow">Marble Green · Personlig översikt</span><h1>En plats för deras framsteg.</h1><p>Följ årskurs 8 och 9 i matematiken, språk, läsning och prov — utan att ändra något i elevprofilerna.</p><span class="hero-tag">Privat på den här enheten</span></section>'+
 '<form class="card formcard" id="'+(setup?'setup':'unlock')+'"><h2>'+(setup?'Välj en åtkomstkod':'Lås upp din översikt')+'</h2>'+
 '<p class="note">'+(setup?'Skapa en sexsiffrig kod som döljer översikten vid nästa besök. Den lagras inte i klartext.':'Skriv din sexsiffriga kod. Det är ett enkelt skydd på enheten, inte ett personligt konto.')+'</p>'+
 '<div class="field"><label for="pin">Sexsiffrig kod</label><input id="pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off" required></div>'+
 (setup?'<div class="field"><label for="pin2">Upprepa koden</label><input id="pin2" name="pin2" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off" required></div>':'')+
 '<button class="btn" type="submit" style="width:100%">'+(setup?'Skapa min översikt':'Öppna min översikt')+'</button>'+
 (!setup?'<button class="btn secondary" type="button" data-action="forgot" style="margin-top:10px;width:100%">Glömt koden? Återställ endast föräldravyn</button>':'')+
 '</form><p class="note" style="text-align:center">Koden är inte en säkerhetsgräns för den som har direkt tillgång till webbläsarens lagring. Använd en privat enhet och dela rapportfiler endast med tillåtna mottagare.</p>',{locked:true});
}
function sharePage(g){
 const bundle=M.minimalReport(g,localStorage),included=Object.keys(bundle.sections),counts=included.map(k=>label(k)).join(' · ');
 return wrap('<section class="hero"><span class="eyebrow">Elevrapport · '+grName(g)+'</span><h1>Dela det som faktiskt är gjort.</h1><p>Skapa en lokal rapportfil som kan öppnas i din föräldraöversikt på en annan telefon. Inga elevtexter, inget lösenord och inga råa provsvar skickas med.</p><span class="hero-tag">'+grName(g)+' · Lokal fil</span></section>'+
 '<div class="card"><h2>Innehållet i rapporten</h2><p>'+esc(counts||'Inga sparade resultat finns ännu')+'</p><p class="note">Filen är inte krypterad. Dela den bara med en person som får ta del av elevens resultat, och spara den inte på öppna eller gemensamma platser.</p>'+
 '<div class="actions"><button class="btn" type="button" data-action="download-report" data-grade="'+g+'">Ladda ner rapport för '+grName(g)+'</button><a class="btn secondary" href="../">Till Matte OS</a></div></div>'+
 '<p class="note" style="margin-top:17px">Förälder: öppna <a href="./">Min översikt</a>, lås upp med din kod och välj Läs in rapportfil.</p>',{share:true});
}
function render(){
 mode();const share=/^#\/dela\/(grade8|grade9)$/.exec(location.hash);
 if(share){root.innerHTML=sharePage(share[1]);return;}
 if(!state.pin||!unlocked()){root.innerHTML=access();return;}
 root.innerHTML=dashboard();
}
function toB64(a){return btoa(String.fromCharCode(...new Uint8Array(a)))}
function fromB64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function derive(pin,salt){
 if(!crypto?.subtle)throw Error('Enheten saknar stöd för lokal kodkontroll. Öppna Matte OS i en modern säker webbläsare.');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
 return toB64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromB64(salt),iterations:165000,hash:'SHA-256'},key,256));
}
async function setupPin(pin){
 const salt=toB64(crypto.getRandomValues(new Uint8Array(16))),hash=await derive(pin,salt);
 const old=state.pin;state.pin={salt,hash,iterations:165000};
 if(!save()){state.pin=old;return false;}
 setUnlocked(true);return true;
}
async function unlockPin(pin){
 const {salt,hash}=state.pin||{},derived=await derive(pin,salt);
 const a=fromB64(derived),b=fromB64(hash);let diff=a.length^b.length;for(let i=0;i<Math.min(a.length,b.length);i++)diff|=a[i]^b[i];
 if(diff)return false;setUnlocked(true);return true;
}
function download(data,filename){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
document.addEventListener('submit',async e=>{
 if(!['setup','unlock'].includes(e.target.id))return;e.preventDefault();if(ui.busy)return;
 ui.busy=true;
 try{
  const pin=e.target.elements.pin.value,repeat=e.target.elements.pin2?.value;
  if(!/^[0-9]{6}$/.test(pin))throw Error('Koden måste bestå av exakt sex siffror.');
  if(e.target.id==='setup'){
   if(pin!==repeat)throw Error('Koderna överensstämmer inte.');
   if(!await setupPin(pin))return;
   ui.notice='Din personliga översikt är nu skapad.';ui.error=false;
  }else{
   if(!await unlockPin(pin))throw Error('Koden stämmer inte.');
   ui.notice='Välkommen till din översikt.';ui.error=false;
  }
 }catch(err){ui.notice=err.message||'Kunde inte verifiera koden.';ui.error=true;}
 finally{ui.busy=false;render()}
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const a=b.dataset.action;
 switch(a){
 case'theme':ui.theme=ui.theme==='dark'?'light':'dark';try{localStorage.setItem(PREF,ui.theme)}catch{}render();break;
 case'view':ui.view=b.dataset.view;ui.notice='';render();scrollTo({top:0,behavior:'auto'});break;
 case'source':ui.sources[b.dataset.grade]=b.dataset.source;render();break;
 case'pickfile':document.getElementById('importInput')?.click();break;
 case'cancel-import':ui.pending=null;ui.preview={};render();break;
 case'confirm-import':{
  if(!ui.pending)return;const candidates=ui.pending.filter((_,i)=>ui.preview[i]);if(!candidates.length){note('Välj minst en årskurs.',true);break;}
  const next=JSON.parse(JSON.stringify(state)),result=[];
  for(const x of candidates){try{const m=M.mergeImported(next.snapshots[x.grade],x.report);next.snapshots[x.grade]=m.report;result.push(grName(x.grade)+': '+m.changed.map(label).join(', '));}catch(err){result.push(grName(x.grade)+': '+err.message);}}
  if(!result.some(x=>x.includes(': ')&&!x.includes('inga')))break;
  const old=state;state=next;if(!save()){state=old;break;}
  ui.pending=null;ui.preview={};for(const x of candidates)if(imported(x.grade))ui.sources[x.grade]='imported';
  note('Inläst: '+result.join(' · '));break;
 }
 case'lock':setUnlocked(false);ui.notice='';render();break;
 case'change-pin':{
  if(!unlocked())break;
  if(!window.confirm('Vill du byta koden? Ange en ny sexsiffrig kod. Dina importerade rapporter bevaras.'))break;
  const pin=window.prompt('Ny sexsiffrig kod:');
  if(!pin)break;
  if(!/^[0-9]{6}$/.test(pin)){note('Koden måste bestå av exakt sex siffror.',true);break;}
  setupPin(pin).then(ok=>{if(ok)note('Koden är ändrad.')}).catch(err=>note(err.message,true));break;
 }
 case'reset-parent':{
  if(!ui.confirmReset){ui.confirmReset=true;render();break;}
  const approved=window.confirm('Radera koden och alla importerade rapportkopior på den här enheten? Elevprofilerna och deras resultat påverkas inte.');
  ui.confirmReset=false;if(!approved){render();break;}
  try{localStorage.removeItem(K);state=newState();setUnlocked(false);ui.sources={};note('Endast föräldravyn har återställts. Elevresultaten finns kvar.');}catch{note('Kunde inte rensa föräldraöversikten.',true);}break;
 }
 case'forgot':{
  const sure=window.confirm('Glömt koden? Detta raderar ENBART kod och importerade rapporter i föräldraöversikten på denna enhet. Elevernas originalresultat påverkas inte. Fortsätta?');
  if(!sure)break;
  try{localStorage.removeItem(K);setUnlocked(false);state=newState();ui.sources={};note('Föräldravyn är återställd. Skapa en ny kod.');}catch{note('Det gick inte att återställa koden.',true)}break;
 }
 case'download-report':{
  const g=b.dataset.grade;if(!M.GRADES.includes(g))return;
  const report=M.minimalReport(g,localStorage);
  download(report,'matte-os-framsteg-'+g+'-'+new Date().toISOString().slice(0,10)+'.json');
  note('Rapportfilen har förberetts för nedladdning. Spara den privat.');break;
 }
 default:break;
 }
});
document.addEventListener('change',async e=>{
 const t=e.target;
 if(t.matches('[data-choose-import]')){ui.preview[Number(t.dataset.chooseImport)]=t.checked;return;}
 if(t.id!=='importInput'||!t.files?.[0])return;
 const file=t.files[0];
 if(file.size>5*1024*1024){note('Rapportfilen är för stor. Välj en säkerhetskopia under 5 MB.',true);return;}
 try{
  const obj=JSON.parse(await file.text()),list=M.fromFile(obj).filter(x=>M.hasActivity(x.report));
  if(!list.length)throw Error('Filen har inget registrerat elevresultat att importera.');
  ui.pending=list;ui.preview=Object.fromEntries(list.map((x,i)=>[i,true]));ui.notice='Kontrollera årskurs och avsnitt innan du läser in.';ui.error=false;render();
 }catch(err){note(err.message||'Kunde inte läsa filen. Inga data ändrades.',true)}
});
window.addEventListener('hashchange',()=>{ui.notice='';render()});
window.addEventListener('matte-study-parent-updated',()=>{if(unlocked())render();});
window.addEventListener('storage',e=>{if(e.key===K){state=getState();render();}});
render();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});
})();
