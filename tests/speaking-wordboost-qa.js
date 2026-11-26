'use strict';
/* Original vocabulary coverage, PACE pedagogy, safe UI and offline resource regression. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const D=require('../lara/speaking-lab-content.js');
const W=require('../lara/speaking-wordbank.js');
let n=0;const ok=(yes,why)=>{assert.ok(yes,why);n++};
const read=x=>fs.readFileSync(x,'utf8');
ok(W.topicCount===49,'all 49 original speaking topics');
ok(D.topics.length===49,'original topics unchanged');
ok(Object.keys(W.byTopic).length===49,'no phantom topic ids');
ok(W.stages.length===4,'exact PACE stages');
ok(W.connectors.length===4,'exact conversational stage starters');
let count=0;const allExamples=[];
for(const topic of D.topics){
 const stages=W.byTopic[topic.id];
 ok(!!stages,'complete original topic '+topic.id);
 ok(stages?.length===4,'four real PACE stages '+topic.id);
 ok(stages[0].length===2&&stages[1].length===2&&stages[2].length===1&&stages[3].length===1,'balanced 2/2/1/1 scaffolding '+topic.id);
 const terms=new Set();
 for(const [stageIndex,items] of stages.entries()){
  ok(W.forStep(topic.id,stageIndex)===items,'same exact stage by lookup '+topic.id+' '+stageIndex);
  for(const entry of items){
   count++;
   ok(entry.term.length>=3&&entry.term.length<=35,'short meaningful term '+topic.id);
   ok(entry.meaning.length>=15&&entry.meaning.length<155,'plain English definition '+topic.id+' '+entry.term);
   ok(entry.example.length>=24&&entry.example.length<190,'natural complete example '+topic.id+' '+entry.term);
   ok(/[.!?]$/.test(entry.example),'full spoken example '+topic.id+' '+entry.term);
   ok(!/[<>|]/.test(entry.term+entry.meaning+entry.example),'no HTML or broken delimiters '+topic.id+' '+entry.term);
   ok(!/\b(TBD|TODO|dummy|placeholder)\b|\.\.\./i.test(entry.example+entry.meaning),'real authored practice '+topic.id+' '+entry.term);
   ok(!/[åäöÅÄÖ]/.test(entry.term+entry.meaning+entry.example),'English-only vocabulary '+topic.id+' '+entry.term);
   ok(!terms.has(entry.term.toLowerCase()),'no repeated term on same card '+topic.id+' '+entry.term);
   terms.add(entry.term.toLowerCase());
   allExamples.push(entry.example);
  }
 }
 ok(W.allFor(topic.id).length===6,'six terms per original prompt '+topic.id);
}
ok(count===294,'294 topic-linked original word examples');
ok(new Set(allExamples).size===294,'294 distinct contextual examples');
ok(W.forStep('ai',0).some(x=>x.term==='AI assistant'),'current AI vocabulary');
ok(W.forStep('ai',2).some(x=>x.term==='fact-check'),'AI information evaluation');
ok(W.forStep('news',0).some(x=>x.term==='misinformation'),'digital news literacy');
ok(W.forStep('privacy',0).some(x=>x.term==='digital footprint'),'privacy vocabulary');
ok(W.forStep('fair',0).some(x=>x.term==='equity'),'clear fairness distinctions');
ok(W.forStep('crime',0).some(x=>x.term==='prevention'),'social topic relevance');
ok(W.forStep('climate',0).some(x=>x.term==='carbon footprint'),'climate vocabulary');
ok(W.forStep('fashion',2).some(x=>x.term==='second-hand outfit'),'accessible everyday vocabulary');
ok(W.forStep('not-a-topic',0).length===0,'safe unknown topic');
const player=read('lara/speaking-play.js'),html=read('lara/speaking-lab.html'),sw=read('lara/sw.js'),css=read('lara/speaking-wordboost.css');
ok(html.includes('<html lang="en">'),'English context preserved');
ok(html.indexOf('speaking-wordbank.js')<html.indexOf('speaking-play.js'),'words load before player code');
for(const asset of ['speaking-wordbank.js?v=1.0.0','speaking-wordboost.css?v=1.0.0']){
 ok(html.includes(asset),'new asset actually loaded: '+asset);
 ok(sw.includes(asset),'new asset precached for offline: '+asset);
}
ok(sw.includes('5.7.0-pace-words'),'separate learning cache bumped');
ok(html.includes('speaking-play.js?v=3.2.0-pace-words'),'correct new interactive player version');
for(const ui of ['wordBoostOpen','sp-wordboost-trigger','sp-wordboost-item','word-speak','word-boost','W.forStep','W.connectors'])ok(player.includes(ui),'contextual in-round vocabulary: '+ui);
for(const forbidden of ['getUserMedia','MediaRecorder','webkitSpeechRecognition','XMLHttpRequest','sendBeacon','fetch('])ok(!player.includes(forbidden),'no speech or response recording '+forbidden);
for(const forbidden of ['fetch(','XMLHttpRequest','localStorage','sessionStorage','getUserMedia','MediaRecorder'])ok(!read('lara/speaking-wordbank.js').includes(forbidden),'vocabulary data never collects or sends data '+forbidden);
ok(css.includes('focus-visible')&&css.includes('prefers-reduced-motion'),'keyboard and reduced-motion support');
console.log('SPEAK WORD BOOST CONTENT '+n+'/'+n+' PASS · 49 topics · 294 original examples · 4 PACE stages');
