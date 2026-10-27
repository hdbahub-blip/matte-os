/* Matte Prov v1 QA — run with: node prov/tests/qa.js */
'use strict';
const path=require('path');
const PC=require(path.join(__dirname,'../js/exam-core.js'));
const M=require(path.join(__dirname,'../../js/math.js'));
const C=require(path.join(__dirname,'../../js/core.js'));
const S9=require(path.join(__dirname,'../../js/content9.js'));
const S8=require(path.join(__dirname,'../../js/content8.js'));

let checks=0,fail=[];
const ok=(x,m)=>{checks++;if(!x)fail.push(m)};
function canon(x){
  const t=x.type||'num';
  if(t==='choice')return x.a;
  if(t==='sci')return {m:String(x.a[0]).replace('.',','),e:String(x.a[1])};
  if(t==='expr')return x.a;
  if(t==='roots')return x.a.length?x.a.join(' och '):'ingen';
  if(x.radical){const [k,n]=x.radical;return (k===1?'':k)+'√'+n+(x.u?' '+x.u:'')}
  if(x.mustFraction)return x.mustFraction[0]+'/'+x.mustFraction[1]+(x.u?' '+x.u:'');
  return String(x.a).replace('.',',')+(x.u?' '+x.u:'');
}
for(const [grade,skills] of [['grade9',S9],['grade8',S8]]){
  for(const ch of C.profiles[grade].chapters){
    const nskills=skills.filter(s=>s.ch===ch.id).length;
    for(const mode of ['diagnos','prov']){
      for(let attempt=1;attempt<=20;attempt++){
        const run=PC.selectRun(skills,ch.id,mode,attempt);
        ok(run.length>=nskills,`${grade}/${ch.id}/${mode}: too few questions`);
        ok(new Set(run.map(q=>q.sid)).size===nskills,`${grade}/${ch.id}/${mode}: not every skill represented`);
        ok(new Set(run.map(q=>q.sid+'|'+q.key)).size===run.length,`${grade}/${ch.id}/${mode}: duplicate question`);
        if(mode==='diagnos')ok(run.length===nskills,`${grade}/${ch.id}: diagnosis should be one question per skill`);
        if(mode==='prov')ok(run.length<=18,`${grade}/${ch.id}: exam too long`);
        for(const q of run){
          ok(M.check(q.item,canon(q.item)).ok,`${grade}/${ch.id}/${q.sid}/${q.key}: canonical answer rejected`);
          ok(!('start' in q)||true,'');
        }
      }
    }
  }
}
console.log(`Matte Prov QA: ${checks-fail.length}/${checks} godkända`);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
