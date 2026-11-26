/* Speak Quest · original interactive oral practice. No recording, assessment or personal data. */
(function(){
'use strict';
const D=window.MO_SPEAKING_DATA,C=window.MO_SPEAKING_CORE,X=window.MO_SPEAKING_EXAMPLES,W=window.MO_SPEAKING_WORDS,app=document.getElementById('app');
if(!D||!C||!X||!W||!app)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const steps=[
 {letter:'P',name:'Your opinion',label:'What do you think?',prompt:'Pick an idea to start with.'},
 {letter:'A',name:'Your reason',label:'Which reason fits?',prompt:'Find a reason that supports your first idea.'},
 {letter:'C',name:'A real example',label:'Which example fits?',prompt:'Pick a situation that shows your idea.'},
 {letter:'E',name:'Keep talking',label:'Which question keeps it going?',prompt:'Choose a question that invites a reply.'}
];
let session=C.load(sessionStorage)||C.make({seed:Date.now()+'-'+Math.random(),mode:'solo'});
if(!C.safe(session))session=C.make({mode:'solo'});
if(session.stage!=='card')session={...session,stage:'card'};
let step=0,chosen=[-1,-1,-1,-1],free=false,examplesOpen=false,exampleIndex=0,help='',guide=location.hash==='#guide',settings=false,wordBoostOpen=false,theme='light',hint='',guideTopic='moneychoice',guideExample=0,message='';
try{theme=['dark','night'].includes(localStorage.getItem('matteos.appearance.v1'))?'dark':'light'}catch{}
const card=()=>C.card(session);
const ex=()=>X.cards[card().id];
const modeText=()=>session.mode==='pair'?'Two players':session.mode==='group'?'Four players':'Solo';
const btn=(a,t,cls='',attrs='')=>'<button type="button" class="sp-btn '+cls+'" data-action="'+a+'" '+attrs+'>'+t+'</button>';
const notice=t=>'<p class="sp-screenreader" role="status">'+esc(t||'')+'</p>';
function save(){try{C.save(sessionStorage,session)}catch{}}
function beginAgain(){step=0;chosen=[-1,-1,-1,-1];free=false;examplesOpen=false;exampleIndex=0;help='';wordBoostOpen=false;hint='';message='';}
function nextPerson(){
 const n=C.participants(session.mode);if(session.turn+1<n){session={...session,turn:session.turn+1,stage:'card'};}
 else{session=C.skip(session);}
 beginAgain();save();render(true);
}
function nextCard(){session=C.skip(session);beginAgain();save();render(true);}
function heading(){
 return '<header class="sp-header"><a class="sp-back" href="./#/studio/en" aria-label="Back to English"><span aria-hidden="true">‹</span> English</a><span class="sp-wordmark"><span class="sp-spark" aria-hidden="true">✦</span> SPEAK<span class="sp-wordmark-end">!</span></span>'+btn('guide','<span aria-hidden="true">?</span> <span class="sp-guide-label">How to play</span>','sp-guide-btn','aria-label="Open the quick game guide"')+'</header>';
}
function progress(){
 return '<div class="sp-progress" aria-label="Build an answer in four small steps"><div class="sp-progress-head"><span>BUILD YOUR ANSWER</span><strong>'+(free?'My own answer':step>=4?'4 of 4 · Ready!':(step+1)+' of 4')+'</strong></div><div class="sp-dots">'+steps.map((s,i)=>'<span class="sp-dot '+(step>i?'done':step===i&&!free?'current':'')+'">'+(step>i?'✓':s.letter)+'</span>').join('')+'</div></div>';
}
function question(){
 const q=card();
 return '<section class="sp-question" aria-label="Speaking card"><div class="sp-cardmeta"><span class="sp-round">CARD '+(session.index+1)+'</span><span class="sp-category">'+esc((D.categories.find(x=>x.id===q.category)||{}).en||'Surprise topics')+'</span></div>'
 +'<p class="sp-eyebrow">YOUR CHALLENGE</p><h1 lang="en">'+esc(q.prompt)+'</h1>'+(hint?'<p role="status" class="sp-audio-notice">'+esc(hint)+'</p>':'')
 +'<div class="sp-questionfoot">'+btn('read','<span aria-hidden="true">▶</span> Listen','sp-soft','aria-label="Read the question aloud in English"')+btn('new','New topic <span aria-hidden="true">↻</span>','sp-ghost')+'</div></section>';
}
function chooseView(){
 const st=steps[step],a=ex();if(!st)return '';
 const order=step===0?[0,1]:(session.index+session.turn+step)%2?[1,0]:[0,1];
 return '<div class="sp-step-head"><span class="sp-step-tag">'+st.letter+'</span><div><span class="sp-eyebrow">Step '+(step+1)+'</span><h2 tabindex="-1">'+st.label+'</h2></div></div>'
 +'<p class="sp-instruction">'+st.prompt+'</p>'
 +(message?'<p class="sp-feedback" role="status">'+esc(message)+'</p>':'')
 +'<div class="sp-choices" role="group" aria-label="'+esc(st.label)+'">'
 +order.map((i,pos)=>btn('choose','<span class="sp-choice-mark">'+(pos+1)+'</span><span lang="en">'+esc(a[i][step])+'</span><span class="sp-choice-arrow" aria-hidden="true">›</span>','sp-choice','data-choice="'+i+'"')).join('')+'</div>'
 +'<div class="sp-step-actions">'+(step>0?btn('back-step','‹ Back','sp-text'):'<span></span>')+btn('free','I want to speak on my own','sp-text')+'</div>';
}
function finishView(){
 const assembled=steps.map((_,i)=>ex()[chosen[i]][i]).join(' ');
 return '<div class="sp-win"><div class="sp-winicon" aria-hidden="true">✦</div><span class="sp-eyebrow">Four steps complete</span><h2>You have built an answer!</h2><p>These are your chosen sentences. Now say the idea <strong>in your own words</strong>.</p><blockquote lang="en">'+esc(assembled)+'</blockquote>'
 +'<div class="sp-win-actions">'+btn('say','Listen to my answer ▶','sp-soft')+btn('try-again','Try other choices ↻','sp-ghost')+'</div></div>';
}
function freeView(){
 return '<div class="sp-free"><div class="sp-free-icon" aria-hidden="true">◈</div><h2>Your turn to speak!</h2><p>Say your idea, give a reason and an example, then ask a question. Keep it simple.</p>'
 +'<div class="sp-free-cues"><span>I think…</span><span>Because…</span><span>For example…</span><span>What do you think?</span></div>'
 +btn('return-build','Build my answer instead','sp-text')+'</div>';
}
function tips(){
 const a=ex(),current=Math.min(step,3);
 const lines={
 blank:[a[0][current],a[1][current]],
 boring:[a[1][0]+' '+a[1][1],a[0][0]+' '+a[0][2]],
 ramble:[a[0][0]+' '+a[0][2]+' '+a[0][3],a[1][0]+' '+a[1][3]],
 word:['Let me explain it in simpler words. '+a[0][current],'I do not know the exact word, but I mean this: '+a[1][current]]
 };
 return '<div class="sp-help"><div class="sp-helps"><span>Stuck?</span>'
 +btn('help','Give me a hint','sp-help-trigger','aria-expanded="'+!!help+'"')
 +'</div>'+(help?'<div class="sp-helpbody"><div class="sp-helpchips">'
 +[['blank','Mind went blank'],['boring','Not my favourite topic'],['ramble','I am talking too much'],['word','I cannot find the word']].map(([id,t])=>btn('select-help',t,help===id?'active':'','data-kind="'+id+'"')).join('')+'</div>'
 +'<p class="sp-help-line" lang="en">'+esc((lines[help]||lines.blank)[0])+'</p><p class="sp-help-note">This fits your card. Borrow one idea, then try it your way.</p></div>':'')+'</div>';
}
/* One topic-specific word bank per card. Vocabulary is optional, never graded.
   P and A have two terms; C and E have one each. Solo/finish view exposes all six. */
function wordBoost(){
 const q=card(),all=free||step>=4,active=Math.min(step,3);
 const words=all?W.byTopic[q.id]?.flatMap((set,i)=>set.map((word,j)=>({word,i,j}))):
  W.forStep(q.id,active).map((word,j)=>({word,i:active,j}));
 const caption=all?'6 words across all four P.A.C.E. moves':
  (words?.length||0)+' words for '+steps[active].name.toLowerCase();
 return '<section class="sp-wordboost" aria-label="Topic vocabulary for '+esc(q.title)+'">'
  +'<button type="button" class="sp-wordboost-trigger" data-action="word-boost" aria-expanded="'+wordBoostOpen+'" aria-controls="sp-wordboost-body">'
  +'<span class="sp-wordboost-symbol" aria-hidden="true">Aa</span><span class="sp-wordboost-title"><strong>Word Boost · '+esc(q.title)+'</strong><small>'+esc(caption)+'</small></span>'
  +'<span class="sp-wordboost-caret" aria-hidden="true">'+(wordBoostOpen?'−':'+')+'</span></button>'
  +(wordBoostOpen?'<div class="sp-wordboost-body" id="sp-wordboost-body">'
   +(!all?'<p class="sp-wordboost-connector"><b>'+esc(W.stages[active])+'</b><span>Conversation move: '+esc(W.connectors[active])+'</span></p>'
    :'<p class="sp-wordboost-connector">Pick one word to use as you give your own answer. You do not have to use them all.</p>')
   +'<div class="sp-wordboost-list">'+(words||[]).map(({word,i,j})=>
     '<article class="sp-wordboost-item"><div class="sp-wordboost-word"><span class="sp-wordboost-step" aria-label="'+esc(W.stages[i])+'">'+steps[i].letter+'</span>'
     +'<strong>'+esc(word.term)+'</strong>'
     +btn('word-speak','Listen','sp-wordboost-listen','data-step="'+i+'" data-item="'+j+'" aria-label="Hear '+esc(word.term)+' in an example sentence"')
     +'</div><p class="sp-wordboost-meaning">'+esc(word.meaning)+'</p>'
     +'<p class="sp-wordboost-example"><span>Try saying</span> '+esc(word.example)+'</p></article>').join('')+'</div>'
   +'<p class="sp-wordboost-fine">Borrow a word, then express your own idea. Nothing you say is recorded or graded.</p></div>':'')
  +'</section>';
}
function play(){
 const count=C.participants(session.mode),last=session.turn>=count-1;
 return '<section class="sp-play">'+(count>1?'<div class="sp-turn"><span>PLAYER '+(session.turn+1)+' OF '+count+'</span><small>'+(session.turn===0?'Start with one clear idea.':'Listen to the previous player and build on their point.')+'</small></div>':'')
 +progress()
 +(free?freeView():step>=4?finishView():chooseView())
 +wordBoost()
 +tips()
 +'<div class="sp-next">'+btn('next-person',count===1||last?'I spoke · Next card →':'Next player →','sp-primary')+'</div>'
 +'<p class="sp-fine">This is practice. No recording, listening or grades.</p></section>';
}
function workedExample(id,n){
 const a=X.cards[id][n],title=id==='moneychoice'?'Money':'Crime',question=D.topics.find(x=>x.id===id).prompt;
 return '<div class="sp-guide-example"><p class="sp-guide-question">'+esc(title)+' · <span lang="en">'+esc(question)+'</span></p><span class="sp-eyebrow">Example '+(n+1)+' of 2</span><p lang="en">'+esc(a.join(' '))+'</p></div>';
}
function guideView(){
 return '<section class="sp-guide"><div class="sp-guide-top">'+btn('close-guide','‹ Back to my card','sp-text')+'<span>30-second guide</span></div><h1>Talk about almost anything</h1><p>You do not need to know everything. Share an opinion, a reason, an example and a question.</p><div class="sp-steps-mini">'+steps.map(st=>'<div><b>'+st.letter+'</b><span>'+st.name+'</span></div>').join('')+'</div>'
 +'<h2>Hear what it sounds like</h2><div class="sp-guide-filters" role="group" aria-label="Choose a practice topic">'
 +btn('guide-topic','Money',guideTopic==='moneychoice'?'selected':'','data-topic="moneychoice" aria-pressed="'+(guideTopic==='moneychoice')+'"')
 +btn('guide-topic','Crime',guideTopic==='crime'?'selected':'','data-topic="crime" aria-pressed="'+(guideTopic==='crime')+'"')+'</div>'
 +workedExample(guideTopic,guideExample)+'<details class="sp-guide-words"><summary>Useful words for this topic</summary><ul>'+W.byTopic[guideTopic].map((set,i)=>'<li><b>'+steps[i].letter+' · '+esc(set[0].term)+'</b><span>'+esc(set[0].meaning)+'</span></li>').join('')+'</ul></details><div class="sp-guide-filters" role="group" aria-label="Choose an example answer">'
 +btn('guide-example','Example 1',guideExample===0?'selected':'','data-ex="0" aria-pressed="'+(guideExample===0)+'"')
 +btn('guide-example','Example 2',guideExample===1?'selected':'','data-ex="1" aria-pressed="'+(guideExample===1)+'"')+'</div>'
 +'<div class="sp-cta-guide">'+btn('close-guide','Let us play →','sp-primary')+'</div><p class="sp-fine">These are original practice cards, not official national exam questions.</p></section>';
}
function examples(){
 const a=ex();
 return '<section class="sp-samples"><button type="button" class="sp-reveal" data-action="examples" aria-expanded="'+examplesOpen+'" aria-controls="sp-example-body"><span class="sp-reveal-symbol" aria-hidden="true">✦</span><span><strong>See two complete answers</strong><small>Two views on the same question</small></span><span aria-hidden="true">'+(examplesOpen?'⌃':'⌄')+'</span></button>'
 +(examplesOpen?'<div id="sp-example-body" class="sp-sample-body"><div class="sp-sample-switch" role="group" aria-label="Choose an example">'
 +[0,1].map(i=>btn('example','Answer '+(i+1),exampleIndex===i?'selected':'','data-ex="'+i+'" aria-pressed="'+(exampleIndex===i)+'"')).join('')+'</div>'
 +'<p class="sp-sample-paragraph" lang="en">'+esc(a[exampleIndex].join(' '))+'</p><p class="sp-fine">This is one possible answer, not the only correct answer. Try again without reading.</p>'
 +btn('read-sample','Listen to this answer ▶','sp-soft')+'</div>':'')+'</section>';
}
function options(){
 return '<section class="sp-options"><button type="button" data-action="settings" class="sp-options-toggle" aria-expanded="'+settings+'">Play with others / more options <span aria-hidden="true">'+(settings?'⌃':'⌄')+'</span></button>'
 +(settings?'<div class="sp-settings"><span>How many are speaking?</span><div class="sp-modes" role="group" aria-label="Choose the number of speakers">'
 +[['solo','Solo'],['pair','Two'],['group','Four']].map(([id,t])=>btn('mode',t,session.mode===id?'selected':'','data-mode="'+id+'" aria-pressed="'+(session.mode===id)+'"')).join('')+'</div>'
 +'<label for="sp-category">Choose a topic (optional)</label><select id="sp-category"><option value="all"'+(session.category==='all'?' selected':'')+'>Surprise me!</option>'
 +D.categories.map(x=>'<option value="'+esc(x.id)+'"'+(session.category===x.id?' selected':'')+'>'+esc(x.en)+'</option>').join('')+'</select>'
 +btn('theme',theme==='dark'?'Light mode':'Dark mode','sp-ghost')+'</div>':'')+'</section>';
}
function render(scroll=false){
 document.documentElement.dataset.spTheme=theme;
 app.innerHTML=heading()+'<main class="sp-shell" id="main">'
 +(guide?guideView():'<div class="sp-board"><div class="sp-overline"><span>ENGLISH · SPEAKING QUEST</span><span class="sp-count">✦ Card '+(session.index+1)+' of '+session.deck.length+'</span></div>'+question()+play()+examples()+options()+'</div>')
 +'</main><footer class="sp-footer"><a href="./#/studio/en">Back to English</a><span>Practise freely · No answers are saved</span></footer>';
 document.title='Speak Quest · Matte OS';
 if(scroll)window.scrollTo?.(0,0);
}
function speak(str){
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){hint='Text-to-speech is not available on this device.';render();return;}
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(str);u.lang='en-GB';u.rate=.88;speechSynthesis.speak(u);}catch{hint='The audio could not start. You can read the sentence aloud.';render();}
}
app.addEventListener('click',ev=>{
 const b=ev.target.closest('button[data-action]');if(!b||!app.contains(b))return;
 const a=b.dataset.action;
 if(a==='choose'){
  const pick=Number(b.dataset.choice);
  if(step>0&&pick!==chosen[0]){message='That belongs to the other point of view. Try the sentence that supports your first idea.';render();return;}
  chosen[step]=pick;step++;help='';
  message=['Good start. Now find a reason that fits.','You have a reason. Show it with an example.','Your example supports your point. Now invite someone to reply.',''][step-1];
  render();(document.querySelector('.sp-step-head h2')||document.querySelector('.sp-win h2'))?.focus({preventScroll:true});return;
 }
 if(a==='back-step'){step=Math.max(0,step-1);message='';render();return;}
 if(a==='try-again'||a==='return-build'){beginAgain();render();return;}
 if(a==='free'){free=true;step=0;help='';message='';render();return;}
 if(a==='next-person'){nextPerson();return;}
 if(a==='new'){nextCard();return;}
 if(a==='read'){speak(card().prompt);return;}
 if(a==='word-boost'){wordBoostOpen=!wordBoostOpen;render();document.querySelector('.sp-wordboost-trigger')?.focus({preventScroll:true});return;}
 if(a==='word-speak'){
  const i=Number(b.dataset.step),j=Number(b.dataset.item);
  const word=Number.isInteger(i)&&Number.isInteger(j)&&i>=0&&i<4?W.forStep(card().id,i)[j]:null;
  if(word)speak(word.term+'. '+word.example);
  return;
 }
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
