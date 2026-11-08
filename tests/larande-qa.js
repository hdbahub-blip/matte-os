/* Run as node tests/larande-qa.js once the patch is applied to Matte OS repo. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const data=require(path.join(dir,'lara/content.js'));
const logic=require(path.join(dir,'lara/logic.js'));
let n=0;const check=(v,msg)=>{assert.ok(v,msg);n++};
const issues=logic.validateContent(data.lessons,data.duels);check(!issues.length,'Content issues: '+issues.join(', '));
check(data.lessons.length>=25,'At least 25 substantive lessons');
check(data.duels.length>=20,'At least 20 duel cards');
check(data.baseline.length===8,'Eight bounded baseline checks');
for(const subject of ['sv','en','study']){
 const ls=data.lessons.filter(l=>l.subject===subject);
 check(ls.length>=8,`At least 8 ${subject} lessons`);
 check(new Set(ls.map(l=>l.category)).size>=4,`${subject} category coverage`);
 check(data.duels.some(x=>x.subject===subject),`${subject} duel coverage`);
}
for(const l of data.lessons){
 check(l.goal.length>20,'Goal too short '+l.id);
 check(l.explain.length>50,'Explanation too short '+l.id);
 check(l.example.length>30,'Example too short '+l.id);
 check(l.guided.type==='choice','Guided must be a choice '+l.id);
 check(l.guided.hint?.length>=10,'Needs scaffold '+l.id);
 check(l.solo.hint?.length>=10,'Needs scaffold solo '+l.id);
 check(l.partner.prompt.length>=30,'Partner task too short '+l.id);
 check(l.partner.follow.length>=20,'Partner follow-up too short '+l.id);
 if(['choice','listen'].includes(l.solo.type)){
  check(logic.checkChoice(l.solo,l.solo.correct),'Correct answer accepted '+l.id);
  check(!logic.checkChoice(l.solo,(l.solo.correct+1)%l.solo.options.length),'Wrong answer rejected '+l.id);
 }
 if(l.solo.type==='listen')check(l.solo.script.length>=30,'Audio script too short '+l.id);
 if(['write','speak'].includes(l.solo.type))check(l.solo.criteria.length>=3,'Rubric required '+l.id);
}
const st=logic.initial();check(logic.level(st,'grade8',data.lessons[0].id)===0,'initial new');
const one=data.lessons[0];logic.record(st,'grade8',{lesson:one.id,ok:true,help:true,mode:'auto'},data.lessons);
check(logic.level(st,'grade8',one.id)===1,'help not independent');
logic.record(st,'grade8',{lesson:one.id,ok:true,help:false,mode:'auto'},data.lessons);
check(logic.level(st,'grade8',one.id)===2,'one independent');
check(logic.level(st,'grade9',one.id)===0,'profiles isolated');
const now=Date.now();st.profiles.grade8.attempts.push({lesson:one.id,ok:true,help:false,mode:'auto',at:now-2*86400000});
check(logic.level(st,'grade8',one.id)===3,'later independent');
check(logic.due(st,'grade8',one.id,now)===false,'repetition interval respected');
st.profiles.grade8.attempts.push({lesson:one.id,ok:true,help:false,mode:'auto',at:now-9*86400000});
check(logic.level(st,'grade8',one.id)===4,'independent days count');
logic.recordBaseline(st,'grade8',data.baseline[0].id,false,data.baseline);
check(logic.baselineInfo(st,'grade8',data.baseline).weak.length===1,'Baseline identifies gap');
check(logic.baselineInfo(st,'grade9',data.baseline).answered===0,'Baseline isolated');
const mal={v:1,active:'bad',profiles:{grade8:{attempts:[{lesson:'__unknown',at:Date.now(),ok:true}]},grade9:{attempts:[]}},duels:[]};
const clean=logic.sanitize(mal,data.lessons,data.baseline);check(clean.active==='grade9','invalid active fails closed');check(!clean.profiles.grade8.attempts.length,'unknown skill dropped');
const after=logic.applyDuelRound({grade8:0,grade9:0},'grade9');check(after.grade8===0&&after.grade9===1,'duel winner');
check(logic.applyDuelRound({grade8:0,grade9:0},'both').grade8===1,'tie scoring');
const app=fs.readFileSync(path.join(dir,'lara/app.js'),'utf8');const ui=fs.readFileSync(path.join(dir,'lara/index.html'),'utf8');const sw=fs.readFileSync(path.join(dir,'lara/sw.js'),'utf8');
check(app.includes("'matteos.v5'"),'read math active');
check(!/fetch\s*\(/.test(app),'learner does not send network requests');
check(app.includes('written')&&app.includes('Inställningar'),'free response and settings exist');
check(app.includes('undo-duel')&&app.includes('duel-point'),'duel transparency/undo');
check(app.includes('speechSynthesis'),'listening available with graceful fallback');
check(sw.includes('matte-os-larande-3.0.1-nav')&&sw.includes('app.js?v=3.0.1-nav')&&ui.includes('app.js?v=3.0.1-nav')&&sw.includes('index.html'),'offline cache scope and version parity');
check(ui.includes('lang="sv"'),'Swedish accessibility');
console.log('Matte OS Lärande QA: PASS ('+n+' checks, '+data.lessons.length+' lessons, '+data.duels.length+' duel cards).');
