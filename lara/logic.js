/* Matte OS · Lärande: ren, testbar datamodell. Ingen rå elevtext lagras. */
(function(root,factory){const out=factory();if(typeof module==='object'&&module.exports)module.exports=out;root.MOL_LOGIC=out;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const STORE='matteos.larande.v1';
const ID_SET=new Set(['grade8','grade9']);
const validId=x=>ID_SET.has(x);
const profile=()=>({attempts:[],baseline:{}});
const initial=()=>({v:1,active:'grade9',profiles:{grade8:profile(),grade9:profile()},duels:[]});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function cleanAttempt(a,ids){
 if(!a||typeof a!=='object'||typeof a.lesson!=='string'||!ids.has(a.lesson))return null;
 if(!Number.isFinite(a.at)||a.at<1600000000000||a.at>Date.now()+86400000)return null;
 return {lesson:a.lesson,at:Math.floor(a.at),mode:a.mode==='self'?'self':'auto',ok:a.ok===true,help:a.help===true};
}
function sanitize(st,lessons,baseline=[]){
 const out=initial(),ids=new Set(lessons.map(x=>x.id));
 if(!st||typeof st!=='object'||st.v!==1)return out;
 out.active=validId(st.active)?st.active:'grade9';
 for(const p of ['grade8','grade9']){
   const incoming=st.profiles&&st.profiles[p];
   out.profiles[p].attempts=Array.isArray(incoming?.attempts)?incoming.attempts.slice(-1500).map(a=>cleanAttempt(a,ids)).filter(Boolean):[];
   const valid=new Set(baseline.map(b=>b.id));if(incoming?.baseline&&typeof incoming.baseline==='object')for(const [id,value] of Object.entries(incoming.baseline))if(valid.has(id)&&typeof value==='boolean')out.profiles[p].baseline[id]=value;
 }
 out.duels=Array.isArray(st.duels)?st.duels.slice(-35).filter(d=>d&&typeof d==='object'&&['sv','en','study'].includes(d.subject)&&Number.isFinite(d.at)).map(d=>({at:Math.floor(d.at),subject:d.subject,score8:clamp(Math.floor(Number(d.score8)||0),0,99),score9:clamp(Math.floor(Number(d.score9)||0),0,99)})):[];
 return out;
}
function record(st,p,attempt,lessons){
 if(!validId(p)||!lessons.some(l=>l.id===attempt.lesson))throw Error('Unknown profile/lesson');
 st.profiles[p].attempts.push({lesson:attempt.lesson,at:Date.now(),mode:attempt.mode==='self'?'self':'auto',ok:attempt.ok===true,help:attempt.help===true});
 if(st.profiles[p].attempts.length>1500)st.profiles[p].attempts=st.profiles[p].attempts.slice(-1200);
}
function results(st,p,id){return (st.profiles[p]?.attempts||[]).filter(a=>a.lesson===id);}
const day=t=>Math.floor(t/86400000);
function level(st,p,id,now=Date.now()){
 const a=results(st,p,id).filter(x=>x.ok);
 if(!a.length)return results(st,p,id).length?1:0;
 const indep=a.filter(x=>!x.help);
 if(!indep.length)return 1;
 const days=[...new Set(indep.map(x=>day(x.at)))];
 const differentDays=days.filter(d=>d!==day(now)).length;
 if(days.length>=3&&differentDays>=2)return 4;
 if(days.length>=2&&differentDays>=1)return 3;
 return 2;
}
const LABEL=['Inte börjat','Övar med stöd','Klarat en gång','Repeterat senare','Säker vid repetition'];
function due(st,p,id,now=Date.now()){
 const a=results(st,p,id).filter(x=>x.ok).sort((x,y)=>y.at-x.at);
 if(!a.length)return true;
 const lv=level(st,p,id,now);
 const interval=lv===4?7:lv===3?3:1;
 return now-a[0].at>=interval*86400000;
}
function recommend(st,p,lessons,subject,now=Date.now(),baseline=[]){
 const pool=lessons.filter(l=>l.subject===subject);
 const dueOld=pool.find(l=>level(st,p,l.id,now)>0&&level(st,p,l.id,now)<4&&due(st,p,l.id,now));
 if(dueOld)return {...dueOld,recommendation:'Repetera för att minnas bättre'};
 const weak=baseline.find(b=>b.subject===subject&&st.profiles[p]?.baseline?.[b.id]===false&&level(st,p,b.lesson,now)===0);
 if(weak){const l=pool.find(x=>x.id===weak.lesson);if(l)return{...l,recommendation:'Börja med detta från startkollen'};}
 const next=pool.find(l=>level(st,p,l.id,now)===0);
 if(next)return {...next,recommendation:'Nytt litet steg'};
 const dueAny=pool.find(l=>due(st,p,l.id,now));
 return {...(dueAny||pool[0]),recommendation:dueAny?'Repetera från minnet':'Välj valfri lektion att öva igen'};
}
function total(st,p,lessons,subject){const list=lessons.filter(l=>l.subject===subject);return{total:list.length,started:list.filter(l=>level(st,p,l.id)>0).length,independent:list.filter(l=>level(st,p,l.id)>=2).length,repeated:list.filter(l=>level(st,p,l.id)>=3).length};}
function recordBaseline(st,p,id,ok,baseline){if(!validId(p)||!baseline.some(b=>b.id===id))throw Error('Unknown baseline item');st.profiles[p].baseline[id]=!!ok;}
function baselineInfo(st,p,baseline){const entries=st.profiles[p]?.baseline||{},answered=baseline.filter(b=>typeof entries[b.id]==='boolean');return{answered:answered.length,total:baseline.length,finished:answered.length===baseline.length,weak:baseline.filter(b=>entries[b.id]===false)};}
function checkChoice(item,val){return Number.isInteger(item.correct)&&Number(val)===item.correct;}
function applyDuelRound(scores,winner){const out={grade8:scores.grade8,grade9:scores.grade9};if(winner==='grade8'||winner==='grade9')out[winner]+=1;else if(winner==='both'){out.grade8+=1;out.grade9+=1;}return out;}
function validateContent(lessons,duels){const errors=[],seen=new Set();for(const l of lessons){if(seen.has(l.id))errors.push(`Duplicate ${l.id}`);seen.add(l.id);if(!/^(sv|en|study)$/.test(l.subject))errors.push(`Invalid subject ${l.id}`);for(const s of ['title','category','goal','explain','example'])if(!l[s]||l[s].length<(s==='category'?2:10))errors.push(`${l.id} missing ${s}`);for(const type of ['guided','solo']){const a=l[type];if(!a||!['choice','write','speak','listen'].includes(a.type))errors.push(`${l.id} missing ${type}`);else if(a.type==='choice'||a.type==='listen'){if(!Array.isArray(a.options)||a.options.length<3||!Number.isInteger(a.correct)||a.correct<0||a.correct>=a.options.length||!a.why)errors.push(`${l.id} broken ${type}`);if(a.type==='listen'&&(!a.script||!a.lang))errors.push(`${l.id} missing audio text`);}else if(!a.model||!a.criteria?.length)errors.push(`${l.id} missing rubric`);}if(!l.partner?.prompt||!l.partner?.follow)errors.push(`${l.id} missing partner task`);}for(const d of duels)if(!['sv','en','study'].includes(d.subject)||!d.q||!d.a||!d.follow)errors.push('Malformed duel');return errors;}
return{STORE,initial,sanitize,record,recordBaseline,baselineInfo,results,level,LABEL,due,recommend,total,checkChoice,applyDuelRound,validateContent};
});
