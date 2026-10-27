(function main(){
'use strict';
const E=window.MOEngine,T=window.MOTables,host=document.getElementById('arena');
const esc=x=>String(x==null?'':x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=x=>{let a=x.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const key=(a,b)=>Math.min(a,b)+'x'+Math.max(a,b);
let round=null,duel=null,finished=null,n=7,duelPrefs={names:['Spelare 1','Spelare 2'],table:'mixed'};
E.load();
const requested=new URLSearchParams(location.search).get('g');
if(requested==='grade8'||requested==='grade9'){E.state().active=requested;E.save()}
const pid=()=>E.state().active;
const data=()=>{const p=E.prof(pid());if(!p.tables)p.tables={v:1,facts:{},sessions:[]};return p.tables};
const log=()=>data().sessions||[];
const info=t=>{
 const a=log().filter(s=>s.mode==='table'&&s.table===t);
 const best=a.reduce((x,s)=>Math.max(x,s.correctFirst||0),0);
 const days=new Set(a.filter(s=>s.total===10&&s.correctFirst>=9).map(s=>s.localDate||String(s.finishedAt).slice(0,10))).size;
 const stable=days>=2;
 return {best,stable,tries:a.length,status:stable?'Sitter stabilt':a.length?best>=8?'Nästan där':'Påbörjad':'Ny',percent:stable?100:Math.min(92,best*8+a.length*2)};
};
const stables=()=>Array.from({length:10},(_,i)=>i+1).filter(t=>info(t).stable).length;
const weekDays=()=>{
 const now=new Date(),day=(now.getDay()+6)%7;
 const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-day).getTime();
 const days=new Set();
 for(const s of log()){
   if(s.mode!=='table'&&s.mode!=='mixed')continue;
   const d=new Date((s.localDate||String(s.finishedAt).slice(0,10))+'T12:00:00');
   if(d.getTime()>=monday&&d.getTime()<monday+7*86400000)days.add(s.localDate||String(s.finishedAt).slice(0,10));
 }
 return days.size;
};
function shell(content){
 document.body.dataset.grade=pid()||'grade9';
 host.innerHTML=`<div class="shell"><header class="top"><div class="topin"><a class="brand" href="../"><span class="symbol">×</span><span class="brandname"><b>TABELLARENAN</b><small>en del av Matte OS</small></span></a><div class="topright"><button class="pillbtn" data-to="home">Översikt</button>${pid()?`<button class="pillbtn" data-act="profile">${pid()==='grade8'?'Åk 8':'Åk 9'} ▾</button>`:''}</div></div></header><main class="container">${content}</main></div>`;
}
function go(v){if(location.hash==='#/'+v)draw();else location.hash='#/'+v;scrollTo(0,0)}
const route=()=>location.hash.replace(/^#\/?/,'')||'home';
function chooseProfile(){shell(`<section class="centered"><span class="eyebrow">En del av Matte OS</span><h1>Välkommen till Tabellarenan.</h1><p class="lead">Välj årskurs för att hålla er träning och era resultat separata.</p><div class="extras"><button class="tabtile" data-act="grade" data-value="grade9"><span class="tabtile-num">Åk 9</span><span class="tabtile-bottom">Välj profil →</span></button><button class="tabtile" data-act="grade" data-value="grade8"><span class="tabtile-num">Åk 8</span><span class="tabtile-bottom">Välj profil →</span></button></div></section>`)}
function home(){
 const tiles=Array.from({length:10},(_,i)=>{
 const t=i+1,x=info(t);
 return `<button class="tabtile" data-act="table" data-value="${t}"><span class="tabtile-top"><span>${t}:ans tabell</span><span>↗</span></span><span class="tabtile-num">${t}<small style="font-size:1.1rem;color:var(--accent)"> ×</small></span><span class="tbar"><i style="width:${x.percent}%"></i></span><span class="tabtile-bottom"><i class="status-dot ${x.stable?'stable':x.tries?'progress':''}"></i>${x.status}</span></button>`;
 }).join('');
 shell(`<section class="home-hero"><div><div class="eyebrow">Matte OS · Grundträning</div><h1>En tabell i taget.<br>Sen blandar vi.</h1><p class="lead">Välj 7:an eller någon annan tabell. Se först alla svar, träna tio frågor och bygg säkerhet. Sedan kan du testa dig på hela blandningen.</p><span class="ribbon">${stables()} av 10 tabeller sitter stabilt</span> <span class="ribbon" style="margin-top:7px">Veckouppdrag: ${Math.min(weekDays(),3)}/3 träningsdagar</span></div><div class="hero-graphic" aria-hidden="true"><span class="hero-calc">7<span> × </span>8<span> = </span>56</span></div></section><div class="sectionheading"><div><h2>Välj din tabell</h2><p>Alla tio tabeller finns här, med hela tabellen utskriven.</p></div></div><div class="grid">${tiles}</div><div class="extras"><section class="extra mixed"><div class="extra-sign">∑</div><div><div class="eyebrow">NÄSTA NIVÅ</div><h2>Blandad utmaning</h2><p>20 frågor från alla tabeller. Utan ledtrådar, facit först efter inlämning.</p></div><button class="btn" data-act="mixed">Starta blandprovet</button></section><section class="extra duel"><div class="extra-sign">VS</div><div><div class="eyebrow">SPELA TILLSAMMANS</div><h2>Snabbast vinner</h2><p>Två spelare. Först att trycka får svara. Spela på en mobil eller dator.</p></div><button class="btn" data-to="duel/setup">Spela duell</button></section></div><p class="subtle">Progressen sparas lokalt på enheten och följer med Matte OS-säkerhetskopian. Inga offentliga resultatlistor.</p>`);
}
function table(v){
 n=Number(v);if(!(n>=1&&n<=10)){go('home');return}
 const s=info(n);
 const rows=Array.from({length:10},(_,i)=>i+1).map(k=>`<div class="eqrow"><span class="math"><b>${n}</b> × ${k}</span><span class="answer">= ${n*k}</span></div>`).join('');
 shell(`<button class="linkback" data-to="home">← Alla tabeller</button><section class="tableintro"><div><span class="eyebrow">LÄS · FÖRSTÅ · TRÄNA</span><h1 class="title">${n}:ans tabell</h1><p>Alla multiplikationer från ${n} × 1 till ${n} × 10.</p></div><div class="table-score"><strong>${s.best}/10</strong><small>Bästa runda</small></div></section><section class="card"><div class="refhead"><h2>Hela ${n}:an</h2><span class="mut">Alla svar synliga</span></div><div class="reference">${rows}</div><div class="study-tip"><b>Så kan du öva:</b> Läs en rad. Dölj svaret med handen. Försök säga det innan du tittar igen.</div><div class="under-reference"><button class="btn" data-act="practice" data-value="${n}">Träna ${n}:an · 10 frågor</button><button class="btn ghost" data-to="home">Välj en annan tabell</button></div></section><p class="subtle">${s.stable?'Sitter stabilt: minst 9/10 på två olika dagar.':s.tries?'Du har gjort '+s.tries+' rundor. För stabil markering krävs 9/10 på två olika dagar.':'Börja med att läsa tabellen och testa sedan dig själv.'}</p>`);
}
function tableQs(t){return shuffle(Array.from({length:10},(_,i)=>({a:t,b:i+1})))}
function mixedQs(){
 const seen=new Set(),qs=[],add=(a,b)=>{const k=key(a,b);if(seen.has(k))return false;seen.add(k);qs.push({a,b});return true};
 for(const a of shuffle(Array.from({length:10},(_,i)=>i+1)))for(const b of shuffle(Array.from({length:10},(_,i)=>i+1))){if(add(a,b))break}
 for(const a of shuffle(Array.from({length:10},(_,i)=>i+1)))for(const b of shuffle(Array.from({length:10},(_,i)=>i+1))){if(qs.length>=20)break;add(a,b)}
 return shuffle(qs.slice(0,20));
}
function begin(type,value){
 if(type==='table'){n=Number(value);round={type:'table',table:n,qs:tableQs(n),i:0,results:[],feedback:null,start:Date.now()}}
 else round={type:'mixed',table:null,qs:mixedQs(),i:0,results:[],feedback:null,start:Date.now()};
 go(type==='table'?'practice':'mixed');
}
function task(){
 if(!round){go('home');return}
 const q=round.qs[round.i];if(!q){finish();return}
 const test=round.type==='mixed',count=round.qs.length,done=round.i+(round.feedback?1:0);
 shell(`<div class="centered"><button class="linkback" data-to="${test?'home':'table/'+n}">← ${test?'Alla tabeller':n+':ans tabell'}</button><section class="question-card"><div class="question-head"><span>${test?'BLANDPROV · UTAN HJÄLP':n+':ANS TABELL · TRÄNING'}</span><span>${round.i+1} / ${count}</span></div><div class="progressline"><i style="width:${100*done/count}%"></i></div><div class="equation">${q.a} <span>×</span> ${q.b} <span>= ?</span></div>${round.feedback?`<div class="feedback ${round.feedback.ok?'ok':'no'}"><div><b>${round.feedback.ok?'Rätt!':'Bra att du försökte.'}</b><span>${q.a} × ${q.b} = ${q.a*q.b}</span></div><button class="btn" data-act="next">${round.i+1===count?'Visa resultat':'Nästa →'}</button></div>`:`<form id="answerform" class="answerform" novalidate><input id="answer" class="answerfield" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="Ditt svar" aria-label="Svar på ${q.a} gånger ${q.b}"><button type="submit" class="btn">${test?(round.i+1===count?'Lämna in':'Nästa →'):'Svara'}</button></form>`}</section><p class="round-note">${test?'Rättning kommer när alla 20 frågor är klara.':'Försök utan tidspress. Ett fel hjälper oss hitta vad du kan öva på.'}</p></div>`);
}
function factScore(q,ok){
 const s=T.factState(pid(),key(q.a,q.b));s.attempts++;s.last=Date.now();
 if(ok){s.correct++;s.firstCorrect++;s.streak=(s.streak||0)+1;s.score=Math.min(12,(s.score||0)+1.25)}
 else{s.wrong++;s.streak=0;s.score=Math.max(0,(s.score||0)-.55)}
 E.save();
}
function answer(v){
 if(!round||round.feedback||round.results.length!==round.i||!/^\d{1,4}$/.test(v.trim()))return;
 const q=round.qs[round.i],num=Number(v.trim()),ok=num===q.a*q.b;
 round.results.push({...q,answer:num,ok});factScore(q,ok);
 if(round.type==='table'){round.feedback={ok};draw()}
 else if(round.i+1===round.qs.length)finish();
 else{round.i++;draw();scrollTo(0,0)}
}
function next(){
 if(!round||!round.feedback)return;
 round.i++;round.feedback=null;
 if(round.i===round.qs.length)finish();else{draw();scrollTo(0,0)}
}
function finish(){
 if(!round)return;
 const a={mode:round.type,table:round.table,total:round.qs.length,correctFirst:round.results.filter(x=>x.ok).length,finishedAt:new Date().toISOString(),localDate:[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-'),elapsedMs:Date.now()-round.start};
 data().sessions.push(a);if(data().sessions.length>120)data().sessions=data().sessions.slice(-100);E.save();
 finished={...a,results:round.results};round=null;go('result');
}
function result(){
 if(!finished){go('home');return}
 const a=finished,pct=a.correctFirst/a.total,good=pct>=.9;
 const rows=a.results.map(q=>`<div><span>${q.a} × ${q.b} = ${q.a*q.b}</span><strong class="${q.ok?'ok':'no'}">${q.ok?'Rätt':'Ditt svar: '+q.answer}</strong></div>`).join('');
 shell(`<div class="centered"><button class="linkback" data-to="home">← Alla tabeller</button><section class="card results"><div class="eyebrow">${a.mode==='mixed'?'BLANDPROV KLART':a.table+':ANS TABELL · KLAR'}</div><div class="stat">${a.correctFirst}/${a.total}</div><h1>${good?'Snyggt jobbat.':'Nästa gång kan det sitta bättre.'}</h1><p>${a.mode==='table'?'Träna gärna igen en annan dag. Två rundor med minst 9/10 på olika dagar ger stabil markering.':'Så här gick ditt blandprov. Alla rätt och fel visas nedan.'}</p><div class="resultsteps">${rows}</div><div class="actionrow">${a.mode==='table'?`<button class="btn" data-act="practice" data-value="${a.table}">Träna ${a.table}:an igen</button><button class="btn ghost" data-to="table/${a.table}">Se tabellen</button>`:`<button class="btn" data-act="mixed">Gör nytt blandprov</button>`}<button class="btn ghost" data-to="home">Till översikten</button></div></section></div>`);
}
function setup(){
 shell(`<section class="duelsetup"><button class="linkback" data-to="home">← Alla tabeller</button><div class="eyebrow">2 SPELARE · EN ENHET</div><h1>Snabbast vinner.</h1><p class="lead">Båda ser samma fråga. Den som vet svaret trycker först och säger det högt. En tredje person, eller ni själva, markerar rätt eller fel.</p><form class="card" id="duelform"><div class="duel-fields"><div><label for="player1" class="field">Spelare 1</label><input id="player1" maxlength="18" class="text-input" value="${esc(duelPrefs.names[0])}"></div><div><label for="player2" class="field">Spelare 2</label><input id="player2" maxlength="18" class="text-input" value="${esc(duelPrefs.names[1])}"></div></div><div style="margin-top:14px"><label for="dueltable" class="field">Tävla på</label><select id="dueltable" class="selector"><option value="mixed">Blandat 1–10</option>${Array.from({length:10},(_,i)=>i+1).map(t=>`<option value="${t}">${t}:ans tabell</option>`).join('')}</select></div><div class="duel-descr">Mobil: varsin stor knapp. Dator: tryck <b>A</b> för spelare 1 och <b>L</b> för spelare 2. Först att trycka får svara. Vid fel får den andra chansen. Inga minuspoäng.</div><button class="btn full" type="submit">Starta duellen · 10 rundor</button></form><p class="subtle">Röstbedömningen görs av er, inte av appen. Tävlingspoäng räknas inte som individuell behärskning.</p></section>`);
 document.getElementById('dueltable').value=duelPrefs.table;
}
function beginDuel(){
 const t=duelPrefs.table,qs=t==='mixed'?mixedQs().slice(0,10):tableQs(Number(t));
 duel={qs,i:0,score:[0,0],names:duelPrefs.names,phase:'buzz',who:null};
 go('duel/play');
}
function buzz(w){if(!duel||duel.phase!=='buzz')return;duel.who=w;duel.phase='judge';draw()}
function judge(ok){
 if(!duel||!['judge','steal'].includes(duel.phase))return;
 if(ok){duel.score[duel.who]++;duel.phase='reveal'}
 else if(duel.phase==='judge'){duel.who=1-duel.who;duel.phase='steal'}
 else duel.phase='reveal';
 draw();
}
function duelNext(){
 if(!duel||duel.phase!=='reveal')return;
 duel.i++;duel.phase='buzz';duel.who=null;
 if(duel.i>=10)go('duel/result');else draw();
}
function duelPlay(){
 if(!duel){go('duel/setup');return}
 const d=duel,q=d.qs[d.i];if(!q){go('duel/result');return}
 let controls;
 if(d.phase==='buzz')controls=`<div class="buzzers"><button class="buzzer" data-act="buzz" data-value="0">${esc(d.names[0])}<small>Jag kan! · tangent A</small></button><button class="buzzer right" data-act="buzz" data-value="1">${esc(d.names[1])}<small>Jag kan! · tangent L</small></button></div><p class="round-note">Vem vet svaret? Tryck först för att svara.</p>`;
 else if(d.phase==='judge'||d.phase==='steal')controls=`<div class="judge"><h2>${esc(d.names[d.who])} ${d.phase==='steal'?'får chansen att ta över!':'tryckte först!'}</h2><p>Spelaren säger svaret högt. Markera vad som stämmer.</p><div class="judge-actions"><button class="btn good" data-act="judge" data-value="1">Rätt · +1</button><button class="btn no" data-act="judge" data-value="0">Fel</button></div></div>`;
 else controls=`<div class="duel-solution">${q.a} × ${q.b} = ${q.a*q.b}</div><button class="btn full" data-act="duelNext">${d.i===9?'Visa resultat':'Nästa runda →'}</button>`;
 shell(`<section class="duel-screen"><button class="linkback" data-act="duelExit">← Avsluta duellen</button><div class="duel-topline"><span>SNABBHETSDUELL</span><span>Runda ${d.i+1} av 10</span></div><div class="scoreboard"><div class="playerbox"><span class="playername">${esc(d.names[0])}</span><span class="playerscore">${d.score[0]}</span></div><div class="playerbox right"><span class="playername">${esc(d.names[1])}</span><span class="playerscore">${d.score[1]}</span></div></div><div class="card"><div class="duel-question">${q.a} <span>×</span> ${q.b} <span>= ?</span></div>${controls}</div></section>`);
}
function duelResult(){
 if(!duel){go('home');return}
 const d=duel,who=d.score[0]===d.score[1]?'Oavgjort!':esc(d.names[d.score[0]>d.score[1]?0:1])+' vinner!';
 shell(`<section class="centered"><div class="card results"><div class="eyebrow">DUELL KLAR · 10 RUNDOR</div><h1>${who}</h1><p>Inga minuspoäng. Vill ni spela igen?</p><div class="scoreboard"><div class="playerbox"><span class="playername">${esc(d.names[0])}</span><span class="playerscore">${d.score[0]}</span></div><div class="playerbox right"><span class="playername">${esc(d.names[1])}</span><span class="playerscore">${d.score[1]}</span></div></div><div class="actionrow"><button class="btn" data-act="again">Spela igen</button><button class="btn ghost" data-to="home">Alla tabeller</button></div></div></section>`);
}
function draw(){
 if(!pid()){chooseProfile();return}
 const r=route();
 if(r==='home')home();
 else if(r.startsWith('table/'))table(r.split('/')[1]);
 else if(r==='practice'||r==='mixed')task();
 else if(r==='result')result();
 else if(r==='duel/setup')setup();
 else if(r==='duel/play')duelPlay();
 else if(r==='duel/result')duelResult();
 else home();
}
host.addEventListener('click',e=>{
 const b=e.target.closest('[data-act],[data-to]');if(!b)return;
 if(b.dataset.to){go(b.dataset.to);return}
 switch(b.dataset.act){
 case 'grade':E.state().active=b.dataset.value;E.save();go('home');break;
 case 'profile':E.state().active=null;E.save();round=null;duel=null;go('home');break;
 case 'table':go('table/'+b.dataset.value);break;
 case 'practice':begin('table',b.dataset.value);break;
 case 'mixed':begin('mixed');break;
 case 'next':next();break;
 case 'buzz':buzz(Number(b.dataset.value));break;
 case 'judge':judge(b.dataset.value==='1');break;
 case 'duelNext':duelNext();break;
 case 'duelExit':duel=null;go('home');break;
 case 'again':beginDuel();break;
 }
});
host.addEventListener('submit',e=>{
 if(e.target.id==='answerform'){e.preventDefault();answer(document.getElementById('answer').value);return}
 if(e.target.id==='duelform'){
 e.preventDefault();duelPrefs={names:[document.getElementById('player1').value.trim().slice(0,18)||'Spelare 1',document.getElementById('player2').value.trim().slice(0,18)||'Spelare 2'],table:document.getElementById('dueltable').value};
 beginDuel();
 }
});
window.addEventListener('keydown',e=>{
 if(!duel||route()!=='duel/play'||duel.phase!=='buzz'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
 if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const k=e.key.toLowerCase();if(k==='a'||k==='l'){e.preventDefault();buzz(k==='a'?0:1)}
});
window.addEventListener('hashchange',()=>{draw();scrollTo(0,0)});
draw();
if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
window.__TABELL_QA={info,mixedQs,tableQs,stables};
})();