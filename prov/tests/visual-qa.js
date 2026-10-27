/* Matte Prov v1.1 — figure QA
   Run with: node prov/tests/visual-qa.js */
'use strict';
const V=require('../js/exam-visuals.js');
const S9=require('../../js/content9.js');
const S8=require('../../js/content8.js');

let checks=0,fail=[];
const ok=(x,m)=>{checks++;if(!x)fail.push(m)};
const geo=[...S9,...S8].filter(s=>/geo/.test(s.ch));
const text=html=>String(html).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

let explicit=0;
for(const s of geo){
  for(const q of s.p){
    const html=V.render(q,s.id);
    if(q.vis){explicit++;ok(!!html,s.id+': explicit visual missing for '+q.q)}
    if(!html)continue;
    const t=text(html);
    ok(!/Pythagoras|formel|en tredjedel av|V\s*=\s*B|πr²|k²|k³/i.test(t),s.id+': teaching/formula leak in figure text: '+t);
    if(typeof q.a==='number'){
      const a=String(q.a).replace('.',',');
      const source=q.q+' '+(q.given||[]).join(' ');
      if(!source.includes(a)){
        const escaped=a.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
        const re=new RegExp('(^|[^0-9])'+escaped+'([^0-9]|$)');
        ok(!re.test(t),s.id+': hidden numeric answer '+a+' leaked into figure: '+t);
      }
    }
  }
}
const find=(sid,part)=>{const s=geo.find(x=>x.id===sid),q=s.p.find(x=>x.q.includes(part));return text(V.render(q,s.id))};
ok(find('f8-sector','Hur stor är vinkeln').includes('v = ?'),'Sector unknown angle must stay unknown');
ok(!find('f8-sector','Hur stor är vinkeln').includes('v = 90'),'Sector figure leaked 90°');
ok(find('s9-angles-more','Två linjer korsar').includes('48°'),'Crossing-line figure missing given angle');
ok(find('s9-pythagoras','rektangulär skärm').includes('48 cm')&&find('s9-pythagoras','rektangulär skärm').includes('36 cm'),'Screen figure missing dimensions');
ok(!/symmetrilinje.*4|4.*symmetrilinje/i.test(find('s9-symmetry','kvadrat')),'Symmetry count leaked in figure');
ok(!find('f8-surface-area','kub har sidan 4').includes('6 lika'),'Surface-area strategy leaked in cube figure');

console.log('Matte Prov figure QA: '+(checks-fail.length)+'/'+checks+' godkända · '+explicit+' explicita figuruppgifter');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}