'use strict';
const assert=require('node:assert/strict');
const DATA=require('../lara/stories.js');
require('../lara/drive-books.js');
const logic=require('../lara/sprak.js');
let checks=0;const ok=(b,msg)=>{checks++;assert(b,msg);};
ok(DATA.length>=13,'at least 13 themes including 5 user originals');
ok(logic.audit().variants===DATA.length*3,'3 levels/theme');
for(const s of ['sv','en'])ok(DATA.filter(b=>b.subject===s).length>=4,'at least four '+s+' themes');
const ids=new Set();
for(const b of DATA){
 ok(!ids.has(b.id),'unique text id');ids.add(b.id);
 ok(['sv','en'].includes(b.subject),'valid subject');
 ok(b.levels.length===3,'three levels '+b.id);
 ok(b.questions.length>=3&&(!b.extra||(b.extra['2']&&b.extra['3']))&&b.words.length>=3&&b.blanks.length>=3,'level-specific extension and multiple task types '+b.id);
 for(const [i,l] of b.levels.entries()){
  const text=l.text.join(' '),words=text.trim().split(/\s+/).length;
  ok(l.level===i+1,'level index '+b.id);
  ok(words>=(b.id.startsWith('original')?50:75),'actual reading passage minimum '+b.id+' level '+i);
  ok(l.text.length>=2,'paragraphs not snippets '+b.id+' '+i);
  for(const q of [...b.questions,...(i>=1&&b.extra?.[String(i+1)]?[b.extra[String(i+1)]]:[])]){ok(q.evidence&&text.toLocaleLowerCase().includes(q.evidence.toLocaleLowerCase()),'quote must occur in actual passage '+b.id+' '+i+' '+q.ask);}
 }
 for(const q of b.questions){ok(['på raderna','mellan raderna','tolka','literal','inference','interpretation'].includes(q.kind),'comprehension question type');ok(q.options.length===3&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3,'valid answer');ok(q.why.length>25,'reasoned explanation');}
 for(const w of b.words){ok(w.term&&w.explain.length>10&&w.example&&w.ask,'word explanation+use in sentence');}
 for(const cl of b.blanks){ok(cl.sentence.includes('___'),'blank marker');ok(cl.options.length===3&&Number.isInteger(cl.answer)&&cl.answer>=0&&cl.answer<3,'valid cloze');ok(cl.why,'why for cloze');}
 if(b.sourceQuestions){ok(b.sourceQuestions.length===b.sourceAnswers?.length && b.sourceQuestions.length>=6,'Original questions and key aligned '+b.id);}ok(b.retell.steps.length===3&&b.retell.model.length>60,'supported retell');ok(b.talk.prompt&&b.talk.follow&&b.talk.challenge,'supported partner talk');
}
ok(!require('node:fs').readFileSync(require('node:path').join(__dirname,'../lara/sprak.js'),'utf8').includes('Math.random'),'no random ordering across devices');
const st=logic._test.empty();ok(st.profiles.grade8!==st.profiles.grade9,'isolated profile progress');
for(const b of DATA){for(let level=1;level<=3;level++){const k=logic._test.identifier(b,level);ok(k===b.subject+':'+b.id+':'+level,'stable activity id');}}
console.log('Språkverkstad QA PASS: '+checks+' checks, '+DATA.length+' themes, '+logic.audit().variants+' levelled reading texts, '+logic.audit().questions+' reading questions, '+logic.audit().blanks+' cloze exercises.');
