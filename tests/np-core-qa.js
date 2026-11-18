'use strict';
// Logikkärnan: källvalidering, textspaning, framsteg som händelser (inte skrivlängd), migrering, sammanslagning, återtest.
const assert=require('node:assert/strict');global.window=global;
const K=require('../lara/np-core.js'),F=require('./np-fixture.js');let n=0;const ok=(c,m)=>{n++;assert(c,m);};
const f=F.make();
// källpaket
ok(K.sourceOK(f),'fixture valid');
for(const [name,mut] of [['3 questions',o=>o.questions.pop()],['no discussion',o=>{delete o.discussionQuestion}],['few paras',o=>{o.textParagraphs=o.textParagraphs.slice(0,3)}],['wrong grade',o=>{o.grade='grade8'}],['wrong format',o=>{o.format='x'}],['bad section index',o=>{o.sections[0].paras=[99]}],['huge para',o=>{o.textParagraphs[0]='x'.repeat(13000)}],['bad keypoint',o=>{o.sections[0].keyPoints=[1]}]]){const g=F.make();mut(g);ok(!K.sourceOK(g),'rejects '+name);}
const nd=K.normalize(f);ok(nd.questions.length===5&&nd.questions[4]===f.discussionQuestion,'4 school questions + discussion');ok(nd.sections.length===3,'sections kept');
const v1=F.make();v1.format='matte-os-np-private-v1';delete v1.sections;delete v1.fidelity;const n1=K.normalize(v1);ok(n1&&n1.v===1&&n1.sections.length===2&&n1.sections[0].paras.length===4,'v1 package gets automatic sections');
// textspaning
const weak=K.analyse('Den var bra.');ok(weak.count<=1,'weak answer: few ingredients');
const strong=K.analyse('Jag tror att hon är rädd eftersom hon raderar allt. ”Hon raderar” visar det. Å andra sidan kan hon vara osäker.');ok(strong.because&&strong.evidence&&strong.other&&strong.claim&&strong.count===4,'strong answer: all four');
ok(K.analyse('x',{evidenceCount:1}).evidence&&K.analyse('x',{perspectiveDone:true}).other,'attached evidence/perspective count');
const filler='ord '.repeat(400);ok(K.analyse(filler).count<=1,'length alone earns nothing');
// frågor
for(const [q,open] of [['Varför tror du att hon valde det?',true],['Hur skulle det kännas om det var tvärtom?',true],['Vad tror du hände sedan?',true],['Är det inte orättvist?',false],['Tycker du inte att det är konstigt?',false],['Har du läst boken?',false]])ok(K.questionKind(q).open===open,'question kind: '+q);
ok(!K.questionKind('Varför tror du det').ok&&K.questionKind('Varför tror du det?').ok,'question mark required');
// kopiering
const src=f.textParagraphs.join(' ');ok(K.copyRatio(src.slice(0,160),src)>0.8,'copy detected');ok(K.copyRatio('Mira väntar på någon som kanske aldrig kommer men hoppas ändå',src)<0.5,'own words ok');
// stödord
ok(K.cues(['rubrik, bild','svar, skäl'],1)[0]==='rubrik · bild'&&K.cues(['rubrik, bild','svar, skäl'],2).join()==='rubrik,svar'&&K.cues(['a','b'],3).join('')==='','cue fading');
// lagring
const N={},A={};ok(K.mergeEntries(N,A,{a:{value:'x',at:5}})&&N.a==='x','merge new');ok(!K.mergeEntries(N,A,{a:{value:'y',at:4}})&&N.a==='x','older ignored');ok(K.mergeEntries(N,A,{a:{value:'z',at:9}})&&N.a==='z','newer wins');
ok(!K.mergeEntries(N,A,{b:{value:{o:1},at:9},['k'.repeat(91)]:{value:'x',at:9},c:{value:'x'.repeat(10001),at:9}})&&!('b' in N),'invalid entries rejected');
// migrering v1
const m={q0:'Mitt gamla svar',u1:'gammal u1',p1:'gammal p1',rubric0:true,highlight:'citat'},ma={q0:7,u1:8,p1:9,rubric0:10,highlight:11};
const moved=K.migrateV1(m,ma);ok(moved>=4,'migrated');ok(m['ans.q0.a1']==='Mitt gamla svar'&&m['pres.1']==='gammal p1'&&m['legacy.u1']==='gammal u1'&&m['legacy.highlight']==='citat'&&m['legacy.rubric0']===true,'v1 keys mapped, rest kept as legacy');ok(m.q0==='Mitt gamla svar','old key untouched (rollback)');
m['ans.q0.a1']='Nytt svar';ok(K.migrateV1(m,ma)===0&&m['ans.q0.a1']==='Nytt svar','migration idempotent, never overwrites');
// framsteg = handling
const t0=1700000000000,J=JSON.stringify;
let notes={'ans.q0.a1':'ord '.repeat(2000)};ok(K.qState(notes,0,t0).level===1&&!K.qState(notes,0,t0).revised,'long first answer is only a first answer');
notes={'ans.q0.a1':'Jag tycker att den är bra.','ans.q0.a2':J({t:'Jag tycker att den är bra.',at:t0})};ok(!K.qState(notes,0,t0).revised,'identical rewrite is not a revision');
notes['ans.q0.a2']=J({t:'Jag tycker att den är bra eftersom den är ärlig.',at:t0});ok(!K.qState(notes,0,t0).revised,'changed text without saying what improved is not enough');
notes['ans.q0.better']=J(['because']);ok(K.qState(notes,0,t0).revised&&K.qState(notes,0,t0).level===3,'revision = changed + named improvement');
ok(!K.qState(notes,0,t0).spoken,'not spoken yet');notes['ans.q0.oral']=J([{lvl:1,rate:'free',at:t0}]);ok(!K.qState(notes,0,t0).spoken,'level 1 alone does not count as spoken');
notes['ans.q0.oral']=J([{lvl:2,rate:'read',at:t0}]);ok(!K.qState(notes,0,t0).spoken,'reading aloud does not count');
notes['ans.q0.oral']=J([{lvl:2,rate:'partly',at:t0}]);ok(K.qState(notes,0,t0).spoken&&K.qState(notes,0,t0).level===4,'faded practice counts');
ok(!K.qState(notes,0,t0+19*3600e3).retestReady&&K.qState(notes,0,t0+21*3600e3).retestReady,'retest unlocks after ~20 h');
const full='Jag tror att hon väntar eftersom hon hoppas. ”Hon kommer tillbaka” visar det. Å andra sidan kan hon vara envis.',tN=t0+22*3600e3,tR=t0+21*3600e3;
notes['ans.q0.rt']=J({t:'Svar.',at:tR,help:0});ok(!K.qState(notes,0,tN).retested,'thin retest does not count');
notes['ans.q0.rt']=J({t:full,at:tR,help:0});ok(K.qState(notes,0,tN).retested&&!K.qState(notes,0,tN).retestReady,'full retest counts and closes the offer');
notes['ans.q0.rt']=J({t:full,at:tR,help:1});ok(!K.qState(notes,0,tN).retested,'retest with help does not count as independent');
notes['ans.q0.rt']=J({t:full,at:t0+3600e3,help:0});ok(!K.qState(notes,0,tN).retested&&K.qState(notes,0,tN).retestReady,'a retest saved before the delay (e.g. via a typed link) does not count');
notes['ans.q0.rt']=J({t:full,at:tN+9e9,help:0});ok(!K.qState(notes,0,tN).retested,'a retest dated in the future does not count');
notes['ans.q0.rt']=J({t:full,at:tR,help:0});ok(!K.qState(notes,0,t0+3600e3).retested,'no retest counts before the delay has passed');
// stationer
const doc=K.normalize(f);let sm=K.summary({},doc,t0);ok(K.nextStation(sm)==='start','new student starts at 1');
let sn={'quiz.pass':'1'};sm=K.summary(sn,doc,t0);ok(K.nextStation(sm)==='read','after quiz: read');
sn['read.s0']=J({t:'Mira väntar vid bussen',kp:[]});sn['read.s1']=J({t:'Hon byter plats i klassrummet',kp:[]});ok(K.nextStation(K.summary(sn,doc,t0))==='read','retelling without evidence is not enough');
sn['ev.p0']=J({kind:'says',note:'visar att hon väntar'});sn['ev.p1']=J({kind:'reads',note:'klockan'});ok(K.nextStation(K.summary(sn,doc,t0))==='read','two sections of three retold is not enough');
sn['read.s2']=J({t:'Hon går till köket och får te',kp:[]});ok(K.nextStation(K.summary(sn,doc,t0))==='think','read done: every section retold + two evidence paragraphs');
for(let i=0;i<4;i++){sn['ans.q'+i+'.a1']='Mitt första svar nummer '+i;sn['ans.q'+i+'.a2']=J({t:'Mitt bättre svar nummer '+i+' eftersom',at:t0});sn['ans.q'+i+'.better']=J(['because']);if(i===0)sn['ans.q0.oral']=J([{lvl:2,rate:'free',at:t0}]);}
ok(K.nextStation(K.summary(sn,doc,t0))==='think','four of five improved answers is not enough');
sn['ans.q4.a1']='Mitt första svar nummer 4';sn['ans.q4.a2']=J({t:'Mitt bättre svar nummer 4 eftersom',at:t0});sn['ans.q4.better']=J(['because']);
ok(K.nextStation(K.summary(sn,doc,t0))==='think','improved without speaking aloud is not enough');
sn['ans.q1.oral']=J([{lvl:2,rate:'free',at:t0}]);ok(K.nextStation(K.summary(sn,doc,t0))==='present','all five improved + two spoken complete Tänk');
ok(K.stationProgress('think',K.summary(sn,doc,t0)).done===7,'progress counts (5 improved + 2 spoken)');
// ledar-övning: öppna frågor krävs
sn['lead.sims']=J({a:{good:true},b:{good:false},c:{good:true}});sn['lead.cards']=J([1,2,3]);sn['lead.followup1']='Är det bra?';sn['lead.followup2']='Varför då?';sn['lead.invite']='Vad tänker du?';
ok(!K.summary(sn,doc,t0).opening,'closed follow-up question is not an opening');sn['lead.followup1']='Hur skulle du ha gjort?';ok(K.summary(sn,doc,t0).opening,'two open questions + invitation = opening');
console.log('NP CORE QA PASS: '+n+' checks');
