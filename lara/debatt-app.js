/* Matte OS · Debattspelet – gränssnitt. Inga skoltexter, inga elevtexter lagras: bara antal färdigheter per profil. */
(function(){
'use strict';
var C=window.MO_DEBATE_CONTENT,D=window.MO_DEBATE,app=document.getElementById('app');
var ui={lang:'sv',mode:'duo',step:1,topic:'',length:3,names:{A:'',B:''},coin:false,checking:false,heard:{},joker:null,flipped:false,idea:null,timer:null,tleft:null,tmax:45,tmsg:'',factPick:null,prepTab:'for',g:null,lessons:false,msg:''};
function E(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x];});}
function L(){return C.ui[ui.lang];}
function now(){return Date.now();}
function loadJ(k){try{var s=localStorage.getItem(k);return s?JSON.parse(s):null;}catch(e){return null;}}
function saveJ(k,o){try{localStorage.setItem(k,JSON.stringify(o));return true;}catch(e){return false;}}
function saveGame(){if(ui.g&&!ui.g.done)saveJ(D.SAVE,ui.g);}
function clearSave(){try{localStorage.removeItem(D.SAVE);}catch(e){}}
function pname(p){var n=ui.g?ui.g.names[p]:'';if(n)return n;return ui.g&&ui.g.mode==='solo'&&p==='B'?(ui.lang==='sv'?'Motspelaren':'The Opponent'):L()['name'+p];}
function route(){var h=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);return h[0]||'home';}
function go(h){if(location.hash==='#/'+h)render();else location.hash='#/'+h;}
function stopTimer(){if(ui.timer){clearInterval(ui.timer);ui.timer=null;}ui.tleft=null;}
function sideBadge(side){var f=side==='for';return '<span class="side '+(f?'for':'against')+'"><span aria-hidden="true">'+(f?'✓':'✕')+'</span> '+esc(f?L().forWord:L().againstWord)+'</span>';}
function topicOf(){return D.topicOf(ui.g||{lang:ui.lang,topicId:ui.topic||C.topics[ui.lang][0].id});}
function btn(label,a,extra,cls){return '<button type="button" class="btn '+(cls||'')+'" data-a="'+a+'" '+(extra||'')+'>'+label+'</button>';}

/* ---------- hem ---------- */
function progressHtml(){
 var key=D.profileKey(localStorage),p=D.sanitizeProgress(loadJ(D.STORE)),e=p.profiles[key];
 var rows=D.SKILL_KEYS.map(function(k){var n=e&&e.skills[k]||0;return '<li><span class="sk-name">'+esc(C.skills[ui.lang][k])+'</span><span class="dots" role="img" aria-label="'+n+'">'+[1,2,3,4,5].map(function(i){return '<i class="'+(n>=i?'on':'')+'"></i>';}).join('')+'</span><small>'+n+'</small></li>';}).join('');
 return '<details class="card"><summary>'+esc(L().progress)+(e&&e.games?' · '+e.games:'')+'</summary>'+(e&&e.games?'<ul class="skills">'+rows+'</ul>':'<p>'+esc(L().progressEmpty)+'</p>')+'<p class="hint">'+esc(L().progressNote)+'</p></details>';
}
function viewHome(){
 var l=L(),saved=D.sanitizeGame(loadJ(D.SAVE)),topics=C.topics[ui.lang];
 if(!ui.topic||!topics.some(function(t){return t.id===ui.topic;}))ui.topic=topics[0].id;
 var steps=['1','2','3'];
 var head='<p class="eyebrow">Matte OS · '+(ui.lang==='sv'?'Svenska':'English')+'</p><h1 id="h1" tabindex="-1">'+esc(l.title)+'</h1><p class="lead">'+esc(l.tagline)+'</p>';
 var resume=saved?'<div class="card note"><b>'+esc(l.resumeNote)+'</b> <small>'+esc(C.topics[saved.lang].filter(function(t){return t.id===saved.topicId;})[0].q)+'</small><div class="actions">'+btn(esc(l.resume),'resume')+btn(esc(l.discard),'discard','','alt sm')+'</div></div>':'';
 var dots='<ol class="steps" aria-label="Steg">'+steps.map(function(s,i){return '<li class="'+(i+1===ui.step?'cur':i+1<ui.step?'done':'')+'"><span>'+s+'</span></li>';}).join('')+'</ol>';
 var body='';
 if(ui.step===1){
  body='<h2>'+esc(ui.lang==='sv'?'Hur vill ni spela?':'How do you want to play?')+'</h2><div class="seg col">'
   +'<button type="button" class="btn alt bigopt" data-a="mode" data-m="duo" aria-pressed="'+(ui.mode==='duo')+'"><b>'+esc(l.mode2)+'</b><small>'+esc(l.mode2Hint)+'</small></button>'
   +'<button type="button" class="btn alt bigopt" data-a="mode" data-m="solo" aria-pressed="'+(ui.mode==='solo')+'"><b>'+esc(l.modeSolo)+'</b><small>'+esc(l.modeSoloHint)+'</small></button></div>'
   +'<h3>'+esc(l.lang)+'</h3><div class="seg">'+['sv','en'].map(function(c){return '<button type="button" class="btn alt" data-a="lang" data-l="'+c+'" aria-pressed="'+(ui.lang===c)+'">'+(c==='sv'?'Svenska':'English')+'</button>';}).join('')+'</div>'
   +btn(esc(ui.lang==='sv'?'Nästa: välj ämne ›':'Next: choose topic ›'),'step','data-s="2"','big');
 }else if(ui.step===2){
  body='<h2>'+esc(l.pickTopic)+'</h2>'+btn('🎲 '+esc(l.randomTopic),'randtopic','','alt')
   +'<ul class="topics">'+topics.map(function(t){return '<li><button type="button" class="topic" data-a="topic" data-t="'+t.id+'" aria-pressed="'+(ui.topic===t.id)+'"><span>'+esc(t.q)+'</span></button></li>';}).join('')+'</ul>'
   +'<div class="pager">'+btn(esc(l.back),'step','data-s="1"','alt')+btn(esc(ui.lang==='sv'?'Nästa ›':'Next ›'),'step','data-s="3"')+'</div>';
 }else{
  var t=C.topics[ui.lang].filter(function(x){return x.id===ui.topic;})[0],aSide=ui.coin?'against':'for';
  body='<blockquote class="topicbox"><span class="tag">'+esc(ui.lang==='sv'?'Ämne':'Topic')+'</span><p>'+esc(t.q)+'</p><small>'+esc(t.intro)+'</small></blockquote>'
   +(ui.mode==='duo'?'<div class="names"><label for="nA">'+esc(l.nameA)+'</label><input id="nA" data-name="A" maxlength="20" value="'+esc(ui.names.A)+'" autocomplete="off"><label for="nB">'+esc(l.nameB)+'</label><input id="nB" data-name="B" maxlength="20" value="'+esc(ui.names.B)+'" autocomplete="off"></div>'
    +'<p class="sidesrow"><span>'+esc(ui.names.A||l.nameA)+' '+sideBadge(aSide)+'</span> <span>'+esc(ui.names.B||l.nameB)+' '+sideBadge(aSide==='for'?'against':'for')+'</span></p>'+btn('🪙 '+esc(l.coin),'coin','','alt')
    :'<p>'+esc(l.yourSide)+': '+sideBadge(aSide)+'</p>'+btn('🪙 '+esc(l.coin),'coin','','alt'))
   +'<h3>'+esc(l.length)+'</h3><div class="seg">'+[3,5].map(function(n){return '<button type="button" class="btn alt" data-a="len" data-n="'+n+'" aria-pressed="'+(ui.length===n)+'">'+esc(n===3?l.short:l.full)+'</button>';}).join('')+'</div>'
   +btn('▶ '+esc(l.start),'start','','big')+btn(esc(l.prep),'prep','','alt')
   +'<div class="pager">'+btn(esc(l.back),'step','data-s="2"','alt')+'<span></span></div>';
 }
 var more='<details class="card"><summary>'+esc(l.quickRead)+'</summary>'+lessonsHtml()+'</details><details class="card"><summary>'+esc(l.qTitle)+'</summary>'+questionsHtml()+'</details>'+progressHtml();
 return '<section>'+head+resume+'<div class="card">'+dots+body+'</div>'+more+'</section>';
}
function lessonsHtml(){return '<ol class="lessons">'+C.lessons[ui.lang].map(function(x){return '<li><b>'+esc(x.h)+'</b><p>'+esc(x.t)+'</p><blockquote class="ex">'+esc(x.ex)+'</blockquote></li>';}).join('')+'</ol>';}
function questionsHtml(){return '<ul class="qcards">'+C.questions[ui.lang].map(function(x){return '<li><b>'+esc(x.q)+'</b><small>'+esc(x.tip)+'</small></li>';}).join('')+'</ul>';}

/* ---------- förberedelse ---------- */
function viewPrep(){
 var l=L(),t=D.topicOf({lang:ui.lang,topicId:ui.topic}),tab=ui.prepTab;
 return '<section><a class="back" href="#/home">'+esc(l.back)+'</a><p class="eyebrow">'+esc(l.prepTitle)+'</p><h1 id="h1" tabindex="-1">'+esc(t.q)+'</h1><p class="lead">'+esc(l.prepHint)+'</p>'
  +'<div class="seg" role="tablist">'+['for','against'].map(function(s){return '<button type="button" class="btn alt" role="tab" data-a="preptab" data-s="'+s+'" aria-pressed="'+(tab===s)+'">'+(s==='for'?esc(l.prepFor):esc(l.prepAgainst))+'</button>';}).join('')+'</div>'
  +'<ul class="args '+tab+'">'+(tab==='for'?t.pro:t.con).map(function(a){return '<li>'+esc(a)+'</li>';}).join('')+'</ul>'
  +'<h2>'+esc(l.prepQs)+'</h2><ul class="qcards">'+t.asks.map(function(a){return '<li><b>'+esc(a)+'</b></li>';}).join('')+'</ul>'
  +btn('▶ '+esc(l.start),'start','','big')+'</section>';
}

/* ---------- spel ---------- */
function timerHtml(){
 var l=L();return '<div class="timerbox"><span class="small">'+esc(l.timer)+'</span> '+[30,45,60].map(function(s){return '<button type="button" class="btn alt sm" data-a="tmax" data-s="'+s+'" aria-pressed="'+(ui.tmax===s)+'">'+s+' s</button>';}).join('')
  +' '+btn(ui.timer?esc(l.stopTimer):esc(l.startTimer),'timer','','alt sm')+'<b id="clock" role="timer">'+fmt(ui.timer&&ui.tleft!=null?ui.tleft:ui.tmax)+'</b><div class="bar" aria-hidden="true"><i id="barfill" style="width:'+Math.round(100*(ui.tleft!=null?ui.tleft:ui.tmax)/ui.tmax)+'%"></i></div></div>';
}
function fmt(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function viewPlay(){
 var g=ui.g,l=L();if(!g)return '<section><div class="card warn"><p>'+esc(l.resumeNote)+'</p><a class="btn" href="#/home">'+esc(l.home)+'</a></div></section>';
 if(g.done){go('end');return '';}
 var t=D.topicOf(g),r=D.currentRound(g),tk=D.task(g),side=g.sides[g.player],rounds=D.roundDefs(g).length;
 var top='<div class="matchbar"><span class="chip">'+esc(l.round)+' '+(g.round+1)+' '+esc(l.of)+' '+rounds+' · <b>'+esc(r.title)+'</b></span><span class="topicmini">'+esc(t.q)+'</span></div>';
 if(g.phase==='star'){return '<section>'+top+'<h1 id="h1" tabindex="-1">'+esc(l.starsQ)+'</h1><div class="seg col">'+btn('⭐ '+esc(pname('A'))+' '+sideBadge(g.sides.A),'star','data-w="A"','alt')+btn('⭐ '+esc(pname('B'))+' '+sideBadge(g.sides.B),'star','data-w="B"','alt')+btn(esc(l.nobody),'star','data-w="N"','alt')+'</div></section>';}
 var who=g.mode==='solo'?pname('A'):pname(g.player),opp=g.mode==='solo'?'<div class="oppcard"><span class="tag">'+esc(l.opponentCard)+' '+sideBadge(D.opponentCard(g).side)+'</span><p>”'+esc(D.opponentCard(g).text)+'”</p></div>':'';
 var lastSaid=g.mode==='duo'&&g.log.length?'<p class="hint">'+esc(l.opponentSaid)+': '+esc(skillsList(g.log[g.log.length-1].skills))+'</p>':'';
 var turn='<div class="turncard '+side+'"><div class="who"><b>'+esc(who)+'</b> '+sideBadge(side)+'</div>'+opp
  +'<h1 id="h1" tabindex="-1">'+esc(r.task)+'</h1>'
  +(tk.voice?'<p class="banner">🎭 '+esc(l.voiceNow)+' '+esc(tk.voice)+'</p>':'')+(tk.extra?'<p class="banner joke">🃏 '+esc(tk.extra)+'</p>':'')
  +'<p class="small">'+esc(l.tipSpeak)+'</p></div>';
 var ideas=ui.idea?'<div class="help"><span class="tag help-tag">'+esc(l['idea'+ui.idea.level])+'</span>'+(ui.idea.kind==='pattern'?'<p><b>'+esc(ui.idea.head)+'</b></p>':'')+'<p class="stem">'+esc(ui.idea.text)+'</p><small>'+esc(l.ideaNote)+'</small></div>':'';
 var jleft=g.jokers[g.mode==='solo'?'A':g.player];
 var tools='<div class="actions">'+btn('💡 '+esc(l.needIdea),'idea','','alt')+btn('🃏 '+esc(l.joker)+' ('+jleft+')','joker',jleft?'':'disabled','alt')+'</div>'
  +(ui.ideaOpen?'<div class="actions ideabtns">'+[1,2,3].map(function(n){return btn(esc(l['idea'+n]),'ideapick','data-n="'+n+'"','alt sm');}).join('')+'</div>':'');
 var check=ui.checking?checkHtml(g,tk):'<button type="button" class="btn big" data-a="done">✓ '+esc(g.mode==='solo'?l.doneTurn:l.doneTurn)+'</button>';
 return '<section>'+top+lastSaid+turn+ideas+(ui.checking?'':tools+timerHtml())+check+'<p class="actions"><button type="button" class="btn alt sm" data-a="pause">'+esc(l.pause)+'</button></p></section>';
}
function skillsList(sk){return sk.map(function(k){return C.skills[ui.lang][k];}).join(', ')||'–';}
function checkHtml(g,tk){
 var l=L(),chips=D.chipsFor(g);
 return '<div class="card listencheck"><h2>'+esc(g.mode==='solo'?l.selfCheck:l.listenerQ)+'</h2><p class="hint">'+esc(l.hearHint)+'</p><div class="chipsel">'+chips.map(function(k){return '<label class="chipcheck"><input type="checkbox" data-heard="'+k+'" '+(ui.heard[k]?'checked':'')+'><span>'+esc(C.skills[ui.lang][k])+'</span></label>';}).join('')+'</div>'+btn(esc(l.doneTurn),'submit','','big')+'</div>';
}
function jokerModal(){
 var j=ui.joker,l=L();if(!j)return '';
 var inner='<button type="button" class="jcard '+(ui.flipped?'flipped':'')+'" data-a="flip" aria-pressed="'+ui.flipped+'" aria-label="'+(ui.flipped?esc(j.title):esc(l.flipHint))+'"><span class="jface jback" aria-hidden="true">?</span><span class="jface jfront"><span class="jicon" aria-hidden="true">'+j.icon+'</span><b>'+esc(j.title)+'</b><span>'+esc(j.text)+'</span></span></button>';
 var extra='';
 if(!ui.flipped)extra='<p class="small">'+esc(l.flipHint)+'</p>';
 else if(j.effect==='swap')extra='<p class="banner">🔄 '+esc(l.swapped)+'</p>';
 else if(j.effect==='fact'&&ui.g.fact){var f=ui.g.fact;extra='<blockquote class="topicbox"><p>”'+esc(f.t)+'”</p></blockquote>'+(f.done?'<div class="fb '+(f.right?'ok':'no')+'" role="status"><b>'+esc(f.right?l.right:l.notQuite)+'</b> '+esc(C.factKinds[ui.lang][f.k])+'. '+esc(C.factWhy[ui.lang][f.k])+'</div>':'<p>'+esc(l.tapKind)+'</p><div class="seg">'+['fact','opinion','claim'].map(function(k){return btn(esc(C.factKinds[ui.lang][k]),'factpick','data-k="'+k+'"','alt');}).join('')+'</div>');}
 var canClose=ui.flipped&&!(j.effect==='fact'&&ui.g.fact&&!ui.g.fact.done);
 return '<div class="sheet-bg" data-a="noop"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="jt" tabindex="-1"><h2 id="jt" class="sr">'+esc(l.joker)+'</h2>'+inner+extra+(canClose?btn(esc(l.okClose),'jclose','','big'):'')+'</div></div>';
}
/* ---------- slut ---------- */
function viewEnd(){
 var g=ui.g,l=L();if(!g)return '<section><a class="btn" href="#/home">'+esc(l.home)+'</a></section>';
 var s=D.summary(g),players=g.mode==='solo'?['A']:['A','B'];
 var cols=players.map(function(p){var k=Object.keys(s.skills[p]);return '<div class="card"><h3>'+esc(pname(p))+'</h3><ul class="skills">'+(k.length?k.map(function(x){return '<li><span class="sk-name">'+esc(C.skills[ui.lang][x])+'</span><b>'+s.skills[p][x]+'</b></li>';}).join(''):'<li>–</li>')+'</ul>'+(g.mode==='duo'?'<p>⭐ '+s.stars[p]+'</p>':'')+'</div>';}).join('');
 return '<section><p class="eyebrow">'+esc(l.endTitle)+'</p><h1 id="h1" tabindex="-1">'+esc(l.endSub)+'</h1><blockquote class="topicbox"><p>'+esc(D.topicOf(g).q)+'</p></blockquote><div class="grid2">'+cols+'</div>'
  +'<div class="card"><h2>'+esc(l.reflect)+'</h2><ul class="qcards"><li><b>'+esc(l.reflect1)+'</b></li><li><b>'+esc(l.reflect2)+'</b></li><li><b>'+esc(l.reflect3)+'</b></li></ul></div>'
  +btn('🔄 '+esc(l.again),'again','','big')+btn(esc(l.newTopic),'newtopic','','alt')+'</section>';
}

/* ---------- render ---------- */
function header(){return '<header class="np-top"><a class="back-svenska" href="./#/'+(ui.lang==='en'?'en':'sv')+'">‹ '+(ui.lang==='en'?'English':'Svenska')+'</a><span class="brand"><b>MATTE OS</b> <small>'+esc(L().title)+'</small></span><div class="top-actions"><button type="button" class="btn alt sm" data-a="theme" aria-label="'+(ui.lang==='sv'?'Växla dag och kväll':'Switch day and night')+'">☾</button></div></header>';}
var lastRoute='';
function render(keep){
 var r=route(),y=window.scrollY,html='';
 if(r!==lastRoute&&ui.timer)stopTimer();
 try{switch(r){case 'prep':html=viewPrep();break;case 'play':html=viewPlay();break;case 'end':html=viewEnd();break;default:html=viewHome();}}
 catch(e){console.error(e);html='<section><div class="card warn"><h2>Något gick fel</h2><a class="btn" href="#/home">Start</a></div></section>';}
 if(!html)return;
 app.innerHTML=header()+(ui.msg?'<div class="notice" role="alert">'+esc(ui.msg)+'</div>':'')+'<main id="main">'+html+'</main><footer class="np-foot"><small>Matte OS · '+(ui.lang==='sv'?'Övning, inte ett officiellt prov. Inget du säger spelas in eller skickas.':'Practice, not an official test. Nothing you say is recorded or sent.')+'</small></footer>'+jokerModal();
 if(keep){window.scrollTo(0,y);}else if(r!==lastRoute){window.scrollTo(0,0);var h=E('h1');if(h)h.focus({preventScroll:true});}
 var sh=document.querySelector('.sheet');if(sh&&ui.joker&&!ui.jfocused){var jc=sh.querySelector('.jcard')||sh;jc.focus();ui.jfocused=true;}
 lastRoute=r;
}
function startGame(){
 ui.g=D.newGame({lang:ui.lang,mode:ui.mode,topicId:ui.topic,length:ui.length,names:ui.names,coin:ui.coin,seed:ui.fixedSeed?ui.fixedSeed:String(now())+Math.random()});
 ui.checking=false;ui.heard={};ui.idea=null;ui.joker=null;stopTimer();saveGame();go('play');
}
function finish(){
 var g=ui.g;clearSave();var prog=D.applyGame(loadJ(D.STORE),D.profileKey(localStorage),g,g.mode==='solo'?['A']:['A','B']);saveJ(D.STORE,prog);
}
var A={
 theme:function(){var d=document.documentElement.classList.toggle('dark');try{localStorage.setItem('matteos.appearance.v1',d?'dark':'light');}catch(e){}},
 mode:function(b){ui.mode=b.dataset.m;render(true);},lang:function(b){ui.lang=b.dataset.l;ui.topic='';render(true);},
 step:function(b){ui.step=+b.dataset.s;render();},topic:function(b){ui.topic=b.dataset.t;render(true);},
 randtopic:function(){var l=C.topics[ui.lang];ui.topic=l[Math.floor(Math.random()*l.length)].id;ui.step=3;render();},
 coin:function(){ui.coin=Math.random()<0.5;render(true);},len:function(b){ui.length=+b.dataset.n;render(true);},
 prep:function(){go('prep');},preptab:function(b){ui.prepTab=b.dataset.s;render(true);},start:startGame,
 resume:function(){var g=D.sanitizeGame(loadJ(D.SAVE));if(!g)return;ui.g=g;ui.lang=g.lang;ui.checking=false;ui.heard={};go(g.done?'end':'play');},
 discard:function(){clearSave();render(true);},
 idea:function(){ui.ideaOpen=!ui.ideaOpen;render(true);},
 ideapick:function(b){var g=ui.g,n=+b.dataset.n,who=g.mode==='solo'?'A':g.player;var i=D.idea(g,who,n);i.level=n;ui.idea=i;saveGame();render(true);},
 tmax:function(b){ui.tmax=+b.dataset.s;stopTimer();render(true);},
 timer:function(){if(ui.timer){stopTimer();render(true);return;}ui.tleft=ui.tmax;ui.timer=setInterval(function(){ui.tleft=Math.max(0,ui.tleft-1);var c=E('clock'),f=E('barfill');if(c)c.textContent=fmt(ui.tleft);if(f)f.style.width=Math.round(100*ui.tleft/ui.tmax)+'%';if(!ui.tleft){stopTimer();render(true);}},1000);render(true);},
 done:function(){stopTimer();ui.checking=true;ui.heard={};ui.ideaOpen=false;render(true);},
 submit:function(){var g=ui.g,heard=Object.keys(ui.heard).filter(function(k){return ui.heard[k];});D.submitTurn(g,heard);ui.checking=false;ui.heard={};ui.idea=null;saveGame();if(g.done){finish();go('end');}else render();},
 star:function(b){var g=ui.g;D.giveStar(g,b.dataset.w);ui.idea=null;saveGame();if(g.done){finish();go('end');}else render();},
 joker:function(){var g=ui.g,who=g.mode==='solo'?'A':g.player,c=D.drawJoker(g,who);if(!c)return;ui.joker=c;ui.flipped=false;ui.jfocused=false;ui.idea=null;saveGame();render(true);},
 flip:function(){ui.flipped=!ui.flipped;ui.jfocused=false;render(true);},
 factpick:function(b){D.resolveFact(ui.g,b.dataset.k);saveGame();render(true);},
 jclose:function(){ui.joker=null;ui.jfocused=false;render(true);},noop:function(){},
 pause:function(){stopTimer();saveGame();ui.g=null;go('home');},
 again:function(){var g=ui.g;ui.mode=g.mode;ui.lang=g.lang;ui.topic=g.topicId;ui.length=g.length;ui.names=g.names;ui.coin=g.sides.A==='for';startGame();},
 newtopic:function(){ui.g=null;ui.step=2;go('home');}
};
document.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var f=A[b.dataset.a];if(!f)return;if(b.dataset.a==='noop')return;if(b.disabled)return;e.preventDefault();f(b,e);});
document.addEventListener('input',function(e){var t=e.target;if(t.dataset.name){ui.names[t.dataset.name]=t.value.slice(0,20);var sr=document.querySelector('.sidesrow');if(sr){var aSide=ui.coin?'against':'for';sr.innerHTML='<span>'+esc(ui.names.A||L().nameA)+' '+sideBadge(aSide)+'</span> <span>'+esc(ui.names.B||L().nameB)+' '+sideBadge(aSide==='for'?'against':'for')+'</span>';}}});
document.addEventListener('change',function(e){var t=e.target;if(t.dataset.heard){ui.heard[t.dataset.heard]=t.checked;}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ui.joker&&ui.flipped&&!(ui.joker.effect==='fact'&&ui.g.fact&&!ui.g.fact.done)){ui.joker=null;ui.jfocused=false;render(true);}});
window.addEventListener('hashchange',function(){render();});
window.addEventListener('beforeunload',stopTimer);
try{var dk=localStorage.getItem('matteos.appearance.v1');if(dk==='dark'||(dk===null&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}
try{var q=new URLSearchParams(location.search),l=q.get('lang');if(l==='en'||l==='sv')ui.lang=l;var sd=q.get('seed');if(sd&&/^[a-z0-9_-]{1,30}$/i.test(sd))ui.fixedSeed=sd;}catch(e){}
render();
window.MO_DEBATE_UI={_debug:function(){return {ui:ui};}};
})();
