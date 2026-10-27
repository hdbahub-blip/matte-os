(function(){
'use strict';

const APP='matte-prov-v1';
const app=document.getElementById('app');
const M=window.MOMath, V=window.MOVis, C=window.MO_CORE, PC=window.MOProvCore;
const ALL=[...(window.MO_CONTENT9||[]),...(window.MO_CONTENT8||[])];
const BYID=Object.fromEntries(ALL.map(s=>[s.id,s]));
let store=load();
let run=null;
let timerId=null;

function load(){
  try{return JSON.parse(localStorage.getItem(APP))||{grade:null,attempts:[],attemptNo:0}}catch{return {grade:null,attempts:[],attemptNo:0}}
}
function save(){localStorage.setItem(APP,JSON.stringify(store))}
function esc(s){return M.esc(String(s??''))}
function rich(s){return M.rich(String(s??''))}
function profile(){return C.profiles[store.grade]}
function skills(){return store.grade==='grade8'?window.MO_CONTENT8:window.MO_CONTENT9}
function skillList(ch){return skills().filter(s=>s.ch===ch)}
function chById(id){return profile().chapters.find(c=>c.id===id)}
function theme(){
  const g=store.grade;
  document.documentElement.style.setProperty('--accent',g==='grade8'?'#1d3557':'#6e1f35');
  document.documentElement.style.setProperty('--soft',g==='grade8'?'#e8eef5':'#f4e7eb');
}
function shell(content,focus=false){
  const p=profile();
  return '<div class="app">'+(focus?'':`<header class="top"><div class="topin"><div class="brand"><div class="mark">P</div><div><b>MATTE PROV</b><small>Diagnos · Prov</small></div></div><div class="spacer"></div>${p?`<button class="grade" data-grade>Å${p.label.replace(/\D/g,'')}</button>`:''}</div></header>`)+`<main class="wrap">${content}</main></div>`;
}
function render(){
  theme();
  if(!store.grade){app.innerHTML=shell(pickProfile());bind();return}
  if(run){app.innerHTML=shell(renderRun(),true);bindRun();return}
  app.innerHTML=shell(renderHome());bind();
}
function pickProfile(){
 return `<section class="pick"><div><div class="kicker" style="text-align:center">SEPARAT TESTMILJÖ</div><h1>Matte Prov</h1><p class="mut">Här tränar man inte. Här testar man vad som sitter utan ledtrådar och formelstöd.</p></div>
 <button class="pickbtn" data-pick="grade9"><span class="avatar g9">Å9</span><span><b>Åk 9</b><small>Tal · Geometri · Procent</small></span></button>
 <button class="pickbtn" data-pick="grade8"><span class="avatar g8">Å8</span><span><b>Åk 8</b><small>Tal · Geometri · Algebra</small></span></button></section>`;
}
function currentInfo(){
 const p=profile(),week=PC.isoWeek(),ch=PC.recommendedChapter(p,week);
 return {p,week,ch,skills:skillList(ch.id)};
}
function countFor(ch,mode){
 return PC.selectRun(skills(),ch,mode,store.attemptNo+1).length;
}
function renderHome(){
 const {p,week,ch,skills:ss}=currentInfo();
 const dcount=countFor(ch.id,'diagnos'),pcount=countFor(ch.id,'prov');
 const recent=store.attempts.slice(-4).reverse();
 return `<section class="hero"><div class="kicker">ÅK ${p.label.replace(/\D/g,'')} · VECKA ${week}</div><h1>Testa vad som faktiskt sitter.</h1><p class="mut">Separat från Matte OS. Under testet finns inga ledtrådar, formler eller direkt feedback.</p></section>
 <section class="panel">
   <div class="reco"><div><div class="kicker">REKOMMENDERAT OMRÅDE</div><h2>${esc(ch.name)}</h2><p class="mut" style="margin:0">Nästa kapitelprov enligt planeringen är vecka ${ch.examWeek}. Välj bara en av två vägar.</p></div><div class="examweek">Prov v${ch.examWeek}</div></div>
   <div class="modegrid">
     <button class="mode primary" data-start="diagnos" data-ch="${ch.id}"><b>Diagnos</b><span>${dcount} frågor · ingen timer · hittar luckor per moment</span></button>
     <button class="mode" data-start="prov" data-ch="${ch.id}"><b>Prov</b><span>${pcount} frågor · 45 min träningsprov · resultat först efteråt</span></button>
   </div>
 </section>
 <details class="details"><summary>Välj ett annat område</summary><div class="chapterlist">${p.chapters.map(x=>`<div class="chapter"><div><b>${esc(x.name)}</b><small>${skillList(x.id).length} moment · planerat prov v${x.examWeek}</small></div><div class="chapacts"><button class="mini" data-start="diagnos" data-ch="${x.id}">Diagnos</button><button class="mini dark" data-start="prov" data-ch="${x.id}">Prov</button></div></div>`).join('')}</div></details>
 ${recent.length?`<section class="panel history"><h3>Senaste resultat</h3>${recent.map(a=>`<div class="histrow"><div><b>${esc(a.chapterName)} · ${a.mode==='prov'?'Prov':'Diagnos'}</b><small>${new Date(a.finishedAt).toLocaleDateString('sv-SE')} · ${a.correct}/${a.total}</small></div><div class="scorepill">${a.percent}%</div></div>`).join('')}</section>`:''}
 <div class="footer">Resultat sparas bara på den här enheten. Testtiden 45 min är Matte Provs egen träningsinställning – inte skolans officiella provtid.</div>`;
}
function begin(mode,ch){
 store.attemptNo=(store.attemptNo||0)+1;save();
 const qs=PC.selectRun(skills(),ch,mode,store.attemptNo);
 run={
   mode,chapter:ch,chapterName:chById(ch).name,items:qs,index:0,answers:{},flags:{},
   startedAt:Date.now(),limitMs:mode==='prov'?45*60*1000:null
 };
 persistRun();startTimer();render();
}
function persistRun(){sessionStorage.setItem(APP+'-active',JSON.stringify(run))}
function clearRun(){sessionStorage.removeItem(APP+'-active')}
function resume(){
 try{
  const x=JSON.parse(sessionStorage.getItem(APP+'-active'));
  if(x&&x.items&&x.items.length){run=x;startTimer()}
 }catch{}
}
function timeLeft(){
 if(!run||!run.limitMs)return null;
 return Math.max(0,run.limitMs-(Date.now()-run.startedAt));
}
function fmtTime(ms){
 const sec=Math.ceil(ms/1000),m=Math.floor(sec/60),s=sec%60;
 return m+':'+String(s).padStart(2,'0');
}
function startTimer(){
 clearInterval(timerId);timerId=null;
 if(!run||!run.limitMs)return;
 timerId=setInterval(()=>{
   const el=document.querySelector('[data-timer]');
   const left=timeLeft();
   if(el)el.textContent=fmtTime(left);
   if(left<=0){clearInterval(timerId);timerId=null;submitRun(true)}
 },1000);
}
function current(){return run.items[run.index]}
function responseFor(q){
 const a=run.answers[q.sid+'|'+q.key];
 return a==null?'':a;
}
function setResponse(q,v){run.answers[q.sid+'|'+q.key]=v;persistRun()}
function renderInput(q){
 const x=q.item,val=responseFor(q);
 if((x.type||'num')==='choice'){
  return `<div class="options">${x.opts.map(o=>`<button type="button" class="opt ${val===o?'sel':''}" data-opt="${esc(o)}">${rich(o)}</button>`).join('')}</div>`;
 }
 if(x.type==='sci'){
  const mv=val&&typeof val==='object'?val.m:'',ev=val&&typeof val==='object'?val.e:'';
  return `<div class="sci"><input class="ansinput" id="ansm" inputmode="decimal" value="${esc(mv)}" placeholder="a" aria-label="Talet framför"><span>· 10</span><sup><input class="ansinput exp" id="anse" inputmode="text" value="${esc(ev)}" placeholder="n" aria-label="Exponent"></sup></div>`;
 }
 return `<input class="ansinput" id="ans" inputmode="${x.type==='expr'||x.type==='roots'?'text':'decimal'}" autocomplete="off" value="${esc(val)}" placeholder="Skriv ditt svar">`;
}
function renderRun(){
 const q=current(),x=q.item,left=timeLeft(),answered=Object.keys(run.answers).filter(k=>{
   const v=run.answers[k];return v!=null&&(typeof v==='object'?String(v.m||'').trim()&&String(v.e||'').trim():String(v).trim())
 }).length;
 const pct=(run.index/run.items.length)*100;
 const vis=x.vis?V.render(x.vis):'';
 return `<div class="runhead"><button class="back" data-exit>Avsluta</button><div class="progress"><i style="width:${pct}%"></i></div>${run.limitMs?`<div class="timer" data-timer>${fmtTime(left)}</div>`:''}</div>
 <section class="qcard">
  <div class="qmeta"><b>Fråga ${run.index+1} av ${run.items.length} · ${answered} besvarade</b><button class="flag ${run.flags[run.index]?'on':''}" data-flag>${run.flags[run.index]?'Markerad':'Markera'}</button></div>
  ${vis?`<div class="visual">${vis}</div>`:''}
  <div class="qtext">${rich(x.q)}</div>
  <div class="answer">${renderInput(q)}</div>
  <div class="navrow"><button class="btn secondary" data-prev ${run.index===0?'disabled':''}>← Föregående</button><button class="btn primary" data-next>${run.index===run.items.length-1?'Kontrollera innan inlämning':'Nästa →'}</button></div>
  <div id="runNotice"></div>
 </section>`;
}
function readInput(){
 const q=current(),x=q.item;
 if((x.type||'num')==='choice') return responseFor(q);
 if(x.type==='sci') return {m:document.getElementById('ansm')?.value||'',e:document.getElementById('anse')?.value||''};
 return document.getElementById('ans')?.value||'';
}
function commitInput(){setResponse(current(),readInput())}
function unanswered(){
 return run.items.map((q,i)=>({q,i,v:responseFor(q)})).filter(z=>{
   const v=z.v;return v==null||(typeof v==='object'?(!String(v.m||'').trim()||!String(v.e||'').trim()):!String(v).trim())
 });
}
function next(){
 commitInput();
 if(run.index<run.items.length-1){run.index++;persistRun();render();return}
 const miss=unanswered();
 if(miss.length){
   document.getElementById('runNotice').innerHTML=`<div class="notice"><b>${miss.length} obesvarade.</b> <button class="mini" data-first-miss>Gå till första</button> <button class="mini dark" data-submit>Skicka ändå</button></div>`;
   bindRun();
 }else submitRun(false);
}
function submitRun(timeout){
 commitInput();
 const results=run.items.map(q=>{
   const raw=responseFor(q),check=M.check(q.item,raw);
   return {sid:q.sid,skillTitle:q.skillTitle,key:q.key,q:q.item.q,raw,ok:!!check.ok,correct:PC.answerText(q.item),sol:q.item.sol||[],ab:q.item.ab||[]};
 });
 const correct=results.filter(r=>r.ok).length,total=results.length,percent=Math.round(100*correct/total);
 const attempt={
   id:Date.now(),grade:store.grade,chapter:run.chapter,chapterName:run.chapterName,mode:run.mode,
   startedAt:run.startedAt,finishedAt:Date.now(),timeout:!!timeout,correct,total,percent,results
 };
 store.attempts.push(attempt);save();clearInterval(timerId);timerId=null;clearRun();run=null;
 renderResult(attempt);
}
function renderResult(a){
 theme();
 app.innerHTML=shell(resultHTML(a));
 bindResult(a);
}
function resultHTML(a){
 const by={};
 a.results.forEach(r=>{const x=by[r.sid]||(by[r.sid]={title:r.skillTitle,c:0,n:0});x.n++;if(r.ok)x.c++});
 const weak=Object.entries(by).sort((A,B)=>(A[1].c/A[1].n)-(B[1].c/B[1].n))[0];
 const abilities={B:[0,0],M:[0,0],P:[0,0],R:[0,0],K:[0,0]};
 a.results.forEach(r=>(r.ab||[]).forEach(k=>{if(abilities[k]){abilities[k][1]++;if(r.ok)abilities[k][0]++}}));
 const abLabels={B:'Begrepp',M:'Metod',P:'Problemlösning',R:'Resonemang',K:'Kommunikation'};
 return `<section class="result-hero"><div class="kicker">${a.mode==='prov'?'PROV KLART':'DIAGNOS KLAR'} · ${esc(a.chapterName)}</div><div class="bigscore">${a.percent}%</div><h1>${a.correct} av ${a.total} rätt</h1><p class="mut">${a.percent>=80?'Starkt resultat. Kontrollera ändå de moment som blev fel.':a.percent>=60?'Mycket sitter, men några områden behöver följas upp.':'Bra att ni testade nu – resultatet visar tydligt vad som behöver tränas vidare.'}</p></section>
 <section class="panel"><div class="kicker">PER MOMENT</div><div class="skillgrid">${Object.entries(by).map(([id,x])=>{const p=x.c/x.n,cl=p>=.8?'ok':p>=.5?'mid':'low',lab=p>=.8?'Sitter':p>=.5?'Nästan':'Behöver träna';return `<div class="skillres"><b>${esc(x.title)}</b><span class="${cl}">${x.c}/${x.n} · ${lab}</span></div>`}).join('')}</div>
 ${Object.values(abilities).some(x=>x[1]>=2)?`<div class="ability">${Object.entries(abilities).filter(([k,x])=>x[1]>=2).map(([k,x])=>`<span>${abLabels[k]} ${x[0]}/${x[1]}</span>`).join('')}</div>`:''}
 <div class="resultacts"><button class="btn primary" data-copy>Kopiera resultat</button>${weak?`<a class="btn secondary" href="../#/l/${weak[0]}/0">Träna svagaste i Matte OS</a>`:''}<button class="btn secondary" data-home>Till startsidan</button></div></section>
 <section class="panel review"><div class="kicker">FRÅGA FÖR FRÅGA</div>${a.results.map((r,i)=>`<details><summary><span class="rq">${i+1}. ${rich(r.q)}</span><span class="${r.ok?'ok':'low'}">${r.ok?'Rätt':'Fel'}</span></summary><div class="ra"><div>Ditt svar: <b>${esc(typeof r.raw==='object'?((r.raw.m||'')+' · 10^'+(r.raw.e||'')):r.raw||'—')}</b></div><div>Rätt svar: <b>${esc(r.correct)}</b></div>${r.sol.length?`<div class="solution">${r.sol.map(s=>`<div>${rich(s)}</div>`).join('')}</div>`:''}</div></details>`).join('')}</section>
 <div class="footer">Det här är ett separat diagnos-/provsystem. Matte OS används för undervisning och träning.</div>`;
}
function summary(a){
 const by={};a.results.forEach(r=>{const x=by[r.skillTitle]||(by[r.skillTitle]=[0,0]);x[1]++;if(r.ok)x[0]++});
 return [`Matte Prov – Åk ${a.grade==='grade8'?'8':'9'} · ${a.chapterName}`,`${a.mode==='prov'?'Prov':'Diagnos'}: ${a.correct}/${a.total} (${a.percent}%)`,'',...Object.entries(by).map(([k,v])=>`${k}: ${v[0]}/${v[1]}`)].join('\n');
}
function bind(){
 document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{store.grade=b.dataset.pick;save();render()});
 document.querySelector('[data-grade]')?.addEventListener('click',()=>{store.grade=null;save();render()});
 document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>begin(b.dataset.start,b.dataset.ch));
}
function bindRun(){
 document.querySelector('[data-exit]')?.addEventListener('click',()=>{if(confirm('Avsluta testet? Svaren i den här omgången sparas inte.')){clearInterval(timerId);timerId=null;run=null;clearRun();render()}});
 document.querySelector('[data-flag]')?.addEventListener('click',()=>{run.flags[run.index]=!run.flags[run.index];persistRun();render()});
 document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{setResponse(current(),b.dataset.opt);render()});
 document.querySelector('[data-prev]')?.addEventListener('click',()=>{commitInput();if(run.index>0){run.index--;persistRun();render()}});
 document.querySelector('[data-next]')?.addEventListener('click',next);
 document.querySelector('[data-first-miss]')?.addEventListener('click',()=>{commitInput();run.index=unanswered()[0].i;persistRun();render()});
 document.querySelector('[data-submit]')?.addEventListener('click',()=>submitRun(false));
 ['ans','ansm','anse'].forEach(id=>document.getElementById(id)?.addEventListener('change',commitInput));
}
function bindResult(a){
 document.querySelector('[data-home]')?.addEventListener('click',render);
 document.querySelector('[data-copy]')?.addEventListener('click',async()=>{
   const t=summary(a);
   try{await navigator.clipboard.writeText(t);alert('Resultatet är kopierat.')}catch{prompt('Kopiera resultatet:',t)}
 });
}
resume();render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();