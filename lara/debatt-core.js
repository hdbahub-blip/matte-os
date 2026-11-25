/* Matte OS · Debattspelet – spellogik (ren, utan DOM, testbar i Node). */
(function(root,factory){var C=root.MO_DEBATE_CONTENT||(typeof require==='function'?require('./debatt-content.js'):null);var o=factory(C);if(typeof module==='object'&&module.exports)module.exports=o;root.MO_DEBATE=o;})(typeof window!=='undefined'?window:globalThis,function(C){
'use strict';
var JOKERS_PER_PLAYER=2,STORE='matteos.debatt.v1',SAVE='matteos.debatt.save.v1';
var SKILL_KEYS=['reason','example','rebut','ask','close','concede','perspective','fact'];
function hash(s){var h=2166136261>>>0;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rnd(g){var x=hash(g.seed+':'+g.n);g.n++;x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;}
function pick(g,arr){return arr[Math.floor(rnd(g)*arr.length)];}
function other(p){return p==='A'?'B':'A';}
function topicOf(g){return C.topics[g.lang].filter(function(t){return t.id===g.topicId;})[0]||C.topics[g.lang][0];}
function roundDefs(g){var all=C.rounds[g.lang];return g.length===3?[all[0],all[2],all[4]]:all.slice();}
function sideOf(g,p){return g.sides[p];}
function newGame(o){
 o=o||{};var lang=C.langs.indexOf(o.lang)>=0?o.lang:'sv',tl=C.topics[lang],topic=tl.filter(function(t){return t.id===o.topicId;})[0]||tl[0];
 var g={v:1,lang:lang,mode:o.mode==='solo'?'solo':'duo',topicId:topic.id,length:o.length===3?3:5,names:{A:String(o.names&&o.names.A||'').slice(0,20),B:String(o.names&&o.names.B||'').slice(0,20)},
  seed:String(o.seed||Date.now()),n:0,sides:{A:'for',B:'against'},round:0,player:'A',phase:'speak',jokers:{A:JOKERS_PER_PLAYER,B:JOKERS_PER_PLAYER},
  deck:[],used:{},cur:null,override:null,voice:null,fact:null,log:[],stars:{A:0,B:0},swaps:0,done:false,idea:{A:0,B:0},argIdx:{A:0,B:0},starAsked:false,oppIdx:0};
 if(o.coin)g.sides={A:'against',B:'for'};
 if(o.sides&&o.sides.A)g.sides={A:o.sides.A==='against'?'against':'for',B:o.sides.A==='against'?'for':'against'};
 return g;
}
function currentRound(g){return roundDefs(g)[Math.min(g.round,roundDefs(g).length-1)];}
/* Uppgiften just nu: jokern kan lägga till eller ersätta. */
function task(g){
 var r=currentRound(g),ov=g.override&&g.override.round===g.round?g.override:null,extra=null;
 if(ov&&(ov.scope==='both'||(ov.scope==='me'&&ov.player===g.player)||(ov.scope==='opp'&&ov.player!==g.player)))extra=ov.text;
 var voice=g.voice&&g.voice.round===g.round?g.voice.text:null;
 return {id:r.id,title:r.title,task:r.task,starter:r.starter,skill:r.skill,extra:extra,voice:voice,joker:ov?ov.cardId:null};
}
/* Matchens kortlek av jokrar, utan upprepning tills leken är slut och aldrig samma kort två gånger i rad. */
function drawJoker(g,who){
 if(g.done||!g.jokers||g.jokers[who]<=0)return null;
 var all=C.jokers[g.lang];if(!g.deck.length){var ids=all.map(function(j){return j.id;}),k=ids.length;for(var i=k-1;i>0;i--){var j=Math.floor(rnd(g)*(i+1)),t=ids[i];ids[i]=ids[j];ids[j]=t;}
  if(g.cur&&ids[ids.length-1]===g.cur.id&&ids.length>1){var s=ids.pop();ids.unshift(s);}g.deck=ids;}
 var id=g.deck.pop(),card=all.filter(function(c){return c.id===id;})[0];g.jokers[who]--;
 var text=card.text;
 if(card.effect==='swap'){var flip=function(x){return x==='for'?'against':'for';};g.sides={A:flip(g.sides.A),B:flip(g.sides.B)};g.swaps++;}
 if(card.effect==='voice'){var v=pick(g,C.voices[g.lang]);g.voice={round:g.round,text:v};text=text.replace('{who}',v);}
 if(card.effect==='fact'){var f=pick(g,topicOf(g).facts);g.fact={t:f.t,k:f.k,done:false,round:g.round};}
  var scope=card.scope;
 if(g.mode==='solo'&&scope==='opp'){scope='me';var q=pick(g,topicOf(g).asks);text=(g.lang==='sv'?'Motspelaren frågar: ”':'The Opponent asks: “')+q+(g.lang==='sv'?'”':'”');}
 if(card.effect==='task'||card.effect==='fact'||card.effect==='voice'||card.effect==='swap'){g.override={round:g.round,scope:scope,player:who,text:text,cardId:card.id,skill:card.skill};}
 g.cur={id:card.id,icon:card.icon,title:card.title,text:text,effect:card.effect,scope:scope,skill:card.skill,by:who,round:g.round};
 return g.cur;
}
function resolveFact(g,kind){if(!g.fact||g.fact.done)return null;g.fact.done=true;g.fact.answer=kind;g.fact.right=kind===g.fact.k;return g.fact.right;}
/* Ledtrådar: nivå 1 startfras, nivå 2 argumentkort för din sida, nivå 3 bemötandemönster. Aldrig facit. */
function idea(g,p,level){
 var r=currentRound(g),t=topicOf(g);
 if(level===1)return {kind:'starter',text:r.starter};
 if(level===2){var side=sideOf(g,p),list=side==='for'?t.pro:t.con,i=g.argIdx[p]%list.length;g.argIdx[p]++;return {kind:'arg',text:list[i],side:side};}
 var pat=C.rebuttals[g.lang],j=(g.idea[p]++)%pat.length;return {kind:'pattern',head:pat[j].h,text:pat[j].t};
}
/* Solo: motspelarens kort kommer från motsatt sida. */
function opponentCard(g){
 var t=topicOf(g),opp=g.sides.A==='for'?'against':'for',list=opp==='for'?t.pro:t.con;
 return {text:list[(g.round+g.swaps)%list.length],side:opp};
}
/* Chips som lyssnaren kan bocka av efter en tur. */
function chipsFor(g){
 var r=currentRound(g),ov=g.override&&g.override.round===g.round?g.override:null,out=[r.skill,'reason','example','rebut','ask'];
 if(ov&&ov.skill)out.push(ov.skill);
 if(g.voice&&g.voice.round===g.round)out.push('perspective');
 var seen={},res=[];out.forEach(function(k){if(!seen[k]&&SKILL_KEYS.indexOf(k)>=0){seen[k]=1;res.push(k);}});return res;
}
function submitTurn(g,heard){
 if(g.done)return g;
 var ok=(heard||[]).filter(function(k){return SKILL_KEYS.indexOf(k)>=0;}).filter(function(k,i,a){return a.indexOf(k)===i;});
 g.log.push({round:g.round,player:g.player,side:sideOf(g,g.player),skills:ok});
 g.override=g.override&&g.override.round===g.round&&g.override.scope==='me'&&g.override.player===g.player?null:g.override;
 return advance(g);
}
function advance(g){
 var duo=g.mode==='duo';
 if(duo&&g.player==='A'){g.player='B';g.phase='speak';return g;}
 if(!duo||g.player==='B'){
  /* rundan är klar: be om stjärna i duo, annars gå vidare */
  g.phase=duo&&!g.starAsked?'star':'speak';
  if(g.phase==='star'){g.starAsked=true;return g;}
 }
 return nextRound(g);
}
function nextRound(g){
 g.starAsked=false;g.round++;g.player='A';g.phase='speak';g.override=null;g.voice=null;g.fact=null;
 if(g.round>=roundDefs(g).length){g.done=true;g.phase='end';}
 return g;
}
function giveStar(g,to){if(g.phase!=='star')return g;if(to==='A'||to==='B')g.stars[to]++;return nextRound(g);}
function summary(g){
 var s={A:{},B:{}};g.log.forEach(function(e){e.skills.forEach(function(k){s[e.player][k]=(s[e.player][k]||0)+1;});});
 return {skills:s,stars:g.stars,turns:g.log.length,swaps:g.swaps,topic:g.topicId};
}
/* Lagring av framsteg: bara antal, aldrig text. Nyckel = profil. */
function emptyProgress(){return {v:1,profiles:{}};}
function sanitizeProgress(p){var out=emptyProgress();if(!p||p.v!==1||typeof p.profiles!=='object'||!p.profiles)return out;
 Object.keys(p.profiles).slice(0,12).forEach(function(k){if(!/^[a-z0-9_-]{1,40}$/i.test(k))return;var e=p.profiles[k]||{},sk={};SKILL_KEYS.forEach(function(s){var n=Number(e.skills&&e.skills[s]);if(n>0)sk[s]=Math.min(9999,Math.floor(n));});
  var games=Math.min(9999,Math.max(0,Math.floor(Number(e.games)||0))),topics={};Object.keys(e.topics||{}).slice(0,60).forEach(function(t){if(/^[a-z0-9-]{1,20}$/.test(t))topics[t]=Math.min(999,Math.max(0,Math.floor(Number(e.topics[t])||0)));});
  out.profiles[k]={skills:sk,games:games,topics:topics};});return out;}
function applyGame(p,key,g,players){
 p=sanitizeProgress(p);if(!/^[a-z0-9_-]{1,40}$/i.test(key))key='guest';var e=p.profiles[key]||(p.profiles[key]={skills:{},games:0,topics:{}}),sm=summary(g).skills;
 (players||['A']).forEach(function(pl){Object.keys(sm[pl]||{}).forEach(function(k){e.skills[k]=Math.min(9999,(e.skills[k]||0)+sm[pl][k]);});});
 e.games=Math.min(9999,e.games+1);e.topics[g.topicId]=Math.min(999,(e.topics[g.topicId]||0)+1);return p;
}
/* Sparad match (paus). */
function sanitizeGame(o){
 if(!o||o.v!==1||C.langs.indexOf(o.lang)<0)return null;
 var t=C.topics[o.lang].filter(function(x){return x.id===o.topicId;})[0];if(!t)return null;
 var g=newGame({lang:o.lang,mode:o.mode,topicId:o.topicId,length:o.length,names:o.names,seed:o.seed});
 g.n=Math.max(0,Math.min(9999,Math.floor(Number(o.n)||0)));g.sides={A:o.sides&&o.sides.A==='against'?'against':'for',B:o.sides&&o.sides.B==='for'?'for':'against'};if(g.sides.A===g.sides.B)g.sides={A:'for',B:'against'};
 g.round=Math.max(0,Math.min(roundDefs(g).length,Math.floor(Number(o.round)||0)));g.player=o.player==='B'?'B':'A';g.phase=['speak','star','end'].indexOf(o.phase)>=0?o.phase:'speak';
 g.jokers={A:Math.max(0,Math.min(JOKERS_PER_PLAYER,Math.floor(Number(o.jokers&&o.jokers.A)))),B:Math.max(0,Math.min(JOKERS_PER_PLAYER,Math.floor(Number(o.jokers&&o.jokers.B))))};
 if(!isFinite(g.jokers.A))g.jokers.A=JOKERS_PER_PLAYER;if(!isFinite(g.jokers.B))g.jokers.B=JOKERS_PER_PLAYER;
 g.stars={A:Math.max(0,Math.min(99,Math.floor(Number(o.stars&&o.stars.A)||0))),B:Math.max(0,Math.min(99,Math.floor(Number(o.stars&&o.stars.B)||0)))};
 g.swaps=Math.max(0,Math.min(99,Math.floor(Number(o.swaps)||0)));g.starAsked=!!o.starAsked;
 g.log=(Array.isArray(o.log)?o.log:[]).slice(0,40).map(function(e){return {round:Math.floor(Number(e.round)||0),player:e.player==='B'?'B':'A',side:e.side==='against'?'against':'for',skills:(Array.isArray(e.skills)?e.skills:[]).filter(function(k){return SKILL_KEYS.indexOf(k)>=0;})};});
 g.deck=(Array.isArray(o.deck)?o.deck:[]).filter(function(id){return C.jokers[o.lang].some(function(j){return j.id===id;});});
 g.done=g.round>=roundDefs(g).length;if(g.done)g.phase='end';
 return g;
}
function profileKey(storage){try{var a=JSON.parse(storage.getItem('matteos.v5'));return a&&(a.active==='grade8'||a.active==='grade9')?a.active:'guest';}catch(e){return 'guest';}}
return {STORE:STORE,SAVE:SAVE,SKILL_KEYS:SKILL_KEYS,JOKERS_PER_PLAYER:JOKERS_PER_PLAYER,newGame:newGame,topicOf:topicOf,roundDefs:roundDefs,currentRound:currentRound,task:task,drawJoker:drawJoker,resolveFact:resolveFact,idea:idea,opponentCard:opponentCard,chipsFor:chipsFor,submitTurn:submitTurn,giveStar:giveStar,summary:summary,
 emptyProgress:emptyProgress,sanitizeProgress:sanitizeProgress,applyGame:applyGame,sanitizeGame:sanitizeGame,profileKey:profileKey,other:other,hash:hash};
});
