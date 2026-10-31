/* Tabellarenan integrated-route regression.
   Run: node tests/tabell-integration.js
   No browser dependencies. Simulated ShadowRoot and localStorage.
*/
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..');
const code=name=>fs.readFileSync(path.join(base,name),'utf8');
const storage={};
const win={localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=String(v),removeItem:k=>delete storage[k]},addEventListener(){},scrollTo(){}};
for(const p of ['js/core.js','js/content9.js','js/content8.js','js/engine.js','js/tables.js'])new Function('window','globalThis',code(p))(win,win);
win.MOEngine.load();win.MOEngine.state().active='grade9';win.MOEngine.save();
let shadow,hash='#/tabell/home',host;
const fields={answer:{value:''},player1:{value:'A'},player2:{value:'B'},dueltable:{value:'mixed'}};
const doc={getElementById:id=>id==='arena'?host:null};
const loc={get hash(){return hash},set hash(v){hash=v},search:'',protocol:'https:'};
new Function('window','document','location','navigator','scrollTo',code('js/tabell-arena.js'))(win,doc,loc,{serviceWorker:{}},()=>{});
function mount(){
  for(let k=0;k<4;k++){
    const prev=hash;
    host={attachShadow(){
      shadow={innerHTML:'',events:{},addEventListener(e,fn){this.events[e]=fn},getElementById:id=>fields[id],activeElement:null};
      return shadow;
    }};
    win.MOTabellArena.mount();
    if(hash===prev)break;
  }
}
const goto=v=>{hash='#/tabell/'+v;mount()};
const click=(act,value)=>{shadow.events.click({target:{closest:()=>({dataset:{act,value}})}});mount()};
const submit=(id,value)=>{if(id==='answerform')fields.answer.value=String(value);shadow.events.submit({target:{id},preventDefault(){}});mount()};
let checks=0,failed=[];
const ok=(cond,id)=>{checks++;if(!cond)failed.push(id)};
mount();ok(shadow.innerHTML.includes('Välj din tabell'),'home');
for(let n=1;n<=10;n++){
  goto('table/'+n);
  ok(Array.from({length:10},(_,i)=>i+1).every(k=>shadow.innerHTML.includes('<b>'+n+'</b> × '+k)&&shadow.innerHTML.includes('= '+(n*k))),'all reference equations '+n);
}
goto('practice/7');ok(shadow.innerHTML.includes('1 / 10'),'deep-linked table practice');
for(let i=0;i<10;i++){
  const m=shadow.innerHTML.match(/<div class="equation">(\d+) <span>×<\/span> (\d+)/);
  if(!m){ok(false,'question '+i);break}
  submit('answerform',Number(m[1])*Number(m[2]));
  ok(shadow.innerHTML.includes('Rätt!'),'correct feedback '+i);
  click('next');
}
ok(shadow.innerHTML.includes('10/10'),'practice scoring');
goto('home');click('mixed');ok(shadow.innerHTML.includes('BLANDPROV'),'mixed starts');
for(let i=0;i<20;i++){
  const m=shadow.innerHTML.match(/<div class="equation">(\d+) <span>×<\/span> (\d+)/);
  if(!m){ok(false,'mixed question '+i);break}
  submit('answerform',Number(m[1])*Number(m[2]));
  if(i<19)ok(!shadow.innerHTML.includes('class="feedback'),'no live correction in mixed '+i);
}
ok(shadow.innerHTML.includes('20/20'),'mixed scoring');
goto('duel/setup');ok(shadow.innerHTML.includes('duelform'),'duel setup');
submit('duelform');ok(shadow.innerHTML.includes('Fråga 1 av 10'),'duel starts with question label');
click('buzz','0');ok(shadow.innerHTML.includes('tryckte först'),'buzzer locks');
ok(!shadow.innerHTML.includes('Facit ·'),'answer hidden until reveal');
click('revealDuel');ok(shadow.innerHTML.includes('Facit ·'),'facit revealed only after buzzer');
const duelEq=shadow.innerHTML.match(/<div class="duel-question">(\d+) <span>×<\/span> (\d+)/);
ok(!!duelEq && shadow.innerHTML.includes('= '+(Number(duelEq[1])*Number(duelEq[2]))),'mathematically correct facit');
click('awardDuel','1');ok(shadow.innerHTML.includes('+1 poäng till B'),'point awarded to non-buzzer');
click('undoDuel');ok(shadow.innerHTML.includes('Facit ·'),'undo reopens facit and scoring');
click('awardDuel','1');ok(shadow.innerHTML.includes('+1 poäng till B'),'awarded after undo');
click('duelNext');ok(shadow.innerHTML.includes('Fråga 2 av 10'),'next question');
click('buzz','0');click('revealDuel');click('awardDuel','none');ok(shadow.innerHTML.includes('Ingen poäng'),'no point');
click('duelNext');
for(let i=2;i<10;i++){click('buzz',String(i%2));click('revealDuel');click('awardDuel',String(i%2));click('duelNext')}
ok(shadow.innerHTML.includes('DUELL KLAR'),'duel result');
ok(win.MOEngine.prof('grade9').tables.sessions.length===2,'duel does not contaminate pupil mastery');
ok(!!JSON.parse(win.MOEngine.exportData()).state.profiles.grade9.tables,'backup includes table state');
console.log('Tabellarenan integrated QA: '+(checks-failed.length)+'/'+checks+' PASS');
if(failed.length){console.error(failed.join('\n'));process.exitCode=1}
