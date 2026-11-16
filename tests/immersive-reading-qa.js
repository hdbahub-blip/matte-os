'use strict';
// Acceptance of exactly eleven newly authored, levelled reading texts, without replacing old progress.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const bank=require('../lara/texts-immersive-20261116.js');
const SV=require('../lara/texts-sv.js'),EN=require('../lara/texts-en.js');
const W=require('../lara/sprak.js'),X=W._test;
const all=[...bank.sv,...bank.en];
assert.deepEqual([bank.sv.length,bank.en.length],[7,4]);
assert.deepEqual([bank.sv.filter(t=>t.level===1).length,bank.sv.filter(t=>t.level===2).length,bank.en.filter(t=>t.level===1).length,bank.en.filter(t=>t.level===2).length],[4,3,2,2]);
assert.equal(new Set(all.map(t=>t.lang+':'+t.id)).size,11);
let checks=4;
for(const t of all){
 const saved=(t.lang==='sv'?SV:EN).find(x=>x.id===t.id);
 assert.ok(saved,'integrated '+t.id);checks++;
 assert.equal(saved.title,t.title);checks++;
 assert.ok(X.words(t)>=[0,170,280][t.level]);checks++;
 assert.ok(t.paragraphs.length>=4&&t.tasks.length===8);checks++;
 assert.deepEqual([...new Set(t.tasks.map(k=>k.id))].length,8);checks++;
 const types=new Set(t.tasks.map(k=>k.type));
 for(const type of ['choice','evidence','order','cloze','open'])assert.ok(types.has(type),t.id+' '+type);checks+=5;
 assert.ok(t.tasks.some(k=>k.skill==='hitta')&&t.tasks.some(k=>k.skill==='slutsats'));checks++;
 assert.ok(t.tasks.every(k=>k.why||k.type==='open'));checks++;
 for(const k of t.tasks){
  if(k.type==='choice'&&k.evidence){assert.equal(t.paragraphs.join(' ').split(k.evidence).length,2,t.id+' '+k.id+' exact evidence');checks++;}
  if(k.type==='evidence'){for(const q of k.targets){assert.equal(X.sentenceList(t).filter(x=>x.s.includes(q)).length,1,t.id+' '+k.id+' unique evidence sentence');checks++;}}
  if(k.type==='cloze'){assert.ok(k.options[0]===k.accept[0]);checks++;}
  if(k.type==='open'){assert.ok(k.criteria.length>=3&&k.model.length>=60);checks++;}
 }
}
const html=fs.readFileSync(path.join(__dirname,'../lara/index.html'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'../lara/sw.js'),'utf8');
const rootSW=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
for(const s of [html,sw,rootSW]){assert.ok(s.includes('texts-immersive-20261116.js'),'offline/browser bundle');checks++;}
assert.equal(W.audit().texts,SV.length+EN.length);checks++;
assert.ok(SV.length>=19&&EN.length>=16,'all old and new readings present');checks++;
console.log('Immersive reading acceptance '+checks+' checks PASS; 11 original stories, '+all.reduce((n,t)=>n+t.tasks.length,0)+' new reading tasks; 7 SV + 4 EN');
