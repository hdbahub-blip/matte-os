/* Matte OS · NP-träning – logikkärna (ingen DOM, ingen skoltext).
 * Allt här är testbart i Node. Skolans text och elevsvar finns aldrig i den här filen.
 * Principer: framsteg mäts i handling (försök, belägg, omprövning, muntlig övning, återtest) – aldrig i skrivlängd.
 */
(function(root,factory){var o=factory();if(typeof module==='object'&&module.exports)module.exports=o;root.MO_NP_CORE=o;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
var DAY=86400000;
var QKEYS=['q0','q1','q2','q3','q4'];

/* ---------- källpaket (privat) ---------- */
function isStr(x,max){return typeof x==='string'&&x.length<=max;}
function sourceOK(o){
 if(!o||o.workId!=='en-stark-nolla'||o.grade!=='grade9')return false;
 if(o.format!=='matte-os-np-private-v1'&&o.format!=='matte-os-np-private-v2')return false;
 if(!Array.isArray(o.questions)||o.questions.length!==4||!o.questions.every(function(q){return isStr(q,2000);}))return false;
 if(!Array.isArray(o.textParagraphs)||o.textParagraphs.length<6||o.textParagraphs.length>120||!o.textParagraphs.every(function(p){return isStr(p,12000);}))return false;
 if(!isStr(o.discussionQuestion,2000)||!isStr(o.summary,4000)||!isStr(o.schoolIntro,4000))return false;
 if(o.format==='matte-os-np-private-v2'){
  if(o.sections!==undefined&&!(Array.isArray(o.sections)&&o.sections.length<=30&&o.sections.every(function(s){return s&&typeof s.title==='string'&&s.title.length<200&&Array.isArray(s.paras)&&s.paras.every(function(i){return Number.isInteger(i)&&i>=0&&i<o.textParagraphs.length;})&&(s.keyPoints===undefined||(Array.isArray(s.keyPoints)&&s.keyPoints.length<=6&&s.keyPoints.every(function(k){return isStr(k,300);})));})))return false;
  if(o.fidelity!==undefined&&!(Array.isArray(o.fidelity)&&o.fidelity.length<=200))return false;
 }
 return true;
}
/* Gemensam intern form för v1 och v2. */
function normalize(o){
 if(!sourceOK(o))return null;
 var n=o.textParagraphs.length,sections=[];
 if(Array.isArray(o.sections)&&o.sections.length){sections=o.sections.map(function(s,i){return {id:'s'+i,title:s.title,paras:s.paras.slice(),keyPoints:(s.keyPoints||[]).slice()};});}
 else{for(var i=0;i<n;i+=4){var p=[];for(var j=i;j<Math.min(n,i+4);j++)p.push(j);sections.push({id:'s'+sections.length,title:'Del '+(sections.length+1),paras:p,keyPoints:[]});}}
 var qs=o.questions.concat([o.discussionQuestion]);
 var sup=Array.isArray(o.supports)?o.supports:[];
 return {raw:o,v:o.format==='matte-os-np-private-v2'?2:1,title:o.title||'',intro:o.schoolIntro,summary:o.summary,
  note:typeof o.note==='string'?o.note.slice(0,600):'',questionHeading:o.questionHeading||'',discussionHeading:o.discussionHeading||'',discussionInstruction:o.discussionInstruction||'',
  paras:o.textParagraphs,sections:sections,questions:qs,
  supports:qs.map(function(_,i){var s=sup[i]||{};return {steps:Array.isArray(s.steps)?s.steps:[],evidence:s.evidence||'',perspective:s.perspective||'',stem:s.stem||'',
   weak:s.weak||'',strong:s.strong||'',why:s.why||'',perspectives:Array.isArray(s.perspectives)?s.perspectives:[],evidenceParas:Array.isArray(s.evidenceParas)?s.evidenceParas:[]};}),
  fidelity:Array.isArray(o.fidelity)?o.fidelity:[]};
}

/* ---------- ord och språk ---------- */
function words(t){return (String(t||'').toLowerCase().match(/[a-zåäöéèü0-9]+(?:[-'’][a-zåäöéèü0-9]+)*/g)||[]);}
function firstSentence(t){var m=String(t||'').trim().match(/^[^.!?\n]+/);return m?m[0]:'';}

var RX={
 because:/(^|[^a-zåäö])(därför att|eftersom|för att|på grund av|det beror på|det visar att|vilket visar|vilket betyder|det betyder att|därför)([^a-zåäö]|$)/i,
 evidence:/(”[^”]{3,}”|"[^"]{3,}"|«[^»]{3,}»|i texten|texten säger|det står|står det|jag ser det när|exempelvis|till exempel|när (han|hon|han|de) )/i,
 other:/(å andra sidan|samtidigt|en annan (läsare|person|tolkning|kan)|någon annan|andra kan|andra skulle|kan också|kan även|däremot|trots det|trots att|medan andra|inte alla)/i,
 conclusion:/(sammanfattningsvis|alltså|därmed|slutsatsen|min slutsats|det betyder att|jag kommer fram till|så jag tror|därför tror jag)/i
};
/* Textspaning: föreslår vilka delar av ett resonemang som syns. Det är inte ett betyg. */
function analyse(text,ctx){
 ctx=ctx||{};var t=String(text||''),w=words(t);
 var claim=words(firstSentence(t)).length>=4;
 var because=RX.because.test(t);
 var evidence=!!ctx.evidenceCount||RX.evidence.test(t);
 var other=!!ctx.perspectiveDone||RX.other.test(t);
 var conclusion=RX.conclusion.test(t);
 var found=[claim&&'claim',because&&'because',evidence&&'evidence',other&&'other'].filter(Boolean);
 return {words:w.length,claim:claim,because:because,evidence:evidence,other:other,conclusion:conclusion,found:found,count:found.length};
}
var INGREDIENTS=['claim','because','evidence','other'];
/* Ordlikhet för att upptäcka att något bara kopierats ur texten (5-gram). */
function copyRatio(answer,source){
 var a=words(answer);if(a.length<6)return 0;var s=words(source),set={},i,hit=0,tot=0;
 for(i=0;i+4<s.length;i++)set[s.slice(i,i+5).join(' ')]=1;
 for(i=0;i+4<a.length;i++){tot++;if(set[a.slice(i,i+5).join(' ')])hit++;}
 return tot?hit/tot:0;
}
var OPEN_START=/^(varför|hur|vad tror|vad tänker|vad skulle|vad hade|vad innebär|vad betyder|vad menar|på vilket sätt|vilka|vilken|vilket|kan du förklara|kan du berätta|kan du utveckla|hur kommer det sig)/i;
var CLOSED_START=/^(är|har|tycker|kan|ska|vill|finns|var|hade|stämmer|håller|eller)\b/i;
/* En öppen fråga bjuder in till resonemang; en sluten kan besvaras med ja/nej. */
function questionKind(q){
 var t=String(q||'').trim();if(t.length<8)return {ok:false,open:false,reason:'short'};
 var hasQ=/\?\s*$/.test(t);
 if(OPEN_START.test(t))return {ok:hasQ,open:true,reason:hasQ?'open':'noqmark'};
 if(CLOSED_START.test(t))return {ok:false,open:false,reason:'closed'};
 return {ok:false,open:false,reason:'unclear'};
}
/* Stödordsnivåer: 1 alla stödord, 2 bara första ordet i varje del, 3 inget. */
function cues(parts,level){
 return parts.map(function(p){var cs=String(p||'').split(/[,\n;·]+/).map(function(x){return x.trim();}).filter(Boolean);
  if(level>=3)return '';if(level===2)return cs.length?cs[0].split(/\s+/)[0]:'';return cs.join(' · ');});
}
/* Ett manus är inte stödord: varna när en del är för lång. */
function cueLength(text){return words(text).length;}

/* ---------- lagring: platta nycklar → {value,at} ---------- */
function validEntry(k,v){return typeof k==='string'&&k.length>0&&k.length<=90&&(typeof v==='string'||typeof v==='boolean')&&String(v).length<=10000;}
function mergeEntries(notes,noteAt,incoming){
 var changed=false;Object.keys(incoming||{}).forEach(function(k){var e=incoming[k],at=Number(e&&e.at)||0;
  if(!e||!validEntry(k,e.value))return;if(at>(Number(noteAt[k])||0)){notes[k]=e.value;noteAt[k]=at;changed=true;}});return changed;
}
function snapshotEntries(notes,noteAt){var o={};Object.keys(notes).forEach(function(k){if(validEntry(k,notes[k]))o[k]={value:notes[k],at:Number(noteAt[k])||0};});return o;}
/* v1-nycklar → v2-nycklar. Gamla svar förloras aldrig: de som inte har ny plats sparas som legacy.* */
var V1MAP={q0:'ans.q0.a1',q1:'ans.q1.a1',q2:'ans.q2.a1',q3:'ans.q3.a1',q4:'ans.q4.a1',p1:'pres.1',p2:'pres.2',p3:'pres.3',p4:'pres.4',p5:'pres.5',l1:'lead.silence',l2:'lead.dominate',l3:'lead.disagree',testnote:'reflect.next'};
function migrateV1(notes,noteAt){
 var moved=0;Object.keys(notes).forEach(function(k){
  if(k.indexOf('.')>=0)return;var v=notes[k];if(typeof v==='boolean'&&!v)return;if(typeof v==='string'&&!v.trim())return;
  var at=Number(noteAt[k])||0,target=V1MAP[k]||('legacy.'+k);
  if(notes[target]===undefined||notes[target]===''){notes[target]=v;noteAt[target]=at||Date.now();moved++;}
 });return moved;
}

/* ---------- JSON-fält i en nyckel ---------- */
function J(notes,k,d){try{var s=notes[k];return s?JSON.parse(s):d;}catch(e){return d;}}
function words5(t){return words(t).length;}

/* ---------- framsteg: händelser, inte tecken ---------- */
function qState(notes,qi,now){
 var q='q'+qi,a1t=typeof notes['ans.'+q+'.a1']==='string'?notes['ans.'+q+'.a1']:'',a2=J(notes,'ans.'+q+'.a2',null),ev=J(notes,'ans.'+q+'.ev',[]),help=Number(notes['ans.'+q+'.help'])||0;
 var perspective=J(notes,'ans.'+q+'.pers',null),better=J(notes,'ans.'+q+'.better',[]),oral=J(notes,'ans.'+q+'.oral',[]),rt=J(notes,'ans.'+q+'.rt',null);
 var attempted=words5(a1t)>=3;
 var a2t=a2&&a2.t?a2.t:'';
 var revised=!!(attempted&&words5(a2t)>=3&&a2t.trim()!==a1t.trim()&&Array.isArray(better)&&better.length>=1);
 var spoken=Array.isArray(oral)&&oral.some(function(r){return r&&r.lvl>=2&&(r.rate==='free'||r.rate==='partly');});
 var spokenFree=Array.isArray(oral)&&oral.some(function(r){return r&&r.lvl>=3&&r.rate==='free';});
 var rtOK=!!(rt&&rt.t&&analyse(rt.t,{}).count>=3&&!rt.help);
 var revAt=a2&&a2.at||0;
 var retestReady=revised&&revAt>0&&(now-revAt)>=20*3600*1000;
 var level=!attempted?0:revised?(spoken?4:3):(ev.length||(perspective&&perspective.t))?2:1;
 return {attempted:attempted,evidence:ev.length,help:help,perspective:!!(perspective&&perspective.t),revised:revised,spoken:spoken,spokenFree:spokenFree,retested:rtOK,retestReady:retestReady&&!rt,level:level,
  independent:attempted&&help<=1};
}
function summary(notes,doc,now){
 now=now||Date.now();
 var qs=QKEYS.map(function(_,i){return qState(notes,i,now);});
 var sections=doc?doc.sections:[];
 var retold=sections.filter(function(s){var r=J(notes,'read.'+s.id,null);return r&&words5(r.t)>=3;}).length;
 var evs=Object.keys(notes).filter(function(k){return k.indexOf('ev.p')===0&&notes[k];}).length;
 var presParts=[1,2,3,4,5].filter(function(i){return words5(notes['pres.'+i])>=1;}).length;
 var rounds=J(notes,'pres.rounds',[]);
 var talkedFree=Array.isArray(rounds)&&rounds.some(function(r){return r&&r.lvl>=2&&(r.rate==='free'||r.rate==='partly');});
 var leadSims=J(notes,'lead.sims',{}),leadSimN=Object.keys(leadSims).length;
 var cards=J(notes,'lead.cards',[]);
 var opening=questionKind(notes['lead.followup1']).open&&questionKind(notes['lead.followup2']).open&&words5(notes['lead.invite'])>=3;
 var join=J(notes,'join.done',{}),joinN=Object.keys(join).length,joinIndep=!!(join.t3&&join.t3.indep);
 var reh=J(notes,'rehearsal',null);
 return {
  s0:notes['quiz.pass']==='1',
  retold:retold,sections:sections.length,evidence:evs,
  q:qs,answered:qs.filter(function(x){return x.attempted;}).length,improved:qs.filter(function(x){return x.revised;}).length,
  spoken:qs.filter(function(x){return x.spoken;}).length,retested:qs.filter(function(x){return x.retested;}).length,retestReady:qs.filter(function(x){return x.retestReady;}).length,
  presParts:presParts,talkedFree:talkedFree,
  leadSims:leadSimN,leadCards:Array.isArray(cards)?cards.length:0,opening:opening,
  joinN:joinN,joinIndep:joinIndep,rehearsed:!!(reh&&reh.at),reflected:words5(notes['reflect.first'])>=3&&words5(notes['reflect.better'])>=3&&words5(notes['reflect.next'])>=3
 };
}
/* Stationer i den ordning som lär bäst. Klart = bevis på handling, inte ifylld text. */
var STATIONS=['start','read','think','present','lead','join','finish'];
function stationDone(s,sm){
 switch(s){
  case 'start':return sm.s0;
  case 'read':return sm.sections>0&&sm.retold>=Math.min(sm.sections,2)&&sm.evidence>=1;
  case 'think':return sm.improved>=3;
  case 'present':return sm.presParts>=5&&sm.talkedFree;
  case 'lead':return sm.leadSims>=3&&sm.leadCards>=3&&sm.opening;
  case 'join':return sm.joinN>=3&&sm.joinIndep;
  case 'finish':return sm.rehearsed&&sm.reflected;
 }
 return false;
}
function nextStation(sm){for(var i=0;i<STATIONS.length;i++){if(!stationDone(STATIONS[i],sm))return STATIONS[i];}return 'done';}
function stationProgress(s,sm){
 switch(s){
  case 'start':return {done:sm.s0?1:0,of:1};
  case 'read':return {done:Math.min(sm.retold,2)+Math.min(sm.evidence,1),of:3};
  case 'think':return {done:Math.min(sm.improved,3),of:3};
  case 'present':return {done:sm.presParts+(sm.talkedFree?1:0),of:6};
  case 'lead':return {done:Math.min(sm.leadSims,3)+Math.min(sm.leadCards,3)+(sm.opening?1:0),of:7};
  case 'join':return {done:Math.min(sm.joinN,3)+(sm.joinIndep?1:0),of:4};
  case 'finish':return {done:(sm.rehearsed?1:0)+(sm.reflected?1:0),of:2};
 }
 return {done:0,of:1};
}
return {sourceOK:sourceOK,normalize:normalize,words:words,analyse:analyse,INGREDIENTS:INGREDIENTS,copyRatio:copyRatio,questionKind:questionKind,cues:cues,cueLength:cueLength,
 validEntry:validEntry,mergeEntries:mergeEntries,snapshotEntries:snapshotEntries,migrateV1:migrateV1,V1MAP:V1MAP,J:J,qState:qState,summary:summary,STATIONS:STATIONS,stationDone:stationDone,nextStation:nextStation,stationProgress:stationProgress,DAY:DAY,QKEYS:QKEYS};
});
