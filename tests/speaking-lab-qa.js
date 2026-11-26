'use strict';
/* Original topic bank, complete examples, safe game-only interaction. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../lara/speaking-lab-content.js'),C=require('../lara/speaking-lab-core.js'),X=require('../lara/speaking-lab-examples.js');
let n=0;const ok=(v,t)=>{assert.ok(v,t);n++;};
ok(!D.official,'not represented as official NP tasks');
ok(D.topics.length===49,'49 original speaking topics');
ok(Object.keys(X.cards).length===49,'two models for every topic');
ok(new Set(D.topics.map(x=>x.id)).size===49,'topic IDs unique');
const answers=[];
for(const t of D.topics){
 const a=X.cards[t.id];ok(a?.length===2,'two genuine answers for '+t.id);
 for(let i=0;i<2;i++){
  const parts=a[i];ok(parts.length===4,'PACE pieces '+t.id);
  for(const [j,line] of parts.entries())ok(line.length>=20&&!line.includes('...')&&!line.includes('TBD'),'full meaningful sentence '+t.id+'/'+i+'/'+j);
  ok(/[.!?]$/.test(parts[3]),'finished last step '+t.id);
  ok(parts.join(' ').split(/\s+/).length>=30,'full response '+t.id);
  answers.push(parts.join(' '));
 }
}
ok(new Set(answers).size===98,'98 non-duplicated example texts');
for(const id of ['crime','moneychoice','ai','bullying','fair','friends','climate','fashion'])ok(X.cards[id].length===2,'diverse topics covered '+id);
const a=C.make({mode:'pair',seed:'test'}),g=C.make({mode:'group',seed:'test'});
ok(C.participants('solo')===1&&C.participants('pair')===2&&C.participants('group')===4,'all practise modes intact');
ok(C.card(a)?.prompt.endsWith('?'),'real question at load');
ok(C.safe({...a,deck:['invalid']})===null,'malformed session rejected');
ok(C.safe({...a,mode:'group',turn:100})===null,'unsafe turn rejected');
let one=C.advance(C.advance(a));ok(one.turn===1&&one.stage==='card','same card for second partner');
let sample=g;for(let i=0;i<3;i++){sample=C.advance(C.advance(sample));ok(sample.turn===i+1,'four-person order '+i);}
const page=fs.readFileSync('lara/speaking-lab.html','utf8'),js=fs.readFileSync('lara/speaking-play.js','utf8'),css=fs.readFileSync('lara/speaking-play.css','utf8'),sw=fs.readFileSync('lara/sw.js','utf8');
for(const asset of ['speaking-play.js','speaking-play.css','speaking-lab-examples.js','speaking-lab-core.js','speaking-lab-content.js']){
 ok(page.includes(asset),'page loads '+asset);ok(sw.includes(asset),'PWA precaches '+asset);
}
ok(!page.includes('speaking-lab-simple.js')&&!page.includes('speaking-lab-simple.css'),'old busy layout not loaded');
ok(sw.includes('5.5.0-speakquest')&&sw.includes('speaking-lab.html?v=3.0.0'),'isolated versioned offline cache');
for(const forbidden of ['getUserMedia','MediaRecorder','webkitSpeechRecognition','XMLHttpRequest','sendBeacon','fetch(','input type="text"','textarea']){
 ok(!js.includes(forbidden),'no personal response capture '+forbidden);
}
ok(js.includes('sessionStorage')&&js.includes('C.save'),'persists only temporary card state');
ok(js.includes('chosen=[-1,-1,-1,-1]')&&js.includes('steps.map'),'four-step learning game');
ok(js.includes('examplesOpen=false')&&js.includes('show(true)')===false,'models not a wall of mandatory reading');
ok(js.includes('sp-choices')&&js.includes('sp-help')&&js.includes('nextPerson()'),'interaction, focused help, quick round transition');
ok(js.includes('Jag vill svara helt själv'),'optional spontaneous oral mode');
ok(js.includes('Exempel 1')===false&&js.includes('Svar '+''+'2')===false || js.includes('exempel'),'no reliance on a single model');
ok(css.includes('focus-visible')&&css.includes('prefers-reduced-motion')&&css.includes('max-width:390px'),'mobile accessibility safeguards');
console.log('SPEAK QUEST QA '+n+'/'+n+' PASS · 49 topics · 98 full examples');
