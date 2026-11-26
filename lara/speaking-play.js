/* Speak Quest · original interactive oral practice. No recording, assessment or personal data. */
(function(){
'use strict';
const D=window.MO_SPEAKING_DATA,C=window.MO_SPEAKING_CORE,X=window.MO_SPEAKING_EXAMPLES,app=document.getElementById('app');
if(!D||!C||!X||!app)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const steps=[
 {letter:'P',name:'Din åsikt',label:'Vad tycker du?',prompt:'Välj den tanke du vill börja med.'},
 {letter:'A',name:'Ditt varför',label:'Vilket skäl passar?',prompt:'Hitta ett varför som fortsätter samma tanke.'},
 {letter:'C',name:'Ett exempel',label:'Vilket exempel passar?',prompt:'Välj en situation som visar din idé.'},
 {letter:'E',name:'Fråga vidare',label:'Vilken fråga passar?',prompt:'Välj en följdfråga som hör ihop med ämnet.'}
];
let session=C.load(sessionStorage)||C.make({seed:Date.now()+'-'+Math.random(),mode:'solo'});
if(!C.safe(session))session=C.make({mode:'solo'});
if(session.stage!=='card')session={...session,stage:'card'};
let step=0,chosen=[-1,-1,-1,-1],free=false,examplesOpen=false,exampleIndex=0,help='',guide=location.hash==='#guide',settings=false,theme='light',hint='',guideTopic='moneychoice',guideExample=0,message='';
try{theme=['dark','night'].includes(localStorage.getItem('matteos.appearance.v1'))?'dark':'light'}catch{}
const card=()=>C.card(session);
const ex=()=>X.cards[card().id];
const modeText=()=>session.mode==='pair'?'Två personer':session.mode==='group'?'Fyra personer':'Själv';
const btn=(a,t,cls='',attrs='')=>'<button type="button" class="sp-btn '+cls+'" data-action="'+a+'" '+attrs+'>'+t+'</button>';
const notice=t=>'<p class="sp-screenreader" role="status">'+esc(t||'')+'</p>';
function save(){try{C.save(sessionStorage,session)}catch{}}
function beginAgain(){step=0;chosen=[-1,-1,-1,-1];free=false;examplesOpen=false;exampleIndex=0;help='';hint='';message='';}
function nextPerson(){
 const n=C.participants(session.mode);if(session.turn+1<n){session={...session,turn:session.turn+1,stage:'card'};}
 else{session=C.skip(session);}
 beginAgain();save();render(true);
}
function nextCard(){session=C.skip(session);beginAgain();save();render(true);}
function heading(){
 return '<header class="sp-header"><a class="sp-back" href="./#/studio/en" aria-label="Till Engelska"><span aria-hidden="true">‹</span> Engelska</a><span class="sp-wordmark"><span class="sp-spark" aria-hidden="true">✦</span> SPEAK<span class="sp-wordmark-end">!</span></span>'+btn('guide','<span aria-hidden="true">?</span> <span class="sp-guide-label">Så gör du</span>','sp-guide-btn','aria-label="Visa enkel spelguide"')+'</header>';
}
function progress(){
 return '<div class="sp-progress" aria-label="Bygg ett svar i fyra små steg"><div class="sp-progress-head"><span>BYGG DIN MENING</span><strong>'+(free?'Eget svar':step>=4?'4 av 4 · Färdigt!':(step+1)+' av 4')+'</strong></div><div class="sp-dots">'+steps.map((s,i)=>'<span class="sp-dot '+(step>i?'done':step===i&&!free?'current':'')+'">'+(step>i?'✓':s.letter)+'</span>').join('')+'</div></div>';
}
function question(){
 const q=card();
 return '<section class="sp-question" aria-label="Samtalskort"><div class="sp-cardmeta"><span class="sp-round">KORT '+(session.index+1)+'</span><span class="sp-category">'+esc((D.categories.find(x=>x.id===q.category)||{}).sv||'Blandat')+'</span></div>'
 +'<p class="sp-eyebrow">Ditt uppdrag</p><h1 lang="en">'+esc(q.prompt)+'</h1>'+(hint?'<p role="status" class="sp-audio-notice">'+esc(hint)+'</p>':'')
 +'<div class="sp-questionfoot">'+btn('read','<span aria-hidden="true">▶</span> Lyssna','sp-soft','aria-label="Läs upp frågan på engelska"')+btn('new','Byt ämne <span aria-hidden="true">↻</span>','sp-ghost')+'</div></section>';
}
function chooseView(){
 const st=steps[step],a=ex();if(!st)return '';
 const order=step===0?[0,1]:(session.index+session.turn+step)%2?[1,0]:[0,1];
 return '<div class="sp-step-head"><span class="sp-step-tag">'+st.letter+'</span><div><span class="sp-eyebrow">Steg '+(step+1)+'</span><h2 tabindex="-1">'+st.label+'</h2></div></div>'
 +'<p class="sp-instruction">'+st.prompt+'</p>'
 +(message?'<p class="sp-feedback" role="status">'+esc(message)+'</p>':'')
 +'<div class="sp-choices" role="group" aria-label="'+esc(st.label)+'">'
 +order.map((i,pos)=>btn('choose','<span class="sp-choice-mark">'+(pos+1)+'</span><span lang="en">'+esc(a[i][step])+'</span><span class="sp-choice-arrow" aria-hidden="true">›</span>','sp-choice','data-choice="'+i+'"')).join('')+'</div>'
 +'<div class="sp-step-actions">'+(step>0?btn('back-step','‹ Tillbaka','sp-text'):'<span></span>')+btn('free','Jag vill svara helt själv','sp-text')+'</div>';
}
function finishView(){
 const assembled=steps.map((_,i)=>ex()[chosen[i]][i]).join(' ');
 return '<div class="sp-win"><div class="sp-winicon" aria-hidden="true">✦</div><span class="sp-eyebrow">Fyra steg avklarade</span><h2>Nu har du ett svar!</h2><p>Här är meningarna du valde. Prova att säga samma tanke <strong>med egna ord</strong>.</p><blockquote lang="en">'+esc(assembled)+'</blockquote>'
 +'<div class="sp-win-actions">'+btn('say','Lyssna på mitt svar ▶','sp-soft')+btn('try-again','Byt mina val ↻','sp-ghost')+'</div></div>';
}
function freeView(){
 return '<div class="sp-free"><div class="sp-free-icon" aria-hidden="true">◈</div><h2>Din tur att prata!</h2><p>Ta en tanke, ett varför, ett exempel – och ställ en fråga. Det får vara enkelt.</p>'
 +'<div class="sp-free-cues"><span>Jag tycker…</span><span>Därför att…</span><span>Till exempel…</span><span>Vad tycker du?</span></div>'
 +btn('return-build','Bygg meningar i stället','sp-text')+'</div>';
}
function tips(){
 const a=ex(),current=Math.min(step,3);
 const lines={
 blank:[a[0][current],a[1][current]],
 boring:[a[1][0]+' '+a[1][1],a[0][0]+' '+a[0][2]],
 ramble:[a[0][0]+' '+a[0][2]+' '+a[0][3],a[1][0]+' '+a[1][3]],
 word:['Let me explain it in simpler words. '+a[0][current],'I do not know the exact word, but I mean this: '+a[1][current]]
 };
 return '<div class="sp-help"><div class="sp-helps"><span>Fastnat?</span>'
 +btn('help','Visa en ledtråd','sp-help-trigger','aria-expanded="'+!!help+'"')
 +'</div>'+(help?'<div class="sp-helpbody"><div class="sp-helpchips">'
 +[['blank','Hjärnsläpp'],['boring','Tråkigt ämne'],['ramble','Pratar för länge'],['word','Saknar ord']].map(([id,t])=>btn('select-help',t,help===id?'active':'','data-kind="'+id+'"')).join('')+'</div>'
 +'<p class="sp-help-line" lang="en">'+esc((lines[help]||lines.blank)[0])+'</p><p class="sp-help-note">Detta hör till ditt kort. Ta bara en idé och prova själv.</p></div>':'')+'</div>';
}
function play(){
 const count=C.participants(session.mode),last=session.turn>=count-1;
 return '<section class="sp-play">'+(count>1?'<div class="sp-turn"><span>PERSON '+(session.turn+1)+' AV '+count+'</span><small>'+(session.turn===0?'Börja med en tanke.':'Lyssna på den före dig och bygg vidare.')+'</small></div>':'')
 +progress()
 +(free?freeView():step>=4?finishView():chooseView())
 +tips()
 +'<div class="sp-next">'+btn('next-person',count===1||last?'Jag har pratat · Nästa kort →':'Nästa person →','sp-primary')+'</div>'
 +'<p class="sp-fine">Du tränar – appen lyssnar inte, spelar inte in och ger inga betyg.</p></section>';
}
function workedExample(id,n){
 const a=X.cards[id][n],title=id==='moneychoice'?'Pengar':'Kriminalitet',question=D.topics.find(x=>x.id===id).prompt;
 return '<div class="sp-guide-example"><p class="sp-guide-question">'+esc(title)+' · <span lang="en">'+esc(question)+'</span></p><span class="sp-eyebrow">Exempel '+(n+1)+' av 2</span><p lang="en">'+esc(a.join(' '))+'</p></div>';
}
function guideView(){
 return '<section class="sp-guide"><div class="sp-guide-top">'+btn('close-guide','‹ Till mitt kort','sp-text')+'<span>30 sekunders guide</span></div><h1>Prata om nästan vad som helst</h1><p>Du behöver inte kunna allt. Välj en åsikt, säg varför, ge ett exempel och fråga vidare.</p><div class="sp-steps-mini">'+steps.map(st=>'<div><b>'+st.letter+'</b><span>'+st.name+'</span></div>').join('')+'</div>'
 +'<h2>Se hur det faktiskt låter</h2><div class="sp-guide-filters" role="group" aria-label="Välj ett övningsämne">'
 +btn('guide-topic','Pengar',guideTopic==='moneychoice'?'selected':'','data-topic="moneychoice" aria-pressed="'+(guideTopic==='moneychoice')+'"')
 +btn('guide-topic','Kriminalitet',guideTopic==='crime'?'selected':'','data-topic="crime" aria-pressed="'+(guideTopic==='crime')+'"')+'</div>'
 +workedExample(guideTopic,guideExample)+'<div class="sp-guide-filters" role="group" aria-label="Välj exempelsvar">'
 +btn('guide-example','Exempel 1',guideExample===0?'selected':'','data-ex="0" aria-pressed="'+(guideExample===0)+'"')
 +btn('guide-example','Exempel 2',guideExample===1?'selected':'','data-ex="1" aria-pressed="'+(guideExample===1)+'"')+'</div>'
 +'<div class="sp-cta-guide">'+btn('close-guide','Jag vill spela →','sp-primary')+'</div><p class="sp-fine">Exemplen är originalövningar, inte riktiga nationella provfrågor.</p></section>';
}
function examples(){
 const a=ex();
 return '<section class="sp-samples"><button type="button" class="sp-reveal" data-action="examples" aria-expanded="'+examplesOpen+'" aria-controls="sp-example-body"><span class="sp-reveal-symbol" aria-hidden="true">✦</span><span><strong>Se två färdiga svar</strong><small>Olika idéer till samma fråga</small></span><span aria-hidden="true">'+(examplesOpen?'⌃':'⌄')+'</span></button>'
 +(examplesOpen?'<div id="sp-example-body" class="sp-sample-body"><div class="sp-sample-switch" role="group" aria-label="Välj exempel">'
 +[0,1].map(i=>btn('example','Svar '+(i+1),exampleIndex===i?'selected':'','data-ex="'+i+'" aria-pressed="'+(exampleIndex===i)+'"')).join('')+'</div>'
 +'<p class="sp-sample-paragraph" lang="en">'+esc(a[exampleIndex].join(' '))+'</p><p class="sp-fine">Det är en modell, inte det enda rätta svaret. Träna sedan utan att läsa.</p>'
 +btn('read-sample','Lyssna på detta svar ▶','sp-soft')+'</div>':'')+'</section>';
}
function options(){
 return '<section class="sp-options"><button type="button" data-action="settings" class="sp-options-toggle" aria-expanded="'+settings+'">Spela med andra / fler val <span aria-hidden="true">'+(settings?'⌃':'⌄')+'</span></button>'
 +(settings?'<div class="sp-settings"><span>Hur många pratar?</span><div class="sp-modes" role="group" aria-label="Välj antal talare">'
 +[['solo','Själv'],['pair','Två'],['group','Fyra']].map(([id,t])=>btn('mode',t,session.mode===id?'selected':'','data-mode="'+id+'" aria-pressed="'+(session.mode===id)+'"')).join('')+'</div>'
 +'<label for="sp-category">Välj ämnen (valfritt)</label><select id="sp-category"><option value="all"'+(session.category==='all'?' selected':'')+'>Överraska mig!</option>'
 +D.categories.map(x=>'<option value="'+esc(x.id)+'"'+(session.category===x.id?' selected':'')+'>'+esc(x.sv)+'</option>').join('')+'</select>'
 +btn('theme',theme==='dark'?'Ljust läge':'Mörkt läge','sp-ghost')+'</div>':'')+'</section>';
}
function render(scroll=false){
 document.documentElement.dataset.spTheme=theme;
 app.innerHTML=heading()+'<main class="sp-shell" id="main">'
 +(guide?guideView():'<div class="sp-board"><div class="sp-overline"><span>ENGLISH · SPEAKING QUEST</span><span class="sp-count">✦ Kort '+(session.index+1)+' av '+session.deck.length+'</span></div>'+question()+play()+examples()+options()+'</div>')
 +'</main><footer class="sp-footer"><a href="./#/studio/en">Till Engelska</a><span>Öva fritt · Inga svar sparas</span></footer>';
 document.title='Speak Quest · Matte OS';
 if(scroll)window.scrollTo?.(0,0);
}
function speak(str){
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){hint='Uppläsning stöds inte på den här enheten.';render();return;}
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(str);u.lang='en-GB';u.rate=.88;speechSynthesis.speak(u);}catch{hint='Det gick inte att läsa upp meningen.';render();}
}
app.addEventListener('click',ev=>{
 const b=ev.target.closest('button[data-action]');if(!b||!app.contains(b))return;
 const a=b.dataset.action;
 if(a==='choose'){
  const pick=Number(b.dataset.choice);
  if(step>0&&pick!==chosen[0]){message='Den meningen hör till det andra exemplet. Den kan också vara bra – men bygg klart det spår du började med.';render();return;}
  chosen[step]=pick;step++;help='';
  message=['Bra start! Nu behöver du ett varför.','Nu har du ett skäl. Visa det med ett exempel.','Ditt exempel håller ihop med din tanke. Bjud in någon annan.',''][step-1];
  render();(document.querySelector('.sp-step-head h2')||document.querySelector('.sp-win h2'))?.focus({preventScroll:true});return;
 }
 if(a==='back-step'){step=Math.max(0,step-1);message='';render();return;}
 if(a==='try-again'||a==='return-build'){beginAgain();render();return;}
 if(a==='free'){free=true;step=0;help='';message='';render();return;}
 if(a==='next-person'){nextPerson();return;}
 if(a==='new'){nextCard();return;}
 if(a==='read'){speak(card().prompt);return;}
 if(a==='say'){speak(steps.map((_,i)=>ex()[chosen[i]][i]).join(' '));return;}
 if(a==='help'){help=help?'':'blank';render();return;}
 if(a==='select-help'){help=b.dataset.kind;render();return;}
 if(a==='examples'){examplesOpen=!examplesOpen;render();return;}
 if(a==='example'){exampleIndex=Number(b.dataset.ex);render();return;}
 if(a==='read-sample'){speak(ex()[exampleIndex].join(' '));return;}
 if(a==='guide'){guide=true;location.hash='guide';render(true);return;}
 if(a==='close-guide'){guide=false;location.hash='';render(true);return;}
 if(a==='guide-topic'){guideTopic=b.dataset.topic;guideExample=0;render();return;}
 if(a==='guide-example'){guideExample=Number(b.dataset.ex);render();return;}
 if(a==='settings'){settings=!settings;render();return;}
 if(a==='mode'){session={...session,mode:b.dataset.mode,turn:0,stage:'card'};beginAgain();save();render();return;}
 if(a==='theme'){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('matteos.appearance.v1',theme)}catch{}render();return;}
});
app.addEventListener('change',ev=>{
 if(ev.target?.id==='sp-category'){session=C.make({mode:session.mode,category:ev.target.value,seed:Date.now()+'-'+Math.random()});beginAgain();save();render(true);}
});
window.addEventListener('hashchange',()=>{guide=location.hash==='#guide';render(true);});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&guide)location.hash='';});
window.addEventListener('pagehide',()=>{try{speechSynthesis.cancel()}catch{}});
save();render();
})();
