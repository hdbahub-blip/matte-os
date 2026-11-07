'use strict';
// Språkverkstad 3.0 content and logic QA. Content quality rules that can be checked automatically;
// pedagogical quality still needs human review (see docs/SPRAKVERKSTAD_3_0.md).
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const SV=require('../lara/texts-sv.js'),EN=require('../lara/texts-en.js');
const W=require('../lara/sprak.js');
const X=W._test;
let n=0;const ok=(c,m)=>{n++;assert(c,m);};
const ALL=[...SV,...EN];
ok(X.BANK.length===ALL.length,'engine loads every text');

/* ---- bank shape: genre breadth, levels that allow a transfer text ---- */
for(const [lang,list] of [['sv',SV],['en',EN]]){
 ok(list.length>=6,lang+': at least six texts');
 for(const lvl of [1,2,3])ok(list.filter(t=>t.level===lvl).length>=2,lang+': two texts on level '+lvl+' so a new text can test transfer');
 ok(new Set(list.map(t=>t.genre)).size>=5,lang+': at least five genres');
 const mean=lvl=>{const a=list.filter(t=>t.level===lvl).map(X.words);return a.reduce((s,x)=>s+x,0)/a.length;};
 ok(mean(1)<mean(2)&&mean(2)<mean(3),lang+': texts get longer with level');
}
const ids=new Set();
for(const t of ALL){
 const where=t.lang+':'+t.id;
 ok(!ids.has(where),'unique id '+where);ids.add(where);
 ok(Number.isInteger(t.version)&&t.version>=1,'content version '+where);
 ok([1,2,3].includes(t.level),'level '+where);
 ok(t.title&&t.lead&&t.purpose&&t.genre,'metadata '+where);
 ok(t.talk&&t.talk.prompt&&t.talk.follow,'discussion '+where);
 const words=X.words(t);
 ok(words>=[0,170,280,400][t.level],'length fits level '+where+' ('+words+' words)');
 ok(t.paragraphs.length>=4,'several paragraphs '+where);
 const full=t.paragraphs.join(' ');
 const types=new Set(t.tasks.map(k=>k.type));
 ok(t.tasks.length>=8,'at least eight tasks '+where);
 ok(types.size>=4&&types.has('evidence')&&types.has('open')&&types.has('cloze'),'varied task types incl. evidence, cloze, open '+where);
 const skills=t.tasks.map(k=>k.skill);
 ok(skills.includes('hitta')&&skills.includes('slutsats'),'both on-the-lines and between-the-lines '+where);
 if(t.level>=2)ok(skills.some(s=>['kritik','syfte','tolka'].includes(s)),'level 2+ asks for analysis '+where);
 if(t.level===3)ok(skills.filter(s=>['slutsats','tolka','kritik'].includes(s)).length>=3,'level 3 has at least three deeper reasoning tasks '+where);
 const taskIds=new Set();
 for(const k of t.tasks){
  const at=where+':'+k.id;
  ok(!taskIds.has(k.id),'unique task id '+at);taskIds.add(k.id);
  ok(X.SKILLS[k.skill],'known skill '+at);
  if(k.type==='choice'){
   ok(k.options.length>=3&&k.options.length<=4,'3–4 options '+at);
   ok(new Set(k.options.map(X.norm)).size===k.options.length,'options are distinct '+at);
   ok(k.why&&k.why.length>=25,'explanation '+at);
   ok(!/(sista|första|andra|tredje|översta|nedersta) alternativet|\b(last|first|second|top|bottom) option|alternativ [A-D]\b|option [A-D]\b/i.test(k.why),'explanation does not refer to an option position, which is shuffled '+at);
   if(k.evidence)ok(full.split(k.evidence).length===2,'evidence occurs exactly once in the passage '+at);
   else ok(k.skill==='syfte','only purpose questions may lack a quoted line '+at);
  }
  if(k.type==='evidence'){const list=X.sentenceList(t);for(const g of k.targets)ok(list.filter(s=>s.s.includes(g)).length===1,'target matches exactly one sentence '+at);ok(k.claim&&k.why,'claim and reason '+at);}
  if(k.type==='order'){ok(k.items.length>=4&&new Set(k.items).size===k.items.length,'at least four distinct events '+at);const d=X.displayOrder(t,k);ok(!d.every((v,i)=>v===i),'order task never starts solved '+at);}
  if(k.type==='cloze'){ok(k.sentence.split('___').length===2,'one blank '+at);ok(k.accept.includes(k.options[0]),'first help option is accepted '+at);ok(k.options.slice(1).every(o=>!k.accept.map(X.norm).includes(X.norm(o))),'distractor words are not accepted '+at);ok(!full.includes(k.sentence.split('___')[0].trim())||k.sentence.split('___')[0].trim().length<12,'cloze sentence is a new context, not copied from the text '+at);}
  if(k.type==='open'){ok(k.criteria.length>=3,'three criteria '+at);ok(k.model.length>=60,'example answer '+at);}
 }
}

/* ---- guessing cannot win: no position or length cue ---- */
const pos={},choice=[];let longest=0,shortest=0;
for(const t of ALL)for(const k of t.tasks){if(k.type!=='choice')continue;choice.push(k);const d=X.displayOrder(t,k);const p=d.indexOf(0);pos[p]=(pos[p]||0)+1;
 const L=k.options.map(o=>o.length),max=Math.max(...L),min=Math.min(...L);if(L[0]===max&&L.filter(x=>x===max).length===1)longest++;if(L[0]===min&&L.filter(x=>x===min).length===1)shortest++;}
for(const p of [0,1,2])ok((pos[p]||0)>0,'correct answer appears in position '+p);
ok(Math.max(...Object.values(pos))/choice.length<=0.4,'no display position holds more than 40 % of correct answers '+JSON.stringify(pos));
ok(longest/choice.length<=0.35,'correct answer is the uniquely longest option in at most 35 % ('+longest+'/'+choice.length+')');
ok(shortest/choice.length<=0.4,'correct answer is the uniquely shortest option in at most 40 % ('+shortest+'/'+choice.length+')');
const always=[0,1,2,3].map(p=>{let s=0;for(const t of ALL)for(const k of t.tasks)if(k.type==='choice'&&X.evaluate(t,k,p).ok)s++;return s/choice.length;});
ok(Math.max(...always)<=0.4,'always tapping the same letter scores at most 40 % '+always.map(x=>x.toFixed(2)).join('/'));

/* ---- deterministic: same text, version and task give the same order everywhere ---- */
for(const t of ALL)for(const k of t.tasks)if(k.type==='choice'||k.type==='order'){const a=X.displayOrder(t,k).join(),b=X.displayOrder(JSON.parse(JSON.stringify(t)),JSON.parse(JSON.stringify(k))).join();ok(a===b,'stable order '+t.id+':'+k.id);}
const src=fs.readFileSync(path.join(__dirname,'../lara/sprak.js'),'utf8');
ok(!src.includes('Math.random'),'no random ordering');
ok(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon/.test(src),'workshop sends nothing over the network');
ok(!/setItem\([^)]*open/.test(src),'open answers are never written to storage');

/* ---- answer checking ---- */
for(const t of ALL)for(const k of t.tasks){
 if(k.type==='choice'){const d=X.displayOrder(t,k);ok(X.evaluate(t,k,d.indexOf(0)).ok,'correct choice accepted '+k.id);ok(!X.evaluate(t,k,d.indexOf(1)).ok,'wrong choice rejected '+k.id);}
 if(k.type==='evidence'){const list=X.sentenceList(t);const right=list.findIndex(s=>s.s.includes(k.targets[0]));ok(X.evaluate(t,k,right).ok,'right sentence accepted '+k.id);ok(!X.evaluate(t,k,right===0?1:0).ok||k.targets.some(g=>list[right===0?1:0].s.includes(g)),'other sentence rejected '+k.id);}
 if(k.type==='order'){const d=X.displayOrder(t,k);const right=k.items.map((_,i)=>d.indexOf(i));ok(X.evaluate(t,k,right).ok,'correct order accepted '+k.id);ok(!X.evaluate(t,k,right.slice().reverse()).ok,'reversed order rejected '+k.id);ok(!X.evaluate(t,k,right.slice(0,-1)).ok,'incomplete order rejected '+k.id);}
 if(k.type==='cloze'){for(const a of k.accept){ok(X.evaluate(t,k,'  '+a.toUpperCase()+'. ').ok,'accepts '+a+' with case and punctuation '+k.id);}ok(!X.evaluate(t,k,k.options[1]).ok,'rejects distractor '+k.id);ok(!X.evaluate(t,k,'').ok,'rejects empty '+k.id);for(const [w,msg] of Object.entries(k.near||{})){const r=X.evaluate(t,k,w);ok(!r.ok&&r.near===msg,'near-miss feedback '+k.id);}}
}

/* ---- storage hygiene and progression ---- */
const now=Date.now(),D=86400000;
const dirty={v:3,profiles:{grade8:{tasks:{'sv:buss:t1':{ok:'yes',help:0,at:now},'sv:nope:t1':{ok:true,at:now},'sv:buss:t2':{ok:true,at:5}},texts:{'sv:buss':{done:now,started:now},'xx:y':{done:now}}},grade9:{tasks:{}}}};
const clean=X.sanitize(dirty);
ok(clean.profiles.grade8.tasks['sv:buss:t1'].ok===false,'non-boolean result coerced to false');
ok(!clean.profiles.grade8.tasks['sv:nope:t1'],'unknown text dropped');
ok(!clean.profiles.grade8.tasks['sv:buss:t2'],'impossible timestamp dropped');
ok(!clean.profiles.grade8.texts['xx:y'],'unknown text record dropped');
ok(Object.keys(clean.profiles.grade9.tasks).length===0,'profiles are separate');
ok(X.sanitize({v:2,profiles:{}}).v===3&&Object.keys(X.sanitize(null).profiles.grade8.tasks).length===0,'old or empty storage starts clean');
const auto=t=>t.tasks.filter(k=>k.type!=='open');
const pass=(p,t,at,help=false)=>{const s={};for(const k of t.tasks){if(k.type==='open')s[t.lang+':'+t.id+':'+k.id]={self:3,at,help:false};else s[t.lang+':'+t.id+':'+k.id]={ok:true,help,at};}return s;};
const sv1=SV.filter(t=>t.level===1);
X.setStore({v:3,profiles:{grade8:{tasks:{},texts:{}},grade9:{tasks:{},texts:{}}}});
ok(X.recommend('grade9','sv').t.level===1,'new learner starts on level 1');
X.setStore({v:3,profiles:{grade8:{tasks:{},texts:{}},grade9:{tasks:pass('grade9',sv1[0],now),texts:{['sv:'+sv1[0].id]:{started:now,done:now}}}}});
let r=X.recommend('grade9','sv');ok(r.t.id===sv1[1].id&&/ny text/i.test(r.why),'after one passed text: a NEW text on the same level (transfer)');
ok(X.recommend('grade8','sv').t.level===1,'the other profile is not affected');
let sk=X.skillStatus('grade9','sv');ok(sk.hitta.level===2,'one text alone is not mastery');
X.setStore({v:3,profiles:{grade8:{tasks:{},texts:{}},grade9:{tasks:{...pass('grade9',sv1[0],now-3*D),...pass('grade9',sv1[1],now)},texts:{['sv:'+sv1[0].id]:{done:now-3*D},['sv:'+sv1[1].id]:{done:now}}}}});
sk=X.skillStatus('grade9','sv');ok(sk.hitta.level===4,'independent success in a new text days later = consolidated');
ok(X.recommend('grade9','sv').t.level===2,'both level-1 texts passed: move to level 2');
X.setStore({v:3,profiles:{grade8:{tasks:{},texts:{}},grade9:{tasks:{...pass('grade9',sv1[0],now),...pass('grade9',sv1[1],now)},texts:{}}}});
ok(X.skillStatus('grade9','sv').hitta.level===3,'two texts on the same day: independent, not yet consolidated');
X.setStore({v:3,profiles:{grade8:{tasks:{},texts:{}},grade9:{tasks:{...pass('grade9',sv1[0],now,true)},texts:{}}}});
ok(X.skillStatus('grade9','sv').hitta.label==='Klarar med stöd','hint use is shown as support, not independence');
ok(X.skillStatus('grade9','sv').resonera.self===true,'open answers are labelled as self-assessed');
X.setStore(X.empty());

/* ---- rendering: every text, mode and the retired 2.0 links ---- */
for(const lang of ['sv','en'])ok(W.library(lang,'grade9').includes('Nivå 3'),'library renders '+lang);
for(const t of ALL)ok(W.page('/verkstad/'+t.lang+'/'+t.id,'grade8').includes(t.title.replace(/&/g,'&amp;').replace(/'/g,'&#39;')),'page renders '+t.id);
ok(W.page('/verkstad/sv/skarmbild/2','grade9').includes('ersatts'),'retired 2.0 link explains replacement');
ok(X.tasksFor(ALL[0],'listen').every(k=>k.type!=='evidence'),'listen mode skips tasks that need the visible text');
ok(X.code(SV[0])==='SV-'+SV[0].id.toUpperCase()+' · v1','visible challenge code with content version');
const audit=W.audit();
console.log('Språkverkstad 3.0 QA PASS: '+n+' checks · '+audit.texts+' texts ('+audit.perLang.sv+' sv, '+audit.perLang.en+' en) · '+audit.tasks+' tasks · correct-answer positions '+JSON.stringify(pos)+' · longest-option cue '+longest+'/'+choice.length);
