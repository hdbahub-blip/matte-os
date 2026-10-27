/* Matte OS v5.2 — Multiplikationsboost.
   Kort, adaptiv grundträning 2–10. Ingen leaderboard, ingen straffande daglig streak. */
(function(root){
'use strict';

const GOAL=3, BASE_N=10;
const FACTS=[];
for(let a=2;a<=10;a++)for(let b=a;b<=10;b++)FACTS.push({a,b,key:a+'x'+b});
const STARTER=[[2,7],[3,4],[4,6],[5,8],[6,7],[6,8],[6,9],[7,8],[7,9],[8,9]];

function engine(){return root.MOEngine}
function canon(a,b){a=Number(a);b=Number(b);return a<=b?{a,b,key:a+'x'+b}:{a:b,b:a,key:b+'x'+a}}
function today(){return new Date().toISOString().slice(0,10)}
function isoWeek(d=new Date()){
 const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
 const day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);
 const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));
 return {year:x.getUTCFullYear(),week:Math.ceil((((x-y)/86400000)+1)/7)};
}
function ensure(pid){
 const E=engine(),p=E.prof(pid);
 if(!p.tables||typeof p.tables!=='object')p.tables={v:1,facts:{},sessions:[]};
 if(!p.tables.facts||typeof p.tables.facts!=='object')p.tables.facts={};
 if(!Array.isArray(p.tables.sessions))p.tables.sessions=[];
 return p.tables;
}
function factState(pid,key){
 const t=ensure(pid);
 return t.facts[key]||(t.facts[key]={attempts:0,firstCorrect:0,correct:0,wrong:0,streak:0,score:0,last:0,lastMs:0});
}
function masteryFrom(st){
 const s=Math.max(0,Number(st?.score)||0);
 if(s>=9&&st.firstCorrect>=4)return 3;
 if(s>=5&&st.firstCorrect>=2)return 2;
 if(s>=2)return 1;
 return 0;
}
function mastery(pid,key){return masteryFrom(factState(pid,key))}
function tableStats(pid,n){
 let sum=0,secure=0,count=0;
 for(let k=2;k<=10;k++){
   const c=canon(n,k),m=mastery(pid,c.key);sum+=m;count++;if(m>=3)secure++;
 }
 return {n,percent:Math.round(100*sum/(3*count)),secure,total:count};
}
function stats(pid){
 const t=ensure(pid);
 let sum=0,secure=0,started=0;
 for(const f of FACTS){const m=mastery(pid,f.key);sum+=m;if(m>=3)secure++;if((t.facts[f.key]?.attempts||0)>0)started++}
 const now=isoWeek(),weekSessions=t.sessions.filter(s=>{const w=isoWeek(new Date(s.finishedAt));return w.year===now.year&&w.week===now.week}).length;
 const last=t.sessions[t.sessions.length-1]||null;
 return {
   percent:Math.round(100*sum/(3*FACTS.length)),secure,total:FACTS.length,started,
   weekSessions,weekGoal:GOAL,last,
   level:sum/(3*FACTS.length)>=.8?'Flyt':sum/(3*FACTS.length)>=.45?'På väg':started>=12?'Bygger':'Start'
 };
}
function scorePriority(pid,f){
 const st=factState(pid,f.key),m=masteryFrom(st);
 const err=st.attempts?st.wrong/st.attempts:0;
 const age=st.last?Math.min(3,(Date.now()-st.last)/(86400000*3)):3;
 return (3-m)*3 + err*3 + age + (st.attempts===0?2:0);
}
function seeded(seed){
 let x=(seed>>>0)||1234567;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}
}
function hash(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function oriented(f,r){return r()<.5?{...f}:{a:f.b,b:f.a,key:f.key}}
function choose(pid,n=BASE_N){
 const t=ensure(pid),sessionNo=t.sessions.length;
 const r=seeded(hash(pid+'|'+today()+'|'+sessionNo+'|'+Date.now()));
 if(sessionNo===0){
   return STARTER.slice(0,n).map(([a,b])=>oriented(canon(a,b),r));
 }
 const scored=FACTS.map(f=>({f,p:scorePriority(pid,f)+r()*1.4})).sort((a,b)=>b.p-a.p);
 const chosen=[],tables=new Map();
 for(const x of scored){
   const f=x.f;
   const load=(tables.get(f.a)||0)+(tables.get(f.b)||0);
   if(load>3&&chosen.length<n-2)continue;
   chosen.push(f);tables.set(f.a,(tables.get(f.a)||0)+1);tables.set(f.b,(tables.get(f.b)||0)+1);
   if(chosen.length>=n)break;
 }
 return chosen.map(f=>oriented(f,r));
}
function start(pid){
 const qs=choose(pid,BASE_N);
 return {pid,started:Date.now(),idx:0,baseN:qs.length,questions:qs.map(q=>({...q,retry:false})),baseCorrect:0,baseAnswered:0,streak:0,bestStreak:0,missed:[],answered:false,feedback:null};
}
function current(run){return run.questions[run.idx]||null}
function record(pid,q,answer,ms,firstAttempt=true){
 const c=canon(q.a,q.b),st=factState(pid,c.key),value=Number(String(answer).trim().replace(',','.'));
 const ok=Number.isFinite(value)&&value===q.a*q.b;
 st.attempts++;st.last=Date.now();st.lastMs=Math.max(0,Math.round(ms||0));
 if(ok){
   st.correct++;st.streak=(st.streak||0)+1;
   if(firstAttempt){st.firstCorrect++;st.score=Math.min(12,(st.score||0)+1.25)}
   else st.score=Math.min(12,(st.score||0)+.45);
 }else{
   st.wrong++;st.streak=0;st.score=Math.max(0,(st.score||0)-.55);
 }
 engine().save();
 return {ok,correct:q.a*q.b,key:c.key,mastery:masteryFrom(st)};
}
function answer(pid,run,answer){
 if(run.answered)return run.feedback;
 const q=current(run),started=q.startedAt||run.questionStarted||Date.now(),ms=Date.now()-started;
 const base=!q.retry,res=record(pid,q,answer,ms,true);
 if(base){run.baseAnswered++;if(res.ok)run.baseCorrect++}
 if(res.ok){run.streak++;run.bestStreak=Math.max(run.bestStreak,run.streak)}
 else{
   run.streak=0;
   if(!run.missed.includes(q.key))run.missed.push(q.key);
   const already=run.questions.slice(run.baseN).some(x=>x.key===q.key);
   if(!already&&run.questions.length<run.baseN+3)run.questions.push({...q,retry:true,a:q.a,b:q.b});
 }
 run.answered=true;
 run.feedback={...res,a:q.a,b:q.b,retry:q.retry,ms};
 return run.feedback;
}
function next(run){
 if(!run.answered)return false;
 run.idx++;run.answered=false;run.feedback=null;run.questionStarted=Date.now();
 return run.idx<run.questions.length;
}
function finish(pid,run){
 const t=ensure(pid),session={
   finishedAt:new Date().toISOString(),baseN:run.baseN,correctFirst:run.baseCorrect,
   missed:run.missed.slice(),bestStreak:run.bestStreak,durationMs:Date.now()-run.started
 };
 t.sessions.push(session);if(t.sessions.length>120)t.sessions=t.sessions.slice(-100);
 engine().save();return session;
}
function weakFacts(pid,n=5){
 return FACTS.map(f=>({f,m:mastery(pid,f.key),p:scorePriority(pid,f)})).sort((a,b)=>b.p-a.p).slice(0,n).map(x=>x.f);
}
function reset(pid){const p=engine().prof(pid);p.tables={v:1,facts:{},sessions:[]};engine().save()}

const API={FACTS,BASE_N,ensure,factState,mastery,tableStats,stats,choose,start,current,answer,next,finish,weakFacts,reset,canon};
root.MOTables=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
