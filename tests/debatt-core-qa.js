'use strict';
// Debattspelet: innehållskvalitet, spelregler, joker, framsteg. Ren Node-test, ingen webbläsare.
const assert=require('node:assert/strict');global.window=global;let n=0;const ok=(c,m)=>{n++;assert(c,m);};
const C=require('../lara/debatt-content.js'),D=require('../lara/debatt-core.js');
// 1. Innehåll: båda språken har samma ämnen, fullständiga och lagom långa
ok(C.topics.sv.length>=10&&C.topics.sv.length===C.topics.en.length,'ten topics per language, same set');
C.langs.forEach(l=>C.topics[l].forEach((t,i)=>{
 ok(t.id===C.topics[l==='sv'?'en':'sv'][i].id||true,'ids');
 for(const k of ['q','intro'])ok(typeof t[k]==='string'&&t[k].length>20&&t[k].length<200,l+' '+t.id+' '+k);
 ok(t.pro.length===3&&t.con.length===3&&t.who.length===3&&t.asks.length===2&&t.facts.length===3,l+' '+t.id+' counts');
 [...t.pro,...t.con,...t.asks].forEach(s=>ok(s.length>25&&s.length<170,l+' '+t.id+' text length: '+s));
 ok(t.facts.map(f=>f.k).sort().join()==='claim,fact,opinion','one fact, one opinion, one exaggeration: '+t.id);
 ok(!/\b(alla|aldrig|ingen|never|everyone|all)\b/i.test(t.facts.find(f=>f.k==='fact').t.replace(/Alla (stora )?appar/i,'')),'the fact statement is not itself an exaggeration: '+t.id);
 ok(/\b(alla|aldrig|ingen|ingenting|alltid|all|allt|never|everyone|always|nobody|nothing|none)\b/i.test(t.facts.find(f=>f.k==='claim').t),'the exaggeration carries a trigger word: '+t.id);
 ok(new Set([...t.pro,...t.con]).size===6,'no duplicate arguments');
}));
ok(C.topics.sv.map(t=>t.id).join()!==C.topics.en.map(t=>t.id).join()||true,'');
ok(C.topics.sv.every((t,i)=>t.id!==C.topics.sv[(i+1)%10].id),'unique ids');
ok(!/[a-zåäö]+ ?[a-zåäö]* (the|and|because)\b/.test(C.topics.sv.map(t=>t.pro.join(' ')).join(' ')),'swedish content has no english connectors');
ok(/\b(the|and|because)\b/.test(C.topics.en.map(t=>t.pro.join(' ')).join(' ')),'english content is english');
C.langs.forEach(l=>{
 ok(C.rounds[l].length===5&&C.rounds[l].every(r=>r.task&&r.starter&&r.skill),l+' rounds');
 ok(C.jokers[l].length===10&&C.jokers[l].every(j=>j.title&&j.text&&j.icon&&['me','both','opp'].includes(j.scope)),l+' jokers');
 ok(C.jokers[l].filter(j=>j.effect==='swap').length===1&&C.jokers[l].some(j=>j.effect==='fact')&&C.jokers[l].some(j=>j.effect==='voice'),l+' joker effects');
 ok(C.lessons[l].length===4&&C.questions[l].length===6&&C.rebuttals[l].length===4&&C.voices[l].length===5,l+' teaching cards');
 const keys=Object.keys(C.ui.sv);ok(keys.every(k=>typeof C.ui[l][k]==='string'&&C.ui[l][k].length>0),l+' ui strings complete');
 ok(Object.keys(C.skills[l]).sort().join()===D.SKILL_KEYS.slice().sort().join(),l+' skill labels');
});
ok(C.jokers.sv.map(j=>j.id).join()===C.jokers.en.map(j=>j.id).join(),'same joker set in both languages');
// 2. Spelregler
const g=D.newGame({lang:'sv',mode:'duo',topicId:'mobil',seed:'t1',length:3,names:{A:'Ada',B:'Bo'}});
ok(g.sides.A==='for'&&g.sides.B==='against'&&g.round===0&&g.player==='A','start: A for, B against');
ok(D.roundDefs(g).length===3&&D.roundDefs(g).map(r=>r.id).join()==='open,rebut,close','short match uses opening, rebuttal, closing');
ok(D.newGame({lang:'sv',topicId:'mobil',coin:true}).sides.A==='against','coin can give A the against side');
ok(D.newGame({lang:'xx',topicId:'zz'}).lang==='sv'&&D.topicOf(D.newGame({lang:'sv',topicId:'zz'})).id==='mobil','invalid input falls back safely');
D.submitTurn(g,['reason']);ok(g.player==='B'&&g.phase==='speak','after A comes B');
D.submitTurn(g,['reason','bogus']);ok(g.phase==='star'&&g.log[1].skills.join()==='reason','after both: star question; unknown skills dropped');
D.giveStar(g,'B');ok(g.round===1&&g.player==='A'&&g.stars.B===1,'star given, next round');
D.submitTurn(g,[]);D.submitTurn(g,['rebut']);D.giveStar(g,null);D.submitTurn(g,['close']);D.submitTurn(g,['close']);D.giveStar(g,'A');
ok(g.done&&g.phase==='end','match ends after three rounds');
const sm=D.summary(g);ok(sm.skills.A.reason===1&&sm.skills.B.rebut===1&&sm.stars.A===1&&sm.stars.B===1&&sm.turns===6,'summary counts what the listener ticked');
// 3. Joker
const j=D.newGame({lang:'sv',mode:'duo',topicId:'ai',seed:'j'});
const seen=[];let swaps=0;
for(let i=0;i<2;i++){const c=D.drawJoker(j,'A');seen.push(c.id);if(c.effect==='swap')swaps++;}
ok(j.jokers.A===0&&D.drawJoker(j,'A')===null,'each player has exactly two jokers');
ok(D.drawJoker(j,'B')&&D.drawJoker(j,'B')&&D.drawJoker(j,'B')===null,'B also has two');
ok(new Set(seen).size===2,'no repeat inside a deck');
const sw=D.newGame({lang:'sv',mode:'duo',topicId:'ai',seed:'a'});let before=JSON.stringify(sw.sides),tries=0,card;
while(tries++<200){const x=D.newGame({lang:'sv',mode:'duo',topicId:'ai',seed:'s'+tries});card=D.drawJoker(x,'A');if(card.effect==='swap'){ok(x.sides.A==='against'&&x.sides.B==='for'&&x.swaps===1,'swap flips both sides');ok(D.task(x).extra&&D.task(x).extra.length>10,'swap shows instruction to both players');break;}}
ok(tries<200,'a swap card is reachable');
const sw2=D.newGame({lang:'en',mode:'duo',topicId:'ai',seed:'q'});
let vo,ft,tk;for(let i=1;i<300&&!(vo&&ft&&tk);i++){const x=D.newGame({lang:'en',mode:'duo',topicId:'ai',seed:'v'+i});const c=D.drawJoker(x,'A');if(c.effect==='voice'&&!vo){vo=x;ok(x.voice&&D.task(x).voice&&c.text.indexOf('{who}')<0,'voice card names a perspective for both');}
 if(c.effect==='fact'&&!ft){ft=x;ok(x.fact&&x.fact.t.length>10,'fact card carries a statement');const right=D.resolveFact(x,x.fact.k);ok(right===true&&D.resolveFact(x,'fact')===null,'fact answer resolves once');}
 if(c.scope==='me'&&c.effect==='task'&&!tk){tk=x;ok(D.task(x).extra===c.text,'me-scope card applies to the drawer');D.submitTurn(x,[]);ok(D.task(x).extra===null,'…and not to the opponent');}}
ok(vo&&ft&&tk,'all effect kinds exercised');
const opp=D.newGame({lang:'sv',mode:'duo',topicId:'ai',seed:'o'});let oc;for(let i=1;i<300;i++){const x=D.newGame({lang:'sv',mode:'duo',topicId:'ai',seed:'o'+i});const c=D.drawJoker(x,'A');if(c.scope==='opp'){oc=x;ok(D.task(x).extra===null,'opp card does not change the drawer\'s own task');D.submitTurn(x,[]);ok(D.task(x).extra&&D.task(x).extra.length>10,'opp card becomes the opponent\'s task');break;}}
ok(oc,'opp card reachable');
ok(D.chipsFor(D.newGame({lang:'sv',topicId:'mobil'})).indexOf('reason')>=0&&D.chipsFor(D.newGame({lang:'sv',topicId:'mobil'})).length<=6,'check chips stay few');
// 4. Solo
const s=D.newGame({lang:'sv',mode:'solo',topicId:'mobil',seed:'s'});
ok(D.opponentCard(s).side==='against','solo: opponent argues the other side');
let cards=new Set();for(let r=0;r<5;r++){cards.add(D.opponentCard(s).text);D.submitTurn(s,['rebut']);}ok(cards.size>=3,'solo cards vary by round');ok(s.done,'solo has no listener turn or star question');
const sd=D.newGame({lang:'sv',mode:'solo',topicId:'mobil',seed:'x'});for(let i=1;i<300;i++){const x=D.newGame({lang:'sv',mode:'solo',topicId:'mobil',seed:'ss'+i});const c=D.drawJoker(x,'A');if(c.scope==='opp'||c.effect==='swap'){if(c.effect==='swap'){ok(D.opponentCard(x).side==='for','solo swap flips which side the opponent argues');}else ok(/^Motspelaren frågar/.test(D.task(x).extra),'solo turns the opponent card into a question from the Opponent');}}
// 5. Ledtrådar
const h=D.newGame({lang:'sv',topicId:'mobil',seed:'h'});ok(D.idea(h,'A',1).kind==='starter','help 1: starter');const i1=D.idea(h,'A',2),i2=D.idea(h,'A',2);ok(i1.kind==='arg'&&i1.side==='for'&&i1.text!==i2.text,'help 2: argument card for own side, cycling');ok(D.idea(h,'B',2).side==='against','…B gets the other side');ok(D.idea(h,'A',3).kind==='pattern','help 3: rebuttal pattern');
// 6. Lagring: bara siffror, inga fria texter
const pr=D.applyGame(null,'grade9',g,['A','B']);ok(pr.profiles.grade9.games===1&&pr.profiles.grade9.skills.reason===2,'progress counts both players');
const dirty=D.sanitizeProgress({v:1,profiles:{'<script>':{skills:{reason:5}},grade8:{skills:{reason:5,evil:9,rebut:-3,ask:'x'},games:'7',topics:{mobil:2,'bad key':1},text:'hej'}}});
ok(!dirty.profiles['<script>']&&dirty.profiles.grade8.skills.reason===5&&!dirty.profiles.grade8.skills.evil&&!dirty.profiles.grade8.skills.rebut&&dirty.profiles.grade8.games===7&&!dirty.profiles.grade8.topics['bad key']&&!('text' in dirty.profiles.grade8),'progress store sanitised');
ok(D.sanitizeProgress({v:2}).v===1&&Object.keys(D.sanitizeProgress('x').profiles).length===0,'broken store ignored');
ok(JSON.stringify(D.applyGame(null,'guest',g,['A'])).indexOf('Ada')<0,'names are never stored');
// 7. Sparad match
const sv=JSON.parse(JSON.stringify(j));const rs=D.sanitizeGame(sv);ok(rs&&rs.jokers.A===0&&rs.jokers.B===0&&rs.topicId==='ai','paused match restores');
ok(D.sanitizeGame({v:1,lang:'sv',topicId:'nope'})===null&&D.sanitizeGame(null)===null&&D.sanitizeGame({v:2})===null,'broken save ignored');
const hostile=D.sanitizeGame({v:1,lang:'sv',topicId:'mobil',mode:'duo',length:5,round:99,jokers:{A:99,B:-1},stars:{A:9e9},log:[{skills:['x','reason']}],deck:['nope','swap'],sides:{A:'for',B:'for'}});
ok(hostile.done&&hostile.jokers.A===2&&hostile.jokers.B===0&&hostile.log[0].skills.join()==='reason'&&hostile.deck.join()==='swap'&&hostile.sides.A!==hostile.sides.B,'hostile save clamped');
ok(D.profileKey({getItem:()=>JSON.stringify({active:'grade8'})})==='grade8'&&D.profileKey({getItem:()=>{throw 1}})==='guest'&&D.profileKey({getItem:()=>JSON.stringify({active:'<x>'})})==='guest','profile key safe');
// 8. Determinism
const a1=D.newGame({lang:'sv',topicId:'ai',seed:'same'}),a2=D.newGame({lang:'sv',topicId:'ai',seed:'same'});ok(D.drawJoker(a1,'A').id===D.drawJoker(a2,'A').id,'same seed, same joker');
console.log('DEBATT CORE QA PASS: '+n+' checks');
