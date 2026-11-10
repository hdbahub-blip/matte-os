/* Matte OS · Parent Insights v1. Pure read-only rollups from existing on-device records.
   Export includes only bounded attempts, completion flags and test aggregates; never written answers. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.MO_PARENT_MODEL=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const GRADES=['grade8','grade9'],KEY='matteos.parent.v1';
const STORAGE={math:'matteos.v5',learning:'matteos.larande.v1',reading:'matteos.sprak.v3',vocab:'matteos.ordlek.v1',memory:'matteos.knep.v1',exam:'matte-prov-v1'};
const limited=(x,max=999999)=>Math.max(0,Math.min(max,Math.floor(Number(x)||0)));
const time=x=>Number.isFinite(Number(x))&&Number(x)>1600000000000&&Number(x)<Date.now()+86400000?Number(x):0;
const ident=x=>typeof x==='string'&&/^[\p{L}\p{N}_: -]{1,130}$/u.test(x)?x:'';
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const arr=x=>Array.isArray(x)?x:[];
const text=(v,n=80)=>typeof v==='string'?v.slice(0,n):'';
const cnt=x=>Object.keys(obj(x)).length;
const date=t=>new Date(t).toLocaleDateString('sv-SE',{day:'numeric',month:'short'});
const copiedMap=(raw,limit,map)=>{const result=Object.create(null);for(const [k,v] of Object.entries(obj(raw)).slice(0,limit)){const id=ident(k);if(id&&v&&typeof v==='object')result[id]=map(v)}return result;};
function compactModule(section,value,grade){
 if(!value||typeof value!=='object')return null;
 const p=obj(value.profiles?.[grade]);
 switch(section){
 case 'math':{
  const src=value.profiles?p:value;
  return {name:text(src.name,30),
   attempts:arr(src.attempts).slice(-3000).map(a=>({s:ident(a?.s),t:time(a?.t),first:a?.first===true,ok:a?.ok===true,h:limited(a?.h,30),sol:a?.sol===true,m:text(a?.m,20)})).filter(a=>a.s&&a.t),
   lessons:copiedMap(src.lessons,240,x=>({done:x.done===true,step:limited(x.step,50),t:time(x.t)})),
   tests:arr(src.tests).slice(-50).map(t=>({ch:ident(t?.ch),n:limited(t?.n,200),ok:limited(t?.ok,200),t:time(t?.t)})).filter(x=>x.ch&&x.t),
   tables:{facts:copiedMap(src.tables?.facts,100,x=>({attempts:limited(x.attempts,5000),firstCorrect:limited(x.firstCorrect,5000),wrong:limited(x.wrong,5000),score:limited(x.score,500),last:time(x.last)})),
    sessions:arr(src.tables?.sessions).slice(-120).map(x=>({finishedAt:text(x?.finishedAt,40),baseN:limited(x?.baseN,100),correctFirst:limited(x?.correctFirst,100)}))}};
 }
 case 'learning':{
  const src=value.profiles?p:value;
  return {attempts:arr(src.attempts).slice(-1500).map(a=>({lesson:ident(a?.lesson),at:time(a?.at),mode:text(a?.mode,10),ok:a?.ok===true,help:a?.help===true})).filter(a=>a.lesson&&a.at),
   baseline:Object.fromEntries(Object.entries(obj(src.baseline)).slice(0,100).filter(([k,v])=>ident(k)&&typeof v==='boolean'))};
 }
 case 'reading':{
  const src=value.profiles?p:value;
  return {tasks:copiedMap(src.tasks,1500,x=>({at:time(x.at),ok:x.ok===true,lastOk:x.lastOk===true,help:x.help===true,self:limited(x.self,20),n:limited(x.n,99)})),
   texts:copiedMap(src.texts,140,x=>({started:time(x.started),done:time(x.done),pair:limited(x.pair,999)}))};
 }
 case 'vocab':{
  const src=value.profiles?p:value;
  return {attempts:copiedMap(src.attempts,350,x=>({at:time(x.at),n:limited(x.n,999),wrong:limited(x.wrong,999),first:x.first===true,last:x.last===true})),
   rounds:{sv:limited(src.rounds?.sv,9999),en:limited(src.rounds?.en,9999)}};
 }
 case 'memory':{
  const src=value.profiles?p:(value.records||value);
  return {records:copiedMap(src,60,x=>({
   t0:x.t0?{at:time(x.t0.at),ok:x.t0.ok===true}:null,
   t1:x.t1?{at:time(x.t1.at),ok:x.t1.ok===true}:null,
   recall:x.recall?{at:time(x.recall.at),ok:x.recall.ok===true}:null
  }))};
 }
 case 'exam':
  return {attempts:arr(value.attempts).filter(a=>a?.grade===grade||(!value.profiles&&a?.grade===undefined&&value.grade===grade)).slice(-100).map(a=>({grade,chapter:ident(a.chapter),mode:a.mode==='diagnos'?'diagnos':'prov',correct:limited(a.correct,1000),total:limited(a.total,1000),finishedAt:time(a.finishedAt),percent:limited(a.percent,100)})).filter(a=>a.finishedAt&&a.total>0)};
 default:return null;
 }
}
function extract(bundle,grade){
 if(!GRADES.includes(grade))throw Error('Okänd elevprofil.');
 const b=obj(bundle),sections=obj(b.sections),out={v:1,grade,createdAt:new Date().toISOString(),sections:{}};
 for(const section of Object.keys(STORAGE)){
  const v=compactModule(section,sections[section]||b[section],grade);
  if(v)out.sections[section]=v;
 }
 return out;
}
function readLocal(grade,storage){
 if(!GRADES.includes(grade))throw Error('Okänd elevprofil.');
 const raw={},has={};
 for(const [part,key] of Object.entries(STORAGE)){
  try{const s=storage?.getItem(key);has[part]=!!s;if(s)raw[part]=JSON.parse(s);}catch{has[part]=false}
 }
 const report=extract(raw,grade);
 report.local=true;
 report.sections={};
 for(const part of Object.keys(STORAGE)){
  if(!has[part])continue;
  const value=compactModule(part,raw[part],grade);
  if(value)report.sections[part]=value;
 }
 return report;
}
function minimalReport(grade,storage){const report=readLocal(grade,storage);return {app:'matte-os-parent-report',version:1,exported:new Date().toISOString(),grade,sections:report.sections};}
function fromFile(input){
 const x=obj(input);
 if(x.app==='matte-os-parent-report'&&x.version===1&&GRADES.includes(x.grade))return [{grade:x.grade,report:extract(x,x.grade),kind:'samlad elevrapport'}];
 if(x.app==='matte-os'&&x.state?.profiles)return GRADES.map(grade=>({grade,report:extract({math:x.state,memory:x.knep},grade),kind:'Matte OS-säkerhetskopia'}));
 if(x.app==='matte-prov-report'&&x.v===1&&Array.isArray(x.attempts))return GRADES.map(grade=>({grade,report:extract({exam:x},grade),kind:'Provresultat'}));
 if(x.v===1&&x.profiles&&x.sprak&&x.ordlek)return GRADES.map(grade=>({grade,report:extract({learning:x,reading:x.sprak.v3||x.sprak,vocab:x.ordlek},grade),kind:'Lärande-säkerhetskopia'}));
 throw Error('Okänt filformat. Använd Elevrapport, Matematik-, Lärande- eller Prov-säkerhetskopia.');
}
function activity(section,x){
 switch(section){
  case'math':return arr(x.attempts).length+Object.values(obj(x.lessons)).filter(y=>y.step||y.done).length+arr(x.tests).length+arr(x.tables?.sessions).length;
  case'learning':return arr(x.attempts).length+cnt(x.baseline);
  case'reading':return cnt(x.tasks)+cnt(x.texts);
  case'vocab':return cnt(x.attempts)+limited(x.rounds?.sv)+limited(x.rounds?.en);
  case'memory':return cnt(x.records);
  case'exam':return arr(x.attempts).length;
  default:return 0;
 }
}
function hasActivity(r){return Object.entries(obj(r?.sections)).some(([k,v])=>activity(k,v)>0)}
function mergeImported(current,incoming,at){
 if(current?.grade&&current.grade!==incoming.grade)throw Error('Rapporterna tillhör olika årskurser.');
 const out={v:1,grade:incoming.grade,createdAt:at||new Date().toISOString(),sections:{...obj(current?.sections)}};
 const changed=[];
 for(const [k,v] of Object.entries(obj(incoming.sections))){
  if(!Object.keys(STORAGE).includes(k)||!v||activity(k,v)===0)continue;
  out.sections[k]=v;changed.push(k);
 }
 if(!changed.length)throw Error('Filen innehöll inga sparade resultat att lägga till.');
 return {report:out,changed};
}
function mathLevel(attempts){
 if(!attempts.length)return 0;
 const ind=a=>a.first&&!a.h&&!a.sol;
 const solo=attempts.filter(a=>a.m!=='guided'&&a.m!=='v4');
 const first=solo.filter(ind),last=solo.slice(-3),mixed=first.some(a=>a.m==='train'||a.m==='test');
 if(first.length>=4&&last.length===3&&last.every(ind)&&mixed)return 4;
 const recent=solo.slice(-4);
 if(first.length>=2&&recent.length&&recent.filter(ind).length/recent.length>=.5)return 3;
 if(attempts.some(a=>a.ok||a.first))return 2;
 return 1;
}
function studyLevel(attempts,now){
 const correct=attempts.filter(a=>a.ok),solo=correct.filter(a=>!a.help);
 if(!correct.length)return attempts.length?1:0;
 if(!solo.length)return 1;
 const days=[...new Set(solo.map(x=>Math.floor(x.at/86400000)))];
 if(days.length>=3&&days.filter(d=>d!==Math.floor(now/86400000)).length>=2)return 4;
 if(days.length>=2&&days.some(d=>d!==Math.floor(now/86400000)))return 3;
 return 2;
}
function summary(report,meta,now=Date.now()){
 const grade=report.grade; if(!GRADES.includes(grade))throw Error('Fel årskurs.');
 const sec=obj(report.sections),skills=arr(meta?.skills?.[grade]),chapters=arr(meta?.chapters?.[grade]);
 const readBooks=arr(meta?.books),words=arr(meta?.words),miniLessons=arr(meta?.miniLessons),kneps=arr(meta?.kneps);
 const m=sec.math,learn=sec.learning,read=sec.reading,vocab=sec.vocab,knep=sec.memory,exam=sec.exam;
 const attempts=arr(m?.attempts),bySkill=new Map();
 for(const a of attempts) {if(!bySkill.has(a.s))bySkill.set(a.s,[]);bySkill.get(a.s).push(a);}
 const mathSkills=skills.map(s=>{const x=bySkill.get(s.id)||[],lv=mathLevel(x),lesson=obj(m?.lessons?.[s.id]);return{id:s.id,title:s.title,chapter:s.ch,lv,started:lv>0||lesson.step>0||lesson.done===true,lessonDone:lesson.done===true,attempts:x.length,last:Math.max(0,...x.map(a=>a.t),Number(lesson.t)||0)};});
 const math={present:!!m,skills:mathSkills,started:mathSkills.filter(x=>x.started).length,total:mathSkills.length,independent:mathSkills.filter(x=>x.lv>=3).length,lessonDone:mathSkills.filter(x=>x.lessonDone).length,needsSupport:mathSkills.filter(x=>x.started&&x.lv<3&&x.attempts>0),notStarted:mathSkills.filter(x=>!x.started),attempts:attempts.length,
 chapters:chapters.map(ch=>{const all=mathSkills.filter(s=>s.chapter===ch.id);return{id:ch.id,title:ch.name,total:all.length,started:all.filter(x=>x.started).length,independent:all.filter(x=>x.lv>=3).length,lessonDone:all.filter(x=>x.lessonDone).length,missing:all.filter(x=>!x.started),needsSupport:all.filter(x=>x.started&&x.lv<3&&x.attempts>0)};}),
 tests:arr(m?.tests).map(x=>({...x,percent:x.n?Math.round(x.ok/x.n*100):0})),last:Math.max(0,...attempts.map(x=>x.t)),table:null
 };
 const facts=obj(m?.tables?.facts),factList=Object.values(facts),tableTotal=55;
 math.table={present:!!m,started:factList.filter(x=>x.attempts>0).length,total:tableTotal,secure:factList.filter(x=>x.score>=9&&x.firstCorrect>=4).length,sessions:arr(m?.tables?.sessions).length};
 const lessons=miniLessons.map(l=>{const arrs=arr(learn?.attempts).filter(a=>a.lesson===l.id);return{id:l.id,title:l.title,subject:l.subject,lv:studyLevel(arrs,now),last:Math.max(0,...arrs.map(x=>x.at))};});
 const subjects=['sv','en','study'].map(sub=>{const a=lessons.filter(l=>l.subject===sub);return{subject:sub,total:a.length,started:a.filter(l=>l.lv>0).length,independent:a.filter(l=>l.lv>=2).length,repeated:a.filter(l=>l.lv>=3).length,remaining:a.filter(l=>l.lv===0)}};});
 const language={present:!!learn,lessons,total:lessons.length,started:lessons.filter(l=>l.lv>0).length,subjects,attempts:arr(learn?.attempts).length,baseline:Object.values(obj(learn?.baseline)).filter(x=>typeof x==='boolean').length};
 const books=readBooks.map(t=>{const key=t.lang+':'+t.id,rec=obj(read?.texts?.[key]),attemptedTasks=t.tasks.filter(k=>!!read?.tasks?.[key+':'+k.id]).length,independent=t.tasks.filter(k=>{const a=read?.tasks?.[key+':'+k.id];return a?.ok&&!a?.help}).length;return{id:t.id,lang:t.lang,title:t.title,level:t.level,genre:t.genre,total:t.tasks.length,done:!!rec.done,started:!!rec.started||!!rec.done||attemptedTasks>0,attemptedTasks,independent};});
 const reading={present:!!read,books,done:books.filter(x=>x.done).length,started:books.filter(x=>x.started).length,total:books.length,forLang:['sv','en'].map(lang=>{const pool=books.filter(x=>x.lang===lang);return{lang,total:pool.length,done:pool.filter(x=>x.done).length,started:pool.filter(x=>x.started).length,byLevel:[1,2,3].map(level=>{const list=pool.filter(x=>x.level===level);return{level,total:list.length,done:list.filter(x=>x.done).length,started:list.filter(x=>x.started).length,remaining:list.filter(x=>!x.started)}})};})};
 const wordAttempts=obj(vocab?.attempts),uniqueWords=new Set(Object.keys(wordAttempts).map(k=>k.split(':').slice(0,2).join(':')));
 const wordTotal=words.length||122;
 const vocabulary={present:!!vocab,words:words.map(w=>({word:w.word,lang:w.lang,level:w.level,started:uniqueWords.has(w.lang+':'+w.word),needsRepeat:['meaning','sentence'].some(kind=>{const r=wordAttempts[w.lang+':'+w.word+':'+kind];return r?.wrong>0&&!r?.last})})),started:uniqueWords.size,total:wordTotal,attempts:Object.values(wordAttempts).reduce((n,a)=>n+(a.n||0),0),pending:Object.entries(wordAttempts).filter(([,v])=>v.wrong>0&&!v.last).map(([key])=>key),forLang:['sv','en'].map(lang=>({lang,total:words.filter(x=>x.lang===lang).length,started:[...uniqueWords].filter(k=>k.startsWith(lang+':')).length,rounds:limited(vocab?.rounds?.[lang])}))};
 const records=obj(knep?.records),memory={present:!!knep,total:kneps.length,started:cnt(records),remembered:0,due:0,items:[]};
 for(const k of kneps){const x=records[k.id];if(!x){memory.items.push({id:k.id,title:k.topic||k.id,status:'Inte påbörjat'});continue;}const ts=[x.t0,x.t1].filter(y=>y?.at>0),first=Math.min(...ts.map(x=>x.at),Infinity);let status='Påbörjat';if(x.recall?.ok&&x.recall?.at-first>=86400000){memory.remembered++;status='Befäst efter repetition';}else if(first<Infinity&&now-first>=86400000){memory.due++;status='Dags att repetera';}memory.items.push({id:k.id,title:k.topic||k.id,status});}
 const results=arr(exam?.attempts).filter(x=>x.grade===grade),valid=results.filter(x=>x.total>0);
 const exams={present:!!exam,attempts:valid.length,last:valid.length?valid[valid.length-1]:null,history:valid.slice(-8).reverse(),mean:valid.length?Math.round(valid.reduce((n,x)=>n+x.correct/x.total,0)/valid.length*100):null};
 const activityDates=[];
 for(const a of attempts)if(a.t)activityDates.push(a.t);
 for(const a of arr(learn?.attempts))if(a.at)activityDates.push(a.at);
 for(const a of Object.values(obj(read?.tasks)))if(a.at)activityDates.push(a.at);
 for(const a of Object.values(wordAttempts))if(a.at)activityDates.push(a.at);
 for(const a of Object.values(records)){for(const b of [a.t0,a.t1,a.recall])if(b?.at)activityDates.push(b.at);}
 for(const a of results)if(a.finishedAt)activityDates.push(a.finishedAt);
 for(const a of arr(m?.tables?.sessions)){const ms=Date.parse(a.finishedAt);if(Number.isFinite(ms))activityDates.push(ms);}
 const today=new Date(now);today.setHours(0,0,0,0);
 const activity14=Array.from({length:14},(_,i)=>{const t=today.getTime()-(13-i)*86400000,end=t+86400000;return{day:date(t),date:new Date(t).toISOString().slice(0,10),count:activityDates.filter(x=>x>=t&&x<end).length};});
 return {grade,name:text(m?.name||'',30),math,language,reading,vocabulary,memory,exams,activity14,sectionsPresent:Object.fromEntries(Object.keys(STORAGE).map(k=>[k,!!sec[k]])),source:report.local?'local':'imported',capturedAt:report.createdAt||'',lastActivity:Math.max(0,...activityDates)};
}
function metaFrom(root){return{skills:{grade8:root.MO_CONTENT8||[],grade9:root.MO_CONTENT9||[]},chapters:{grade8:root.MO_CORE?.profiles?.grade8?.chapters||[],grade9:root.MO_CORE?.profiles?.grade9?.chapters||[]},books:root.MO_BANK3||[],words:root.MO_ORDLEK?._test?.WORDS||[],miniLessons:root.MOL_CONTENT?.lessons||[],kneps:root.MOKnep?.KNEP||[]};}
return{KEY,STORAGE,GRADES,extract,readLocal,minimalReport,fromFile,mergeImported,hasActivity,activity,summary,metaFrom,mathLevel,studyLevel,compactModule};
});
