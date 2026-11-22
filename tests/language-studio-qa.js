'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const d=require('../lara/language-studio-content.js');
const app=require('../lara/language-studio.js');
let checks=0;const ok=(v,m)=>{assert(v,m);checks++};
const stats=d.validate();
ok(stats.modules>=36,'broad original curriculum coverage');
ok(stats.swedish>=18&&stats.english>=18,'both languages covered');
ok(stats.gradeQuestions>=72,'both grades each have objective questions');
ok(stats.termPairs>=110,'match banks substantive');
const answerPositionCounts=[0,0,0,0];
const required={
 sv:['Läsa','Texter','Skriva','Tala','Språk','Källor'],
 en:['Reading','Listening','Speaking','Writing','Language','Sources','Culture']
};
for(const lang of ['sv','en']){
 const units=d.units.filter(x=>x.lang===lang);
 ok(units.length>=18,lang+' sufficiently diverse units');
 for(const group of required[lang]){
  const groupUnits=units.filter(x=>x.group===group);
  ok(groupUnits.length>0,lang+' central strand '+group);
  ok(app.render('#/studio/'+lang+'/area/'+encodeURIComponent(group),'grade8').includes('ls-unit-row'),lang+' strand clickable '+group);
 }
 for(const grade of ['grade8','grade9']){
  const hub=app.render('#/studio/'+lang,grade);
  ok(hub.includes('ls-shelf-grid')&&hub.includes('ls-game-grid'),lang+'/'+grade+' navigable hub');
  for(const unit of units){
   const questions=app.quizQuestions(unit,grade);
   ok(questions.length===2,unit.id+'/'+grade+' teach then retrieval');
   questions.forEach((q,i)=>{
    ok(q.options.length===4&&new Set(q.options).size===4&&q.answer>=0&&q.answer<4,unit.id+'/'+grade+'/'+i+' one clear correct');
    answerPositionCounts[q.answer]++;
    ok(q.options[q.answer]&&q.why&&q.prompt,unit.id+'/'+grade+'/'+i+' rationale');
   });
   ok(!!app.render('#/studio/'+lang+'/unit/'+unit.id,grade).includes('ls-guide-panel'),unit.id+' guide');
   ok(!!app.render('#/studio/'+lang+'/write/'+unit.id,grade).includes('ls-draft'),unit.id+' writing');
   ok(!!app.render('#/studio/'+lang+'/talk/'+unit.id,grade).includes('ls-talk-steps'),unit.id+' speaking');
   ok(unit.write.length>35&&unit.talk.length>35,unit.id+' sufficiently useful writing/speaking prompts');
  }
  const deck=app.gameDeck(lang,grade,'quiz');
  ok(deck.length===5&&new Set(deck.map(x=>x.unit.id)).size===5,lang+grade+' quiz range');
  const matching=app.matchDeck(lang,grade);
  ok(matching.length===6&&new Set(matching.map(x=>x.id)).size===6,lang+grade+' matching range');
  const order=app.orderDeck(lang,grade);
  ok(order.length===3,lang+grade+' ordering range');
 }
 const gids=d.units.filter(x=>x.lang===lang).map(x=>x.id);
 ok(new Set(gids).size===gids.length,lang+' stable unique content IDs');
}
ok(answerPositionCounts.every(x=>x>15),'Answer positions dispersed across all choices '+JSON.stringify(answerPositionCounts));
ok(d.units.some(x=>x.quiz.grade8.prompt!==x.quiz.grade9.prompt),'grade variation');
ok(d.units.every(x=>x.quiz.grade8.prompt!==x.quiz.grade9.prompt),'every module grade-aware question');
ok(app.render('#/studio/en/unit/en-listen-gist','grade8').includes('data-ls="listen-example"'),'English listening offers playable example');
ok(app.render('#/spel','grade9').includes('ls-game-grid'),'common games hub');
ok(!/NP-|nationella prov|national test/i.test(d.units.map(x=>x.title+' '+x.teach).join(' ')),'student-facing lessons are ordinary curriculum');
ok(!/localStorage|sessionStorage|fetch\(|XMLHttpRequest|WebSocket|indexedDB/.test(fs.readFileSync(path.join(__dirname,'../lara/language-studio.js'),'utf8')),'new games leave account/personal answers untouched');
console.log('LANGUAGE STUDIO CONTENT '+checks+'/'+checks+' PASS: '+JSON.stringify(stats));
