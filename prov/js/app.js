(function(){
'use strict';

const STORE_KEY='matte-prov-v1';
const ACTIVE_KEY=STORE_KEY+'-active';
const app=document.getElementById('app');
const M=window.MOMath, V=window.MOExamVisuals, C=window.MO_CORE, PC=window.MOProvCore;
let store=loadStore();
let run=loadActive();

function emptyStore(){return {grade:null,attempts:[],attemptNo:0}}
function loadStore(){try{return {...emptyStore(),...(JSON.parse(localStorage.getItem(STORE_KEY))||{})}}catch{return emptyStore()}}
function saveStore(){localStorage.setItem(STORE_KEY,JSON.stringify(store))}
function loadActive(){try{const x=JSON.parse(sessionStorage.getItem(ACTIVE_KEY));return x&&Array.isArray(x.items)?x:null}catch{return null}}
function saveActive(){if(run)sessionStorage.setItem(ACTIVE_KEY,JSON.stringify(run))}
function clearActive(){sessionStorage.removeItem(ACTIVE_KEY)}
function esc(s){return M.esc(String(s??''))}
function rich(s){return M.rich(String(s??''))}
function profile(){return C.profiles[store.grade]}
function skills(){return store.grade==='grade8'?window.MO_CONTENT8:window.MO_CONTENT9}
function skillList(ch){return skills().filter(s=>s.ch===ch)}
function chapter(id){return profile().chapters.find(c=>c.id===id)}
function setTheme(){
 const g=store.grade;
 document.documentElement.style.setProperty('--accent',g==='grade8'?'#1d3557':'#6e1f35');
 document.documentElement.style.setProperty('--soft',g==='grade8'?'#e9eef5':'#f5e8ec');
}
function header(){
 const p=profile();
 return `<header class="top"><div class="topin"><div class="brand"><div class="mark">P</div><div><b>MATTE PROV</b><small>separat från Matte OS</small></div></div><div class="spacer"></div>${p?`<button class="grade" data-grade aria-label="Byt årskurs">Å${p.label.replace(/\D/g,'')}</button>`:''}</div></header>`;
}
function shell(content,focus=false){
 return `<div class="app">${focus?'':header()}<main class="wrap ${focus?'focus-wrap':''}">${content}</main></div>`;
}
function render(){
 setTheme();
 if(!store.grade){app.innerHTML=shell(renderGradePick());bindHome();return}
 if(run){app.innerHTML=shell(run.review?renderReview():renderQuestion(),true);run.review?bindReview():bindQuestion();return}
 app.innerHTML=shell(renderHome());bindHome();
}
function renderGradePick(){
 return `<section class="pick">
   <div class="pick-intro"><div class="kicker">SEPARAT TESTMILJÖ</div><div class="seal">P</div><h1>Matte Prov</h1><p>Här får eleven visa vad hon kan <b>utan ledtrådar, formelsamling eller direkt rättning</b>.</p></div>
   <button class="pickbtn" data-pick="grade9"><span class="avatar g9">Å9</span><span><b>Åk 9</b><small>Tal · Geometri · Procent</small></span><span class="arrow">→</span></button>
   <button class="pickbtn" data-pick="grade8"><span class="avatar g8">Å8</span><span><b>Åk 8</b><small>Tal · Geometri · Algebra</small></span><span class="arrow">→</span></button>
   <p class="privacy">Resultat sparas bara på den här enheten.</p>
 </section>`;
}
function currentInfo(){
 const p=profile(),week=PC.isoWeek(),ch=PC.recommendedChapter(p,week);
 return {p,week,ch};
}
function countFor(ch,mode){return PC.selectRun(skills(),ch,mode,(store.attemptNo||0)+1).length}
function renderHome(){
 const {p,week,ch}=currentInfo(),recent=(store.attempts||[]).slice(-4).reverse();
 const dc=countFor(ch.id,'diagnos'),pc=countFor(ch.id,'prov');
 return `
 <section class="home-head"><div class="kicker">ÅK ${p.label.replace(/\D/g,'')} · VECKA ${week}</div><h1>Testa utan hjälp.</h1><p>Matte OS används för att lära och träna. Här mäter ni vad som går att lösa självständigt.</p></section>
 <section class="exam-card">
   <div class="recommended"><div><div class="kicker">REKOMMENDERAT NU</div><h2>${esc(ch.name)}</h2><p>Enligt planeringen kommer kapitelprovet vecka ${ch.examWeek}.</p></div><div class="week-chip">v${ch.examWeek}</div></div>
   <div class="rules"><span>Ingen formelsamling</span><span>Inga ledtrådar</span><span>Rättning efter inlämning</span></div>
   <div class="modegrid">
     <button class="mode primary" data-start="diagnos" data-ch="${ch.id}"><span class="mode-num">01</span><span><b>Diagnos</b><small>${dc} frågor · en fråga per moment · hittar luckor snabbt</small></span></button>
     <button class="mode" data-start="prov" data-ch="${ch.id}"><span class="mode-num">02</span><span><b>Prov</b><small>${pc} frågor · hela kapitlet + extra blandade uppgifter</small></span></button>
   </div>
 </section>
 <details class="area-picker"><summary>Välj ett annat område</summary><div class="area-list">${p.chapters.map(x=>`<div class="area-row"><div><b>${esc(x.name)}</b><small>${skillList(x.id).length} moment · planerat kapitelprov v${x.examWeek}</small></div><div><button data-start="diagnos" data-ch="${x.id}">Diagnos</button><button class="dark" data-start="prov" data-ch="${x.id}">Prov</button></div></div>`).join('')}</div></details>
 ${recent.length?`<section class="history-card"><div class="section-title">Senaste resultat</div>${recent.map(a=>`<div class="history-row"><div><b>${esc(a.chapterName)} · ${a.mode==='prov'?'Prov':'Diagnos'}</b><small>${new Date(a.finishedAt).toLocaleDateString('sv-SE')} · ${a.correct}/${a.total} rätt</small></div><strong>${a.percent}%</strong></div>`).join('')}</section>`:''}
 <footer>Ingen provtid har lagts in eftersom skolans faktiska provtid inte är verifierad.</footer>`;
}
function begin(mode,ch){
 store.attemptNo=(store.attemptNo||0)+1;saveStore();
 run={mode,chapter:ch,chapterName:chapter(ch).name,items:PC.selectRun(skills(),ch,mode,store.attemptNo),index:0,answers:{},flags:{},review:false,startedAt:Date.now()};
 saveActive();render();
}
function key(q){return q.sid+'|'+q.key}
function current(){return run.items[run.index]}
function response(q){return run.answers[key(q)]??''}
function setResponse(q,v){run.answers[key(q)]=v;saveActive()}
function answered(q){
 const v=response(q);
 if(v&&typeof v==='object')return String(v.m??'').trim()!==''&&String(v.e??'').trim()!=='';
 return String(v??'').trim()!=='';
}
function renderInput(q){
 const x=q.item,v=response(q),type=x.type||'num';
 if(type==='choice')return `<div class="options" role="group" aria-label="Svarsalternativ">${x.opts.map(o=>`<button type="button" class="opt ${v===o?'sel':''}" data-opt="${esc(o)}">${rich(o)}</button>`).join('')}</div>`;
 if(type==='sci'){
   const mv=v&&typeof v==='object'?v.m:'',ev=v&&typeof v==='object'?v.e:'';
   return `<div class="sci"><input id="ansm" class="ansinput" inputmode="decimal" value="${esc(mv)}" aria-label="Talet framför tiopotensen" placeholder="a"><span>· 10</span><sup><input id="anse" class="ansinput exp" inputmode="text" value="${esc(ev)}" aria-label="Exponent" placeholder="n"></sup></div>`;
 }
 const mode=type==='expr'||type==='roots'||x.radical?'text':'decimal';
 return `<input id="ans" class="ansinput" inputmode="${mode}" autocomplete="off" value="${esc(v)}" placeholder="${esc(x.answerHint||'Skriv ditt svar')}">`;
}
function renderQuestion(){
 const q=current(),x=q.item,pct=100*run.index/run.items.length;
 const vis=V.render(x,q.sid);
 return `<div class="exam-top"><button class="exit" data-exit>Avsluta</button><div class="exam-progress" aria-label="Framsteg"><i style="width:${pct}%"></i></div><div class="qcount">${run.index+1}/${run.items.length}</div></div>
 <div id="exitNotice"></div>
 <section class="question-sheet">
   <div class="question-meta"><span>${run.mode==='prov'?'PROV':'DIAGNOS'} · ${esc(run.chapterName)}</span><button class="flag ${run.flags[run.index]?'on':''}" data-flag>${run.flags[run.index]?'Markerad':'Markera'}</button></div>
   <div class="question-number">Fråga ${run.index+1}</div>
   <div class="question-text">${rich(x.q)}</div>
   ${vis?`<div class="visual">${vis}</div>`:''}
   <div class="answer-block"><div class="answer-label">Ditt svar</div>${renderInput(q)}</div>
   <div class="question-nav"><button class="btn secondary" data-prev ${run.index===0?'disabled':''}>← Föregående</button><button class="btn primary" data-next>${run.index===run.items.length-1?'Granska testet':'Nästa →'}</button></div>
 </section>`;
}
function readInput(){
 const x=current().item,type=x.type||'num';
 if(type==='choice')return response(current());
 if(type==='sci')return {m:document.getElementById('ansm')?.value||'',e:document.getElementById('anse')?.value||''};
 return document.getElementById('ans')?.value||'';
}
function commit(){setResponse(current(),readInput())}
function go(i){commit();run.index=Math.max(0,Math.min(run.items.length-1,i));run.review=false;saveActive();render()}
function renderReview(){
 const n=run.items.length,done=run.items.filter(answered).length,marked=Object.values(run.flags).filter(Boolean).length;
 return `<div class="review-top"><button class="exit" data-back-question>← Till frågorna</button><div class="kicker">${run.mode==='prov'?'PROV':'DIAGNOS'} · ${esc(run.chapterName)}</div></div>
 <section class="review-sheet"><h1>Granska innan du lämnar in.</h1><p>${done} av ${n} frågor är besvarade${marked?' · '+marked+' markerade':''}.</p>
 <div class="review-grid">${run.items.map((q,i)=>`<button data-jump="${i}" class="${answered(q)?'done':'missing'} ${run.flags[i]?'marked':''}"><b>${i+1}</b><span>${answered(q)?'Besvarad':'Obesvarad'}${run.flags[i]?' · markerad':''}</span></button>`).join('')}</div>
 ${done<n?`<div class="warning"><b>${n-done} obesvarade.</b> Du kan gå tillbaka och svara, eller lämna in ändå.</div>`:''}
 <div class="review-actions"><button class="btn secondary" data-back-question>Tillbaka</button><button class="btn primary" data-submit>Lämna in ${run.mode==='prov'?'provet':'diagnosen'}</button></div></section>`;
}
function submit(){
 commit();
 const results=run.items.map(q=>{
  const raw=response(q),check=M.check(q.item,raw);
  return {sid:q.sid,skillTitle:q.skillTitle,key:q.key,q:q.item.q,raw,ok:!!check.ok,correct:PC.answerText(q.item),sol:q.item.sol||[]};
 });
 const correct=results.filter(r=>r.ok).length,total=results.length;
 const a={id:Date.now(),grade:store.grade,chapter:run.chapter,chapterName:run.chapterName,mode:run.mode,startedAt:run.startedAt,finishedAt:Date.now(),correct,total,percent:Math.round(100*correct/total),results};
 store.attempts.push(a);saveStore();run=null;clearActive();renderResult(a);
}
function renderResult(a){
 setTheme();app.innerHTML=shell(resultHTML(a));bindResult(a);
}
function resultHTML(a){
 const by={};for(const r of a.results){const x=by[r.sid]||(by[r.sid]={title:r.skillTitle,c:0,n:0});x.n++;if(r.ok)x.c++}
 const failed=Object.entries(by).filter(([,x])=>x.c<x.n);
 const firstFail=failed[0];
 return `<section class="result-head"><div class="kicker">${a.mode==='prov'?'PROV KLART':'DIAGNOS KLAR'} · ${esc(a.chapterName)}</div><div class="score">${a.percent}%</div><h1>${a.correct} av ${a.total} rätt</h1><p>Det här är ett resultat från <b>den här testomgången</b> – inte ett skolbetyg eller ett säkert mått på att ett moment är helt behärskat.</p></section>
 <section class="result-card"><div class="section-title">Moment i testet</div><div class="skill-results">${Object.entries(by).map(([id,x])=>`<div class="skill-result"><div><b>${esc(x.title)}</b><small>${x.c}/${x.n} rätt i den här omgången</small></div><span class="${x.c===x.n?'pass':'follow'}">${x.c===x.n?'Rätt':'Följ upp'}</span></div>`).join('')}</div>
 <div class="result-actions"><button class="btn primary" data-retry data-mode="${a.mode}" data-ch="${a.chapter}">Nytt ${a.mode==='prov'?'prov':'diagnostest'}</button>${firstFail?`<a class="btn secondary" href="../#/l/${firstFail[0]}/0">Träna ett felområde i Matte OS</a>`:''}<button class="btn secondary" data-copy>Kopiera resultat</button><button class="btn secondary" data-home>Startsidan</button></div></section>
 <section class="result-card review-list"><div class="section-title">Rättning – fråga för fråga</div>${a.results.map((r,i)=>`<details ${r.ok?'':'open'}><summary><span><b>${i+1}.</b> ${rich(r.q)}</span><strong class="${r.ok?'pass-text':'fail-text'}">${r.ok?'Rätt':'Fel'}</strong></summary><div class="result-detail"><div><span>Ditt svar</span><b>${esc(rawText(r.raw)||'—')}</b></div><div><span>Rätt svar</span><b>${esc(r.correct)}</b></div>${r.sol.length?`<div class="solution"><span>Lösning</span>${r.sol.map(s=>`<p>${rich(s)}</p>`).join('')}</div>`:''}</div></details>`).join('')}</section>
 <footer>Matte Prov används för kontroll. Matte OS används för undervisning och träning.</footer>`;
}
function rawText(v){return v&&typeof v==='object'?`${v.m||''} · 10^${v.e||''}`:String(v??'')}
function copySummary(a){
 const by={};a.results.forEach(r=>{const x=by[r.skillTitle]||(by[r.skillTitle]=[0,0]);x[1]++;if(r.ok)x[0]++});
 return [`Matte Prov · Åk ${a.grade==='grade8'?'8':'9'} · ${a.chapterName}`,`${a.mode==='prov'?'Prov':'Diagnos'}: ${a.correct}/${a.total} (${a.percent}%)`,'',...Object.entries(by).map(([k,v])=>`${k}: ${v[0]}/${v[1]}`)].join('\n');
}
function showExit(){
 const box=document.getElementById('exitNotice');if(!box)return;
 box.innerHTML='<div class="exit-box"><div><b>Avsluta testet?</b><span>Svaren i den här omgången sparas inte.</span></div><div><button data-cancel-exit>Fortsätt</button><button class="danger" data-confirm-exit>Avsluta</button></div></div>';
 box.querySelector('[data-cancel-exit]').onclick=()=>box.innerHTML='';
 box.querySelector('[data-confirm-exit]').onclick=()=>{run=null;clearActive();render()};
}
function bindHome(){
 document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{store.grade=b.dataset.pick;saveStore();render()});
 document.querySelector('[data-grade]')?.addEventListener('click',()=>{store.grade=null;saveStore();render()});
 document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>begin(b.dataset.start,b.dataset.ch));
}
function bindQuestion(){
 document.querySelector('[data-exit]')?.addEventListener('click',showExit);
 document.querySelector('[data-flag]')?.addEventListener('click',()=>{run.flags[run.index]=!run.flags[run.index];saveActive();render()});
 document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{setResponse(current(),b.dataset.opt);render()});
 document.querySelector('[data-prev]')?.addEventListener('click',()=>go(run.index-1));
 document.querySelector('[data-next]')?.addEventListener('click',()=>{commit();if(run.index===run.items.length-1){run.review=true;saveActive();render()}else go(run.index+1)});
 ['ans','ansm','anse'].forEach(id=>document.getElementById(id)?.addEventListener('change',commit));
}
function bindReview(){
 document.querySelectorAll('[data-back-question]').forEach(b=>b.onclick=()=>{run.review=false;saveActive();render()});
 document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{run.index=Number(b.dataset.jump);run.review=false;saveActive();render()});
 document.querySelector('[data-submit]')?.addEventListener('click',submit);
}
function bindResult(a){
 document.querySelector('[data-home]')?.addEventListener('click',render);
 document.querySelector('[data-retry]')?.addEventListener('click',b=>begin(b.currentTarget.dataset.mode,b.currentTarget.dataset.ch));
 document.querySelector('[data-copy]')?.addEventListener('click',async()=>{
   const t=copySummary(a);try{await navigator.clipboard.writeText(t);alert('Resultatet är kopierat.')}catch{prompt('Kopiera resultatet:',t)}
 });
}

render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();