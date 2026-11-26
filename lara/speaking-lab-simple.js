/* Speaking Lab 2.0 — question first, two complete examples, one-click turn flow.
   No microphone, no transcript, no new accounts and no network writes. */
(function(){
'use strict';
const D=window.MO_SPEAKING_DATA,C=window.MO_SPEAKING_CORE,X=window.MO_SPEAKING_EXAMPLES,app=document.getElementById('app');
if(!D||!C||!X||!app)return;
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keys=['Position','Anledning','Exempel','Bjud in'],steps=['Din åsikt','Varför tycker du så?','Ett riktigt exempel','Fråga någon annan'];
const start=C.load(sessionStorage);
let session=start||C.make({mode:'solo',category:'all',seed:String(Date.now())+'-'+Math.random()});
if(session.stage!=='card')session=Object.assign({},session,{stage:'card'});
let builder=false,guide=false,selected=[0,0,0,0],feedback=false,helpOpen=false,notice='',theme='light',speaker='question';
try{theme=['night','dark'].includes(localStorage.getItem('matteos.appearance.v1'))?'dark':'light'}catch(_){}
const card=()=>C.card(session),examples=()=>X.cards[card()?.id]||null;
const modeLabel=m=>m==='pair'?'Två personer':m==='group'?'Fyra personer':'Själv';
const categoryLabel=id=>(D.categories.find(x=>x.id===id)||{}).sv||'Blandade ämnen';
function store(){if(!C.save(sessionStorage,session))notice='Din plats kunde inte sparas, men du kan fortfarande öva.';}
function freshCard(){session=C.skip(session);selected=[0,0,0,0];builder=false;feedback=false;helpOpen=false;notice='';store();show(true);}
function nextTurn(){
 if(session.turn+1<C.participants(session.mode))session=Object.assign({},session,{turn:session.turn+1,stage:'card'});
 else session=C.skip(session);
 selected=[0,0,0,0];builder=false;feedback=false;helpOpen=false;notice='';store();show(true);
}
function btn(action,caption,klass='',attrs=''){return '<button type="button" class="ss-btn '+klass+'" data-act="'+action+'" '+attrs+'>'+caption+'</button>';}
function exampleParts(parts){return parts.map((s,i)=>'<li><b class="ss-letter">'+['P','A','C','E'][i]+'</b><span><small>'+keys[i]+'</small><span lang="en">'+E(s)+'</span></span></li>').join('');}
function sample(person,parts){return '<article class="ss-example"><div class="ss-ex-head"><span>'+person+'</span><span class="ss-example-label">'+(person.includes('1')?'Kort och tydligt':'Ett annat sätt att tänka')+'</span></div><ol>'+exampleParts(parts)+'</ol>'+btn('listen-example','Lyssna på hela svaret','ss-listen','data-ex="'+(person.includes('1')?'0':'1')+'"')+'</article>';}
function header(){
 return '<header class="ss-head"><a class="ss-back" href="./#/studio/en" aria-label="Tillbaka till Engelska">‹ <span>Engelska</span></a><span class="ss-headname">PRATA ENGELSKA</span>'+btn('guide','Så svarar du','ss-help')+'</header>';
}
function modeBox(){
 return '<div class="ss-mode"><span>Jag övar</span><div class="ss-modechoices" role="group" aria-label="Hur många övar?">'+[['solo','Själv'],['pair','Två'],['group','Fyra']].map(([m,label])=>btn('mode',label,session.mode===m?'ss-selected':'','data-mode="'+m+'" aria-pressed="'+(session.mode===m)+'"')).join('')+'</div></div>';
}
function cardTop(){
 const q=card();if(!q)return '<p>Kortet kunde inte visas.</p>';
 return '<section class="ss-card" aria-label="Ditt samtalskort"><div class="ss-topline"><span class="ss-which">KORT '+(session.index+1)+' AV '+session.deck.length+'</span><span class="ss-category">'+E(categoryLabel(q.category))+'</span></div>'
 +'<p class="ss-kicker">Ditt ämne</p><h1 lang="en">'+E(q.prompt)+'</h1>'
 +'<div class="ss-cardbuttons">'+btn('next-card','Nytt ämne ↻','ss-outline')+btn('speak','Lyssna på frågan ▶','ss-outline')+'</div></section>';
}
function turn(){
 const count=C.participants(session.mode),isFirst=session.turn===0;
 return '<section class="ss-turn"><div class="ss-turnhead"><div><span class="ss-kicker">SÄG DET HÖGT</span><h2>'+(count===1?'Nu är det din tur':'Person '+(session.turn+1)+' av '+count)+'</h2></div><span class="ss-voice">'+(session.turn+1)+'</span></div>'
 +'<p>'+(count===1?'Säg vad du tycker, ett skäl och ett exempel. Avsluta med en fråga.':isFirst?'Säg en åsikt och lämna sedan över med en fråga.':'Lyssna på förra personen. Svara på något som faktiskt sades, inte med ett nytt fristående tal.')+'</p>'
 +(count>1&&!isFirst?'<div class="ss-reply" lang="en"><strong>Så kan du svara:</strong> I understand your point about '+E(card().title.toLowerCase())+'. However, I think ... because ... What do you think?</div>':'')
 +'<div class="ss-turnbuttons">'+btn('turn',count===1||session.turn===count-1?'Klart! Nästa kort →':'Nästa person →','ss-primary')+'</div></section>';
}
function exampleSection(){
 const ex=examples();
 return '<section class="ss-block" id="real-examples"><div class="ss-sectiontitle"><h2>Två riktiga exempelsvar</h2><span>För just det här kortet</span></div>'
 +'<p class="ss-intro">Läs båda. De visar <strong>olika sätt</strong> att svara. Låna tankesättet – säg sedan något med egna ord.</p>'
 +'<div class="ss-examples">'+sample('Exempel 1',ex[0])+sample('Exempel 2',ex[1])+'</div></section>';
}
function compose(){const e=examples();return keys.map((_,i)=>e[selected[i]][i]).join(' ');}
function builderSection(){
 const ex=examples();
 return '<section class="ss-block ss-builder" id="sentence-builder"><h2>Bygg ett eget svar</h2><p>Välj en mening i varje steg. Två färdiga val finns – du kan blanda dem så du förstår hur ett svar byggs.</p>'
 +'<div class="ss-buildsteps">'+steps.map((x,i)=>'<div class="ss-buildstep"><h3><b>'+['P','A','C','E'][i]+'</b>'+x+'</h3><div class="ss-switch" role="group" aria-label="'+E(x)+'">'+[0,1].map(j=>btn('pick',E(ex[j][i]),selected[i]===j?'ss-picked':'','data-part="'+i+'" data-choice="'+j+'" aria-pressed="'+(selected[i]===j)+'"')).join('')+'</div></div>').join('')+'</div>'
 +'<div class="ss-built"><strong>Så låter ditt sammansatta svar:</strong><p lang="en">'+E(compose())+'</p>'+btn('listen-built','Lyssna på ditt svar ▶','ss-outline')+'</div>'
 +'<p class="ss-note">Det här är meningsbyggande, inte ett facit. Byt gärna ett ord och gör svaret till ditt eget.</p></section>';
}
function rescue(){
 return '<div class="ss-rescue" id="when-stuck"><h2>Fastnat? Börja här.</h2>'
 +'<div class="ss-rescuegrid">'+[['blank','Helt blankt','I have not thought about this before, but I think it affects people because ...'],['bored','Tråkigt ämne','This is not my favourite topic, but one important question is who it affects.'],['excited','Jag babblar','So, to come back to the question, my main point is ... What is your view?'],['word','Saknar ett ord','I cannot remember the word, but what I mean is ...'],['disagree','Inte samma åsikt','I see your point. I see it differently because ...']].map(x=>'<div class="ss-rescueitem"><h3>'+x[1]+'</h3><p lang="en">'+E(x[2])+'</p></div>').join('')+'</div></div>';
}
function bottom(){
 return '<section class="ss-more"><details class="ss-details"><summary>Fler val (om du behöver)</summary><div class="ss-detailsbody"><label for="ss-topic-filter">Träna bara ett visst ämnesområde</label><select id="ss-topic-filter"><option value="all"'+(session.category==='all'?' selected':'')+'>Överraska mig – blandade kort</option>'+D.categories.map(x=>'<option value="'+E(x.id)+'"'+(session.category===x.id?' selected':'')+'>'+E(x.sv)+'</option>').join('')+'</select><p>Byter du område startar ett nytt kort utan att ändra någon elevprofil.</p>'+btn('theme',theme==='dark'?'Byt till ljust läge':'Byt till mörkt läge','ss-outline')+'</div></details>'
 +'<p class="ss-privacy">Ingenting spelas in och inga svar skickas iväg. Endast vilket kort du är på sparas tillfälligt i denna flik.</p></section>';
}
function cardView(){
 return '<div class="ss-path">Du är här: Engelska <span>›</span> Prata</div>'
 +'<div class="ss-welcome"><strong>1. Läs kortet.</strong><span>2. Säg vad du tycker.</span><span>3. Fråga vidare.</span></div>'
 +cardTop()+modeBox()+turn()
 +exampleSection()
 +'<div class="ss-buildercta">'+btn('builder',builder?'Stäng meningsbygget':'Bygg ditt svar med meningar →', 'ss-secondary','aria-expanded="'+builder+'" aria-controls="sentence-builder"')+'</div>'
 +(builder?builderSection():'')
 +rescue()+bottom();
}
function guideExample(title,id){
 const q=D.topics.find(t=>t.id===id),ex=X.cards[id];
 return '<div class="ss-guideexample"><h3>'+E(title)+'</h3><p class="ss-question" lang="en">'+E(q.prompt)+'</p><p>Här är <b>två kompletta svar</b> som båda hör ihop med frågan.</p><div class="ss-examples">'+sample('Exempel 1',ex[0])+sample('Exempel 2',ex[1])+'</div></div>';
}
function guideView(){
 return '<div class="ss-path">Du är här: Engelska <span>›</span> Så svarar du</div>'
 +'<section class="ss-guidehero"><p class="ss-kicker">DIN ENKLA GUIDE</p><h1>Så pratar du om vilket ämne som helst</h1><p>Du behöver inte veta allt. Svara på frågan och ta en sak i taget.</p>'
 +btn('back','← Till mitt kort','ss-primary')+'</section>'
 +'<section class="ss-block"><h2>Fyra små steg</h2><p>Det här är <strong>PACE</strong>. Du behöver bara komma ihåg fyra frågor.</p><div class="ss-guidegrid">'+[['P','Vad tycker du?','I think ...'],['A','Varför då?','Because ...'],['C','Ge ett exempel','For example ...'],['E','Fråga tillbaka','What do you think?']].map(x=>'<div class="ss-guidestep"><b>'+x[0]+'</b><div><strong>'+x[1]+'</strong><span lang="en">'+x[2]+'</span></div></div>').join('')+'</div></section>'
 +'<section class="ss-block"><h2>Två helt olika ämnen – samma metod</h2><p>Pengar och kriminalitet kräver olika innehåll, men du kan fortfarande använda de fyra stegen.</p>'+guideExample('Ämne 1: Pengar','moneychoice')+guideExample('Ämne 2: Kriminalitet','crime')+'</section>'
 +rescue()
 +'<section class="ss-block"><h2>Tre saker att tänka på</h2><p><strong>Det är okej att tänka en stund.</strong> Säg: <span lang="en">Let me think for a second.</span></p><p><strong>Håll dig till frågan.</strong> En åsikt och ett tydligt exempel räcker som start.</p><p><strong>Gör det till ett samtal.</strong> Svara på någon annan och ställ en riktig fråga.</p>'+btn('back','Nu vill jag öva →','ss-primary')+'</section>'
 +'<p class="ss-privacy">Originalövningar. Detta är inte nationella provfrågor eller en officiell bedömningsmall. <a href="https://www.gu.se/nationella-prov-frammande-sprak/prov-och-bedomningsstod-i-engelska/engelska-arskurs-7-9/nationella-prov-i-engelska-for-arskurs-9" target="_blank" rel="noopener noreferrer">Läs om provets upplägg</a>.</p>';
}
function isGuide(){return location.hash==='#guide'}
function show(scrollTop=false){
 document.documentElement.dataset.ssTheme=theme;
 app.innerHTML=header()+'<main class="ss-main" id="main"><div class="ss-live" role="status">'+E(notice)+'</div>'+(isGuide()?guideView():cardView())+'</main>'
 +'<footer class="ss-foot"><a href="./#/studio/en">← Till Engelska</a><span>Matte OS · Engelska muntligt</span></footer>';
 document.title='Prata engelska · Matte OS';
 if(scrollTop)window.scrollTo?.(0,0);
}
function speak(text){
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){notice='Uppläsning finns inte på den här enheten.';show();return;}
 try{window.speechSynthesis.cancel();const say=new SpeechSynthesisUtterance(text);say.lang='en-GB';say.rate=.85;window.speechSynthesis.speak(say);}catch(_){notice='Uppläsning kunde inte starta.';show();}
}
app.addEventListener('click',ev=>{
 const b=ev.target.closest('button[data-act]');if(!b||!app.contains(b))return;
 const a=b.dataset.act;
 if(a==='guide'){location.hash='guide';return;}
 if(a==='back'){location.hash='';return;}
 if(a==='turn'){nextTurn();return;}
 if(a==='next-card'){freshCard();return;}
 if(a==='builder'){builder=!builder;show();if(builder)document.getElementById('sentence-builder')?.scrollIntoView({block:'start',behavior:'instant'});return;}
 if(a==='pick'){selected[Number(b.dataset.part)]=Number(b.dataset.choice);const box=document.getElementById('sentence-builder');const offset=box?.getBoundingClientRect().top;show();if(offset!=null)window.scrollBy?.(0,document.getElementById('sentence-builder').getBoundingClientRect().top-offset);return;}
 if(a==='mode'){session=Object.assign({},session,{mode:b.dataset.mode,turn:0,stage:'card'});store();show();return;}
 if(a==='theme'){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('matteos.appearance.v1',theme)}catch(_){ }show();return;}
 if(a==='speak'){speak(card().prompt);return;}
 if(a==='listen-example'){const id=Number(b.dataset.ex);const data=isGuide()?null:examples();if(data)speak(data[id].join(' '));else{const item=b.closest('.ss-guideexample');const title=item?.querySelector('.ss-question')?.textContent;const q=D.topics.find(t=>t.prompt===title);if(q)speak(X.cards[q.id][id].join(' '));}return;}
 if(a==='listen-built'){speak(compose());return;}
});
app.addEventListener('change',ev=>{
 if(ev.target?.id==='ss-topic-filter'){session=C.make({mode:session.mode,category:ev.target.value,seed:String(Date.now())+'-'+Math.random()});store();show(true);}
});
window.addEventListener('hashchange',()=>show(true));
if(!C.safe(session)){session=C.make({mode:'solo'});}
store();show();
})();
