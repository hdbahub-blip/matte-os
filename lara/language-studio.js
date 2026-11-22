/* Matte OS Language Studio — original, assessment-neutral interactive practice. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.MOL_STUDIO=api;})(typeof window!=='undefined'?window:globalThis,function(root){
'use strict';
const DATA=root.MOL_STUDIO_DATA || (typeof require==='function'?require('./language-studio-content.js'):null);
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validLang=x=>x==='en'?'en':'sv';
const validGrade=x=>x==='grade9'?'grade9':'grade8';
const words={sv:{title:'Svenska',back:'Tillbaka',home:'Alla ämnen',games:'Spelstudio',solo:'Spela själv',pair:'Spela tillsammans',next:'Nästa',again:'Spela igen',correct:'Rätt! Bra tänkt.',try:'Inte riktigt än.',why:'Så tänker du',tap:'Välj ett alternativ',continue:'Fortsätt',finished:'Bra jobbat!'},en:{title:'English',back:'Back',home:'All subjects',games:'Game studio',solo:'Play solo',pair:'Play together',next:'Next',again:'Play again',correct:'Correct! Well done.',try:'Not quite yet.',why:'Why it works',tap:'Choose an answer',continue:'Continue',finished:'Well done!'}};
const ui={key:'',qIndex:0,selected:null,checked:false,score:0,matchTerm:null,matched:[],matchMessage:'',picks:[],orderChecked:false,draft:'',showChecklist:false,talkIndex:0};
function hash32(s){let n=2166136261>>>0;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n>>>0;}
function shuffle(items,key){const a=items.slice();let n=hash32(key)||1;for(let i=a.length-1;i>0;i--){n^=n<<13;n^=n>>>17;n^=n<<5;const j=(n>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function readRoute(path){const p=String(path||'').replace(/^#?\/?/,'').split('/').map(x=>{try{return decodeURIComponent(x)}catch{return ''}});
 if(p[0]==='spel'&&p.length===1)return {kind:'games-hub',lang:'sv',section:'',id:''};
 if(p[0]==='studio'&&['sv','en'].includes(p[1]))return {kind:'studio',lang:p[1],section:p[2]||'',id:p[3]||'',mode:p[4]||''};
 if(p[0]==='studio-game'&&['sv','en'].includes(p[1]))return {kind:'game',lang:p[1],section:p[2]||'',id:p[3]||'',mode:p[4]||''};
 return null;
}
function resetFor(path){if(ui.key===path)return;ui.key=path;ui.qIndex=0;ui.selected=null;ui.checked=false;ui.score=0;ui.matchTerm=null;ui.matched=[];ui.matchMessage='';ui.picks=[];ui.orderChecked=false;ui.draft='';ui.showChecklist=false;ui.talkIndex=0;}
function list(lang){return DATA.units.filter(u=>u.lang===lang);}
function groupUnits(lang,group){return list(lang).filter(u=>u.group===group);}
function findUnit(lang,id){return list(lang).find(u=>u.id===id);}
function gradeName(grade){return grade==='grade9'?'Årskurs 9':'Årskurs 8';}
function base(lang){return '#/studio/'+lang;}
function gameBase(lang){return '#/studio-game/'+lang;}
function backdrop(lang,grade,title,description){
 return '<header class="ls-hero"><div class="ls-eyebrow">MATTE OS <span class="ls-dot">•</span> '+E(gradeName(grade))+'</div><h1>'+E(title)+'</h1><p>'+E(description)+'</p></header>';
}
function back(href,label){return '<a class="ls-back" href="'+E(href)+'"><span aria-hidden="true">‹</span> '+E(label)+'</a>';}
function panel(title,body,kind=''){return '<section class="ls-panel '+E(kind)+'"><h2>'+E(title)+'</h2>'+body+'</section>';}
function plainLink(href,label,desc,icon='',extra=''){
 return '<a class="ls-shelf-card '+E(extra)+'" href="'+E(href)+'"><span class="ls-card-icon" aria-hidden="true">'+E(icon)+'</span><span><strong>'+E(label)+'</strong><small>'+E(desc)+'</small></span><span class="ls-arrow" aria-hidden="true">›</span></a>';
}
function categories(lang,grade){
 const W=words[lang];return back('#/',W.home)+back('#/','') /* replaced below by styled breadcrumb */;
}
function hub(lang,grade){
 lang=validLang(lang);grade=validGrade(grade);const W=words[lang];
 const learning=DATA.paths[lang];
 const sections=learning.map((g,i)=>plainLink(base(lang)+'/area/'+encodeURIComponent(g.name),g.name,g.detail,g.icon,'ls-tile-'+i)).join('');
 const gameCards=[
  {id:'quiz',title:lang==='sv'?'Fem snabba':'Quick five',detail:lang==='sv'?'Kort frågeutmaning med förklaringar':'Five questions with explanations',icon:'5'},
  {id:'match',title:lang==='sv'?'Para ihop':'Match it',detail:lang==='sv'?'Hitta orden och betydelserna':'Match terms and meanings',icon:'↔'},
  {id:'order',title:lang==='sv'?'Rätt ordning':'Put in order',detail:lang==='sv'?'Bygg en text eller tanke steg för steg':'Build a clear sequence',icon:'≡'},
  {id:'talk',title:lang==='sv'?'Samtalskort':'Talk cards',detail:lang==='sv'?'Svara, fråga och förklara tillsammans':'Speak, ask and explain',icon:'◎'}
 ];
 return '<div class="ls-root" data-ls-screen="hub">'
 +back('#/',lang==='sv'?'Tillbaka till Lärande':'Back to learning')
 +backdrop(lang,grade,W.title,lang==='sv'?'Välj vad du vill öva. Börja enkelt, få stöd och prova själv.':'Choose a skill. Learn it, try it and make it your own.')
 +'<div class="ls-start-now">'+plainLink(base(lang)+'/area/'+encodeURIComponent(learning[0].name),lang==='sv'?'Börja här: första uppgiften':'Start here: first skill',lang==='sv'?'Ett lugnt steg i taget':'One clear step at a time','→','ls-feature')+'</div>'
 +'<h2 class="ls-section-heading">'+(lang==='sv'?'Vad vill du lära dig?':'What do you want to learn?')+'</h2>'
 +'<div class="ls-shelf-grid">'+sections+'</div>'
 +'<h2 class="ls-section-heading">'+(lang==='sv'?'Lär genom att spela':'Learn by playing')+'</h2>'
 +'<div class="ls-game-grid">'+gameCards.map(x=>plainLink(gameBase(lang)+'/'+x.id,x.title,x.detail,x.icon,'ls-game-link')).join('')+'</div>'
 +panel(lang==='sv'?'Fler sätt att öva':'More ways to practise',
   plainLink('#/texter/'+lang,lang==='sv'?'Läs berättelser och saktexter':'Read stories and articles',lang==='sv'?'Nivåer, frågor och texter i eget tempo':'Levels and reading tasks','▤')
  +plainLink('#/korta/'+lang,lang==='sv'?'Korta språklektioner':'Short lessons',lang==='sv'?'Förstå, prova, förklara':'Learn, practise, explain','◉')
  +plainLink('#/tillsammans',lang==='sv'?'Fler spel tillsammans':'More games together',lang==='sv'?'Lagtävling och samarbete':'Team challenges and cooperation','✦'))
 +'<p class="ls-quiet">Ingen tidspress. Du kan alltid gå tillbaka. Spelresultaten stannar bara i det här spelpasset.</p></div>';
}
function gamesHub(grade){
 const t=['sv','en'].map(lang=>plainLink(base(lang),lang==='sv'?'Svenska':'English',lang==='sv'?'Ord, texter, meningar och samtal':'Words, reading, writing and speaking',lang==='sv'?'S':'E')).join('');
 const modes=['quiz','match','order','talk'];
 const labels={sv:['Fem snabba','Para ihop','Rätt ordning','Samtalskort'],en:['Quick five','Match it','Put in order','Talk cards']};
 return '<div class="ls-root" data-ls-screen="game-hub">'+back('#/','Till Lärande')
 +backdrop('sv',grade,'Välj ett spel','Träna genom att spela. Du kan välja ämne, spel och om ni vill vara två.')
 +'<h2 class="ls-section-heading">Välj språk</h2><div class="ls-shelf-grid">'+t+'</div>'
 +'<h2 class="ls-section-heading">Spel på svenska</h2><div class="ls-game-grid">'
 +modes.map((m,i)=>plainLink(gameBase('sv')+'/'+m,labels.sv[i],['Korta frågor','Begrepp och ord','Bygg en tydlig ordning','Prata med en vän'][i],['5','↔','≡','◎'][i],'ls-game-link')).join('')+'</div>'
 +'<h2 class="ls-section-heading">Games in English</h2><div class="ls-game-grid">'
 +modes.map((m,i)=>plainLink(gameBase('en')+'/'+m,labels.en[i],['Questions and feedback','Match words','Order the steps','Talk together'][i],['5','↔','≡','◎'][i],'ls-game-link')).join('')+'</div>'
 +panel('Andra spel som redan finns',plainLink('../tillsammans/?start=group&grade='+grade,'Lära tillsammans','Samarbeta, spela som Joker och välj laguppgifter','✦')
 +plainLink('../#/cup','Matte OS Cup','Matematikspel med kompisar','∑'))
 +'<p class="ls-quiet">Du får prova igen hur många gånger du vill. Inga nya spelpoäng sparas till elevkonton.</p></div>';
}
function area(lang,grade,name){
 const g=DATA.paths[lang].find(x=>x.name===name);if(!g)return hub(lang,grade);
 const a=groupUnits(lang,name),W=words[lang];
 return '<div class="ls-root" data-ls-screen="area">'+back(base(lang),W.back+' · '+W.title)
 +backdrop(lang,grade,g.name,g.detail)
 +'<div class="ls-list">'+a.map((u,i)=>plainLink(base(lang)+'/unit/'+u.id,u.title,u.teach,i+1,'ls-unit-row')).join('')+'</div>'
 +panel(lang==='sv'?'Vill du öva ihop?':'Practise with a friend',plainLink(gameBase(lang)+'/quiz/pair',lang==='sv'?'Turas om: fem snabba':'Take turns: quick five',lang==='sv'?'Frågor och förklaringar':'Questions and reasons','2'))
 +'</div>';
}
function unitView(lang,grade,id){
 const u=findUnit(lang,id);if(!u)return hub(lang,grade);
 return '<div class="ls-root" data-ls-screen="unit">'
 +back(base(lang)+'/area/'+encodeURIComponent(u.group),lang==='sv'?'Till '+u.group:'Back to '+u.group)
 +backdrop(lang,grade,u.title,u.teach)
 +panel(lang==='sv'?'Så fungerar det':'How it works','<p class="ls-explain">'+E(u.teach)+'</p><div class="ls-example"><strong>'+(lang==='sv'?'Exempel':'Example')+'</strong><p>'+E(u.example)+'</p></div>'+(lang==='en'&&u.group==='Listening'?'<button class="ls-button ls-outline" type="button" data-ls="listen-example">Listen to the example</button><p id="ls-voice-status" class="ls-quiet" role="status">You can listen again, or read it together with a partner.</p>':''),'ls-guide-panel')
 +'<div class="ls-action-stack">'
 +plainLink(base(lang)+'/quiz/'+u.id,lang==='sv'?'Prova två frågor':'Try two questions',lang==='sv'?'Du får förklaringar efter varje fråga':'Explanations after each answer','1','ls-primary-link')
 +plainLink(base(lang)+'/write/'+u.id,lang==='sv'?'Skriv med egna ord':'Write in your own words',lang==='sv'?'En uppgift med checklista':'One task with a checklist','✎')
 +plainLink(base(lang)+'/talk/'+u.id,lang==='sv'?'Prata och förklara':'Speak and explain',lang==='sv'?'Gör själv eller med en kompis':'Solo or with a friend','◉')
 +'</div><p class="ls-quiet">'+(lang==='sv'?'Du behöver inte vara snabb. Förståelsen kommer först.':'No rush. Understanding comes first.')+'</p></div>';
}
function quizQuestions(u,grade){
 const q=u.quiz[grade];
 const terms=u.terms,chosen=terms[(grade==='grade9'?1:0)%terms.length],others=terms.filter(x=>x!==chosen);
 // Exactly one objective definition. The optional fourth distractor comes from a different module.
 const cross=list(u.lang).filter(x=>x.id!==u.id).flatMap(x=>x.terms).find(x=>!terms.some(v=>v[1]===x[1])&&!others.some(v=>v[1]===x[1]));
 const options=[chosen[1],...others.map(x=>x[1])].slice(0,4);
 if(options.length<4&&cross)options.push(cross[1]);
 const mix=shuffle(options,u.id+grade+'term');
 const isSv=u.lang==='sv';
 const primaryOrder=shuffle([0,1,2,3],u.id+'|'+grade+'|primary');
 const primary={...q,options:primaryOrder.map(i=>q.options[i]),answer:primaryOrder.indexOf(q.answer),why:u.why,topic:u.title};
 return [
  primary,
  {prompt:(isSv?'Vad betyder ”':'What does “')+chosen[0]+(isSv?'”?':'” mean?'),options:mix,answer:mix.indexOf(chosen[1]),why:(isSv?'Rätt betydelse: ':'Correct meaning: ')+chosen[0]+' — '+chosen[1]+'.',topic:u.title}
 ];
}
function gradeQuiz(lang,grade,id){
 const u=findUnit(lang,id);if(!u)return hub(lang,grade);
 const W=words[lang],qs=quizQuestions(u,grade);
 if(ui.qIndex>=qs.length)return '<div class="ls-root" data-ls-screen="quiz-end">'+back(base(lang)+'/unit/'+u.id,W.back)
 +'<div class="ls-finish"><span class="ls-celebrate" aria-hidden="true">✦</span><h1>'+W.finished+'</h1><p>'+(lang==='sv'?'Du har tränat två olika sätt att tänka.':'You practised two different ways to think.')+'</p><strong>'+ui.score+' / '+qs.length+'</strong></div>'
 +'<div class="ls-action-stack">'+plainLink(base(lang)+'/write/'+u.id,lang==='sv'?'Använd kunskapen i en egen text':'Use the skill in writing','✎','✎')
 +plainLink(base(lang)+'/unit/'+u.id,lang==='sv'?'Till momentet':'Back to the skill','↶')+'</div>'
 +'<button class="ls-button ls-quiet-button" type="button" data-ls="restart">Öva igen</button></div>';
 const q=qs[ui.qIndex],right=ui.selected===q.answer;
 return '<div class="ls-root" data-ls-screen="quiz">'+back(base(lang)+'/unit/'+u.id,W.back)
 +'<div class="ls-step">'+(lang==='sv'?'Fråga ':'Question ')+(ui.qIndex+1)+' / '+qs.length+'<div class="ls-step-bar"><span style="width:'+((ui.qIndex+1)/qs.length*100)+'%"></span></div></div>'
 +'<h1 class="ls-question-title">'+E(q.prompt)+'</h1><div class="ls-answer-grid" role="group" aria-label="'+E(W.tap)+'">'
 +q.options.map((choice,i)=>'<button type="button" data-ls="select" data-index="'+i+'" class="ls-answer'+(ui.selected===i?' selected':'')+'" aria-pressed="'+(ui.selected===i)+'"'+(ui.checked?' disabled':'')+'><b class="ls-answer-index">'+(i+1)+'</b><span>'+E(choice)+'</span></button>').join('')+'</div>'
 +(ui.checked?'<div class="ls-feedback '+(right?'positive':'retry')+'" role="status"><strong>'+(right?W.correct:W.try)+'</strong>'
 +(!right?'<p>'+(lang==='sv'?'Rätt svar: ':'Correct answer: ')+E(q.options[q.answer])+'</p>':'')
 +'<p>'+E(q.why)+'</p></div><button type="button" class="ls-button" data-ls="next">'+W.next+'</button>'
 :'<button type="button" class="ls-button" data-ls="check"'+(ui.selected===null?' disabled':'')+'>'+(lang==='sv'?'Kontrollera svar':'Check answer')+'</button>'
 +'<p class="ls-quiet">'+(lang==='sv'?'Välj lugnt. Det finns ingen tidtagning.':'Take your time. No timer.')+'</p>')+'</div>';
}
function writeView(lang,grade,id){
 const u=findUnit(lang,id);if(!u)return hub(lang,grade);
 const isSv=lang==='sv',advanced=grade==='grade9';
 const title=isSv?'Skriv och utveckla':'Write and improve';
 const prompt=isSv?'Din uppgift':'Your task';
 const advice=advanced?(isSv?'Utmaning: använd fler perspektiv och tydliga belägg.':'Challenge: consider another perspective and support your ideas.'):(isSv?'Börja med två meningar och bygg vidare.':'Start with two sentences and add more when ready.');
 const points=isSv?['Jag svarar på uppgiften.','Jag ger minst ett exempel.','Meningarna hänger ihop.',advanced?'Jag väger fler perspektiv och har belägg.':'Jag har läst igenom texten igen.']:['I answer the task.','I include an example.','My sentences connect.',advanced?'I consider more than one perspective and give support.':'I reread my draft.'];
 const checklist=ui.showChecklist?'<div class="ls-feedback positive" role="region" aria-label="'+(isSv?'Självkontroll':'Self-check')+'"><strong>'+(isSv?'Kolla din text':'Check your writing')+'</strong><ul>'+points.map(x=>'<li>'+E(x)+'</li>').join('')+'</ul><p>'+(isSv?'Detta är självkontroll, inte automatisk rättning.':'This is a self-check, not automatic marking.')+'</p></div>':'';
 const body='<p class="ls-explain">'+E(u.write)+'</p><p class="ls-level-hint">'+E(advice)+'</p>'
 +'<label class="ls-field-label" for="ls-draft">'+(isSv?'Ditt utkast':'Your draft')+'</label>'
 +'<textarea id="ls-draft" rows="7" maxlength="4000" placeholder="'+(isSv?'Skriv ditt första försök här ...':'Write your first draft here ...')+'">'+E(ui.draft)+'</textarea>'
 +'<button class="ls-button" type="button" data-ls="checklist">'+(ui.showChecklist?(isSv?'Dölj checklistan':'Hide checklist'):(isSv?'Visa checklista':'Show checklist'))+'</button>'
 +checklist+'<p class="ls-quiet">'+(isSv?'Utkastet sparas inte, skickas inte iväg och försvinner när du lämnar sidan.':'Drafts are not saved or sent and disappear when you leave the page.')+'</p>';
 return '<div class="ls-root" data-ls-screen="write">'+back(base(lang)+'/unit/'+u.id,words[lang].back)
 +backdrop(lang,grade,title,u.title)+panel(prompt,body,'ls-writing')+'</div>';
}
function talkView(lang,grade,id){
 const u=findUnit(lang,id);if(!u)return hub(lang,grade);
 return '<div class="ls-root" data-ls-screen="talk">'+back(base(lang)+'/unit/'+u.id,words[lang].back)
 +backdrop(lang,grade,lang==='sv'?'Säg det med egna ord':'Say it in your own words',u.title)
 +panel(lang==='sv'?'Prata eller tänk':'Talk or think','<p class="ls-talk-prompt">'+E(u.talk)+'</p><div class="ls-talk-steps"><span>1. '+(lang==='sv'?'Tänk en stund':'Think first')+'</span><span>2. '+(lang==='sv'?'Säg din tanke':'Share your idea')+'</span><span>3. '+(lang==='sv'?'Fråga varför':'Ask why')+'</span></div><p class="ls-quiet">'+(lang==='sv'?'Inget spelas in. Använd en kompis eller svara för dig själv.':'No recording. Work with a friend or think aloud alone.')+'</p>'
 +'<button class="ls-button ls-outline" data-ls="speak" type="button">'+(lang==='sv'?'Läs upp uppgiften':'Read prompt aloud')+'</button>','ls-talking')
 +'<div class="ls-action-stack">'+plainLink(gameBase(lang)+'/talk/pair',lang==='sv'?'Fler samtalskort för två':'More talk cards for two',lang==='sv'?'Turas om att fråga och förklara':'Take turns asking and explaining','2')+'</div></div>';
}
function gamePick(lang,mode,grade){
 const specs={quiz:['Fem snabba','Quick five','5'],match:['Para ihop','Match it','↔'],order:['Rätt ordning','Put in order','≡'],talk:['Samtalskort','Talk cards','◎']};
 const m=specs[mode];if(!m)return hub(lang,grade);
 return '<div class="ls-root" data-ls-screen="game-select">'+back(base(lang),words[lang].back+' · '+words[lang].games)
 +backdrop(lang,grade,lang==='sv'?m[0]:m[1],lang==='sv'?'Välj hur du vill spela. Inget behöver laddas ned.':'Choose how to play. No downloads needed.')
 +'<div class="ls-action-stack">'+plainLink(gameBase(lang)+'/'+mode+'/solo',words[lang].solo,lang==='sv'?'Ditt eget lugna spelpass':'Your own relaxed round','1','ls-primary-link')
 +plainLink(gameBase(lang)+'/'+mode+'/pair',words[lang].pair,lang==='sv'?'Två turas om på samma mobil':'Two players on the same device','2')+'</div>'
 +panel(lang==='sv'?'Vill ni spela på flera mobiler?':'Want to play on multiple phones?',
 plainLink('../tillsammans/',lang==='sv'?'Öppna befintliga lagspel':'Open existing group games',lang==='sv'?'Andra gemensamma spel och gruppuppgifter':'Other shared games and group activities','✦'))
 +'<p class="ls-quiet">'+(lang==='sv'?'Resultat från dessa nya minispel sparas inte till elevkonton.':'Results from these new mini-games are not stored in student accounts.')+'</p></div>';
}
function playerLabel(pair,index,lang){return pair?(lang==='sv'?'Spelare ':'Player ')+(index%2+1):lang==='sv'?'Du spelar själv':'Solo round';}
function gameDeck(lang,grade,mode){
 const baseUnits=shuffle(list(lang),lang+grade+mode+'20261122');
 return baseUnits.slice(0,5).map(u=>{
  const qs=quizQuestions(u,grade),q=qs[0];
  return {unit:u,question:q,kind:'quiz'};
 });
}
function gameQuiz(lang,grade,pair){
 const deck=gameDeck(lang,grade,'quiz'),length=deck.length;
 if(ui.qIndex>=length)return gameEnd(lang,grade,pair,length);
 const {unit:u,question:q}=deck[ui.qIndex],right=ui.selected===q.answer;
 return '<div class="ls-root" data-ls-screen="game-quiz">'
 +back(gameBase(lang)+'/quiz',words[lang].back)
 +'<div class="ls-game-head"><span>'+E(playerLabel(pair,ui.qIndex,lang))+'</span><span>'+(ui.qIndex+1)+' / '+length+'</span></div>'
 +backdrop(lang,grade,lang==='sv'?'Fem snabba':'Quick five',u.title)
 +'<h2 class="ls-question-title">'+E(q.prompt)+'</h2>'
 +'<div class="ls-answer-grid" role="group" aria-label="'+E(words[lang].tap)+'">'
 +q.options.map((x,i)=>'<button type="button" class="ls-answer'+(i===ui.selected?' selected':'')+'" data-ls="select" data-index="'+i+'" aria-pressed="'+(i===ui.selected)+'"'+(ui.checked?' disabled':'')+'><b class="ls-answer-index">'+(i+1)+'</b><span>'+E(x)+'</span></button>').join('')+'</div>'
 +(ui.checked?'<div class="ls-feedback '+(right?'positive':'retry')+'" role="status"><strong>'+(right?words[lang].correct:words[lang].try)+'</strong><p>'+E(q.why)+'</p></div><button class="ls-button" data-ls="next">'+words[lang].next+'</button>'
 :'<button class="ls-button" data-ls="check"'+(ui.selected===null?' disabled':'')+'>'+(lang==='sv'?'Kontrollera':'Check')+'</button>')
 +'<p class="ls-quiet">'+(lang==='sv'?'Poäng visar bara rätt svar, inte ett betyg.':'Points are just for this round, not a grade.')+'</p></div>';
}
function gameEnd(lang,grade,pair,length){
 return '<div class="ls-root" data-ls-screen="game-end">'+back(base(lang),words[lang].back)
 +'<div class="ls-finish"><span class="ls-celebrate" aria-hidden="true">✦</span><h1>'+words[lang].finished+'</h1><p>'+(lang==='sv'?'Ni har tränat flera olika färdigheter.':'You practised several skills.')+'</p>'
 +'<strong>'+ui.score+' / '+length+'</strong><p class="ls-quiet">'+(lang==='sv'?'Siffran visar hur många svar som var rätt i omgången.':'The number shows correct answers in this round.')+'</p></div>'
 +'<button class="ls-button" type="button" data-ls="restart">'+words[lang].again+'</button>'
 +plainLink(base(lang),lang==='sv'?'Till språkämnet':'Back to subject','', '↶')+'</div>';
}
function matchDeck(lang,grade){const units=shuffle(list(lang),lang+grade+'match2026').slice(0,4);
 return shuffle(units.flatMap(u=>u.terms.slice(0,2).map((pair,i)=>({id:u.id+':'+i,term:pair[0],meaning:pair[1]}))),lang+grade+'matchset').slice(0,6);}
function matchScreen(lang,grade,pair){
 const d=matchDeck(lang,grade),done=new Set(ui.matched),terms=shuffle(d,lang+'terms'+grade),definitions=shuffle(d,lang+'meanings'+grade);
 const finished=done.size===d.length;
 return '<div class="ls-root" data-ls-screen="match">'+back(gameBase(lang)+'/match',words[lang].back)
 +backdrop(lang,grade,lang==='sv'?'Para ihop':'Match it',lang==='sv'?'Tryck på ett ord, sedan på rätt förklaring.':'Pick a word, then the matching meaning.')
 +'<div class="ls-game-head"><span>'+E(playerLabel(pair,ui.qIndex,lang))+'</span><span>'+done.size+' / '+d.length+'</span></div>'
 +(finished?'<div class="ls-finish"><span aria-hidden="true">✦</span><h2>'+words[lang].finished+'</h2><p>'+(lang==='sv'?'Ni hittade alla par!':'All pairs matched!')+'</p></div><button class="ls-button" type="button" data-ls="restart">'+words[lang].again+'</button>'
 :'<div class="ls-match-layout"><div><h2>'+(lang==='sv'?'Ord':'Terms')+'</h2>'+terms.map(x=>'<button type="button" class="ls-match-item'+(ui.matchTerm===x.id?' selected':'')+(done.has(x.id)?' matched':'')+'" data-ls="match-term" data-id="'+E(x.id)+'"'+(done.has(x.id)?' disabled':'')+'>'+E(x.term)+'</button>').join('')+'</div>'
 +'<div><h2>'+(lang==='sv'?'Förklaring':'Meaning')+'</h2>'+definitions.map(x=>'<button type="button" class="ls-match-item'+(done.has(x.id)?' matched':'')+'" data-ls="match-meaning" data-id="'+E(x.id)+'"'+((done.has(x.id)||!ui.matchTerm)?' disabled':'')+'>'+E(x.meaning)+'</button>').join('')+'</div></div>'
 +'<p class="ls-feedback-inline" role="status">'+E(ui.matchMessage||'')+'</p>')
 +'<p class="ls-quiet">'+(lang==='sv'?'Inga tidsgränser och inga minuspoäng.':'No timer and no penalties.')+'</p></div>';
}
function orderDeck(lang,grade){return shuffle(DATA.sequence[lang],lang+grade+'order2026').slice(0,3);}
function orderScreen(lang,grade,pair){
 const deck=orderDeck(lang,grade);
 if(ui.qIndex>=deck.length)return gameEnd(lang,grade,pair,deck.length);
 const q=deck[ui.qIndex],shuffled=shuffle(q.items,q.title+grade),remaining=shuffled.filter(x=>!ui.picks.includes(x)),right=q.items.every((x,i)=>ui.picks[i]===x);
 return '<div class="ls-root" data-ls-screen="order">'+back(gameBase(lang)+'/order',words[lang].back)
 +'<div class="ls-game-head"><span>'+E(playerLabel(pair,ui.qIndex,lang))+'</span><span>'+(ui.qIndex+1)+' / '+deck.length+'</span></div>'
 +backdrop(lang,grade,q.title,lang==='sv'?'Tryck på stegen i rätt ordning. Du kan ångra.':'Tap each step in the correct order. You can undo.')
 +'<div class="ls-order-picked"><strong>'+(lang==='sv'?'Din ordning':'Your order')+'</strong>'
 +(ui.picks.length?'<ol>'+ui.picks.map(x=>'<li>'+E(x)+'</li>').join('')+'</ol>':'<p>'+(lang==='sv'?'Inga steg valda ännu.':'No steps chosen yet.')+'</p>')+'</div>'
 +(ui.orderChecked?'<div class="ls-feedback '+(right?'positive':'retry')+'" role="status"><strong>'+(right?words[lang].correct:words[lang].try)+'</strong><p>'+E(q.items.join(' → '))+'</p></div><button class="ls-button" data-ls="next">'+words[lang].next+'</button>'
 :'<div class="ls-order-options">'+remaining.map(x=>'<button class="ls-order-choice" data-ls="pick-order" data-value="'+E(x)+'">'+E(x)+'</button>').join('')+'</div>'
 +'<div class="ls-row-actions"><button class="ls-button ls-outline" data-ls="undo-order"'+(ui.picks.length?'':' disabled')+'>'+(lang==='sv'?'Ångra sista':'Undo last')+'</button><button class="ls-button" data-ls="check-order"'+(remaining.length?' disabled':'')+'>'+(lang==='sv'?'Kontrollera':'Check')+'</button></div>')
 +'</div>';
}
function talkDeck(lang,grade){return shuffle(list(lang),lang+grade+'talk2026').slice(0,6);}
function gameTalk(lang,grade,pair){
 const deck=talkDeck(lang,grade);
 if(ui.qIndex>=deck.length)return '<div class="ls-root">'+back(base(lang),words[lang].back)+'<div class="ls-finish"><h1>'+words[lang].finished+'</h1><p>'+(lang==='sv'?'Att förklara för varandra är också lärande.':'Explaining to each other is part of learning.')+'</p></div><button class="ls-button" data-ls="restart">'+words[lang].again+'</button></div>';
 const u=deck[ui.qIndex];
 return '<div class="ls-root" data-ls-screen="talk-game">'+back(gameBase(lang)+'/talk',words[lang].back)
 +'<div class="ls-game-head"><span>'+E(playerLabel(pair,ui.qIndex,lang))+'</span><span>'+(ui.qIndex+1)+' / '+deck.length+'</span></div>'
 +backdrop(lang,grade,lang==='sv'?'Samtalskort':'Talk cards',u.title)
 +panel(lang==='sv'?'Prata om detta':'Talk about this','<p class="ls-talk-prompt">'+E(u.talk)+'</p><div class="ls-talk-steps"><span>1. '+(lang==='sv'?'Tänk':'Think')+'</span><span>2. '+(lang==='sv'?'Förklara':'Explain')+'</span><span>3. '+(lang==='sv'?'Fråga vidare':'Ask why')+'</span></div>')
 +'<button class="ls-button" data-ls="next">'+(lang==='sv'?'Klart, nästa kort':'Done, next card')+'</button>'
 +'<p class="ls-quiet">'+(lang==='sv'?'Inget spelas in eller poängsätts automatiskt.':'Nothing is recorded or automatically scored.')+'</p></div>';
}
function render(path,grade){
 if(!DATA)return '';
 const r=readRoute(path);if(!r)return '';
 grade=validGrade(grade);const lang=validLang(r.lang);resetFor(path);
 if(r.kind==='games-hub')return gamesHub(grade);
 if(r.kind==='studio'){
  if(r.section==='area')return area(lang,grade,r.id);
  if(r.section==='unit')return unitView(lang,grade,r.id);
  if(r.section==='quiz')return gradeQuiz(lang,grade,r.id);
  if(r.section==='write')return writeView(lang,grade,r.id);
  if(r.section==='talk')return talkView(lang,grade,r.id);
  return hub(lang,grade);
 }
 if(!['quiz','match','order','talk'].includes(r.section))return hub(lang,grade);
 if(!['solo','pair'].includes(r.id))return gamePick(lang,r.section,grade);
 const pair=r.id==='pair';
 if(r.section==='quiz')return gameQuiz(lang,grade,pair);
 if(r.section==='match')return matchScreen(lang,grade,pair);
 if(r.section==='order')return orderScreen(lang,grade,pair);
 return gameTalk(lang,grade,pair);
}
function current(){return readRoute(root.location?.hash||'');}
function click(event){
 const b=event.target?.closest?.('[data-ls]');if(!b)return false;
 const r=current();if(!r)return false;
 const lang=validLang(r.lang),grade=validGrade(root.MOL_ACTIVE?.()),cmd=b.dataset.ls;let changed=false;
 if(cmd==='select'&&!ui.checked){const i=Number(b.dataset.index);if(Number.isInteger(i)&&i>=0&&i<4){ui.selected=i;changed=true;}}
 if(cmd==='check'&&ui.selected!==null&&!ui.checked){const deck=r.kind==='studio'?quizQuestions(findUnit(lang,r.id),grade):gameDeck(lang,grade,'quiz').map(x=>x.question);const q=deck[ui.qIndex];if(q){ui.checked=true;if(ui.selected===q.answer)ui.score++;changed=true;}}
 if(cmd==='next'){
  ui.qIndex++;ui.selected=null;ui.checked=false;ui.matchTerm=null;ui.matchMessage='';ui.picks=[];ui.orderChecked=false;changed=true;
 }
 if(cmd==='restart'){const key=ui.key;resetFor(key+'-restart');ui.key=key;changed=true;}
 if(cmd==='match-term'){ui.matchTerm=b.dataset.id;ui.matchMessage='';changed=true;}
 if(cmd==='match-meaning'&&ui.matchTerm){
  if(b.dataset.id===ui.matchTerm){ui.matched=[...new Set([...ui.matched,ui.matchTerm])];ui.matchMessage=lang==='sv'?'Rätt par!':'Correct pair!';}
  else ui.matchMessage=lang==='sv'?'Försök med en annan förklaring.':'Try another meaning.';
  ui.matchTerm=null;ui.qIndex++;changed=true;
 }
 if(cmd==='pick-order'&&!ui.orderChecked){const v=b.dataset.value;if(v&&!ui.picks.includes(v)){ui.picks.push(v);changed=true;}}
 if(cmd==='undo-order'&&!ui.orderChecked&&ui.picks.length){ui.picks.pop();changed=true;}
 if(cmd==='check-order'&&!ui.orderChecked){const deck=orderDeck(lang,grade),q=deck[ui.qIndex];if(q&&ui.picks.length===q.items.length){ui.orderChecked=true;if(q.items.every((v,i)=>v===ui.picks[i]))ui.score++;changed=true;}}
 if(cmd==='checklist'){ui.draft=root.document?.getElementById('ls-draft')?.value?.slice(0,4000)||'';ui.showChecklist=!ui.showChecklist;changed=true;}
 if(cmd==='listen-example'){
  const u=findUnit(lang,r.id);
  const msg=root.document?.getElementById('ls-voice-status');
  if(u&&'speechSynthesis' in root&&'SpeechSynthesisUtterance' in root){
   try{
    root.speechSynthesis.cancel();
    const voice=new root.SpeechSynthesisUtterance(u.example);
    voice.lang='en-GB';voice.rate=.85;
    root.speechSynthesis.speak(voice);
    if(msg)msg.textContent='Playing. Tap again to listen once more.';
   }catch{
    if(msg)msg.textContent='Sound is unavailable on this device. Read the example with a partner.';
   }
  }else if(msg)msg.textContent='Sound is unavailable on this device. Read the example with a partner.';
  return true;
 }
 if(cmd==='speak'){
  const u=findUnit(lang,r.id);
  if(u&&'speechSynthesis' in root&&'SpeechSynthesisUtterance' in root){try{root.speechSynthesis.cancel();const utterance=new root.SpeechSynthesisUtterance(u.talk);utterance.lang=lang==='sv'?'sv-SE':'en-GB';utterance.rate=.9;root.speechSynthesis.speak(utterance);}catch{}}
  else if(root.document){const msg=root.document.getElementById('ls-voice-status');if(msg)msg.textContent=lang==='sv'?'Uppläsning saknas på den här enheten.':'Speech is unavailable on this device.';}
  return true;
 }
 if(changed){event.preventDefault();root.MOL_RENDER?.();return true;}
 return false;
}
if(root.document)root.document.addEventListener('click',e=>{if(e.target.closest('[data-ls]'))click(e);});
return Object.freeze({version:'1.0.0',render,click,readRoute,quizQuestions,matchDeck,orderDeck,gameDeck,shuffle,unitCount:DATA?.units.length||0,_debug:()=>JSON.parse(JSON.stringify(ui))});
});