'use strict';
/* Topic-specific full examples + reduced-click learner flows, synthetic only. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../lara/speaking-lab-content.js'),C=require('../lara/speaking-lab-core.js'),EX=require('../lara/speaking-lab-examples.js');
let count=0;function ok(test,label){assert.ok(test,label);count++;}
ok(D.official===false,'no claim that cards are a national exam');
ok(D.topics.length===49,'all original speaking topics remain');
ok(new Set(D.topics.map(x=>x.id)).size===49,'unique topics');
ok(Object.keys(EX.cards).length===49,'49 topic-specific sets of examples');
let corpus=[];
for(const t of D.topics){
 const answers=EX.cards[t.id];
 ok(Array.isArray(answers)&&answers.length===2,'two complete answers for '+t.id);
 for(let v=0;v<2;v++){
  const x=answers[v];ok(Array.isArray(x)&&x.length===4,'PACE structure for '+t.id+' answer '+v);
  for(const [i,p] of x.entries())ok(p.length>=20&&!p.includes('...')&&!p.includes('TBD'),'concrete sentence, '+t.id+', '+v+', '+i);
  ok(/[.?!]$/.test(x[3]),'engagement turn ends with punctuation, '+t.id);
  ok(x.join(' ').split(/\s+/).length>=30,'answer models sufficient detail for '+t.id);
  corpus.push(x.join(' '));
 }
}
ok(new Set(corpus).size===98,'every model answer is distinct');
ok(D.topics.some(x=>x.id==='crime')&&D.topics.some(x=>x.id==='moneychoice'),'concrete crime and money guides');
const s=C.make({mode:'pair',seed:'qa'});
ok(C.card(s)?.prompt.endsWith('?'),'a live question is returned immediately');
let two=C.advance(C.advance(s));ok(two.stage==='card'&&two.turn===1,'same card second speaker');
ok(C.participants('solo')===1&&C.participants('pair')===2&&C.participants('group')===4,'solo and group available');
ok(C.safe({...s,deck:['invalid']})===null,'hostile deck rejected');
const app=fs.readFileSync('lara/speaking-lab-simple.js','utf8');
const page=fs.readFileSync('lara/speaking-lab.html','utf8');
const style=fs.readFileSync('lara/speaking-lab-simple.css','utf8');
const sw=fs.readFileSync('lara/sw.js','utf8');
for(const item of ['speaking-lab-simple.js','speaking-lab-examples.js','speaking-lab-simple.css'])ok(page.includes(item),'new view asset wired: '+item);
ok(page.includes('speaking-lab-content.js')&&page.includes('speaking-lab-core.js'),'preserve content and proven rules');
ok(!page.includes('src="./speaking-lab.js?'),'old complex view not executed');
for(const item of ['speaking-lab-simple.js','speaking-lab-examples.js','speaking-lab-simple.css'])ok(sw.includes(item),'PWA precaches '+item);
for(const old of ['getUserMedia','MediaRecorder','SpeechRecognition','webkitSpeechRecognition','XMLHttpRequest','sendBeacon','fetch(','localStorage.setItem("student"'])ok(!app.includes(old),'no microphone or remote answer transfer: '+old);
ok(app.includes('sessionStorage')&&app.includes('C.save'),'only the card/turn stored temporarily');
ok(!app.includes('textarea')&&!app.includes('input type="text"'),'no mandatory typing');
ok(app.includes('Två riktiga exempelsvar')&&app.includes('Bygg ett eget svar'),'prominent examples and builder');
ok(app.includes('Nästa person')&&app.includes('Nytt ämne'),'minimal interaction');
ok(app.includes('Du är här: Engelska'),'simple place indicator');
ok(!app.includes("screen='home'"),'no setup wizard or pre-start screen');
ok(style.includes('@media(max-width:390px)')&&style.includes('focus-visible'),'mobile responsive and keyboard focus');
console.log('SPEAKING LAB SIMPLIFIED QA '+count+'/'+count+' PASS · '+D.topics.length+' topics · '+corpus.length+' complete examples');
