/* Cross-site figure consistency regression suite
   Run: node tests/figure-consistency.js */
'use strict';
const assert=require('node:assert/strict');
const S8=require('../js/content8.js'),S9=require('../js/content9.js');
const V=require('../js/visuals.js');
const EV=require('../prov/js/exam-visuals.js');
const M=require('../js/math.js');
const all=[...S8,...S9];
let checks=0;
const verify=(c,msg)=>{checks++;assert.ok(c,msg)};
const visible=html=>String(html).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const pick=(sid,start)=>all.find(x=>x.id===sid).p.find(q=>q.q.startsWith(start));
const roof=pick('s9-pyth-more','Ett likbent tak');
for(const [name,h] of [['Matte OS',V.render(roof.vis)],['Matte Prov',EV.render(roof,'s9-pyth-more')]]){
 const t=visible(h);verify(t.includes('8 m')&&t.includes('5 m'),name+': roof must be in meters');verify(!t.includes('cm'),name+': roof incorrectly shows cm');
}
const cross=pick('s9-angles-more','Två linjer korsar');
const cross2=pick('s9-angles-more','Vinkel 2 är 115');
for(const item of [cross,cross2]){
 const x=visible(V.render(item.vis));verify(!/parallella/i.test(x),'single intersection cannot claim parallel');
 verify(/\?/.test(x),'missing unknown angle marker');
 const y=EV.render(item,'s9-angles-more');verify(/Två korsande linjer/.test(y),'exam aria must describe crossed lines');
}
const para=pick('s9-angles-more','Linjerna är parallella');
verify(/parallella/.test(V.render(para.vis)),'parallel relation must remain visible');
const tr=pick('s9-pythagoras','Kateterna är 9 cm');
verify(visible(EV.render(tr,'s9-pythagoras')).includes('9 cm'),'pythagoras must preserve cm');
verify(!visible(EV.render(tr,'s9-pythagoras')).includes('9 m '),'pythagoras cannot transform cm to m');
const square=pick('s9-pythagoras','En kvadrat har sidan 7 cm');
const fig=EV.render(square,'s9-pythagoras');
verify(fig.includes('width="150" height="150"'),'square must have equal displayed side lengths');
const angle=pick('f8-sector','En sektor i en cirkel');
const angText=visible(EV.render(angle,'f8-sector'));
verify(angText.includes('v = ?'),'unknown sector angle must remain unknown');
verify(!angText.includes('v = 90'),'sector must not leak numeric solution');
let svgCount=0,exerciseCount=0,mathCount=0,invalid=0;
for(const s of all){
 for(const spec of [s.cvis,s.ex.vis,s.g.vis,...s.p.map(p=>p.vis)].filter(Boolean)){
  const h=V.render(spec);svgCount++;verify(h.startsWith('<svg')&&!/NaN|undefined/.test(h),'invalid learning SVG '+s.id);
 }
 for(const q of [s.g,...s.p]){
  exerciseCount++;
  if(q.type!=='num'||!q.calc)continue;mathCount++;
  const computed=Function('"use strict";return ('+q.calc+')')();
  const rounded=q.dec!=null?Math.round(computed*10**q.dec)/10**q.dec:computed;
  verify(Math.abs(rounded-q.a)<=Math.max(1e-9,Math.abs(q.a)*1e-9),'calc differs from answer '+s.id);
 }
}
verify(exerciseCount===403,'expect 403 guided+practice exercises');
verify(svgCount===288,'expect 288 explicit learning diagrams across all phases');
console.log('Figure consistency QA: '+checks+'/'+checks+' PASS; '+svgCount+' SVG, '+exerciseCount+' exercises, '+mathCount+' numeric calc');
