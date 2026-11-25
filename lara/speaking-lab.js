/* English Speaking Lab: original practice, not official test tasks or grades. */
(function(){
'use strict';
const D=window.MO_SPEAKING_DATA,C=window.MO_SPEAKING_CORE,app=document.getElementById('app');
if(!D||!C||!app)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,t=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[t]));
let session=C.load(sessionStorage),screen='home',mode='solo',category='all',checks=new Set(),showResult=false,helper='',msg='',seconds=0,timer=null,theme='light';
try{theme=['dark','night'].includes(localStorage.getItem('matteos.appearance.v1'))?'dark':'light'}catch{}
function stopClock(){if(timer)clearInterval(timer);timer=null;seconds=0;}
function save(){if(session&&!C.save(sessionStorage,session))msg='Positionen kunde inte sparas. Du kan fortsätta i den här fliken.';}
function go(next){stopClock();screen=next;render();window.scrollTo?.(0,0);}
function titleMode(m){return m==='pair'?'Två elever':m==='group'?'Övningsgrupp (fyra)':'Själv';}
function titleCat(c){return (D.categories.find(x=>x.id===c)||{}).sv||'Överraskningskort';}
function button(a,title,cls='',extra=''){return '<button type="button" data-action="'+a+'" class="sl-btn '+cls+'" '+extra+'>'+title+'</button>';}
function header(){return '<header class="sl-top"><a class="sl-back" href="./#/studio/en"><span aria-hidden="true">‹</span> Engelska</a><div class="sl-brand"><span class="sl-logo">M</span><span>MATTE OS<small>SPEAKING LAB</small></span></div>'+button('theme',theme==='dark'?'Dag':'Kväll','sl-mode','aria-label="Växla mellan ljust och mörkt läge"')+'</header>';}
function feature(icon,title,desc){return '<div class="sl-feature"><span class="sl-feature-icon" aria-hidden="true">'+icon+'</span><span><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></span></div>';}
function framework(){return '<div class="sl-pace">'+D.framework.map((x,i)=>'<div class="sl-pace-step"><span class="sl-letter">'+['P','A','C','E'][i]+'</span><span><strong>'+esc(x.label)+'</strong><small>'+esc(x.cue)+'</small></span></div>').join('')+'</div>';}
function home(){
return '<section class="sl-intro"><div><p class="sl-kicker">ENGLISH · ÅK 9 · MUNTLIG TRÄNING</p><h1>Whatever the card.<br><em>You can talk.</em></h1><p>Slumpkort, oväntade ämnen och samtal. Träna på att börja, hålla dig relevant och få med andra – även när huvudet blir blankt.</p></div><span class="sl-sticker" aria-hidden="true">SPEAK<br>UP!</span></section>'
+(session?'<section class="sl-resume"><div><strong>Fortsätt på ditt kort</strong><p>'+esc((C.card(session)||{}).title||'')+' · '+esc(titleMode(session.mode))+'</p></div>'+button('resume','Fortsätt →','sl-small')+'</section>':'')
+'<div class="sl-layout"><section class="sl-panel sl-start"><div class="sl-sectionline"><h2>Ta ett överraskningskort</h2><span class="sl-number">01</span></div><p>Välj hur ni vill öva. Par är närmast den officiellt beskrivna provformen; grupp är frivillig skolträning.</p>'
+'<div class="sl-choice-grid" role="group" aria-label="Välj övningssätt">'+[['solo','Själv','En röst'],['pair','Två personer','Provlika samtal'],['group','Fyra personer','Gruppövning']].map(x=>button('mode','<strong>'+x[1]+'</strong><small>'+x[2]+'</small>','sl-choice '+(mode===x[0]?'is-picked':''),'data-value="'+x[0]+'" aria-pressed="'+(mode===x[0])+'"')).join('')+'</div>'
+'<label class="sl-label" for="sl-category">Vilka ämnen?</label><select id="sl-category" class="sl-select"><option value="all"'+(category==='all'?' selected':'')+'>Helt blandat – rekommenderas</option>'+D.categories.map(x=>'<option value="'+x.id+'"'+(x.id===category?' selected':'')+'>'+esc(x.sv)+'</option>').join('')+'</select>'
+button('start','Dra första kortet <span aria-hidden="true">→</span>','sl-primary sl-full')+'<p class="sl-fine">Egenkonstruerade övningskort. Inga hemliga nationella provfrågor.</p></section>'
+'<section class="sl-panel sl-concept"><div class="sl-sectionline"><h2>Din cheatcode: PACE</h2><span class="sl-number">02</span></div><p>En enkel modell som fungerar för nästan vilket ämne som helst – utan att låta inövad.</p>'+framework()+button('cheat','Lär mig fraserna och räddningstekniken','sl-outline sl-full')+'</section></div>'
+'<section class="sl-why"><h2>Tre färdigheter att träna</h2><div class="sl-features">'+feature('01','Våga börja','En rimlig tanke räcker som första steg.')+feature('02','Undvik att babbla','En huvudpoäng, ett varför, ett exempel.')+feature('03','Lyssna och svara','Reagera på andra och ställ en riktig fråga.')+'</div></section>'
+'<section class="sl-reference"><h2>Om nationella provet</h2><p>Engelska åk 9, delprov A, är enligt Göteborgs universitet ett <strong>parsamtal med Warm-up, Part 1 och Part 2</strong>. Din skolas gruppövningar kan skilja sig. Läraren bedömer din faktiska talade engelska – vår checklista är ingen betygsmatris.</p><a target="_blank" rel="noopener noreferrer" href="https://www.gu.se/nationella-prov-frammande-sprak/prov-och-bedomningsstod-i-engelska/engelska-arskurs-7-9/nationella-prov-i-engelska-for-arskurs-9">Officiell elevinformation</a></section>';
}
function cheat(){
return '<div class="sl-pagehead"><p class="sl-kicker">DET HÄR KAN DU TA MED DIG I HUVUDET</p><h1>PACE – för alla sorters ämnen.</h1><p>Träna på stegen, inte på att memorera ett helt tal. Stödet är till för övning, inte att läsa innantill på prov.</p></div>'
+'<div class="sl-guide-grid">'+D.framework.map((x,i)=>'<section class="sl-panel sl-guide"><span class="sl-guide-letter">'+['P','A','C','E'][i]+'</span><h2>'+esc(x.label)+'</h2><p>'+esc(x.cue)+'</p><blockquote lang="en">'+esc(x.say)+'</blockquote></section>').join('')+'</div>'
+'<section class="sl-panel sl-example"><p class="sl-kicker">EXEMPEL · MONEY</p><h2>Can money make people happy?</h2><p lang="en"><strong>P:</strong> I think money can make life easier, but it cannot solve everything.<br><strong>A:</strong> That is because people also need good relationships.<br><strong>C:</strong> Someone might have a high salary but still feel lonely.<br><strong>E:</strong> What do you think matters more, money or time?</p></section>'
+'<h2 class="sl-h2">Rädda ett svårt samtal</h2><div class="sl-rescue-grid">'+D.rescue.map(x=>'<details class="sl-panel sl-rescue"><summary>'+esc(x.title)+'</summary><p>'+esc(x.intro)+'</p><ul lang="en">'+x.lines.map(y=>'<li>'+esc(y)+'</li>').join('')+'</ul></details>').join('')+'</div>'
+'<section class="sl-panel"><h2>Om ämnet känns helt okänt</h2><p>Fråga dig: <strong>Vem påverkas?</strong> Vad kan vara bra eller svårt? Finns ett vardagsexempel? Du får säga att något beror på situationen utan att hitta på fakta.</p><h2>Om du har för mycket att säga</h2><p>Håll dig till <strong>en poäng, ett skäl, ett exempel, en följdfråga</strong>. Återvänd till kortets fråga innan du lämnar över.</p><blockquote lang="en">So, to come back to the question, I would say ... How about you?</blockquote></section>'
+'<div class="sl-actions">'+button(session?'resume':'start',session?'Till mitt kort →':'Öva direkt →','sl-primary')+button('home','Tillbaka till start','sl-outline')+'</div>';
}
function coach(){
const r=D.rescue.find(x=>x.id===helper)||D.rescue[0];
return '<aside class="sl-coach" aria-label="Fraser som hjälper dig vidare"><div class="sl-coach-top"><h3>'+esc(r.title)+'</h3>'+button('coach-close','×','sl-close','aria-label="Stäng hjälpen"')+'</div><p>'+esc(r.intro)+'</p><ol lang="en">'+r.lines.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><p class="sl-fine">Säg något som faktiskt är ditt. Stödet är ett exempel, inte ett facit.</p></aside>';
}
function speaking(){
const q=C.card(session),n=C.participants(session.mode),who=session.mode==='solo'?'Ditt svar':'Person '+(session.turn+1)+' av '+n;
if(!q)return '<p>Ett kort kunde inte laddas.</p>'+button('home','Till start');
return '<div class="sl-playtop"><span class="sl-pill">KORT '+(session.index+1)+' / '+session.deck.length+'</span><span>'+esc(titleMode(session.mode))+'</span></div>'
+'<section class="sl-bigcard"><div class="sl-cardshine"></div><p class="sl-cardlabel">WHAT DO YOU THINK?</p><p class="sl-topic">'+esc(q.title)+'</p><h1 lang="en">'+esc(q.prompt)+'</h1><div class="sl-cardbottom"><span class="sl-cat">'+esc(titleCat(q.category))+'</span>'+button('speak','▶ Lyssna på frågan','sl-textbutton','aria-label="Läs upp kortet på engelska"')+'</div></section>'
+'<section class="sl-stepcard"><div><p class="sl-kicker">DAGS ATT PRATA</p><h2>'+esc(who)+'</h2><p>'+(session.mode==='solo'?'Säg ditt svar högt. Tänk sedan på hur någon annan skulle kunna se saken.':session.mode==='pair'?'En talar, den andra lyssnar. För ett samtal – inte två monologer.':'En talar i taget. Nästa person bygger på någon annans idé. Alla får utrymme.')+'</p></div><div class="sl-turn" aria-hidden="true">'+(session.turn+1)+'</div></section>'
+(session.mode==='solo'?'<aside class="sl-listenmission"><strong>Öva också på en annan synvinkel</strong><p lang="en">Someone might disagree because ... How would you respond?</p></aside>':session.turn===0?'<aside class="sl-listenmission"><strong>Din samtalsuppgift</strong><p>Uttryck en tanke, ge ett konkret exempel och <b>bjud in nästa person</b> med en öppen fråga.</p></aside>':'<aside class="sl-listenmission"><strong>Lyssna – och bygg vidare</strong><p>'+esc(D.listening[(session.index+session.turn)%D.listening.length].task)+'</p><p lang="en">'+esc(D.listening[(session.index+session.turn)%D.listening.length].line)+'</p></aside>')
+'<section class="sl-mini"><strong>PACE i huvudet</strong><span>Position → Reason → Example → Engage</span></section>'
+'<div class="sl-helper-actions" aria-label="Välj ett stöd om det behövs">'+[['blank','Hjärnsläpp'],['bored','Tråkigt ämne'],['excited','Jag babblar'],['word','Saknar ord'],['disagree','Oense']].map(x=>button('coach',x[1],'sl-chip'+(helper===x[0]?' sl-chip-active':''),'data-value="'+x[0]+'"')).join('')+'</div>'
+(helper?coach():'')
+'<details class="sl-support"><summary>Visa PACE-meningar</summary><div class="sl-support-inner">'+D.framework.map((x,i)=>'<p><strong>'+['P','A','C','E'][i]+' · '+esc(x.label)+'</strong><span lang="en">'+esc(x.say)+'</span></p>').join('')+'</div></details>'
+'<details class="sl-support"><summary>Överraska med en följdfråga</summary><div class="sl-support-inner"><p lang="en">'+esc(C.follow(session))+'</p><p>Lyssna först på den andra personens svar. Följ upp något hen faktiskt sade.</p></div></details>'
+'<div class="sl-clock"><div><b>Frivillig övningsklocka</b><p>Inget tidskrav; prata tydligt och håll fokus.</p></div>'+button('clock',timer?'Pausa':'Starta 45 sek','sl-outline sl-clockbutton')+'<b id="sl-clock-readout" aria-live="off">'+(timer?seconds+' s':'—')+'</b></div>'
+'<div class="sl-actions sl-main-actions">'+button('done','Jag har sagt mitt svar →','sl-primary')+button('skip','Byt till ett nytt ämne','sl-outline')+'</div>'
+'<p class="sl-fine">Ingen mikrofon aktiveras. Appen spelar inte in vad du säger och sätter inga automatiska betyg.</p>';
}
function reflection(){
const q=C.card(session);
return '<div class="sl-pagehead"><p class="sl-kicker">EFTER DIN TUR · SJÄLVREFLEKTION</p><h1>What went well?</h1><p>Vilka saker gjorde du på riktigt när du talade om <strong>'+esc(q.title)+'</strong>? En ärlig självkoll är bättre än att bocka i allt.</p></div>'
+'<div class="sl-checklist">'+D.checks.map(x=>'<label class="sl-check"><input type="checkbox" data-check="'+esc(x.id)+'"'+(checks.has(x.id)?' checked':'')+'><span><strong>'+esc(x.name)+'</strong><small>'+esc(x.help)+'</small></span></label>').join('')+'</div>'
+(showResult?'<aside class="sl-tip" role="status"><strong>Ett tips till nästa gång</strong><p>'+esc(C.insights([...checks]).nextTip)+'</p><p>'+esc(C.insights([...checks]).message)+'</p></aside>':'')
+'<div class="sl-actions">'+button('feedback','Välj ett förbättringsfokus','sl-outline')+button('advance',session.turn+1<C.participants(session.mode)?'Nästa person →':'Färdig med kortet →','sl-primary')+'</div>'
+'<p class="sl-fine">Bedömningsfaktorerna i det riktiga provet är bredare än denna egencheck. Bara läraren kan bedöma prestationen.</p>';
}
function review(){
const q=C.card(session);
return '<section class="sl-finish"><div class="sl-finish-mark" aria-hidden="true">✦</div><p class="sl-kicker">SPEAKING ROUND COMPLETE</p><h1>Good conversation!</h1><p>Ni övade på <strong>'+esc(q.title)+'</strong>. Ta ett nytt kort där du inte kan svaret i förväg, och träna på att både prata och lyssna.</p>'
+'<div class="sl-features">'+feature('✓','Röd tråd','Kom tillbaka till frågan.')+feature('↗','Samspel','Följ upp något någon sade.')+'</div>'
+'<div class="sl-actions">'+button('advance','Dra ett nytt slumpkort →','sl-primary')+button('cheat','Öppna PACE-cheatcode','sl-outline')+'</div></section>';
}
function practice(){return !session?home():session.stage==='card'?speaking():session.stage==='reflect'?reflection():review();}
function render(){
document.documentElement.setAttribute('data-sl-theme',theme);
const view=screen==='home'?home():screen==='cheat'?cheat():practice();
app.innerHTML=header()+'<main id="main" class="sl-wrap"><div class="sl-sr-status" role="status">'+esc(msg)+'</div>'+view+'</main><footer class="sl-foot"><a href="./#/studio/en">Till Engelska</a><span>Originalövningar · ingen datadelning · inga riktiga provuppgifter</span></footer>';
document.title='Speaking Lab · Matte OS';
}
function setSession(s){session=s;checks=new Set();helper='';showResult=false;msg='';save();go('play');}
function start(){setSession(C.make({mode,category,seed:Date.now()+'-'+Math.random()}));}
function advance(){setSession(C.advance(session));}
function clock(){
 if(timer){stopClock();render();return;}
 seconds=45;timer=setInterval(()=>{seconds--;const v=document.getElementById('sl-clock-readout');if(v)v.textContent=Math.max(0,seconds)+' s';if(seconds<=0){clearInterval(timer);timer=null;const b=document.querySelector('[data-action="clock"]');if(b)b.textContent='Starta 45 sek';}},1000);
 const b=document.querySelector('[data-action="clock"]');if(b)b.textContent='Pausa';const v=document.getElementById('sl-clock-readout');if(v)v.textContent=seconds+' s';
}
app.addEventListener('click',e=>{
 const b=e.target.closest('button[data-action]');if(!b||!app.contains(b))return;
 const a=b.dataset.action;
 if(a==='mode'){mode=b.dataset.value;render();return;}
 if(a==='theme'){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('matteos.appearance.v1',theme)}catch{}render();return;}
 if(a==='home'){go('home');return;}
 if(a==='start'){start();return;}
 if(a==='resume'){session?go('play'):start();return;}
 if(a==='cheat'){go('cheat');return;}
 if(a==='coach'){helper=helper===b.dataset.value?'':b.dataset.value;render();return;}
 if(a==='coach-close'){helper='';render();return;}
 if(a==='speak'){
  if('speechSynthesis' in window&&'SpeechSynthesisUtterance' in window){try{speechSynthesis.cancel();const v=new SpeechSynthesisUtterance(C.card(session).prompt);v.lang='en-GB';v.rate=.88;speechSynthesis.speak(v);}catch{msg='Uppläsning stöds inte på den här enheten.';render();}}
  else{msg='Uppläsning stöds inte på den här enheten.';render();}return;
 }
 if(a==='clock'){clock();return;}
 if(a==='done'){stopClock();session.stage='reflect';checks=new Set();showResult=false;save();render();return;}
 if(a==='feedback'){showResult=true;render();return;}
 if(a==='advance'){advance();return;}
 if(a==='skip'){setSession(C.skip(session));return;}
});
app.addEventListener('change',e=>{
 if(e.target?.id==='sl-category'){category=e.target.value;return;}
 if(e.target?.matches('input[data-check]')){e.target.checked?checks.add(e.target.dataset.check):checks.delete(e.target.dataset.check);showResult=false;}
});
window.addEventListener('pagehide',()=>{stopClock();if('speechSynthesis'in window)try{speechSynthesis.cancel()}catch{}});
render();
})();
