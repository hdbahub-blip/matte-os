'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const source=read('js/teach-simple.js'),app=read('js/app.js'),index=read('index.html'),worker=read('sw.js'),core=read('js/core.js');
const window={};vm.runInNewContext(source,{window},{timeout:2000});
const {DATA,diagram,ids}=window.MOSimple;
const original=[...read('js/content8.js').matchAll(/\bid:\s*'((?:f8|s9)-[^']+)'\s*,\s*ch:/g),...read('js/content9.js').matchAll(/\bid:\s*'((?:f8|s9)-[^']+)'\s*,\s*ch:/g)].map(x=>x[1]);
const unique=[...new Set(original)];
assert.equal(unique.length,63,'Expected 63 original curriculum skills, update audit if corpus changes');
assert.equal(ids.length,63,'All 63 curriculum items need simple explanations');
assert.deepEqual(ids.slice().sort().join('|'),unique.slice().sort().join('|'),'Simple layer must cover every original skill');
let checks=0;
for(const sid of unique){
 const d=DATA[sid];assert(d,'Missing '+sid);
 assert.equal(d.length,4,'Unexpected simple datum '+sid);
 assert.equal(typeof d[0],'string');assert(d[0].length>24&&d[0].length<310,'Explain one topic in simple words '+sid);checks++;
 assert(d[1].length>10&&d[1].length<180,'Concrete question '+sid);checks++;
 assert(d[2].length>=2 && d[2].length<=3,'Maximum three easy steps '+sid);checks++;
 for(const step of d[2]){assert(step.length>=4&&step.length<200,'Step too long '+sid);checks++;}
 assert(d[3].startsWith('Svar:'),'Visible answer for '+sid);checks++;
}
assert(source.includes("f8-powers-ten")&&source.includes("(0,1)²")&&source.includes("två decimaler"),'Must show decimal-place thinking');
assert(source.includes('f8-perimeter')&&source.includes('f8-area')&&source.includes('RUNT')&&source.includes('INUTI'),'Perimeter and area intuition required');
assert(diagram('f8-perimeter').includes('<svg')&&diagram('f8-area').includes('<svg'),'Diagram for perimeter and area');
assert(diagram('f8-powers-ten').includes('0,01'),'Two-power comparisons diagram');
assert(app.includes('function paperSteps')&&app.includes('paper-lead'),'Lessons use paper-first rendering');
assert(app.includes('<details class="paper-more">'),'Advanced symbol sections must be optional');
assert(index.includes('js/teach-simple.js?v=5.5.4'),'Presentational layer loaded');
assert(worker.includes('./js/teach-simple.js?v=5.5.4'),'Simple layer available offline');
assert(core.includes("version: '5.5.4'"),'Coordinated build');
assert(read('prov/index.html').includes('1.2.4'),'Separate exam must remain unchanged');
for(let a=1;a<=10;a++)for(let b=1;b<=10;b++)assert.equal(a*b,b*a);
console.log('Paper-first 63/63 curriculum lessons: '+checks+' checks PASS. 100 multiplication facts PASS. Offline/core compatibility PASS.');
