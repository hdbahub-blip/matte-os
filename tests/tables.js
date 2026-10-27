/* Matte OS v5.2 Multiplikationsboost QA
   Run: node tests/tables.js */
'use strict';
require('../js/core.js');
require('../js/content9.js');
require('../js/content8.js');
const E=require('../js/engine.js');
const T=require('../js/tables.js');

let checks=0,fail=[];
const ok=(x,m)=>{checks++;if(!x)fail.push(m)};

E._reset();E.load();E.state().active='grade9';E.save();
const pid='grade9';

ok(T.FACTS.length===55,'55 unika kommutativa fakta 1–10');
ok(new Set(T.FACTS.map(f=>f.key)).size===55,'inga duplicerade fakta');

const r=T.start(pid);
ok(r.baseN===10,'runda har 10 basfrågor');
ok(new Set(r.questions.slice(0,10).map(q=>q.key)).size===10,'första rundan har 10 olika fakta');
for(let n=1;n<=10;n++)ok(r.questions.slice(0,10).some(q=>q.a===n||q.b===n),'första rundan täcker tabell '+n);

const first=T.current(r);
const before=T.factState(pid,first.key).firstCorrect;
const wrong=T.answer(pid,r,999);
ok(!wrong.ok,'fel svar underkänns');
ok(r.questions.length===11,'missat fakta läggs tillbaka som revansch');
ok(T.factState(pid,first.key).firstCorrect===before,'fel svar ökar inte firstCorrect');
T.next(r);

while(T.current(r)){
  const q=T.current(r);
  T.answer(pid,r,q.a*q.b);
  if(!T.next(r))break;
}
const stMiss=T.factState(pid,first.key);
ok(stMiss.firstCorrect===before,'rätt på revansch räknas inte som rätt på första försöket');
const fin=T.finish(pid,r);
ok(fin.correctFirst===9,'9 av 10 rätt på första försöket efter ett avsiktligt fel');
ok(fin.missed.length===1,'ett missat fakta sparas i sessionssammanfattning');
ok(T.stats(pid).percent>0,'progress rör sig efter första rundan');
ok(T.stats(pid).weekSessions===1,'första träningsdagen fyller ett veckomål');

const r2=T.start(pid);
for(const q of r2.questions.slice()){
  while(T.current(r2)){
    const cur=T.current(r2);T.answer(pid,r2,cur.a*cur.b);
    if(!T.next(r2))break;
  }
  break;
}
T.finish(pid,r2);
ok(T.stats(pid).weekSessions===1,'flera rundor samma dag räknas som en träningsdag');

const exp=JSON.parse(E.exportData());
ok(!!exp.state.profiles.grade9.tables,'tabellprogress ingår i Matte OS-backup');
ok(Array.isArray(exp.state.profiles.grade9.tables.sessions),'tabellsessioner finns i backup');

E.resetProfile(pid);
ok(T.stats(pid).started===0&&T.stats(pid).percent===0,'nollställ profil rensar tabellprogress');

console.log('Multiplikationsboost QA: '+(checks-fail.length)+'/'+checks+' godkända');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
