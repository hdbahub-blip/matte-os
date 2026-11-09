'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const SV=require('../lara/texts-sv.js'),EN=require('../lara/texts-en.js'),W=require('../lara/sprak.js'),O=require('../lara/ordlek.js');
const root=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
let n=0;function check(v,m){assert.ok(v,m);n++}
check(SV.length>=11&&EN.length>=11,'at least 11 reading texts per language');
check(SV.every(t=>t.lang==='sv')&&EN.every(t=>t.lang==='en'),'language isolation');
check(W.audit().tasks>=191,'at least 191 reading comprehension tasks');
check(O._test.WORDS.length>=122,'at least 122 vocabulary items');
for(const lang of ['sv','en'])for(const level of [1,2,3]){
 const ts=W._test.BANK.filter(t=>t.lang===lang&&t.level===level);
 const ws=O._test.WORDS.filter(t=>t.lang===lang&&t.level===level);
 check(ts.length>=3,lang+' level '+level+' has transfer stories');
 check(ws.length>=19,lang+' level '+level+' has enough words');
 for(const t of ts)check(t.tasks.length>=8&&t.tasks.some(q=>q.type==='open')&&t.tasks.some(q=>q.type==='evidence'),t.id+' has varied comprehension');
}
const html=root('lara/index.html'),sw=root('lara/sw.js');
for(const s of ['texts-extra-sv.js','texts-extra-en.js','words-extra.js','atelier.css']){check(html.includes(s),'HTML loads '+s);check(sw.includes(s),'offline retains '+s);}
check(!root('lara/sprak.js').includes('Math.random'),'assessment order stays deterministic');
check(root('lara/ordlek.js').includes('chosenLevel'),'vocabulary selection uses three levels');
check(root('lara/sprak.js').includes('data-a="jump-level"'),'one-tap difficulty navigation in reading library');
check(root('lara/app.js').includes("'jump-level':b=>"),'difficulty navigation wired to real action');
console.log('ATELIER learning coverage: '+n+'/'+n+' PASS ('+W.audit().texts+' books, '+W.audit().tasks+' tasks, '+O._test.WORDS.length+' words)');
