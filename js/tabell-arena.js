(function(root){
'use strict';
const E=window.MOEngine,T=window.MOTables;
let host=null,shadow=null;
const esc=x=>String(x==null?'':x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=x=>{let a=x.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const key=(a,b)=>Math.min(a,b)+'x'+Math.max(a,b);
let round=null,duel=null,finished=null,n=7,duelPrefs={names:['Spelare 1','Spelare 2'],tables:[1,2,3,4,5,6,7,8,9,10],firstSec:5,secondSec:3};
let autoNext=false, nextTimer=null, duelTimer=null, duelTicker=null;
const reducedMotion=()=>!!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
 if(!shadow)return;
 shadow.innerHTML='<link rel="stylesheet" href="css/tabell-arena.css?v=5.5.3"><div class="arena-app" data-grade="'+pid()+'"><div class="container">'+content+'</div></div>';
}
function go(v){if(nextTimer){clearTimeout(nextTimer);nextTimer=null;}if(v!=='duel/play')stopDuelTimer();const h='#/tabell/'+v;if(location.hash===h)draw();else location.hash=h;window.scrollTo(0,0)}
const route=()=>location.hash.replace(/^#\/tabell\/?/,'')||'home';
function chooseProfile(){shell(`<section class="centered"><span class="eyebrow">En del av Matte OS</span><h1>Välkommen till Tabellarenan.</h1><p class="lead">Välj årskurs för att hålla er träning och era resultat separata.</p><div class="extras"><button class="tabtile" data-act="grade" data-value="grade9"><span class="tabtile-num">Åk 9</span><span class="tabtile-bottom">Välj profil →</span></button><button class="tabtile" data-act="grade" data-value="grade8"><span class="tabtile-num">Åk 8</span><span class="tabtile-bottom">Välj profil →</span></button></div></section>`)}
function home(){
 const tiles=Array.from({length:10},(_,i)=>{
 const t=i+1,x=info(t);
 return `<a class="tabtile" href="#/tabell/table/${t}" aria-label="Öppna ${t}:ans tabell"><span class="tabtile-top"><span>${t}:ans tabell</span><span>↗</span></span><span class="tabtile-num">${t}<small style="font-size:1.1rem;color:var(--accent)"> ×</small></span><span class="tbar"><i style="width:${x.percent}%"></i></span><span class="tabtile-bottom"><i class="status-dot ${x.stable?'stable':x.tries?'progress':''}"></i>${x.status}</span></a>`;
 }).join('');
 shell(`<section class="home-hero"><div><div class="eyebrow">Matte OS · Grundträning</div><h1>En tabell i taget.<br>Sen blandar vi.</h1><p class="lead">Välj 7:an eller någon annan tabell. Se först alla svar, träna tio frågor och bygg säkerhet. Sedan kan du testa dig på hela blandningen.</p><span class="ribbon">${stables()} av 10 tabeller sitter stabilt</span> <span class="ribbon" style="margin-top:7px">Veckouppdrag: ${Math.min(weekDays(),3)}/3 träningsdagar</span></div><div class="hero-graphic" aria-hidden="true"><span class="hero-calc">7<span> × </span>8<span> = </span>56</span></div></section><div class="sectionheading"><div><h2>Välj din tabell</h2><p>Alla tio tabeller finns här, med hela tabellen utskriven.</p></div></div><div class="grid">${tiles}</div><div class="extras"><section class="extra mixed"><div class="extra-sign">∑</div><div><div class="eyebrow">NÄSTA NIVÅ</div><h2>Blandad utmaning</h2><p>20 frågor från alla tabeller. Utan ledtrådar, facit först efter inlämning.</p></div><button class="btn" data-act="mixed">Starta blandprovet</button></section><section class="extra duel"><div class="extra-sign">VS</div><div><div class="eyebrow">SPELA TILLSAMMANS</div><h2>Snabbast vinner</h2><p>Två spelare. Först att trycka får svara. Spela på en mobil eller dator.</p></div><button class="btn" data-to="duel/setup">Spela duell</button></section><section class="extra duel"><div class="extra-sign">CUP</div><div><div class="eyebrow">SPELA TILLSAMMANS · VARSIN MOBIL</div><h2>Matte OS Cup</h2><p>Studera tabellerna, spela samma frågor på varsin mobil och gå från kval till final.</p></div><a class="btn" href="#/cup">Öppna Matte OS Cup</a></section></div><p class="subtle">Progressen sparas lokalt på enheten och följer med Matte OS-säkerhetskopian. Inga offentliga resultatlistor.</p>`);
}
function table(v){
 n=Number(v);if(!(n>=1&&n<=10)){go('home');return}
 const s=info(n);
 const rows=Array.from({length:10},(_,i)=>i+1).map(k=>`<div class="eqrow"><span class="math"><b>${n}</b> × ${k}</span><span class="answer">= ${n*k}</span></div>`).join('');
 shell(`<button class="linkback" data-to="home">← Alla tabeller</button><section class="tableintro"><div><span class="eyebrow">LÄS · FÖRSTÅ · TRÄNA</span><h1 class="title">${n}:ans tabell</h1><p>Alla multiplikationer från ${n} × 1 till ${n} × 10.</p></div><div class="table-score"><strong>${s.best}/10</strong><small>Bästa runda</small></div></section><section class="card"><div class="refhead"><h2>Hela ${n}:an</h2><span class="mut">Alla svar synliga</span></div><div class="reference">${rows}</div><div class="study-tip"><b>Så kan du öva:</b> Läs en rad. Dölj svaret med handen. Försök säga det innan du tittar igen.</div><div class="under-reference"><a class="btn" href="#/tabell/practice/${n}">Träna ${n}:an · 10 frågor</a>${reducedMotion() ? '' : `<button class="btn ghost" data-act="autonext" aria-pressed="${autoNext}">${autoNext ? 'Automatiskt nästa efter rätt svar: på' : 'Färre tryck: automatiskt nästa efter rätt svar (valfritt)'}</button>`}<button class="btn ghost" data-to="home">Välj en annan tabell</button></div></section><p class="subtle">${s.stable?'Sitter stabilt: minst 9/10 på två olika dagar.':s.tries?'Du har gjort '+s.tries+' rundor. För stabil markering krävs 9/10 på två olika dagar.':'Börja med att läsa tabellen och testa sedan dig själv.'}</p>`);
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
 shell(`<div class="centered"><button class="linkback" data-to="${test?'home':'table/'+n}">← ${test?'Alla tabeller':n+':ans tabell'}</button><section class="question-card"><div class="question-head"><span>${test?'BLANDPROV · UTAN HJÄLP':n+':ANS TABELL · TRÄNING'}</span><span>${round.i+1} / ${count}</span></div><div class="progressline"><i style="width:${100*done/count}%"></i></div><div class="equation">${q.a} <span>×</span> ${q.b} <span>= ?</span></div>${round.feedback?`<div class="feedback ${round.feedback.ok?'ok':'no'}" role="status" aria-live="polite"><div><b>${round.feedback.ok?'Rätt!':'Bra att du försökte.'}</b><span>${q.a} × ${q.b} = ${q.a*q.b}</span></div><button class="btn" data-act="next">${round.i+1===count?'Visa resultat':'Nästa →'}</button></div>`:`<form id="answerform" class="answerform" novalidate><input id="answer" class="answerfield" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="Ditt svar" aria-label="Svar på ${q.a} gånger ${q.b}"><button type="submit" class="btn">${test?(round.i+1===count?'Lämna in':'Nästa →'):'Svara'}</button></form>`}</section><p class="round-note">${test?'Rättning kommer när alla 20 frågor är klara.':'Försök utan tidspress. Ett fel hjälper oss hitta vad du kan öva på.'}</p></div>`);
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
 if(round.type==='table'){round.feedback={ok};draw();// Auto-advance only after a correct answer; a wrong answer keeps the correction visible until the learner taps Next.
 if(autoNext && ok && !reducedMotion()){nextTimer=setTimeout(()=>{nextTimer=null;if(round && round.type==='table' && round.feedback)next()},1800)}}
 else if(round.i+1===round.qs.length)finish();
 else{round.i++;draw();scrollTo(0,0)}
}
function next(){
 if(nextTimer){clearTimeout(nextTimer);nextTimer=null;}
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
 shell(`<div class="centered"><button class="linkback" data-to="home">← Alla tabeller</button><section class="card results"><div class="eyebrow">${a.mode==='mixed'?'BLANDPROV KLART':a.table+':ANS TABELL · KLAR'}</div><div class="stat">${a.correctFirst}/${a.total}</div><h1>${good?'Snyggt jobbat.':'Nästa gång kan det sitta bättre.'}</h1><p>${a.mode==='table'?'Träna gärna igen en annan dag. Två rundor med minst 9/10 på olika dagar ger stabil markering.':'Så här gick ditt blandprov. Alla rätt och fel visas nedan.'}</p><div class="resultsteps">${rows}</div><div class="actionrow">${a.mode==='table'?`<a class="btn" href="#/tabell/practice/${a.table}">Träna ${a.table}:an igen</a><button class="btn ghost" data-to="table/${a.table}">Se tabellen</button>`:`<button class="btn" data-act="mixed">Gör nytt blandprov</button>`}<button class="btn ghost" data-to="home">Till översikten</button></div></section></div>`);
}
function setup(){
 const p=duelPrefs;
 const tables=Array.from({length:10},(_,i)=>i+1).map(t=>'<button type="button" class="duel-table-chip'+(p.tables.includes(t)?' on':'')+'" aria-pressed="'+p.tables.includes(t)+'" data-act="duelTable" data-value="'+t+'">'+t+'</button>').join('');
 const times=(n,opts,act)=>opts.map(t=>'<button type="button" class="duel-table-chip'+(n===t?' on':'')+'" aria-pressed="'+(n===t)+'" data-act="'+act+'" data-value="'+t+'">'+t+' sek</button>').join('');
 shell('<section class="duelsetup"><button class="linkback" data-to="home">← Alla tabeller</button><div class="eyebrow">2 SPELARE · EN ENHET</div><h1>Snabbast och rätt vinner.</h1><p class="lead">Tryck först, säg svaret högt och låt klockan räkna ned. Den andra får sedan en egen chans. Facit visas automatiskt och ni väljer vem som får poängen.</p><form class="card" id="duelform"><div class="duel-fields"><div><label for="player1" class="field">Spelare 1</label><input id="player1" maxlength="18" class="text-input" value="'+esc(p.names[0])+'"></div><div><label for="player2" class="field">Spelare 2</label><input id="player2" maxlength="18" class="text-input" value="'+esc(p.names[1])+'"></div></div><div class="duel-group"><span class="field">Välj en eller flera tabeller</span><div class="duel-table-grid" role="group" aria-label="Multiplikationstabeller">'+tables+'</div><div class="duel-presets"><button type="button" class="btn ghost" data-act="duelAll">Alla / Blandat</button><button type="button" class="btn ghost" data-act="duelSubset">6–9</button></div></div><div class="duel-fields duel-group"><div><span class="field">Den som trycker först</span><div class="duel-timing" role="group" aria-label="Första spelarens svarstid">'+times(p.firstSec,[5,8,10],"duelFirstSec")+'</div></div><div><span class="field">Andra spelarens chans</span><div class="duel-timing" role="group" aria-label="Andra spelarens svarstid">'+times(p.secondSec,[3,5],"duelSecondSec")+'</div></div></div><div class="duel-descr">Säg svaren högt. Facit visas automatiskt när båda tiderna är slut. Välj +1 till den som svarade rätt eller Ingen poäng. Om båda svarar rätt får den som tryckte först poängen. Nästa fråga kommer automatiskt 3 sekunder efter ert poängval. På dator: A och L.</div><button class="btn full" type="submit">Starta duellen · 10 frågor</button></form><p class="subtle">Ingen röstigenkänning används. Appen räknar ut facit men ni avgör vem som sa rätt. Duellpoäng påverkar inte Matte OS-träningen.</p></section>');
}
function stopDuelTimer(){
 if(duelTimer!==null){clearTimeout(duelTimer);duelTimer=null}
 if(duelTicker!==null){clearInterval(duelTicker);duelTicker=null}
}
function updateDuelClock(){
 if(!duel||!['first','second','awarded'].includes(duel.phase))return;
 const clock=shadow&&shadow.getElementById('duel-clock');if(!clock)return;
 const remain=Math.max(0,Math.ceil((duel.deadline-Date.now())/1000));
 clock.textContent=String(remain);clock.setAttribute('data-low',remain<=2?'true':'false');
}
function timedDuelPhase(phase,seconds,onExpire){
 stopDuelTimer();const d=duel;if(!d)return;
 d.phase=phase;d.deadline=Date.now()+seconds*1000;draw();updateDuelClock();
 duelTicker=setInterval(updateDuelClock,100);
 duelTimer=setTimeout(()=>{
   if(duel!==d||route()!=='duel/play'||d.phase!==phase)return;
   stopDuelTimer();onExpire();
 },seconds*1000);
}
function beginDuel(){
 stopDuelTimer();
 const qs=shuffle(duelPrefs.tables.flatMap(t=>tableQs(t))).slice(0,10);
 duel={qs,i:0,score:[0,0],names:duelPrefs.names.slice(),firstSec:duelPrefs.firstSec,secondSec:duelPrefs.secondSec,phase:'buzz',who:null,awardedTo:null,deadline:null};
 go('duel/play');
}
function buzz(w){
 if(!duel||duel.phase!=='buzz'||(w!==0&&w!==1))return;
 duel.who=w;
 timedDuelPhase('first',duel.firstSec,()=>timedDuelPhase('second',duel.secondSec,revealDuel));
}
function revealDuel(){
 if(!duel||duel.phase!=='second')return;
 stopDuelTimer();duel.phase='reveal';duel.deadline=null;draw();
}
function awardDuel(w){
 if(!duel||duel.phase!=='reveal'||(w!==null&&w!==0&&w!==1))return;
 if(w!==null)duel.score[w]++;
 duel.awardedTo=w;timedDuelPhase('awarded',3,duelNext);
}
function undoDuelAward(){
 if(!duel||duel.phase!=='awarded')return;
 stopDuelTimer();if(duel.awardedTo!==null)duel.score[duel.awardedTo]--;
 duel.awardedTo=null;duel.phase='reveal';duel.deadline=null;draw();
}
function duelNext(){
 if(!duel||duel.phase!=='awarded')return;
 stopDuelTimer();duel.i++;duel.phase='buzz';duel.who=null;duel.awardedTo=null;duel.deadline=null;
 if(duel.i>=duel.qs.length)go('duel/result');else draw();
}
function duelPlay(){
 if(!duel){go('duel/setup');return}
 const d=duel,q=d.qs[d.i];if(!q){go('duel/result');return}
 const clock=label=>'<div class="duel-clockbox" role="timer" aria-label="'+label+'"><span>'+label+'</span><strong id="duel-clock">'+Math.max(0,Math.ceil((d.deadline-Date.now())/1000))+'</strong><small>sekunder</small></div>';
 let controls;
 if(d.phase==='buzz')controls='<div class="buzzers"><button class="buzzer" data-act="buzz" data-value="0">'+esc(d.names[0])+'<small>Jag kan! · tangent A</small></button><button class="buzzer right" data-act="buzz" data-value="1">'+esc(d.names[1])+'<small>Jag kan! · tangent L</small></button></div><p class="round-note">Tryck först för att starta nedräkningen.</p>';
 else if(d.phase==='first')controls='<div class="judge"><h2>'+esc(d.names[d.who])+' svarar först!</h2>'+clock('Första svarschansen')+'<p>Säg svaret högt innan tiden tar slut. Facit är dolt.</p></div>';
 else if(d.phase==='second')controls='<div class="judge"><h2>'+esc(d.names[1-d.who])+' får svara nu!</h2>'+clock('Andra svarschansen')+'<p>Säg ett eget svar. Facit visas automatiskt när tiden går ut.</p></div>';
 else if(d.phase==='reveal')controls='<div class="judge"><h2>Facit · '+q.a+' × '+q.b+' = '+q.a*q.b+'</h2><p>'+esc(d.names[d.who])+' tryckte först. Vem svarade rätt? Om båda svarade rätt: välj den som tryckte först.</p><div class="judge-actions duel-awards"><button class="btn good" data-act="awardDuel" data-value="0">+1 '+esc(d.names[0])+'</button><button class="btn good" data-act="awardDuel" data-value="1">+1 '+esc(d.names[1])+'</button><button class="btn no no-point" data-act="awardDuel" data-value="none">Ingen poäng</button></div></div>';
 else controls='<div class="judge" role="status" aria-live="polite"><h2>'+(d.awardedTo===null?'Ingen poäng':'+1 poäng till '+esc(d.names[d.awardedTo]))+'</h2>'+clock('Nästa fråga om')+'<div class="judge-actions"><button class="btn no" data-act="undoDuel">Ångra poäng</button><button class="btn" data-act="duelNext">'+(d.i===d.qs.length-1?'Visa resultat nu':'Nästa fråga nu')+'</button></div></div>';
 shell('<section class="duel-screen"><button class="linkback" data-act="duelExit">← Avsluta duellen</button><div class="duel-topline"><span>SNABBHETSDUELL</span><span>Fråga '+(d.i+1)+' av '+d.qs.length+'</span></div><div class="scoreboard"><div class="playerbox"><span class="playername">'+esc(d.names[0])+'</span><span class="playerscore">'+d.score[0]+'</span></div><div class="playerbox right"><span class="playername">'+esc(d.names[1])+'</span><span class="playerscore">'+d.score[1]+'</span></div></div><div class="card"><div class="duel-question">'+q.a+' <span>×</span> '+q.b+' <span>= ?</span></div>'+controls+'</div></section>');
}
function duelResult(){
 if(!duel){go('home');return}
 const d=duel,who=d.score[0]===d.score[1]?'Oavgjort!':esc(d.names[d.score[0]>d.score[1]?0:1])+' vinner!';
 shell(`<section class="centered"><div class="card results"><div class="eyebrow">DUELL KLAR · 10 FRÅGOR</div><h1>${who}</h1><p>Inga minuspoäng. Vill ni spela igen?</p><div class="scoreboard"><div class="playerbox"><span class="playername">${esc(d.names[0])}</span><span class="playerscore">${d.score[0]}</span></div><div class="playerbox right"><span class="playername">${esc(d.names[1])}</span><span class="playerscore">${d.score[1]}</span></div></div><div class="actionrow"><button class="btn" data-act="again">Spela igen</button><button class="btn ghost" data-to="home">Alla tabeller</button></div></div></section>`);
}
function draw(){
 if(!pid()){chooseProfile();return}
 const r=route();
 if(r==='home')home();
 else if(r.startsWith('table/'))table(r.split('/')[1]);
 else if(/^practice\/(?:[1-9]|10)$/.test(r))begin('table',Number(r.split('/')[1]));
 else if(r==='practice'||r==='mixed')task();
 else if(r==='result')result();
 else if(r==='duel/setup')setup();
 else if(r==='duel/play')duelPlay();
 else if(r==='duel/result')duelResult();
 else home();
}
function mount(){
 host=document.getElementById('arena');
 if(!host)return;
 shadow=host.attachShadow({mode:'open'});
 shadow.addEventListener('click',e=>{
 const b=e.target.closest('[data-act],[data-to]');if(!b)return;
 if(b.dataset.to){go(b.dataset.to);return}
 switch(b.dataset.act){
 case 'grade':E.state().active=b.dataset.value;E.save();go('home');break;
 case 'profile':E.state().active=null;E.save();round=null;stopDuelTimer();duel=null;go('home');break;
 case 'table':go('table/'+b.dataset.value);break;
 case 'practice':begin('table',b.dataset.value);break;
 case 'mixed':begin('mixed');break;
  case 'autonext':autoNext=!autoNext;draw();break;
 case 'next':next();break;
 case 'duelTable':if(route()==='duel/setup'){duelPrefs.names=[shadow.getElementById('player1').value,shadow.getElementById('player2').value];const t=Number(b.dataset.value);if(duelPrefs.tables.includes(t)){if(duelPrefs.tables.length>1)duelPrefs.tables=duelPrefs.tables.filter(x=>x!==t)}else duelPrefs.tables.push(t);draw()}break;
 case 'duelAll':if(route()==='duel/setup'){duelPrefs.names=[shadow.getElementById('player1').value,shadow.getElementById('player2').value];duelPrefs.tables=[1,2,3,4,5,6,7,8,9,10];draw()}break;
 case 'duelSubset':if(route()==='duel/setup'){duelPrefs.names=[shadow.getElementById('player1').value,shadow.getElementById('player2').value];duelPrefs.tables=[6,7,8,9];draw()}break;
 case 'duelFirstSec':case 'duelSecondSec':if(route()==='duel/setup'){duelPrefs.names=[shadow.getElementById('player1').value,shadow.getElementById('player2').value];duelPrefs[b.dataset.act==='duelFirstSec'?'firstSec':'secondSec']=Number(b.dataset.value);draw()}break;
 case 'buzz':buzz(Number(b.dataset.value));break;
 case 'revealDuel':revealDuel();break;
 case 'awardDuel':awardDuel(b.dataset.value==='none'?null:Number(b.dataset.value));break;
 case 'undoDuel':undoDuelAward();break;
 case 'duelNext':duelNext();break;
 case 'duelExit':stopDuelTimer();duel=null;go('home');break;
 case 'again':beginDuel();break;
 }
});
shadow.addEventListener('submit',e=>{
 if(e.target.id==='answerform'){e.preventDefault();answer(shadow.getElementById('answer').value);return}
 if(e.target.id==='duelform'){
 e.preventDefault();duelPrefs.names=[shadow.getElementById('player1').value.trim().slice(0,18)||'Spelare 1',shadow.getElementById('player2').value.trim().slice(0,18)||'Spelare 2'];
 beginDuel();
 }
});

 draw();
}
window.addEventListener('keydown',e=>{
 if(!duel||route()!=='duel/play'||duel.phase!=='buzz'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
 if(['INPUT','TEXTAREA','SELECT'].includes(shadow?.activeElement?.tagName))return;
 const k=e.key.toLowerCase();if(k==='a'||k==='l'){e.preventDefault();buzz(k==='a'?0:1)}
});
window.addEventListener('hashchange',()=>{
  if(location.hash!=='#/tabell/duel/play')stopDuelTimer();
 if(!/^#\/tabell(?:\/|$)/.test(location.hash) && nextTimer){
    clearTimeout(nextTimer);
    nextTimer=null;
  }
});
root.MOTabellArena={mount,qa:{info,mixedQs,tableQs,stables}};
})(typeof window!=='undefined'?window:globalThis);