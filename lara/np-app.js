/* Matte OS · NP-träning – gränssnitt. Skolans text och elevsvar finns bara i webbläsarens lagring på elevens enhet
 * (och i elevens skyddade Study Cloud-snapshot när eleven själv loggat in). Aldrig i den här filen. */
(function(){
'use strict';
var K=window.MO_NP_CORE,C=window.MO_NP_CONTENT,app=document.getElementById('app');
var ROOT='matteos.np.enstarknolla.grade9.',raw=null,doc=null,notes={},noteAt={},sourceAt=0,accountId='';
var ui={q:0,step:{},sim:{},card:null,cardPick:null,joinStep:{},help:{},model:{},quiz:{},open:null,sheet:false,timer:null,tts:false,oralLvl:{},presLvl:1,presShown:false,joinShow:{},evOpen:null,msg:''};
function now(){return window.__NP_NOW?Number(window.__NP_NOW):Date.now();}
function E(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x];});}
function load(k,o){try{var s=localStorage.getItem(ROOT+k);return s?JSON.parse(s):o;}catch(e){return o;}}
function save(k,o){try{localStorage.setItem(ROOT+k,JSON.stringify(o));return true;}catch(e){return false;}}
function persist(){var ok=save('notes',notes)&&save('noteAt',noteAt);if(!ok)ui.msg='Svaret kunde inte sparas på den här enheten. Frigör lagringsutrymme eller exportera en säkerhetskopia.';return ok;}
function get(k){return notes[k];}
function set(k,v){notes[k]=v;noteAt[k]=now();persist();if(window.MO_NP_SYNC)window.MO_NP_SYNC.schedule();}
function setJ(k,o){set(k,JSON.stringify(o));}
function J(k,d){return K.J(notes,k,d);}
function sm(){return K.summary(notes,doc,now());}

/* ---------- källa ---------- */
function setSource(o){raw=o;doc=K.normalize(o);}
function loadScope(){raw=load('source',null);doc=raw?K.normalize(raw):null;notes=load('notes',{});noteAt=load('noteAt',{});sourceAt=Number(load('sourceAt',0))||0;
 if(K.migrateV1(notes,noteAt))persist();}
function switchAccount(id){
 if(!/^[0-9a-f-]{36}$/i.test(id||''))return false;if(accountId===id)return true;
 var wasGuest=!accountId,guest={raw:raw,notes:notes,noteAt:noteAt,sourceAt:sourceAt};
 accountId=id;ROOT='matteos.np.enstarknolla.account.'+id+'.';loadScope();
 if(wasGuest&&!raw&&guest.raw&&!localStorage.getItem('matteos.np.guest-claimed.v1')){
  raw=guest.raw;doc=K.normalize(raw);notes=guest.notes;noteAt=guest.noteAt;sourceAt=guest.sourceAt||now();
  Object.keys(notes).forEach(function(k){if(!noteAt[k])noteAt[k]=sourceAt;});
  var ok=save('source',raw)&&save('sourceAt',sourceAt)&&save('notes',notes)&&save('noteAt',noteAt);
  if(ok){try{localStorage.setItem('matteos.np.guest-claimed.v1',id);['source','notes','noteAt','sourceAt'].forEach(function(k){localStorage.removeItem('matteos.np.enstarknolla.grade9.'+k);});}catch(e){}}
  else{ROOT='matteos.np.enstarknolla.grade9.';accountId='';raw=guest.raw;doc=K.normalize(raw);notes=guest.notes;noteAt=guest.noteAt;sourceAt=guest.sourceAt;ui.msg='Kunde inte flytta materialet till kontot. Din lokala kopia är kvar. Frigör lagringsutrymme och försök igen.';render();return false;}
 }
 try{localStorage.setItem('matteos.np.last-user.v1',id);}catch(e){}
 render();return true;
}
function lockAccount(){if(!accountId)return false;accountId='';ROOT='matteos.np.enstarknolla.grade9.';raw=null;doc=null;notes={};noteAt={};sourceAt=0;render();return true;}
function snapshot(){return {kind:'matteos-private-np-2',workId:'en-stark-nolla',source:raw,sourceAt:sourceAt,entries:K.snapshotEntries(notes,noteAt)};}
function mergeCloud(rows){
 var changed=false;
 (rows||[]).forEach(function(r){var p=r&&r.payload;if(!p||p.workId!=='en-stark-nolla'||(p.kind!=='matteos-private-np-1'&&p.kind!=='matteos-private-np-2'))return;
  if(Number(p.sourceAt)>sourceAt&&K.sourceOK(p.source)){raw=p.source;doc=K.normalize(raw);sourceAt=Number(p.sourceAt);changed=true;}
  var inc=p.entries||{};
  if(p.kind==='matteos-private-np-1'){var n={},a={},o={};Object.keys(inc).forEach(function(k){var e=inc[k];if(K.validEntry(k,e&&e.value)){n[k]=e.value;a[k]=Number(e.at)||0;}});K.migrateV1(n,a);Object.keys(n).forEach(function(k){o[k]={value:n[k],at:a[k]};});inc=o;}
  if(K.mergeEntries(notes,noteAt,inc))changed=true;});
 if(changed){save('source',raw);save('sourceAt',sourceAt);persist();softRender();}
 return changed;
}

/* ---------- routing ---------- */
function route(){var h=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);return {v:h[0]||'home',a:h[1]||'',b:h[2]||''};}
function go(h){if(location.hash==='#/'+h)render();else location.hash='#/'+h;}
function stopTimer(){if(ui.timer){clearInterval(ui.timer);ui.timer=null;}if(window.speechSynthesis&&ui.tts){try{speechSynthesis.cancel();}catch(e){}ui.tts=false;}}

/* ---------- byggstenar ---------- */
function btn(label,a,extra,cls){return '<button type="button" class="btn '+(cls||'')+'" data-a="'+a+'" '+(extra||'')+'>'+label+'</button>';}
function stepBar(n,cur,names){return '<ol class="steps" aria-label="Steg">'+names.map(function(s,i){return '<li class="'+(i+1===cur?'cur':i+1<cur?'done':'')+'"'+(i+1===cur?' aria-current="step"':'')+'><span>'+(i+1)+'</span><b>'+esc(s)+'</b></li>';}).join('')+'</ol>';}
function schoolBlock(label,text,extra){return '<blockquote class="school"><span class="tag">'+esc(label)+'</span><p>'+esc(text)+'</p>'+(extra||'')+'</blockquote>';}
function helpBlock(title,inner){return '<div class="help"><span class="tag help-tag">'+esc(title)+'</span>'+inner+'</div>';}
function chips(an){return '<ul class="chips" aria-label="Textspaning">'+K.INGREDIENTS.map(function(i){var on=an.found.indexOf(i)>=0;return '<li class="'+(on?'on':'')+'"><span aria-hidden="true">'+(on?'✓':'○')+'</span> '+esc(C.ingredients[i].label)+'<small class="sr"> '+(on?'syns':'syns inte än')+'</small></li>';}).join('')+'</ul><p class="hint">Textspaning – ett stöd för dig, inte ett betyg. Du avgör själv om något saknas.</p>';}
function noSource(){return '<div class="card warn"><h2>Lägg in ditt textpaket först</h2><p>Det här steget använder skolans text. Den finns bara på din enhet och i ditt skyddade konto – aldrig i appens öppna kod.</p>'+btn('Lägg in textpaket','sheet')+'</div>';}
function needSource(){return !doc;}

/* ---------- vyer ---------- */
function viewHome(){
 var s=sm(),next=K.nextStation(s),items=K.STATIONS.map(function(id){var inf=C.stationInfo[id],p=K.stationProgress(id,s),done=K.stationDone(id,s);
  return '<li><a class="station '+(done?'done':'')+(next===id?' next':'')+'" href="#/'+id+'"><span class="num" aria-hidden="true">'+(done?'✓':inf.n)+'</span><span class="body"><b>'+esc(inf.title)+'</b><small>'+esc(inf.goal)+'</small><small class="meta">'+esc(inf.mins)+' · '+p.done+' av '+p.of+(next===id?' · <em>Rekommenderat nu</em>':'')+'</small></span><span class="chev" aria-hidden="true">›</span></a></li>';}).join('');
 var cta=next==='done'?'Du har gått igenom hela vägen. Fortsätt öva där det känns osäkert.':'Nästa steg: '+C.stationInfo[next].title;
 var dev='<div class="grid3"><div class="stat"><b>'+s.improved+'</b><span>svar jag förbättrat</span></div><div class="stat"><b>'+s.evidence+'</b><span>belägg jag sparat</span></div><div class="stat"><b>'+s.spoken+'</b><span>svar jag sagt högt</span></div><div class="stat"><b>'+s.joinN+'</b><span>okända texter jag svarat på</span></div><div class="stat"><b>'+s.retested+'</b><span>återtest klarade</span></div><div class="stat"><b>'+s.leadSims+'</b><span>ledarsituationer jag prövat</span></div></div>';
 var retest=s.retestReady?'<div class="card note"><b>Återtest redo.</b> Det har gått en dag sedan du förbättrade ett svar. <a href="#/think">Svara på nytt utan att titta på dina gamla svar.</a></div>':'';
 return '<section><p class="eyebrow">Åk 9 · Svenska · Muntlig övning</p><h1 id="h1" tabindex="-1">Din väg till att presentera, leda och delta – utan att läsa innantill</h1>'
  +'<p class="lead">Du övar på att förstå texten, hitta egna tankar, motivera dem, tala fritt och bidra i andras samtal. Ett steg i taget.</p>'
  +(doc?'':'<div class="card warn"><b>Första gången på den här enheten?</b> Lägg in ditt privata textpaket – eller logga in på elevkontot så hämtas det. '+btn('Lägg in textpaket','sheet')+'</div>')
  +'<a class="btn big" href="#/'+(next==='done'?'finish':next)+'">'+esc(cta)+' ›</a>'+retest
  +'<h2>Din väg</h2><ol class="stations">'+items+'</ol><h2>Din utveckling</h2>'+dev+'<p class="hint">Framsteg räknas när du försökt, hittat belägg, förbättrat, sagt högt och testat igen – inte när du skrivit mycket.</p></section>';
}

function viewStart(){
 var q=C.quiz,answered=ui.quiz,correct=q.filter(function(x,i){return answered[i]===x.a;}).length,done=Object.keys(answered).length===q.length;
 var pass=get('quiz.pass')==='1';
 return '<section>'+back()+'<p class="eyebrow">Steg 1 av 7</p><h1 id="h1" tabindex="-1">Så fungerar övningen</h1><p class="lead">Du ska kunna tre saker. Läs dem och prova sedan: vilken är vilken?</p>'
  +'<div class="card"><p class="small">'+esc(C.frame)+'</p></div>'
  +C.roles.map(function(r){return '<div class="card role"><h2>'+esc(r.title)+'</h2><p><b>Du gör:</b> '+esc(r.does)+'</p><p><b>Så märks det:</b> '+esc(r.proof)+'</p></div>';}).join('')
  +'<h2>Prova: vilken roll är det?</h2><ol class="quiz">'+q.map(function(x,i){var a=answered[i];return '<li><p>'+esc(x.s)+'</p><div class="seg" role="group" aria-label="Välj roll">'+C.roles.map(function(r){var on=a===r.id;return '<button type="button" class="btn alt sm" data-a="quiz" data-i="'+i+'" data-r="'+r.id+'" aria-pressed="'+on+'">'+esc(r.title)+'</button>';}).join('')+'</div>'
   +(a?'<p class="fb '+(a===x.a?'ok':'no')+'" role="status">'+(a===x.a?'Rätt. ':'Inte riktigt – det är '+esc(C.roles.filter(function(r){return r.id===x.a;})[0].title)+'. ')+esc(x.why)+'</p>':'')+'</li>';}).join('')+'</ol>'
  +(done?'<div class="card '+(correct>=5||pass?'ok':'')+'"><b>'+correct+' av '+q.length+' rätt.</b> '+(correct>=5||pass?'Du har koll på rollerna.':'Läs rollerna en gång till och försök igen.')+'</div>':'')
  +(done&&correct<5&&!pass?btn('Försök igen','quizreset','','alt'):'')
  +((correct>=5&&done)||pass?'<a class="btn big" href="#/read">Klart – till att läsa ›</a>':'')+'</section>';
}
function back(to){return '<a class="back" href="#/'+(to||'home')+'">‹ '+(to?'Tillbaka':'Min väg')+'</a>';}

/* --- Läs --- */
function copyHtml(c){return c?'<p class="fb no">Det här ligger nära textens ord. Prova att säga det som om du berättade för en kompis.</p>':'';}
function kpHtml(sec,rt){return K.words(rt.t).length>=3&&sec.keyPoints.length?'<fieldset><legend>Fick jag med något av det här? (Kolla själv)</legend>'+sec.keyPoints.map(function(k,i){return '<label class="radio"><input type="checkbox" data-kp="'+sec.id+'" data-i="'+i+'" '+((rt.kp||[]).indexOf(i)>=0?'checked':'')+'> '+esc(k)+'</label>';}).join('')+'</fieldset>':'';}
function paraHtml(i){
 var ev=J('ev.p'+i,null),open=ui.evOpen===i,fid=(doc.fidelity||[]).filter(function(f){return f&&f.i===i;})[0];
 var kinds=[['says','Det som står'],['reads','Min tolkning'],['thinks','Det jag tycker']];
 var flag=fid&&fid.status&&fid.status!=='VERBATIM_PHOTO'?'<small class="flag">Källa: '+({PHOTO_PARTIAL:'delvis läsbar på skolans foto',EPUB_INFERRED:'ur romanen, ej läsbar på fotot',UNREADABLE:'oläslig på fotot'}[fid.status]||'osäker')+'</small>':'';
 return '<article class="para'+(ev?' saved':'')+'" id="p'+i+'"><p class="schooltext">'+esc(doc.paras[i]).replace(/\n/g,'<br>')+'</p>'+flag
  +'<div class="paractions">'+(ev?'<span class="chip-ev">Belägg: '+esc((kinds.filter(function(k){return k[0]===ev.kind;})[0]||['','Belägg'])[1])+'</span>':'')
  +'<button type="button" class="btn alt sm" data-a="ev" data-i="'+i+'" aria-expanded="'+open+'">'+(ev?'Ändra belägg':'Spara som belägg')+'</button></div>'
  +(open?'<div class="evform"><fieldset><legend>Vad är det här?</legend>'+kinds.map(function(k){return '<label class="radio"><input type="radio" name="evk" value="'+k[0]+'" data-evk '+((ev&&ev.kind===k[0])||(!ev&&k[0]==='says')?'checked':'')+'> '+k[1]+'</label>';}).join('')+'</fieldset><label for="evn">Det här visar att …</label><textarea id="evn" rows="2" data-evn>'+esc(ev?ev.note:'')+'</textarea><div class="actions">'+btn('Spara','evsave','data-i="'+i+'"')+(ev?btn('Ta bort','evdel','data-i="'+i+'"','alt'):'')+btn('Stäng','evclose','','alt')+'</div></div>':'')+'</article>';
}
function viewRead(r){
 if(needSource())return '<section>'+back()+'<h1 id="h1" tabindex="-1">Läs och förstå</h1>'+noSource()+'</section>';
 var si=Math.max(0,Math.min(doc.sections.length-1,(parseInt(r.a,10)||1)-1)),sec=doc.sections[si],rt=J('read.'+sec.id,null)||{t:'',kp:[]},words=K.words(rt.t).length;
 var copy=rt.t&&K.copyRatio(rt.t,sec.paras.map(function(i){return doc.paras[i];}).join(' '))>0.5;
 var vvh=si===doc.sections.length-1?'<div class="card"><h2>Berättelsen på tre rader</h2><label for="vvh1">Vem berättar?</label><input id="vvh1" data-k="read.vvh1" value="'+esc(get('read.vvh1')||'')+'"><label for="vvh2">Vad vill hen?</label><input id="vvh2" data-k="read.vvh2" value="'+esc(get('read.vvh2')||'')+'"><label for="vvh3">Vad hindrar hen?</label><input id="vvh3" data-k="read.vvh3" value="'+esc(get('read.vvh3')||'')+'"></div>':'';
 return '<section>'+back()+'<p class="eyebrow">Steg 2 av 7 · Del '+(si+1)+' av '+doc.sections.length+'</p><h1 id="h1" tabindex="-1">Läs och förstå</h1>'
  +(doc.note&&si===0?helpBlock('Tänk på',  '<p>'+esc(doc.note)+'</p>'):'')+(si===0?'<details class="card"><summary>Skolans inledning och sammanfattning</summary>'+schoolBlock('Inledning',doc.intro)+schoolBlock('Sammanfattning',doc.summary)+'</details>':'')
  +'<p class="small">Tryck på <b>Spara som belägg</b> vid ett stycke du vill kunna peka på. Skilj på <b>det som står</b>, <b>din tolkning</b> och <b>vad du tycker</b>.</p>'
  +(window.speechSynthesis?'<p>'+btn(ui.tts?'Stoppa uppläsning':'Läs upp den här delen','tts','data-i="'+si+'"','alt sm')+'</p>':'')
  +'<div class="textcol"><h2 class="sr">'+esc(sec.title)+'</h2>'+sec.paras.map(paraHtml).join('')+'</div>'
  +'<div class="card"><h2>Berätta med egna ord</h2><label for="retell">Vad hände i den här delen? En eller två meningar – utan att kopiera.</label><textarea id="retell" rows="3" data-retell="'+sec.id+'">'+esc(rt.t)+'</textarea>'
  +'<div id="copy-fb" role="status">'+copyHtml(copy)+'</div><div id="kp-box">'+kpHtml(sec,rt)+'</div>'+'</div>'+vvh
  +'<nav class="pager">'+(si>0?'<a class="btn alt" href="#/read/'+si+'">‹ Förra delen</a>':'<span></span>')+(si<doc.sections.length-1?'<a class="btn" href="#/read/'+(si+2)+'">Nästa del ›</a>':'<a class="btn" href="#/think">Till frågorna ›</a>')+'</nav></section>';
}

/* --- Tänk --- */
function rot(a,n){n=n%a.length;return a.slice(n).concat(a.slice(0,n));}
function qType(i){return C.typeOfQuestion[i]||'opinion';}
function curStep(qi){if(ui.step[qi])return ui.step[qi];var st=K.qState(notes,qi,now());ui.step[qi]=st.revised?6:st.attempted?2:1;return ui.step[qi];}
var QSTEPS=['Eget svar','Belägg','Annan syn','Jämför','Förbättra','Säg högt'];
function qLabel(i){return i===4?'Diskussionsfråga':'Fråga '+(i+1);}
function viewThinkList(){
 if(needSource())return '<section>'+back()+'<h1 id="h1" tabindex="-1">Tänk och svara</h1>'+noSource()+'</section>';
 var s=sm();
 return '<section>'+back()+'<p class="eyebrow">Steg 3 av 7</p><h1 id="h1" tabindex="-1">Tänk och svara</h1><p class="lead">Du skriver först med egna ord. Sedan hittar du belägg, prövar en annan syn, jämför och förbättrar – och säger det högt.</p>'
  +(s.retestReady?'<div class="card note"><b>Återtest redo.</b> Välj en fråga markerad ”Återtest” och svara på nytt utan att titta på dina gamla svar.</div>':'')
  +'<ol class="qlist">'+doc.questions.map(function(q,i){var st=s.q[i];return '<li><a class="station'+(st.level>=3?' done':'')+'" href="#/think/'+i+'"><span class="num" aria-hidden="true">'+(st.level>=3?'✓':i+1)+'</span><span class="body"><b>'+qLabel(i)+'</b><small class="schoolq">'+esc(q)+'</small><small class="meta">'+esc(C.statusText[st.level])+(st.retestReady?' · <em>Återtest</em>':'')+(st.retested?' · återtestad':'')+'</small></span><span class="chev" aria-hidden="true">›</span></a></li>';}).join('')+'</ol></section>';
}
function helpPanel(qi,stage){
 var lvl=ui.help[qi]||0,type=qType(qi),h=C.helpByType[type],sup=doc.supports[qi],out='';
 if(lvl<1)return '<p>'+btn('Jag vet inte hur jag ska börja','help1','data-q="'+qi+'"','alt sm')+'</p>';
 out+=helpBlock('Hjälp 1 · startfraser',h.stems.map(function(x){return '<p class="stem">'+esc(x)+'</p>';}).join('')+(sup.stem?'<p class="stem">'+esc(sup.stem)+'</p>':''));
 if(lvl<2)return out+'<p>'+btn('Ge mig tankefrågor','help2','data-q="'+qi+'"','alt sm')+'</p>';
 out+=helpBlock('Hjälp 2 · tankefrågor','<ul>'+h.asks.concat(sup.steps).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'+(sup.evidence?'<p><b>Titta efter:</b> '+esc(sup.evidence)+'</p>':''));
 return out;
}
function viewThinkQ(qi,sub){
 if(needSource())return '<section>'+back('think')+noSource()+'</section>';
 qi=Math.max(0,Math.min(4,qi));var q=doc.questions[qi],st=K.qState(notes,qi,now());
 if(sub==='retest')return viewRetest(qi);
 var step=curStep(qi),pre='ans.q'+qi,a1=get(pre+'.a1')||'',a2=J(pre+'.a2',null)||{t:''},ev=J(pre+'.ev',[]),body='';
 var head=(st.retestReady?'<div class="card note"><b>Återtest redo.</b> <a href="#/think/'+qi+'/retest">Svara på nytt utan att titta på dina gamla svar.</a></div>':'')+back('think')+'<p class="eyebrow">'+qLabel(qi)+' · steg '+step+' av 6</p>'+stepBar(6,step,QSTEPS)
  +schoolBlock(qi===4?doc.discussionHeading||'Diskussionsfråga':'Skolans fråga',q,qi===4&&doc.discussionInstruction?'<p>'+esc(doc.discussionInstruction)+'</p>':'')+(qi===4&&doc.note?helpBlock('Tänk på','<p>'+esc(doc.note)+'</p>'):'');
 var nav=function(prev,next,nextLabel,ok){return '<nav class="pager">'+(prev?btn('‹ Tillbaka','qstep','data-q="'+qi+'" data-s="'+prev+'"','alt'):'<span></span>')+(next?btn(nextLabel||'Nästa ›','qstep','data-q="'+qi+'" data-s="'+next+'"'+(ok===false?' disabled':'')):'')+'</nav>';};
 if(step===1){
  var an=K.analyse(a1,{evidenceCount:ev.length});
  body='<h2>1. Ditt första svar</h2><p>Skriv med egna ord. Det är bra att du försöker själv först – hjälpen finns om du behöver.</p><label for="a1">Mitt svar</label><textarea id="a1" rows="5" data-k="'+pre+'.a1" data-live="an" data-q="'+qi+'" placeholder="Jag tänker att … eftersom …">'+esc(a1)+'</textarea><div id="live-an">'+(K.words(a1).length>=3?chips(an):'')+'</div>'+helpPanel(qi,1)+nav(0,2,'Nästa: hitta belägg ›',K.words(a1).length>=3||(ui.help[qi]||0)>=1);
 }else if(step===2){
  var all=doc.paras.map(function(p,i){return {i:i,p:p};}),saved=Object.keys(notes).filter(function(k){return k.indexOf('ev.p')===0&&notes[k];}).map(function(k){return parseInt(k.slice(4),10);});
  var hints=doc.supports[qi].evidenceParas;
  body='<h2>2. Var i texten ser du det?</h2><p>Välj ett eller två stycken som stöder ditt svar. Förklara sedan med en mening <b>varför</b> stället visar det.</p><p class="small">Din text: <i>'+esc(a1.slice(0,160))+(a1.length>160?' …':'')+'</i></p>'
   +'<ul class="evpick">'+all.map(function(x){var on=ev.indexOf(x.i)>=0,suggested=hints.indexOf(x.i)>=0;return '<li><label class="check"><input type="checkbox" data-evq="'+qi+'" data-i="'+x.i+'" '+(on?'checked':'')+'><span><small class="who">Stycke '+(x.i+1)+(saved.indexOf(x.i)>=0?' · sparat belägg':'')+'</small>'+esc(x.p.slice(0,200))+(x.p.length>200?' …':'')+'</span></label></li>';}).join('')+'</ul>'
   +'<label for="evwhy">Det här stället visar att …</label><textarea id="evwhy" rows="3" data-k="'+pre+'.evwhy">'+esc(get(pre+'.evwhy')||'')+'</textarea>'+nav(1,3,'Nästa: annan syn ›');
 }else if(step===3){
  var pr=J(pre+'.pers',null)||{id:'',t:''},list=doc.supports[qi].perspectives.length?doc.supports[qi].perspectives:C.perspectivesGeneric;
  body='<h2>3. Hur kan någon annan se det?</h2><p>Välj en person och tänk som hen. Du behöver inte hålla med.</p><div class="seg col" role="group" aria-label="Perspektiv">'+list.map(function(x,i){return '<button type="button" class="btn alt" data-a="pers" data-q="'+qi+'" data-i="'+i+'" aria-pressed="'+(String(pr.id)===String(i))+'"><b>'+esc(x.who)+'</b><small>'+esc(x.prompt)+'</small></button>';}).join('')+'</div>'
   +(String(pr.id)!==''?'<label for="pers">Vad skulle hen säga – och vad förändrar det för ditt svar?</label><textarea id="pers" rows="4" data-persq="'+qi+'">'+esc(pr.t)+'</textarea>':'')+nav(2,4,'Nästa: jämför ›');
 }else if(step===4){
  var sup=doc.supports[qi],pair=sup.weak&&sup.strong?[{id:'a',t:sup.weak,tag:'weak'},{id:'b',t:sup.strong,tag:'strong'}]:rot(C.model.answers.map(function(x){return {id:x.id,t:x.t,tag:x.tag};}),qi),picked=(ui.model[qi]||{}),qtext=sup.weak&&sup.strong?q:C.model.question;
  body='<h2>4. Jämför tre resonemang</h2>'+helpBlock('Övningsexempel – inte facit',(sup.weak&&sup.strong?'<p>Frågan: <i>'+esc(qtext)+'</i></p>':'<p>Exempel på en påhittad text, <b>'+esc(C.model.title)+'</b>:</p><p class="schooltext small">'+esc(C.model.text)+'</p><p>Frågan: <i>'+esc(qtext)+'</i></p>')
   +'<p>Vilket resonemang är starkast – och varför? Välj först. Sedan ser du förklaringen.</p><div class="seg col" role="group" aria-label="Välj resonemang">'+pair.map(function(x,i){return '<button type="button" class="btn alt" data-a="model" data-q="'+qi+'" data-i="'+x.id+'" aria-pressed="'+(picked.pick===x.id)+'">'+'Svar '+String.fromCharCode(65+i)+': '+esc(x.t)+'</button>';}).join('')+'</div>'
   +(picked.pick?'<div class="fb '+(pair.filter(function(x){return x.id===picked.pick;})[0].tag==='strong'?'ok':'no')+'" role="status">'+(sup.weak&&sup.strong?esc(sup.why||'Det starkaste svaret har tydligt svar, ”därför”, belägg och en annan syn.'):esc(C.model.explain[picked.pick]))+'</div>':''))
   +'<p class="small">Titta på dina egna fyra delar: Mitt svar, Därför, Belägg, Annan syn. Vilka saknar du?</p>'+nav(3,5,'Nästa: förbättra mitt svar ›',!!picked.pick);
 }else if(step===5){
  var cur=a2.t||a1,an1=K.analyse(a1,{evidenceCount:ev.length,perspectiveDone:!!(J(pre+'.pers',null)||{}).t}),an2=K.analyse(cur,{evidenceCount:ev.length,perspectiveDone:!!(J(pre+'.pers',null)||{}).t}),better=J(pre+'.better',[]);
  body='<h2>5. Förbättra ditt svar</h2><p>Skriv om ditt svar så att det blir tydligare. Du ser ditt första svar nedan. Använd det du hittat: belägg, annan syn och det du lärde dig i jämförelsen.</p>'
   +'<details><summary>Mitt första svar</summary><p class="schooltext">'+esc(a1)+'</p></details><label for="a2">Mitt förbättrade svar</label><textarea id="a2" rows="7" data-a2="'+qi+'" data-live="an2">'+esc(cur)+'</textarea><div id="live-an2">'+chips(an2)+'</div>'
   +'<fieldset><legend>Vad blev bättre? (Välj det som stämmer.)</legend>'+C.betterOptions.map(function(o){return '<label class="radio"><input type="checkbox" data-better="'+qi+'" data-id="'+o.id+'" '+(better.indexOf(o.id)>=0?'checked':'')+'> '+esc(o.label)+'</label>';}).join('')+'</fieldset>'
   +(an2.count>an1.count?'<p class="fb ok">Före: '+an1.count+' av 4 delar syns. Nu: '+an2.count+' av 4.</p>':'')
   +nav(4,6,'Nästa: säg det högt ›',st.revised);
 }else{
  var parts=J(pre+'.cues',['','','']),lvl=ui.oralLvl[qi]||Math.min(3,((J(pre+'.oral',[]).slice(-1)[0]||{}).lvl||0)+1)||1,oral=J(pre+'.oral',[]);
  body='<h2>6. Säg det högt – utan att läsa</h2><p>Skriv tre korta stödord (2–5 ord): <b>svar</b>, <b>därför/belägg</b>, <b>annan syn/slutsats</b>. Sedan övar du med mindre och mindre stöd.</p>'
   +['Svar','Därför och belägg','Annan syn / slutsats'].map(function(l,i){return '<label for="cue'+i+'">'+l+'</label><input id="cue'+i+'" data-cue="'+qi+'" data-i="'+i+'" value="'+esc(parts[i]||'')+'" autocomplete="off">';}).join('')+'<div id="live-cue" class="hint"></div>'
   +'<div id="oral-box">'+oralBlock(qi)+'</div>'
   +(st.spoken?'<div class="card ok"><b>Bra.</b> Du har sagt svaret högt med mindre stöd. '+(qi<4?'<a href="#/think/'+(qi+1)+'">Nästa fråga ›</a>':'<a href="#/present">Till Presentera ›</a>')+'</div>':'')
   +compare(qi,a1,a2.t)+nav(5,0);
 }
 return '<section>'+head+'<div class="card">'+body+'</div></section>';
}
function oralBlock(qi){var pre='ans.q'+qi,parts=J(pre+'.cues',['','','']),oral=J(pre+'.oral',[]),lvl=ui.oralLvl[qi]||Math.min(3,((oral.slice(-1)[0]||{}).lvl||0)+1)||1;return parts.filter(Boolean).length===3?oralRound(qi,parts,lvl,oral):'<p class="hint">Skriv alla tre stödord för att börja öva.</p>';}
function oralRound(qi,parts,lvl,oral){
 var L=C.oral.levels[lvl-1],cs=K.cues(parts,lvl);
 return '<div class="round"><h3>'+esc(L.title)+'</h3><p>'+esc(L.text)+'</p><div class="cuebox" aria-live="polite">'+(lvl>=3?'<b>Bara frågan syns.</b>':cs.map(function(c,i){return '<span class="cue"><small>'+(i+1)+'</small> '+esc(c)+'</span>';}).join(''))+'</div><p>Hur gick det?</p><div class="seg col" role="group" aria-label="Hur gick det">'+C.oral.rates.map(function(r){return '<button type="button" class="btn alt" data-a="oral" data-q="'+qi+'" data-lvl="'+lvl+'" data-r="'+r.id+'">'+esc(r.label)+'</button>';}).join('')+'</div><p class="hint">'+esc(C.oral.tip)+'</p>'+(oral.length?'<p class="small">Dina rundor: '+oral.map(function(r){return 'nivå '+r.lvl+' – '+esc((C.oral.rates.filter(function(x){return x.id===r.rate;})[0]||{label:''}).label.toLowerCase());}).join('; ')+'</p>':'')+'</div>';
}
function compare(qi,a1,a2){return a2?'<details class="cmp"><summary>Före och efter</summary><div class="grid2"><div><b>Första svaret</b><p class="schooltext">'+esc(a1)+'</p></div><div><b>Förbättrat</b><p class="schooltext">'+esc(a2)+'</p></div></div></details>':'';}
function viewRetest(qi){
 var pre='ans.q'+qi,rt=J(pre+'.rt',null),q=doc.questions[qi];
 return '<section>'+back('think')+'<p class="eyebrow">Återtest · '+qLabel(qi)+'</p><h1 id="h1" tabindex="-1">Svara på nytt – utan hjälp</h1><p>Du får inte titta på dina gamla svar. Skriv som om du fick frågan för första gången.</p>'+schoolBlock('Skolans fråga',q)
  +'<div class="card">'+(rt?'<p class="schooltext">'+esc(rt.t)+'</p><div class="chips-box">'+chips(K.analyse(rt.t,{}))+'</div>'+compare(qi,J(pre+'.a2',{t:''}).t,rt.t)+'<p class="fb ok">Sparat. Jämför med ditt förbättrade svar ovan.</p>':'<label for="rt">Mitt svar</label><textarea id="rt" rows="7"></textarea>'+btn('Spara återtest','rtsave','data-q="'+qi+'"'))+'</div></section>';
}

/* --- Presentera --- */
function viewPresent(){
 if(needSource())return '<section>'+back()+'<h1 id="h1" tabindex="-1">Presentera</h1>'+noSource()+'</section>';
 var parts=C.presParts.map(function(p){return get('pres.'+p.n)||'';});
 var s=sm(),ready=parts.every(function(x){return K.words(x).length>=1;}),lvl=ui.presLvl,rounds=J('pres.rounds',[]);
 var seed=[];Object.keys(notes).filter(function(k){return k.indexOf('ev.p')===0&&notes[k];}).slice(0,3).forEach(function(k){var e=JSON.parse(notes[k]);seed.push('Belägg: '+(e.note||'').slice(0,80));});
 doc.sections.forEach(function(sec){var r=J('read.'+sec.id,null);if(r&&r.t)seed.push('Del: '+r.t.slice(0,90));});
 return '<section>'+back()+'<p class="eyebrow">Steg 4 av 7</p><h1 id="h1" tabindex="-1">Presentera</h1><p class="lead">Bygg en presentation på cirka två minuter av stödord. Du behöver inget manus – bara orden som hjälper dig minnas.</p>'
  +(seed.length?'<details class="card"><summary>Hämta från mitt tidigare arbete</summary><ul>'+seed.slice(0,6).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></details>':'')
  +'<div class="card">'+C.presParts.map(function(p,i){var w=K.cueLength(parts[i]);return '<label for="pp'+p.n+'">'+p.n+'. '+esc(p.title)+' <small>'+esc(p.prompt)+'</small></label><input id="pp'+p.n+'" data-pres="'+p.n+'" value="'+esc(parts[i])+'" autocomplete="off"><small id="pw'+p.n+'" class="cuew'+(w>12?' warn':'')+'">'+(w>12?w+' ord – det blir manus. Korta ner till stödord.':w?w+' ord':'')+'</small>';}).join('')+'</div>'
  +'<div id="pres-box" data-ready="'+(ready?1:0)+'">'+presPractice()+'</div>'
  +(s.presParts>=5&&s.talkedFree?'<div class="card ok"><b>Bra jobbat.</b> Du har presenterat med mindre stöd. <a href="#/lead">Till Leda ›</a></div>':'')+'</section>';
}
function oralLevelBox(lvl){return '<div class="seg" role="group" aria-label="Stödnivå">'+[1,2,3].map(function(l){return '<button type="button" class="btn alt sm" data-a="plvl" data-lvl="'+l+'" aria-pressed="'+(lvl===l)+'">Nivå '+l+'</button>';}).join('')+'</div><p class="small">'+esc(C.oral.levels[lvl-1].text)+'</p>';}

function presPractice(){var parts=C.presParts.map(function(p){return get('pres.'+p.n)||'';}),ready=parts.every(function(x){return K.words(x).length>=1;}),lvl=ui.presLvl,rounds=J('pres.rounds',[]);return ((ready?'<div class="card"><h2>Öva</h2>'+oralLevelBox(lvl)+'<div class="cuebox" aria-live="polite">'+(lvl>=3?'<b>Bara delarnas rubriker syns:</b> '+C.presParts.map(function(p){return esc(p.title);}).join(' → '):K.cues(parts,lvl).map(function(c,i){return '<span class="cue"><small>'+(i+1)+'</small> '+esc(c)+'</span>';}).join(''))+'</div><p class="actions">'+btn(ui.timer?'Stoppa klockan':'Starta tvåminutersklocka (övning)','ptimer','','alt')+'<b id="clock" role="timer">'+clockText(120)+'</b></p><p>Hur gick det?</p><div class="seg col" role="group" aria-label="Hur gick det">'+C.oral.rates.map(function(r){return '<button type="button" class="btn alt" data-a="prate" data-lvl="'+lvl+'" data-r="'+r.id+'">'+esc(r.label)+'</button>';}).join('')+'</div>'
   +(rounds.length?'<p class="small">Rundor: '+rounds.map(function(r){return 'nivå '+r.lvl+' – '+esc((C.oral.rates.filter(function(x){return x.id===r.rate;})[0]||{label:''}).label.toLowerCase());}).join('; ')+'</p>':'')+'<p class="hint">'+esc(C.rehearsal.timerNote)+'</p></div>':'<p class="hint">Fyll i ett stödord i alla fem delar för att börja öva.</p>'));}
function presReady(){return C.presParts.every(function(p){return K.words(get('pres.'+p.n)).length>=1;});}
/* --- Leda --- */
function viewLead(){
 var sims=J('lead.sims',{}),cards=J('lead.cards',[]),dq=doc?doc.questions[4]:'';
 var simHtml=C.leadSims.map(function(sim){var pick=ui.sim[sim.id],done=sims[sim.id];
  return '<div class="card sim"><span class="tag help-tag">Simulering</span><h3>'+esc(sim.title)+'</h3><p>'+esc(sim.setup)+'</p><p><b>Vad säger eller gör du?</b></p><div class="seg col">'+sim.options.map(function(o,i){return '<button type="button" class="btn alt" data-a="sim" data-id="'+sim.id+'" data-i="'+i+'" aria-pressed="'+(pick===i)+'">'+esc(o.t)+'</button>';}).join('')+'</div>'
   +(pick!==undefined?'<div class="fb '+(sim.options[pick].good?'ok':'no')+'" role="status"><b>'+(sim.options[pick].good?'Det fungerar.':'Det kan bli svårt.')+'</b> '+esc(sim.options[pick].why)+(sim.options[pick].good?'':'<br><b>Starkare:</b> '+esc(sim.options.filter(function(o){return o.good;})[0].why))+'</div>':'')+(done?'<small class="hint">Prövad'+(done.good?' – du valde det starka alternativet direkt.':'.')+'</small>':'')+'</div>';}).join('');
 var fu1=get('lead.followup1')||'',fu2=get('lead.followup2')||'';
 var card=ui.card!==null?C.objections[ui.card]:null;
 return '<section>'+back()+'<p class="eyebrow">Steg 5 av 7</p><h1 id="h1" tabindex="-1">Leda samtalet</h1><p class="lead">Att leda är att hjälpa gruppen att tänka – inte att prata mest. Du övar på situationer som kan hända, och bygger din egen öppning.</p>'
  +'<h2>1. Vad gör du då?</h2><p class="hint">Simuleringar är påhittade övningar, inte facit. Det finns ofta flera bra sätt.</p>'+simHtml
  +'<h2>2. Min öppning</h2>'+(doc?schoolBlock('Skolans diskussionsfråga',dq,doc.discussionInstruction?'<p>'+esc(doc.discussionInstruction)+'</p>':''):noSource())
  +'<div class="card"><p>Skriv två <b>öppna</b> följdfrågor (de som börjar med Varför, Hur, Vad tror du …) och en inbjudan till någon som inte pratat.</p><label for="fu1">Följdfråga 1</label><input id="fu1" data-k="lead.followup1" data-live="qk" value="'+esc(fu1)+'" autocomplete="off"><div id="qk-lead.followup1" class="qk"></div><label for="fu2">Följdfråga 2</label><input id="fu2" data-k="lead.followup2" data-live="qk" value="'+esc(fu2)+'" autocomplete="off"><div id="qk-lead.followup2" class="qk"></div><label for="inv">Inbjudan till den som är tyst</label><input id="inv" data-k="lead.invite" value="'+esc(get('lead.invite')||'')+'" autocomplete="off"><label for="sum">Så här sammanfattar jag samtalet</label><textarea id="sum" rows="2" data-k="lead.summary">'+esc(get('lead.summary')||'')+'</textarea><ul class="frames">'+C.leadFrames.map(function(f){return '<li>'+esc(f)+'</li>';}).join('')+'</ul></div>'
  +'<h2>3. Överraskningskort</h2><div class="card"><p>Någon i gruppen säger något oväntat. Dra ett kort, <b>svara högt</b> i 20–30 sekunder och bedöm dig själv.</p>'+btn('Dra ett kort','card')+(card?'<blockquote class="sim-card"><span class="tag help-tag">Simulering</span><p>”'+esc(card)+'”</p></blockquote><div class="seg col" role="group" aria-label="Hur gick det">'+C.oral.rates.map(function(r){return '<button type="button" class="btn alt" data-a="cardrate" data-r="'+r.id+'">'+esc(r.label)+'</button>';}).join('')+'</div>':'')+'<p class="small">Du har övat '+cards.length+' kort.</p></div>'
  +'<details class="card"><summary>'+esc(C.family.title)+'</summary><p>'+esc(C.family.how)+'</p><ul>'+C.family.rules.map(function(r){return '<li>'+esc(r)+'</li>';}).join('')+'</ul><ol class="objlist">'+C.objections.map(function(o){return '<li>”'+esc(o)+'”</li>';}).join('')+'</ol>'+btn('Skriv ut rollkortet','print','','alt')+'</details>'
  +'<a class="btn big" href="#/join">Till Delta ›</a></section>';
}

/* --- Delta --- */
function viewJoin(r){
 var done=J('join.done',{}),tid=r.a||'',t=C.joinTexts.filter(function(x){return x.id===tid;})[0];
 if(!t)return '<section>'+back()+'<p class="eyebrow">Steg 6 av 7</p><h1 id="h1" tabindex="-1">Delta i andras texter</h1><p class="lead">I provet lyssnar du på texter du inte har läst. Här övar du på tre okända texter. Stödet minskar för varje text.</p><ol class="stations">'+C.joinTexts.map(function(x,i){var d=done[x.id];return '<li><a class="station'+(d?' done':'')+'" href="#/join/'+x.id+'"><span class="num" aria-hidden="true">'+(d?'✓':i+1)+'</span><span class="body"><b>'+esc(x.title)+'</b><small>'+esc(x.genre)+' · '+(i===0?'med alla hjälpramar':i===1?'med bara stödfraser':'utan hjälp')+'</small></span><span class="chev" aria-hidden="true">›</span></a></li>';}).join('')+'</ol><a class="btn big" href="#/finish">Till generalrepetitionen ›</a></section>';
 var idx=C.joinTexts.indexOf(t),level=idx===0?1:idx===1?2:3,pre='join.'+t.id+'.',d=done[t.id],steps=C.joinSteps;
 return '<section>'+back('join')+'<p class="eyebrow">Delta · '+esc(t.genre)+'</p><h1 id="h1" tabindex="-1">'+esc(t.title)+'</h1>'
  +helpBlock('Simulering – en kompis presenterar den här texten',(level===3?'<p>Nu får du ingen hjälp. Läs texten en gång, och svara sedan på alla fyra delar.</p>':'')+'<p class="schooltext">'+esc(t.text)+'</p>')
  +'<div class="card">'+steps.map(function(s,i){var v=get(pre+s.id)||'',qk=s.id==='q'?K.questionKind(v):null;
   return '<label for="j'+s.id+'">'+(i+1)+'. '+esc(s.title)+(level<3?' <small>'+esc(s.ask)+'</small>':'')+'</label><textarea id="j'+s.id+'" rows="2" data-k="'+pre+s.id+'" '+(s.id==='q'?'data-live="jq" ':'')+'>'+esc(v)+'</textarea>'+(level===1?'<ul class="frames">'+s.frames.map(function(f){return '<li>'+esc(f)+'</li>';}).join('')+'</ul>':level===2?'<p class="hint">Starta gärna: '+esc(s.frames[0])+'</p>':'')+(s.id==='q'?'<div id="jq-'+t.id+'" class="qk">'+qkText(qk)+'</div>':'');}).join('')
   +btn(d?'Spara igen':'Klar – visa ett exempel','joindone','data-id="'+t.id+'" data-lvl="'+level+'"')+'</div>'
  +(d?'<div class="card"><h2>Så kan ett starkt svar låta</h2><p class="hint">Övningsexempel – inte facit. Jämför med dina egna ord: vad gör det starkt?</p>'+steps.map(function(s){return '<p><b>'+esc(s.title)+':</b> '+esc(t.strong[s.id]||'')+'</p>';}).join('')+'</div>':'')+'</section>';
}
function qkText(k){if(!k||k.reason==='short')return '';if(k.open&&k.ok)return '<span class="ok-t">✓ Öppen fråga – den bjuder in till resonemang.</span>';if(k.open)return '<span class="warn-t">Sätt ett frågetecken i slutet.</span>';if(k.reason==='closed')return '<span class="warn-t">Den här kan besvaras med ja eller nej. Prova att börja med Varför, Hur eller Vad tror du.</span>';return '<span class="warn-t">Börja gärna med Varför, Hur eller Vad tror du …</span>';}

/* --- Generalrepetition --- */
function viewFinish(){
 var s=sm(),reh=J('rehearsal',null),checks=J('rehearsal.checks',[]);
 var hasQ=doc&&s.q[0].attempted,a1=doc?get('ans.q0.a1')||'':'',a2=doc?(J('ans.q0.a2',{t:''}).t||''):'';
 var legacy=Object.keys(notes).filter(function(k){return k.indexOf('legacy.')===0&&notes[k]&&notes[k]!==false;});
 return '<section>'+back()+'<p class="eyebrow">Steg 7 av 7</p><h1 id="h1" tabindex="-1">Generalrepetition och reflektion</h1><p class="lead">Be någon hemma vara samtalspartner (rollkortet finns under Leda). Du går igenom hela provet och ser sedan vad du blivit bättre på.</p>'
  +'<div class="card"><h2>Genomgång</h2><ol class="checks">'+C.rehearsal.steps.map(function(x,i){return '<li><label class="check"><input type="checkbox" data-reh="'+i+'" '+(checks.indexOf(i)>=0?'checked':'')+'><span>'+esc(x)+'</span></label></li>';}).join('')+'</ol><p class="actions">'+btn(ui.timer?'Stoppa klockan':'Starta sex minuter (övning)','rtimer','','alt')+'<b id="clock" role="timer">'+clockText(360)+'</b></p><p class="hint">'+esc(C.rehearsal.timerNote)+'</p>'+btn(reh?'Genomförd – spara igen':'Jag har genomfört en generalrepetition','rehdone')+(reh?'<p class="fb ok">Genomförd.</p>':'')+'</div>'
  +'<div class="card"><h2>Reflektion</h2>'+C.reflect.map(function(r){return '<label for="rf'+r.k+'">'+esc(r.label)+'</label><textarea id="rf'+r.k+'" rows="3" data-k="reflect.'+r.k+'">'+esc(get('reflect.'+r.k)||'')+'</textarea>';}).join('')+'</div>'
  +(hasQ?'<div class="card"><h2>Du då och nu</h2><div class="grid2"><div><b>Första svaret på fråga 1</b><p class="schooltext">'+esc(a1)+'</p></div><div><b>Efter förbättring</b><p class="schooltext">'+esc(a2||'Inte förbättrat än.')+'</p></div></div></div>':'')
  +'<div class="card"><h2>Det här kan du nu – bevisat av vad du gjort</h2><ul><li>Svar förbättrade: '+s.improved+' av 5</li><li>Svar sagda högt med mindre stöd: '+s.spoken+' av 5</li><li>Återtest klarade: '+s.retested+'</li><li>Ledarsituationer prövade: '+s.leadSims+' av 5</li><li>Okända texter besvarade: '+s.joinN+' av 3</li></ul><p class="hint">Det här är din egen översikt – inte en bedömning och inte provpoäng.</p></div>'
  +(legacy.length?'<details class="card"><summary>Dina tidigare anteckningar (från den gamla övningen)</summary>'+legacy.map(function(k){return '<p><b>'+esc(k.slice(7))+':</b> '+esc(String(notes[k]))+'</p>';}).join('')+'</details>':'')+'</section>';
}

/* ---------- sheet: konto, text, säkerhet ---------- */
function sheetHtml(){
 var fid=doc?doc.fidelity:[],counts={};fid.forEach(function(f){counts[f.status]=(counts[f.status]||0)+1;});
 return '<div class="sheet-bg" data-a="sheetbg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h" tabindex="-1"><div class="sheet-head"><h2 id="sheet-h">Text, konto och säkerhet</h2>'+btn('Stäng','sheet','aria-label="Stäng"','alt sm')+'</div>'
  +'<div class="note" id="cloudStatus" role="status" aria-live="polite">'+esc(window.MO_NP_STATUS||'Kontrollerar elevkontots synkstatus …')+'</div>'
  +'<div class="actions"><a class="btn alt" href="../study/">Elevkonto / logga in</a><button type="button" class="btn alt" id="syncNow">Synka nu</button></div>'
  +'<h3>Textpaket</h3><p class="small" id="status">'+(doc?'Textpaketet är inläst (version '+doc.v+'). Lokal kopia finns.':'Ingen skoltext ännu. Lägg in ditt privata paket, eller logga in så hämtas det.')+'</p>'
  +(fid.length?'<p class="small">Källstatus: '+(counts.VERBATIM_PHOTO||0)+' stycken lästa direkt från skolans foto'+(counts.PHOTO_PARTIAL?', '+counts.PHOTO_PARTIAL+' delvis läsbara':'')+(counts.EPUB_INFERRED?', '+counts.EPUB_INFERRED+' kompletterade ur romanen':'')+(counts.UNREADABLE?', '+counts.UNREADABLE+' oläsliga':'')+'. Osäkra stycken är märkta i texten.</p>':'')
  +'<div class="actions">'+btn('Lägg in textpaket','pickimport','','alt')+btn('Exportera säkerhetskopia','export','','alt')+btn('Återställ säkerhetskopia','pickrestore','','alt')+'</div>'
  +'<input type="file" id="fileSource" accept=".json,application/json" class="sr" tabindex="-1" aria-hidden="true"><input type="file" id="fileRestore" accept=".json,application/json" class="sr" tabindex="-1" aria-hidden="true">'
  +'<h3>Rensa</h3><p class="small">Rensar dina svar på den här enheten och i den synkade kopian. Exportera en säkerhetskopia först.</p>'+btn('Rensa mitt NP-arbete','clear','','alt danger')
  +'<p class="small muted">Utan konto sparas allt bara på den här enheten. Med elevkonto (åk 9) synkas text och svar till din skyddade Study Cloud. En kopplad mentor kan läsa enligt ditt godkännande; materialet är inte end-to-end-krypterat. Säkerhetskopior innehåller text och svar – dela dem aldrig öppet. Använd aldrig ditt Gmail-lösenord här.</p></div></div>';
}
function exportBackup(){
 var blob=new Blob([JSON.stringify({format:'matte-os-np-backup-v3',workId:'en-stark-nolla',grade:'grade9',source:raw,sourceAt:sourceAt,notes:notes,noteAt:noteAt,exportedAt:new Date(now()).toISOString()},null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=u;a.download='matte-os-np-PRIVAT-sakerhetskopia.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1000);
}

/* ---------- header + render ---------- */
function shortStatus(){var m=window.MO_NP_STATUS||'Sparas på den här enheten.';return m.split(/(?<=[.!?])\s/)[0];}
function header(){return '<header class="np-top"><a class="back-svenska" href="./#/sv">‹ Svenska</a><span class="brand"><b>MATTE OS</b> <small>NP-övning</small></span><div class="top-actions"><button type="button" class="btn alt sm" data-a="theme" aria-label="Växla dag och kväll">☾</button><button type="button" class="btn alt sm" data-a="sheet" aria-label="Text, konto och säkerhet">⚙</button></div></header>';}
function render(keep){
 stopTimerIfLeaving();
 var r=route(),y=window.scrollY,html='';
 try{
  switch(r.v){
   case 'start':html=viewStart();break;
   case 'read':html=viewRead(r);break;
   case 'think':html=r.a===''?viewThinkList():viewThinkQ(parseInt(r.a,10)||0,r.b);break;
   case 'present':html=viewPresent();break;
   case 'lead':html=viewLead();break;
   case 'join':html=viewJoin(r);break;
   case 'finish':html=viewFinish();break;
   default:html=viewHome();
  }
 }catch(e){console.error(e);html='<section><div class="card warn"><h2>Något gick fel</h2><p>Sidan kunde inte visas. Dina svar är sparade på enheten.</p><a class="btn" href="#/home">Till början</a></div></section>';}
 app.innerHTML=header()+(ui.msg?'<div class="notice" role="alert">'+esc(ui.msg)+'</div>':'')+'<main id="main">'+html+'</main><footer class="np-foot"><small>Matte OS · Privat övningsstöd, inte ett officiellt nationellt prov. Inga elevsvar eller ljud skickas till någon tjänst från den här sidan.</small></footer>'+(ui.sheet?sheetHtml():'');
 refreshLive();
 if(keep){window.scrollTo(0,y);}
 else if(r.v!==lastView||r.a!==lastArg){window.scrollTo(0,0);var h=E('h1');if(h&&!ui.sheet)h.focus({preventScroll:true});}
 lastView=r.v;lastArg=r.a;
 if(ui.sheet){var sh=document.querySelector('.sheet');if(sh&&!sheetFocused){sh.focus();sheetFocused=true;}}
 if(window.MO_NP_SYNC&&ui.sheet)window.dispatchEvent(new Event('np-sheet'));
}
var lastView='',lastArg='',sheetFocused=false;
/* Ritar inte om medan eleven skriver: ett pågående svar får aldrig tappa fokus eller text på grund av synk. */
function softRender(){var a=document.activeElement;if(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&app.contains(a)){ui.pending=true;return;}render(true);}
document.addEventListener('focusout',function(){if(!ui.pending)return;setTimeout(function(){var a=document.activeElement;if(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&app.contains(a))return;ui.pending=false;render(true);},60);});
function stopTimerIfLeaving(){var r=route();if(ui.timer&&r.v!==lastView){stopTimer();}}
function syncNext(qi){var st=K.qState(notes,qi,now()),a1=get('ans.q'+qi+'.a1')||'',b1=document.querySelector('[data-a=qstep][data-s="2"]'),b6=document.querySelector('[data-a=qstep][data-s="6"]');if(b1)b1.disabled=!(K.words(a1).length>=3||(ui.help[qi]||0)>=1);if(b6)b6.disabled=!st.revised;}
function refreshLive(){
 document.querySelectorAll('[data-live="qk"]').forEach(function(el){var t=E('qk-'+el.dataset.k);if(t)t.innerHTML=qkText(K.questionKind(el.value));});
 var cues=document.querySelectorAll('[data-cue]');if(cues.length){var n=[].map.call(cues,function(x){return K.cueLength(x.value);}),box=E('live-cue');if(box)box.textContent=n.some(function(x){return x>6;})?'Stödord är 2–5 ord. Längre blir manus.':'';}
}

/* ---------- händelser ---------- */
var A={
 nav:function(b){go(b.dataset.h);},
 theme:function(){var d=document.documentElement.classList.toggle('dark');try{localStorage.setItem('matteos.appearance.v1',d?'dark':'light');}catch(e){}},
 sheet:function(){ui.sheet=!ui.sheet;sheetFocused=false;render(true);if(!ui.sheet){var b=document.querySelector('[data-a="sheet"]');if(b)b.focus();}},
 sheetbg:function(b,e){if(e.target===b){ui.sheet=false;render(true);}},
 pickimport:function(){var f=E('fileSource');if(f)f.click();},pickrestore:function(){var f=E('fileRestore');if(f)f.click();},
 export:exportBackup,print:function(){window.print();},
 quiz:function(b){ui.quiz[b.dataset.i]=b.dataset.r;var ok=C.quiz.filter(function(x,i){return ui.quiz[i]===x.a;}).length;if(Object.keys(ui.quiz).length===C.quiz.length&&ok>=5)set('quiz.pass','1');render(true);},
 quizreset:function(){ui.quiz={};render(true);},
 ev:function(b){ui.evOpen=ui.evOpen===+b.dataset.i?null:+b.dataset.i;render(true);var t=E('evn');if(t)t.focus();},
 evclose:function(){ui.evOpen=null;render(true);},
 evsave:function(b){var i=+b.dataset.i,k=(document.querySelector('[data-evk]:checked')||{}).value||'says',n=(E('evn')||{}).value||'';setJ('ev.p'+i,{kind:k,note:n.slice(0,600)});ui.evOpen=null;render(true);},
 evdel:function(b){set('ev.p'+(+b.dataset.i),'');ui.evOpen=null;render(true);},
 tts:function(b){if(!window.speechSynthesis)return;if(ui.tts){speechSynthesis.cancel();ui.tts=false;render(true);return;}var sec=doc.sections[+b.dataset.i],u=new SpeechSynthesisUtterance(sec.paras.map(function(i){return doc.paras[i];}).join(' '));u.lang='sv-SE';u.onend=function(){ui.tts=false;render(true);};ui.tts=true;speechSynthesis.speak(u);render(true);},
 help1:function(b){var q=+b.dataset.q;ui.help[q]=Math.max(ui.help[q]||0,1);set('ans.q'+q+'.help',String(Math.max(Number(get('ans.q'+q+'.help'))||0,1)));render(true);},
 help2:function(b){var q=+b.dataset.q;ui.help[q]=2;set('ans.q'+q+'.help','2');render(true);},
 qstep:function(b){var q=+b.dataset.q,s=+b.dataset.s;if(s===0){go('think');return;}ui.step[q]=s;render();},
 pers:function(b){var q=+b.dataset.q,p=J('ans.q'+q+'.pers',null)||{t:''};setJ('ans.q'+q+'.pers',{id:+b.dataset.i,t:p.t||''});render(true);},
 model:function(b){var q=+b.dataset.q;ui.model[q]={pick:b.dataset.i};render(true);},
 oral:function(b){var q=+b.dataset.q,lvl=+b.dataset.lvl,l=J('ans.q'+q+'.oral',[]);l.push({lvl:lvl,rate:b.dataset.r,at:now()});setJ('ans.q'+q+'.oral',l.slice(-12));ui.oralLvl[q]=Math.min(3,lvl+(b.dataset.r==='read'?0:1));render(true);},
 rtsave:function(b){var q=+b.dataset.q,t=(E('rt')||{}).value||'';if(K.words(t).length<3)return;setJ('ans.q'+q+'.rt',{t:t,at:now(),help:0});render(true);},
 ptimer:function(){toggleTimer(120);},rtimer:function(){toggleTimer(360);},
 plvl:function(b){ui.presLvl=+b.dataset.lvl;render(true);},
 prate:function(b){var l=J('pres.rounds',[]);l.push({lvl:+b.dataset.lvl,rate:b.dataset.r,at:now()});setJ('pres.rounds',l.slice(-12));if(b.dataset.r!=='read'&&ui.presLvl<3)ui.presLvl++;render(true);},
 sim:function(b){var id=b.dataset.id,i=+b.dataset.i,sim=C.leadSims.filter(function(s){return s.id===id;})[0],sims=J('lead.sims',{});ui.sim[id]=i;if(!sims[id])sims[id]={pick:i,good:!!sim.options[i].good,at:now()};setJ('lead.sims',sims);render(true);},
 card:function(){var n;do{n=Math.floor(Math.random()*C.objections.length);}while(n===ui.card&&C.objections.length>1);ui.card=n;render(true);},
 cardrate:function(b){var l=J('lead.cards',[]);l.push({i:ui.card,rate:b.dataset.r,at:now()});setJ('lead.cards',l.slice(-30));ui.card=null;render(true);},
 joindone:function(b){var id=b.dataset.id,lvl=+b.dataset.lvl,pre='join.'+id+'.',ok=C.joinSteps.every(function(s){return K.words(get(pre+s.id)).length>=3;});if(!ok){ui.msg='Skriv minst några ord i alla fyra delarna.';render(true);return;}ui.msg='';var d=J('join.done',{});d[id]={at:now(),indep:lvl===3,q:K.questionKind(get(pre+'q')).open};setJ('join.done',d);render(true);},
 clear:function(){if(!confirm('Rensa dina svar och anteckningar för NP-övningen? Det rensas också i den synkade kopian. Har du exporterat en säkerhetskopia?'))return;var at=now();Object.keys(notes).forEach(function(k){notes[k]=typeof notes[k]==='boolean'?false:'';noteAt[k]=at;});persist();if(window.MO_NP_SYNC)window.MO_NP_SYNC.schedule();ui.step={};ui.help={};ui.quiz={};render(true);},
 rehdone:function(){setJ('rehearsal',{at:now()});render(true);}
};
function fmtClock(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function clockText(def){return fmtClock(ui.timer&&ui.tleft!=null?ui.tleft:def);}
function toggleTimer(sec){if(ui.timer){stopTimer();ui.tleft=null;render(true);return;}ui.tleft=sec;ui.timer=setInterval(function(){ui.tleft=Math.max(0,ui.tleft-1);var el=E('clock');if(el)el.textContent=fmtClock(ui.tleft);if(!ui.tleft){stopTimer();render(true);}},1000);render(true);}
document.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var f=A[b.dataset.a];if(!f)return;if(b.tagName!=='A')e.preventDefault();if(b.disabled)return;f(b,e);});
document.addEventListener('input',function(e){
 var t=e.target;
 if(t.dataset.k){set(t.dataset.k,t.value.slice(0,10000));if(t.dataset.live==='an'){var q=+t.dataset.q;syncNext(q);var a=K.analyse(t.value,{evidenceCount:J('ans.q'+q+'.ev',[]).length}),box=E('live-an');if(box)box.innerHTML=K.words(t.value).length>=3?chips(a):'';}
  if(t.dataset.live==='qk'){var qb=E('qk-'+t.dataset.k);if(qb)qb.innerHTML=qkText(K.questionKind(t.value));}
  if(t.dataset.live==='jq'){var id=(route().a),jb=E('jq-'+id);if(jb)jb.innerHTML=qkText(K.questionKind(t.value));}}
 else if(t.dataset.retell){var sec=t.dataset.retell,r=J('read.'+sec,null)||{kp:[]};r.t=t.value.slice(0,3000);setJ('read.'+sec,r);var sd=doc.sections.filter(function(x){return x.id===sec;})[0],kb=E('kp-box'),cb=E('copy-fb');if(kb&&sd)kb.innerHTML=kpHtml(sd,r);if(cb&&sd)cb.innerHTML=copyHtml(r.t&&K.copyRatio(r.t,sd.paras.map(function(i){return doc.paras[i];}).join(' '))>0.5);}
 else if(t.dataset.a2!==undefined){var qi=+t.dataset.a2;setJ('ans.q'+qi+'.a2',{t:t.value.slice(0,10000),at:now()});syncNext(qi);var ev=J('ans.q'+qi+'.ev',[]),p=J('ans.q'+qi+'.pers',null),b2=E('live-an2');if(b2)b2.innerHTML=chips(K.analyse(t.value,{evidenceCount:ev.length,perspectiveDone:!!(p&&p.t)}));}
 else if(t.dataset.persq!==undefined){var qp=+t.dataset.persq,pr=J('ans.q'+qp+'.pers',null)||{id:''};pr.t=t.value.slice(0,3000);setJ('ans.q'+qp+'.pers',pr);}
 else if(t.dataset.cue!==undefined){var qc=+t.dataset.cue,cs=J('ans.q'+qc+'.cues',['','','']);cs[+t.dataset.i]=t.value.slice(0,80);setJ('ans.q'+qc+'.cues',cs);refreshLive();var ob=E('oral-box');if(ob){var was=ob.dataset.ready==='1',now3=cs.filter(Boolean).length===3;if(was!==now3||now3){ob.innerHTML=oralBlock(qc);ob.dataset.ready=now3?'1':'0';}}}
 else if(t.dataset.pres){set('pres.'+t.dataset.pres,t.value.slice(0,200));var pbx=E('pres-box');if(pbx&&(pbx.dataset.ready==='1')!==presReady()){pbx.dataset.ready=presReady()?'1':'0';pbx.innerHTML=presPractice();}var n=K.cueLength(t.value),w=E('pw'+t.dataset.pres);if(w){w.textContent=n>12?n+' ord – det blir manus. Korta ner till stödord.':n?n+' ord':'';w.className='cuew'+(n>12?' warn':'');}}
 else if(t.dataset.evn!==undefined){}
});
document.addEventListener('change',function(e){
 var t=e.target;
 if(t.dataset.evq!==undefined){var q=+t.dataset.evq,ev=J('ans.q'+q+'.ev',[]),i=+t.dataset.i;ev=t.checked?ev.concat([i]).filter(function(v,x,a){return a.indexOf(v)===x;}):ev.filter(function(v){return v!==i;});setJ('ans.q'+q+'.ev',ev);}
 else if(t.dataset.better!==undefined){var qb=+t.dataset.better,b=J('ans.q'+qb+'.better',[]),id=t.dataset.id;b=t.checked?b.concat([id]):b.filter(function(v){return v!==id;});setJ('ans.q'+qb+'.better',b);syncNext(qb);}
 else if(t.dataset.kp){var sec=t.dataset.kp,r=J('read.'+sec,null)||{t:'',kp:[]},i2=+t.dataset.i;r.kp=t.checked?(r.kp||[]).concat([i2]):(r.kp||[]).filter(function(v){return v!==i2;});setJ('read.'+sec,r);}
 else if(t.dataset.reh!==undefined){var c=J('rehearsal.checks',[]),i3=+t.dataset.reh;c=t.checked?c.concat([i3]):c.filter(function(v){return v!==i3;});setJ('rehearsal.checks',c);}
 else if(t.id==='fileSource'){var f=t.files&&t.files[0];if(!f)return;if(f.size>250000){ui.msg='Filen är för stor.';render(true);return;}f.text().then(function(s){var v=JSON.parse(s);if(!K.sourceOK(v))throw Error('Fel privat textpaket.');setSource(v);sourceAt=now();save('source',raw);save('sourceAt',sourceAt);ui.msg='';ui.sheet=false;if(window.MO_NP_SYNC)window.MO_NP_SYNC.schedule();render();go('home');}).catch(function(err){ui.msg='Kunde inte läsa paketet: '+err.message;render(true);});t.value='';}
 else if(t.id==='fileRestore'){var g=t.files&&t.files[0];if(!g)return;if(g.size>400000){ui.msg='Säkerhetskopian är för stor.';render(true);return;}g.text().then(function(txt){var v=JSON.parse(txt);if(v&&v.workId!=='en-stark-nolla')throw Error('Fel backupformat.');var fmts=['matte-os-np-backup-v3','matte-os-np-backup-v2','matte-os-np-notes-v1'];if(fmts.indexOf(v.format)<0||(v.source&&!K.sourceOK(v.source)))throw Error('Felaktigt backupformat.');if(!confirm('Återställ säkerhetskopian? Den ersätter dina svar på det här kontot.'))return;if(v.source){setSource(v.source);}sourceAt=now();notes={};noteAt={};Object.keys(v.notes||{}).forEach(function(k){if(K.validEntry(k,v.notes[k])){notes[k]=v.notes[k];noteAt[k]=sourceAt;}});K.migrateV1(notes,noteAt);save('source',raw);save('sourceAt',sourceAt);persist();if(window.MO_NP_SYNC)window.MO_NP_SYNC.schedule();ui.sheet=false;render();}).catch(function(err){ui.msg='Kunde inte återställa: '+err.message;render(true);});t.value='';}
});
document.addEventListener('keydown',function(e){if(e.key==='Tab'&&ui.sheet){var f=[].slice.call(document.querySelectorAll('.sheet button,.sheet a,.sheet input:not([aria-hidden])'));if(f.length){var a=document.activeElement,i=f.indexOf(a);if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus();}}}
 if(e.key==='Escape'&&ui.sheet){ui.sheet=false;render(true);var b=document.querySelector('[data-a="sheet"]');if(b)b.focus();}});
window.addEventListener('hashchange',function(){render();});
window.addEventListener('beforeunload',stopTimer);

/* ---------- start ---------- */
try{var dark=localStorage.getItem('matteos.appearance.v1');if(dark==='dark'||(dark===null&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}
loadScope();
try{var cached=JSON.parse(localStorage.getItem('matteos-study-auth-v1')||'null'),recent=localStorage.getItem('matteos.np.last-user.v1');if(cached&&cached.user&&cached.user.id===recent&&/^[0-9a-f-]{36}$/i.test(recent||''))switchAccount(recent);}catch(e){}
render();
window.MO_NP_APP={switchAccount:switchAccount,snapshot:snapshot,mergeCloud:mergeCloud,hasSource:function(){return !!doc;},accountId:function(){return accountId;},lockAccount:lockAccount,_debug:function(){return {notes:notes,noteAt:noteAt,doc:doc};}};
if(!window.MO_NP_SYNC)window.MO_NP_SYNC=null;
})();
