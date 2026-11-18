'use strict';
/* Read-only regression for original Nov 2026 anthology. No accounts, network or student data. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const R=require('../lara/texts-immersive-20261116.js');
const SV=require('../lara/texts-sv.js'),EN=require('../lara/texts-en.js');
const W=require('../lara/sprak.js'),X=W._test;
const root=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
let checks=0;
const ok=(condition,message)=>{checks++;assert.ok(condition,message)};
ok(R.sv.length===7&&R.en.length===4,'seven Swedish + four English originals');
const expected={sv:{1:4,2:3},en:{1:2,2:2}};
for(const lang of ['sv','en'])for(const level of [1,2])
 ok(R[lang].filter(t=>t.level===level).length===expected[lang][level],lang+' level '+level+' distribution');
const all=[...R.sv,...R.en],ids=new Set();
ok(SV.length===18&&EN.length===15,'preserve 11 old readings in each language');
ok(W.audit().texts===33,'exactly 33 readings after anthology');
ok(W.audit().perLang.sv===18&&W.audit().perLang.en===15,'language isolation');
for(const t of all){
 const key=t.lang+':'+t.id,passage=t.paragraphs.join(' ');
 ok(!ids.has(key),'unique new id '+key);ids.add(key);
 ok(t.version===1&&t.collection===undefined,'immutable source metadata '+key);
 ok([1,2].includes(t.level)&&t.title&&t.lead&&t.purpose&&t.genre,'metadata '+key);
 ok(passage.split(/\s+/).length>=(t.level===1?170:280),'min reading length '+key);
 ok(t.tasks.length===8,'eight varied questions '+key);
 const qtypes=new Set(t.tasks.map(q=>q.type));
 for(const type of ['choice','evidence','open','cloze','order'])ok(qtypes.has(type),'question type '+type+' '+key);
 ok(t.glossary?.length>=3&&t.talk?.prompt&&t.talk?.follow,'language + discussion support '+key);
 const sentences=X.sentenceList(t),qIds=new Set();
 for(const q of t.tasks){
  ok(!qIds.has(q.id),'unique question '+key+':'+q.id);qIds.add(q.id);
  ok(!!X.SKILLS[q.skill],'known skill '+key+':'+q.id);
  if(q.type==='choice'){
   ok(q.options.length>=3&&q.options.length<=4,'choice shape '+key+':'+q.id);
   ok(new Set(q.options.map(X.norm)).size===q.options.length,'distinct options '+key+':'+q.id);
   ok(q.why?.length>=25,'pedagogical feedback '+key+':'+q.id);
   if(q.evidence)ok(passage.split(q.evidence).length===2,'unambiguous quoted evidence '+key+':'+q.id);
  }else if(q.type==='evidence'){
   for(const target of q.targets)ok(sentences.filter(s=>s.s.includes(target)).length===1,'one sentence matches evidence '+key+':'+q.id);
  }else if(q.type==='cloze'){
   ok(q.sentence.split('___').length===2&&q.accept.includes(q.options[0]),'cloze '+key+':'+q.id);
  }else if(q.type==='order'){
   ok(q.items.length>=4,'event sequence '+key+':'+q.id);
  }else if(q.type==='open'){
   ok(q.criteria.length>=3&&q.model.length>=60,'graded self-assessment '+key+':'+q.id);
  }
 }
 const loaded=X.BANK.filter(x=>x.lang===t.lang&&x.id===t.id);
 ok(loaded.length===1,'one runtime copy (no duplicated story) '+key);
}
const html=root('lara/index.html'),childSW=root('lara/sw.js'),rootSW=root('sw.js');
for(const [name,body] of [['HTML',html],['learning SW',childSW],['root SW',rootSW]]){
 const found=(body.match(/texts-immersive-20261116\.js/g)||[]).length;
 ok(found===1,name+' includes anthology exactly once');
}
ok(html.indexOf('texts-immersive-20261116.js')<html.indexOf('texts-sv.js'),'new bank available before language aggregation');
ok(childSW.includes('5.2.0-account-offline')&&rootSW.includes('6.9.4-20261118-account-offline'),'both PWA caches versioned');
ok(root('lara/sprak.js').includes('NEW_READINGS'),'new texts visibly discoverable');
console.log('Immersive reading anthology regression PASS: '+checks+' checks, 11 original texts, 88 new tasks.');
