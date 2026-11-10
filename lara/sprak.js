/* Matte OS · Språkverkstad 3.0
 * Shared texts and tasks for both learner profiles; separate, evidence-based progress per profile.
 * - Answer options are shuffled deterministically per task (same order on every device and profile).
 * - No free text, names or audio are stored. Open answers stay in memory only.
 * - Pair results are never credited as one learner's individual mastery.
 */
(function(root,factory){const o=factory(root);if(typeof module==='object'&&module.exports)module.exports=o;root.MO_WORKSHOP=o;})(typeof window!=='undefined'?window:globalThis,function(root){
'use strict';
const BANK=(root.MO_BANK3||[]).slice();
const ENGINE='3.0.0';
const STORE='matteos.sprak.v3', OLD_STORE='matteos.sprak.v2';
const PROFILES=['grade8','grade9'];
const LANG={sv:'Svenska',en:'Engelska'};
const LEVEL={1:'Grund',2:'Fördjupning',3:'Utmaning'};
const LEVEL_INFO={1:'Kortare text, ordförklaringar och mer stöd.',2:'Längre text, fler slutsatser och belägg.',3:'Lång text, flera perspektiv och granskning – mindre stöd.'};
const SKILLS={
 hitta:'Hitta information som står i texten',
 slutsats:'Dra slutsatser som texten inte säger rakt ut',
 'belägg':'Visa var i texten svaret finns',
 tolka:'Tolka uttryck, bilder och berättarteknik',
 ord:'Förstå och använda ord i nya sammanhang',
 struktur:'Se hur en text är uppbyggd',
 syfte:'Förstå textens syfte och mottagare',
 kritik:'Granska argument och källor',
 strategi:'Välja ett smart sätt att läsa',
 resonera:'Resonera, förklara och skriva'
};
const SKILLS_EN={hitta:'Find information in the text',slutsats:'Draw conclusions','belägg':'Show the evidence',tolka:'Interpret expressions and images',ord:'Words in context',struktur:'Text structure',syfte:'Purpose and reader',kritik:'Evaluate arguments and sources',strategi:'Reading strategy',resonera:'Reason, explain and write'};
const HINTS={
 hitta:'Svaret står i texten. Leta efter ett nyckelord från frågan och läs meningen runt det.',
 slutsats:'Svaret står inte rakt ut. Vad gör personerna, och varför kan de göra så? Kombinera två ledtrådar.',
 'belägg':'Leta efter den mening som skulle övertyga någon som tvivlar på påståendet.',
 tolka:'Fråga dig vad uttrycket eller bilden betyder här, inte ordagrant.',
 ord:'Läs hela meningen. Vilket ord passar både betydelsen och grammatiken?',
 struktur:'Leta efter tidsord som först, sedan, efteråt och nästa – eller efter textens delar.',
 syfte:'Vem är texten skriven för, och vad vill den att läsaren ska veta, göra eller tycka?',
 kritik:'Fråga dig: hur vet skribenten det här? Finns det källor, exempel eller motargument?',
 strategi:'Tänk på vad du vill ta reda på. Behöver du läsa allt, eller kan du söka?',
 resonera:'Säg först vad du tycker, sedan varför, sedan en detalj ur texten.'
};
const HINTS_EN={
 hitta:'The answer is in the text. Find a key word from the question and read the sentence around it.',
 slutsats:'The answer is not stated directly. What do the people do, and why? Combine two clues.',
 'belägg':'Find the sentence that would convince someone who doubts the claim.',
 tolka:'Ask what the expression or image means here, not word for word.',
 ord:'Read the whole sentence. Which word fits both the meaning and the grammar?',
 struktur:'Look for time words like first, next, then and later – or for the parts of the text.',
 syfte:'Who is the text for, and what does it want the reader to know, do or think?',
 kritik:'Ask: how does the writer know this? Are there sources, examples or counter-arguments?',
 strategi:'Think about what you want to find out. Do you need to read everything?',
 resonera:'First say what you think, then why, then a detail from the text.'
};
const OLD_IDS=new Set(['skarmbild','bibliotek','mobilregel','grupparbete','screenshot','library','homework','trophy']);
const DAY=86400000;
const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS='ABCDEFG';

/* ---------- deterministic content ---------- */
function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function permutation(n,seed){const idx=[...Array(n).keys()];const r=rng(hash(seed));for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}return idx;}
function seedOf(t,k){return t.lang+':'+t.id+':v'+t.version+':'+k.id;}
/* Display order for options or items: display[i] = authored index. Order tasks never start solved. */
function displayOrder(t,k){const n=(k.type==='order'?k.items:k.options).length;let p=permutation(n,seedOf(t,k));if(k.type==='order'&&p.every((v,i)=>v===i))p=p.slice(1).concat(p[0]);return p;}
/* Split after . ! ? … when whitespace and a capital, digit or quote follow. No look-behind: Safari < 16.4 cannot parse it. */
function sentences(paragraph){const out=[];const re=/[.!?…]\s+(?=[„”"‘’(A-ZÅÄÖ0-9–])/gu;let start=0,m;while((m=re.exec(paragraph))){out.push(paragraph.slice(start,m.index+1));start=m.index+m[0].length;}out.push(paragraph.slice(start));return out;}
function sentenceList(t){const out=[];t.paragraphs.forEach((p,pi)=>sentences(p).forEach(s=>out.push({p:pi,s})));return out;}
function paragraphOf(t,needle){if(!needle)return -1;return t.paragraphs.findIndex(p=>p.includes(needle));}
function code(t){return t.lang.toUpperCase()+'-'+t.id.toUpperCase()+' · v'+t.version;}
function words(t){return t.paragraphs.join(' ').trim().split(/\s+/).length;}
function minutes(t){return Math.max(2,Math.round(words(t)/(t.lang==='en'?110:150)+t.tasks.length*1.2));}
function getText(lang,id){return BANK.find(t=>t.lang===lang&&t.id===id);}
function tasksFor(t,mode){return mode==='listen'?t.tasks.filter(k=>k.type!=='evidence'):t.tasks.slice();}
function norm(x){return String(x??'').normalize('NFC').toLocaleLowerCase('sv-SE').replace(/[’`´]/g,"'").replace(/\s+/g,' ').trim().replace(/^[„”"']+|[.?!,;:„”"']+$/g,'');}
function isAuto(k){return k.type!=='open';}

/* evaluate(t,k,answer) -> {ok, near?}  answer: choice/evidence = display index or sentence index, order = array of display indices, cloze = string */
function evaluate(t,k,ans){
 if(k.type==='choice'){const d=displayOrder(t,k);return {ok:Number.isInteger(ans)&&d[ans]===0};}
 if(k.type==='evidence'){const list=sentenceList(t);const s=list[ans];return {ok:!!s&&k.targets.some(g=>s.s.includes(g))};}
 if(k.type==='order'){const d=displayOrder(t,k);return {ok:Array.isArray(ans)&&ans.length===k.items.length&&ans.every((di,i)=>d[di]===i)};}
 if(k.type==='cloze'){const v=norm(ans);if(!v)return {ok:false};if(k.accept.some(a=>norm(a)===v))return {ok:true};const near=Object.entries(k.near||{}).find(([w])=>norm(w)===v);return {ok:false,near:near?near[1]:''};}
 return {ok:null};
}

/* ---------- storage: one key, both profiles separate ---------- */
const KNOWN_TEXTS=new Set(BANK.map(t=>t.lang+':'+t.id));
const KNOWN_TASKS=new Map();BANK.forEach(t=>t.tasks.forEach(k=>KNOWN_TASKS.set(t.lang+':'+t.id+':'+k.id,{t,k})));
function emptyProfile(){return {tasks:{},texts:{}};}
function empty(){return {v:3,engine:ENGINE,profiles:{grade8:emptyProfile(),grade9:emptyProfile()}};}
function validAt(x){return Number.isFinite(x)&&x>1600000000000&&x<Date.now()+DAY;}
function sanitize(raw){const out=empty();if(!raw||raw.v!==3||!raw.profiles)return out;
 for(const p of PROFILES){const src=raw.profiles[p];if(!src)continue;
  for(const [key,r] of Object.entries(src.tasks||{})){const known=KNOWN_TASKS.get(key);if(!known||!r||!validAt(r.at))continue;const rec={at:Math.floor(r.at),mode:r.mode==='listen'?'listen':'solo',help:!!r.help,n:Math.max(1,Math.min(99,Math.floor(Number(r.n)||1)))};
   if(known.k.type==='open'){rec.self=Math.max(0,Math.min(known.k.criteria.length,Math.floor(Number(r.self)||0)));}else{rec.ok=r.ok===true;rec.wrong=Math.max(0,Math.min(999,Math.floor(Number(r.wrong) || (!rec.ok?1:0))));rec.lastOk=r.lastOk===true||(r.lastOk===undefined&&rec.ok);if(validAt(r.lastAt))rec.lastAt=Math.floor(r.lastAt);}
   out.profiles[p].tasks[key]=rec;}
  for(const [key,r] of Object.entries(src.texts||{})){if(!KNOWN_TEXTS.has(key)||!r)continue;const rec={};if(validAt(r.started))rec.started=Math.floor(r.started);if(validAt(r.done))rec.done=Math.floor(r.done);rec.pair=Math.max(0,Math.min(999,Math.floor(Number(r.pair)||0)));if(rec.started||rec.done||rec.pair)out.profiles[p].texts[key]=rec;}
 }
 return out;}
function storage(){try{return root.localStorage;}catch{return null;}}
function load(){try{const s=storage();return sanitize(JSON.parse(s?.getItem(STORE)||'null'));}catch{return empty();}}
let store=load();
let saveError=false;
function save(){try{storage().setItem(STORE,JSON.stringify(store));root.MO_STUDY?.markDirty('reading');saveError=false;return true;}catch{saveError=true;return false;}}
function profileData(p){return store.profiles[PROFILES.includes(p)?p:'grade9'];}
function oldCount(p){try{const raw=JSON.parse(storage()?.getItem(OLD_STORE)||'null');return raw&&raw.v===2?Object.keys(raw.profiles?.[p]?.done||{}).length:0;}catch{return 0;}}
/* Only the first individual attempt per task counts as evidence; repeats only raise the counter. */
function recordTask(p,t,k,res){const key=t.lang+':'+t.id+':'+k.id,d=profileData(p);const prior=d.tasks[key];if(prior){prior.n=Math.min(99,(prior.n||1)+1);if(k.type!=='open'){prior.wrong=Math.max(0,Math.min(999,(prior.wrong??(prior.ok?0:1))+(res.ok?0:1)));prior.lastOk=!!res.ok;prior.lastAt=Date.now();}save();return prior;}
 const rec={at:Date.now(),mode:res.mode,help:!!res.help,n:1};if(k.type==='open')rec.self=res.self||0;else{rec.ok=!!res.ok;rec.wrong=res.ok?0:1;rec.lastOk=!!res.ok;rec.lastAt=rec.at;}d.tasks[key]=rec;save();return rec;}
function markText(p,t,field){const key=t.lang+':'+t.id,d=profileData(p);const rec=d.texts[key]||(d.texts[key]={pair:0});if(field==='pair')rec.pair=(rec.pair||0)+1;else if(!rec[field])rec[field]=Date.now();save();}

/* ---------- progression ---------- */
function textStats(p,t){const d=profileData(p);let auto=0,indep=0,helped=0,tried=0;for(const k of t.tasks){if(!isAuto(k))continue;auto++;const r=d.tasks[t.lang+':'+t.id+':'+k.id];if(!r)continue;tried++;if(r.ok&&!r.help)indep++;else if(r.ok)helped++;}
 const rec=d.texts[t.lang+':'+t.id]||{};return {auto,indep,helped,tried,rate:tried?indep/auto:0,done:!!rec.done,started:!!rec.started,pair:rec.pair||0};}
function textStatus(p,t){const s=textStats(p,t);if(s.done)return s.rate>=0.7?{label:'Klarad själv '+s.indep+'/'+s.auto,cls:'good'}:{label:'Gjord · '+s.indep+'/'+s.auto+' själv',cls:'mid'};if(s.started)return {label:'Påbörjad',cls:'mid'};if(s.pair)return {label:'Gjord i par',cls:'mid'};return {label:'Ny',cls:'new'};}
/* Skill status from first individual attempts across different texts. */
function skillStatus(p,lang){const d=profileData(p);const out={};
 for(const skill of Object.keys(SKILLS)){const recs=[];for(const [key,r] of Object.entries(d.tasks)){const known=KNOWN_TASKS.get(key);if(!known||known.t.lang!==lang||known.k.skill!==skill)continue;recs.push({r,t:known.t,k:known.k});}
  if(!recs.length){out[skill]={level:0,label:'Inte övat än'};continue;}
  if(skill==='resonera'){const good=recs.filter(x=>x.r.self>=2).length;out[skill]={level:good?2:1,label:good?'Självbedömt: '+good+' svar med minst två kriterier':'Övat – bedöm ditt svar mot kriterierna',self:true};continue;}
  const indep=recs.filter(x=>x.r.ok&&!x.r.help);const texts=new Set(indep.map(x=>x.t.id));
  const firstIndep=indep.length?Math.min(...indep.map(x=>x.r.at)):0;
  const firstText=indep.find(x=>x.r.at===firstIndep)?.t.id;
  const later=indep.some(x=>x.t.id!==firstText&&x.r.at-firstIndep>=2*DAY);
  if(texts.size>=2&&later)out[skill]={level:4,label:'Befäst – klarat själv i nya texter, även efter några dagar'};
  else if(texts.size>=2)out[skill]={level:3,label:'Klarar själv i '+texts.size+' texter – pröva igen om några dagar'};
  else if(texts.size===1)out[skill]={level:2,label:'Klarat själv i en text – pröva en ny text'};
  else if(recs.some(x=>x.r.ok))out[skill]={level:2,label:'Klarar med stöd'};
  else out[skill]={level:1,label:'Behöver öva mer'};}
 return out;}
function recommend(p,lang){const pool=BANK.filter(t=>t.lang===lang);
 for(const lvl of [1,2,3]){const at=pool.filter(t=>t.level===lvl);const passed=at.filter(t=>{const s=textStats(p,t);return s.done&&s.rate>=0.7;});
  if(passed.length>=Math.min(2,at.length))continue;
  const fresh=at.filter(t=>!textStats(p,t).started&&!textStats(p,t).done);
  if(passed.length&&fresh.length)return {t:fresh[0],why:'Du har klarat en text på nivå '+lvl+' själv. Gör en ny text på samma nivå utan stöd – då ser du om det håller i en ny text.'};
  const next=fresh[0]||at.find(t=>!textStats(p,t).done)||at[0];
  return {t:next,why:lvl===1?'Börja här. Nivån säger hur krävande texten är, inte vilken årskurs du går i.':'Nästa steg: nivå '+lvl+', '+LEVEL[lvl].toLowerCase()+'.'};}
 return {t:pool[pool.length-1],why:'Du har klarat alla nivåer. Gör om en text i lyssna-läge eller i par och förklara för den andra.'};}

/* ---------- UI state (memory only) ---------- */
let ui=fresh('');
function fresh(key){return {key,mode:null,view:'intro',i:0,sel:null,typed:'',picks:[],checked:false,res:null,help:0,showText:false,listenReady:false,voice:'',open:'',self:[],modelShown:false,pair:null,solo:{auto:0,indep:0,helped:0,open:0},focus:true};}
function pairState(){return {turn:0,phase:'answer',ans:[null,null],help:[0,0],res:[null,null],score:[0,0],peer:[[],[]],peerTurn:0};}
function resetTask(){ui.sel=null;ui.typed='';ui.picks=[];ui.checked=false;ui.res=null;ui.help=0;ui.open='';ui.self=[];ui.modelShown=false;ui.focus=true;if(ui.pair){ui.pair.turn=0;ui.pair.phase='answer';ui.pair.ans=[null,null];ui.pair.help=[0,0];ui.pair.res=[null,null];ui.pair.peer=[[],[]];ui.pair.peerTurn=0;}}
const first=i=>i%2; /* who answers first alternates every task */
function playerNow(){return (first(ui.i)+ui.pair.turn)%2;}

/* ---------- rendering helpers ---------- */
function hintText(t,k){const base=(t.lang==='en'?HINTS_EN:HINTS)[k.skill]||'';return k.hint||base;}
function whereText(t,k){const needle=k.type==='evidence'?k.targets[0]:k.type==='choice'?k.evidence:'';const p=paragraphOf(t,needle);if(p<0)return '';return t.lang==='en'?'Look in paragraph '+(p+1)+'.':'Titta i stycke '+(p+1)+'.';}
function textBlock(t,{highlight=-1,compact=false}={}){return `<article class="wk-reading${compact?' wk-compact':''}" lang="${t.lang}">${t.paragraphs.map((p,i)=>`<p class="${i===highlight?'wk-hl':''}"><span class="wk-pn" aria-hidden="true">${i+1}</span>${e(p)}</p>`).join('')}</article>`;}
function stepsBar(list){return `<div class="wk-steps" role="img" aria-label="Uppgift ${ui.i+1} av ${list.length}">${list.map((_,j)=>`<span class="${j===ui.i?'active':j<ui.i?'past':''}"></span>`).join('')}</div>`;}
function chip(s){return `<span class="wk-chip ${s.cls}">${e(s.label)}</span>`;}
function tr(t,sv,en){return t.lang==='en'?en:sv;}

/* Misstag log: only task identifiers, correctness and attempts are saved; no free text. */
function wrongTasks(p,lang){const d=profileData(p),out=[];for(const [key,r] of Object.entries(d.tasks)){const entry=KNOWN_TASKS.get(key);if(!entry||entry.t.lang!==lang||entry.k.type==='open')continue;const wrong=r.wrong??(r.ok?0:1);if(wrong>0)out.push({entry,r,key,wrong});}return out.sort((a,b)=>(b.r.lastAt||b.r.at)-(a.r.lastAt||a.r.at));}
function mistakes(lang,p){if(!LANG[lang])return '<p>Okänt språk.</p>';const arr=wrongTasks(p,lang);const unresolved=arr.filter(x=>x.r.lastOk!==true).length;
return '<a class="back" href="#/'+lang+'">‹ Till alla texter</a><p class="wk-eyebrow">MINA FEL · '+(p==='grade8'?'ÅK 8':'ÅK 9')+'</p><h1>Lär av dina misstag</h1><p class="mut">Här finns frågor som någon gång blev fel: både dem du behöver öva igen och sådant du senare klarat. Vi sparar inte vad du skrev eller vilket alternativ du valde.</p><div class="ord-numbers"><span><strong>'+arr.length+'</strong> frågor med minst ett fel</span><span><strong>'+unresolved+'</strong> behöver repeteras</span></div><a class="wk-quick" href="#/ord/'+lang+'"><strong>Träna ord som känns svåra</strong><span>Ordlek · korta kryssfrågor ›</span></a>'
+(arr.length?arr.map(({entry,r,wrong})=>{const t=entry.t,k=entry.k;const q=k.type==='cloze'?k.sentence:k.type==='evidence'?k.claim:k.ask;return '<section class="wk-card"><span class="wk-chip '+(r.lastOk?'good':'mid')+'">'+(r.lastOk?'Klarat vid senare försök':'Behöver övas')+'</span><p class="wk-eyebrow">'+e(t.title)+'</p><h2>'+e(q||'Vilket svar visar att du förstår texten?')+'</h2><p class="mut small">'+wrong+' felaktiga försök · '+(r.n||1)+' försök totalt</p><details><summary>Visa rätt svar och förklaring</summary><p><strong>Rätt svar:</strong> '+e(solution(t,k))+'</p><p>'+e(k.why||'Läs stycket i texten och försök igen.')+'</p></details><a class="wk-link" href="#/verkstad/'+t.lang+'/'+t.id+'">Öppna texten och öva igen ›</a></section>';}).join(''):'<p>Inga fel registrerade ännu. Välj en text och pröva.</p>');}

/* ---------- library ---------- */
function library(lang,active){if(!LANG[lang])return '<p>Okänt språk.</p>';const pool=BANK.filter(t=>t.lang===lang);const rec=recommend(active,lang);const skills=skillStatus(active,lang);
 const practised=Object.entries(skills).filter(([,v])=>v.level>0);
 const old=oldCount(active);
 return `<a class="back" href="#/">‹ Till start</a><p class="wk-eyebrow">SPRÅKVERKSTAD 3.1 · SAMMA TEXTER FÖR BÅDA</p><h1>${LANG[lang]} – läsa, förstå, samtala</h1>
 <p class="wk-lead">${lang==='sv'?'Riktiga texter i olika genrer. Svara själv, visa var i texten svaret finns och förklara för varandra.':'Real texts in different genres. Answer on your own, show the evidence in the text and explain to each other.'}</p>
 <section class="wk-feature"><div><span class="wk-eyebrow">NÄSTA STEG FÖR DEN HÄR PROFILEN</span><h2>${e(rec.t.title)}</h2><p>${e(rec.why)}</p><small>${e(rec.t.genre)} · nivå ${rec.t.level} ${e(LEVEL[rec.t.level])} · ca ${minutes(rec.t)} min</small></div><a class="wk-btn" href="#/verkstad/${lang}/${rec.t.id}">Öppna texten →</a></section>
 <div class="wk-toplinks"><a class="wk-quick" href="#/ord/${lang}"><strong>${lang==='sv'?'Lek med svenska ord':'Play with English words'}</strong><span>Betydelse · ord i meningar · skriv själv ›</span></a><a class="wk-quick" href="#/fel/${lang}"><strong>Mina fel · ${wrongTasks(active,lang).length}</strong><span>Se vad som blev fel och repetera ›</span></a></div>
 <nav class="wk-jump" aria-label="Hoppa direkt till svårighetsgrad">${[1,2,3].map(n=>`<button class="wk-jump-button" type="button" data-a="jump-level" data-level="${n}">Nivå ${n} · ${LEVEL[n]}</button>`).join('')}</nav>\n ${[1,2,3].map(lvl=>`<h2 class="wk-section" tabindex="-1" id="wk-level-${lvl}">Nivå ${lvl} · ${LEVEL[lvl]}</h2><p class="mut small">${LEVEL_INFO[lvl]}</p><div class="wk-booklist">${pool.filter(t=>t.level===lvl).map(t=>`<a class="wk-book" href="#/verkstad/${lang}/${t.id}"><span class="wk-book-meta">${e(t.genre)} · ${words(t)} ord · ca ${minutes(t)} min</span><h3>${e(t.title)}</h3><p>${e(t.lead)}</p>${chip(textStatus(active,t))}</a>`).join('')}</div>`).join('')}
 <section class="wk-card wk-skills"><h2>Vad den här profilen har visat</h2>${practised.length?`<ul class="wk-skilllist">${practised.map(([k,v])=>`<li class="lvl${v.level}"><strong>${e(SKILLS[k])}</strong><span>${e(v.label)}</span></li>`).join('')}</ul>`:'<p class="mut">Inget än. Gör en text på egen hand, så visas här vad du klarar – inte bara hur mycket du gjort.</p>'}
 <p class="mut small">Bara ditt första försök på varje uppgift räknas, och uppgifter där du tog ledtråd räknas som ”med stöd”. Att göra om samma text visar inte att du kan något nytt. Öppna svar bedömer du själv mot kriterier. ${old?'Från Språkverkstad 2.0 finns '+old+' tränade nivåer sparade på enheten; de raderas inte.':''}</p></section>
 <section class="wk-explain"><h2>Så tränar ni två</h2><ol><li><strong>Två på en mobil:</strong> öppna en text och välj ”Två på en mobil”. Ni svarar i tur och ordning, svaren låses och syns först när båda svarat.</li><li><strong>Två mobiler:</strong> öppna samma text på båda. Ni får samma frågor och samma bokstäver i samma ordning (koden visas överst). Säg era bokstäver högt och jämför – mobilerna synkas inte.</li><li><strong>Lyssna-läge:</strong> en läser texten högt, den andra svarar utan att se texten.</li></ol><p class="mut small">Poäng ges för rätt svar och för förklaringar som kamraten bedömer. Det finns ingen tidspress – den som läser långsamt förlorar inget.</p></section>
 <a class="wk-quick" href="#/korta/${lang}"><strong>Korta övningar i ${LANG[lang].toLowerCase()}</strong><span>Ordförståelse, lyssna, skriva och tala – korta pass ›</span></a>`;}

/* ---------- text page ---------- */
function page(route,active){const parts=route.replace(/^\/verkstad\/?/,'').split('/').filter(Boolean);const [lang,id]=parts;
 if(LANG[lang]&&OLD_IDS.has(id))return `<a class="back" href="#/${e(lang)}">‹ Alla texter</a><div class="wk-card"><h1>Texten har ersatts</h1><p>Den här länken gick till en text i Språkverkstad 2.0. Texterna har bytts ut mot nya, längre texter med bättre uppgifter. Dina gamla framsteg finns kvar på enheten.</p><a class="wk-btn" href="#/${e(lang)}">Välj en ny text →</a></div>`;
 const t=getText(lang,id);if(!t)return `<a class="back" href="#/">‹ Till start</a><div class="wk-card"><p>Texten hittades inte. Välj språk och text igen.</p><a class="wk-btn" href="#/sv">Svenska texter</a> <a class="wk-btn" href="#/en">Engelska texter</a></div>`;
 const key=active+':'+lang+':'+id;if(ui.key!==key)ui=fresh(key);
 const link=(root.location?root.location.origin+root.location.pathname:'')+'#/verkstad/'+lang+'/'+id;
 const head=`<a class="back" href="#/${lang}">‹ Alla texter på ${LANG[lang].toLowerCase()}</a><p class="wk-eyebrow">${LANG[lang].toUpperCase()} · ${e(t.genre)} · NIVÅ ${t.level} ${e(LEVEL[t.level]).toUpperCase()}</p><h1 ${ui.view==='intro'?'tabindex="-1" data-wfocus':''}>${e(t.title)}</h1>`;
 let body='';
 if(ui.view==='intro')body=intro(t,link);
 else if(ui.view==='read')body=reading(t);
 else if(ui.view==='task')body=taskView(t,active);
 else if(ui.view==='talk')body=talkView(t);
 else body=doneView(t,active);
 return head+body;}
function intro(t,link){return `<p class="wk-lead">${e(t.lead)}</p><div class="wk-inline"><span>${words(t)} ord</span><span>${t.tasks.length} uppgifter</span><span>ca ${minutes(t)} min</span>${t.note?`<span>${e(t.note)}</span>`:''}</div>
 <div class="wk-challenge"><div><small>UTMANINGSKOD</small><strong>${e(code(t))}</strong><span class="mut small">Samma kod ger samma text, frågor och svarsordning på alla mobiler och för båda årskurserna.</span></div><button data-w="share" data-link="${e(link)}" class="wk-link">Kopiera länken</button></div>
 <h2 class="wk-section">Hur vill ni träna?</h2><div class="wk-modes">
 <button class="wk-mode" data-w="mode" data-mode="solo"><strong>Själv</strong><span>Läs, svara och få återkoppling. Ditt första försök sparas på den här profilen.</span></button>
 <button class="wk-mode" data-w="mode" data-mode="pair"><strong>Två på en mobil</strong><span>Turas om att svara. Svaren låses och visas först när båda har svarat. Sparas inte som individuell nivå.</span></button>
 <button class="wk-mode" data-w="mode" data-mode="listen"><strong>Lyssna-läge</strong><span>En läser texten högt, den andra svarar utan att se texten. Tränar hörförståelse med en riktig uppläsare.</span></button></div>
 <p class="mut small">Två mobiler? Välj ”Själv” på båda och jämför bokstäverna högt efter varje fråga.</p>`;}
function reading(t){const tts=`<button type="button" data-w="tts" class="wk-link">${tr(t,'Läs upp med talsyntes','Read aloud with speech synthesis')}</button>`;
 if(ui.mode==='listen'&&!ui.listenReady)return `<div class="wk-card"><h2 tabindex="-1" data-wfocus>Lyssna-läge · uppläsaren läser</h2><p><strong>Lyssnaren:</strong> titta bort från skärmen. <strong>Uppläsaren:</strong> läs texten högt i lugn takt. Läs gärna en gång till om lyssnaren ber om det.</p><p class="mut small">Uppgifter där man pekar ut meningar i texten hoppas över i lyssna-läge. Ingen uppläsare? Talsyntes kan läsa, men det är ett stöd och inte samma sak som provets inspelade ljud.</p><div class="wk-toolbar">${tts}</div>${ui.voice?`<p class="wk-note" role="status">${e(ui.voice)}</p>`:''}${textBlock(t)}<button class="wk-btn wk-wide" data-w="listen-done">Uppläsningen är klar – dölj texten →</button></div>`;
 return `<div class="wk-card"><h2 tabindex="-1" data-wfocus>Läs texten</h2><div class="wk-purpose"><small>LÄSMÅL</small><p>${e(t.purpose)}</p></div>
 ${t.glossary?.length?`<details class="wk-gloss" ${t.level===1?'open':''}><summary>${tr(t,'Ord som kan vara bra att kunna','Useful words (svenska förklaringar)')}</summary><dl>${t.glossary.map(g=>`<div><dt>${e(g.term)}</dt><dd>${e(g.explain)}</dd></div>`).join('')}</dl></details>`:''}
 <div class="wk-toolbar">${tts}</div>${ui.voice?`<p class="wk-note" role="status">${e(ui.voice)}</p>`:''}
 ${textBlock(t)}
 <p class="mut small">Tips: säg efter varje stycke en mening om vad som hände eller vad stycket handlade om.</p>
 <button class="wk-btn wk-wide" data-w="start-tasks">Till uppgifterna (${tasksFor(t,ui.mode).length}) →</button></div>`;}

function answerInput(t,k,disabled){
 if(k.type==='choice'){const d=displayOrder(t,k);return `<div class="wk-options" role="group" aria-label="Svarsalternativ">${d.map((ai,di)=>`<button type="button" class="wk-option ${ui.sel===di?'on':''}" data-w="pick" data-i="${di}" aria-pressed="${ui.sel===di}" ${disabled?'disabled':''}><b>${LETTERS[di]}</b><span>${e(k.options[ai])}</span></button>`).join('')}</div>`;}
 if(k.type==='evidence'){const list=sentenceList(t);let cur=-1;let html='<div class="wk-sentences" role="group" aria-label="Meningar i texten">';list.forEach((s,i)=>{if(s.p!==cur){if(cur>=0)html+='</p>';html+=`<p><span class="wk-pn" aria-hidden="true">${s.p+1}</span>`;cur=s.p;}html+=`<span role="button" tabindex="${disabled?'-1':'0'}" class="wk-sent ${ui.sel===i?'on':''}" ${disabled?'aria-disabled="true"':'data-w="pick"'} data-i="${i}" aria-pressed="${ui.sel===i}">${e(s.s)}</span> `;});return html+'</p></div>';}
 if(k.type==='order'){const d=displayOrder(t,k);return `<div class="wk-order" role="group" aria-label="Händelser att ordna">${d.map((ai,di)=>{const pos=ui.picks.indexOf(di);return `<button type="button" class="wk-option ${pos>=0?'on':''}" data-w="order" data-i="${di}" aria-pressed="${pos>=0}" ${disabled||pos>=0?'disabled':''}><b>${pos>=0?pos+1:'·'}</b><span>${e(k.items[ai])}</span></button>`;}).join('')}</div>${!disabled&&ui.picks.length?`<button type="button" class="wk-link" data-w="order-undo">Ångra senaste</button>`:''}`;}
 if(k.type==='cloze'){return `<p class="wk-sentence">${e(k.sentence).replace('___','<span class="wk-blank">______</span>')}</p><label for="wk-type" class="wk-label">${tr(t,'Skriv ordet som saknas','Write the missing word')}</label><input id="wk-type" class="wk-input" type="text" value="${e(ui.typed)}" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" ${disabled?'readonly':''}>${ui.help>=2&&!disabled?`<div class="wk-chips">${displayOrder(t,k).map(ai=>`<button type="button" data-w="fill" data-value="${e(k.options[ai])}">${e(k.options[ai])}</button>`).join('')}</div>`:''}`;}
 return '';}
function ready(k){if(k.type==='choice'||k.type==='evidence')return ui.sel!==null;if(k.type==='order')return ui.picks.length===k.items.length;if(k.type==='cloze')return norm(ui.typed).length>0;return true;}
/* The input element is the source of truth for typed answers: iOS autocorrect/IME may not fire every input event. */
function syncTyped(){const el=root.document?.getElementById?.('wk-type');if(el&&typeof el.value==='string')ui.typed=el.value;}
function currentAnswer(k){if(k.type==='order')return ui.picks.slice();if(k.type==='cloze'){syncTyped();return ui.typed;}return ui.sel;}
function describeAnswer(t,k,ans){if(ans===null||ans===undefined)return '–';if(k.type==='choice')return LETTERS[ans]+': '+k.options[displayOrder(t,k)[ans]];if(k.type==='evidence')return '”'+(sentenceList(t)[ans]?.s||'')+'”';if(k.type==='order'){const d=displayOrder(t,k);return ans.map(di=>k.items[d[di]]).join(' → ');}return String(ans);}
function solution(t,k){if(k.type==='choice'){const d=displayOrder(t,k);const di=d.indexOf(0);return LETTERS[di]+': '+k.options[0];}if(k.type==='evidence')return '”'+(sentenceList(t).find(s=>k.targets.some(g=>s.s.includes(g)))?.s||k.targets[0])+'”';if(k.type==='order')return k.items.join(' → ');if(k.type==='cloze')return k.accept.join(' / ');return '';}
function explain(t,k){const p=paragraphOf(t,k.type==='choice'?k.evidence:k.type==='evidence'?k.targets[0]:'');const quote=k.type==='choice'&&k.evidence?`<blockquote><small>${tr(t,'Textbevis','Evidence')}${p>=0?' · '+tr(t,'stycke','paragraph')+' '+(p+1):''}</small><p>”${e(k.evidence)}”</p></blockquote>`:'';return `<p>${e(k.why||'')}</p>${quote}`;}
function helpTools(t,k,disabled){if(disabled||k.type==='open')return '';const where=ui.mode!=='listen'?whereText(t,k):'';
 return `<div class="wk-help">${ui.help>=1?`<p class="wk-note"><strong>${tr(t,'Ledtråd','Hint')}:</strong> ${e(hintText(t,k))}${ui.help>=2&&where?' '+e(where):''}${ui.help>=2&&k.type==='cloze'?' '+tr(t,'Välj ett av orden nedan eller skriv själv.','Pick one of the words below or write your own.'):''}</p>`:''}
 ${ui.help<1?`<button type="button" class="wk-link" data-w="hint">${tr(t,'Jag behöver en ledtråd','I need a hint')}</button>`:ui.help<2&&(where||k.type==='cloze')?`<button type="button" class="wk-link" data-w="hint">${k.type==='cloze'?tr(t,'Visa tre ord att välja mellan','Show three words to choose from'):tr(t,'Visa var i texten','Show where in the text')}</button>`:''}
 <span class="mut small">${ui.help?tr(t,'Uppgiften räknas som gjord med stöd.','This task counts as done with support.'):''}</span></div>`;}
function textToggle(t,k){if(ui.mode==='listen'||k.type==='evidence')return '';const p=ui.help>=2?paragraphOf(t,k.type==='choice'?k.evidence:''):-1;return `<button type="button" class="wk-link" data-w="toggle-text" aria-expanded="${ui.showText}">${ui.showText?tr(t,'Dölj texten','Hide the text'):tr(t,'Visa texten','Show the text')}</button>${ui.showText?textBlock(t,{highlight:p,compact:true}):''}`;}
function askOf(k){return k.type==='evidence'?(k.claim):k.type==='cloze'?'':k.ask;}

function taskView(t,active){const list=tasksFor(t,ui.mode);const k=list[ui.i];if(!k){ui.view='talk';return talkView(t);}
 const skill=(t.lang==='en'?SKILLS_EN:SKILLS)[k.skill]||'';const label=`<p class="wk-eyebrow">${tr(t,'UPPGIFT','TASK')} ${ui.i+1} ${tr(t,'AV','OF')} ${list.length} · ${e(skill.toUpperCase())}</p>`;
 const ask=k.type==='evidence'?`<h2 tabindex="-1" data-wfocus>${tr(t,'Tryck på meningen som bäst visar att påståendet stämmer','Tap the sentence that best shows the claim is true')}</h2><p class="wk-claim">${e(k.claim)}</p>`:k.type==='cloze'?`<h2 tabindex="-1" data-wfocus>${tr(t,'Vilket ord saknas?','Which word is missing?')}</h2>`:`<h2 tabindex="-1" data-wfocus>${e(k.ask)}</h2>`;
 if(ui.mode==='pair')return stepsBar(list)+label+pairTask(t,k,ask);
 if(k.type==='open')return stepsBar(list)+label+openSolo(t,k,ask);
 const done=ui.checked;
 const feedback=done?`<div class="wk-feedback ${ui.res.ok?'good':'try'}" role="status" tabindex="-1" data-wfb><b>${ui.res.ok?(ui.help?tr(t,'Rätt – med stöd','Correct – with support'):tr(t,'Rätt, och helt själv','Correct, all on your own')):tr(t,'Inte riktigt','Not quite')}</b>${ui.res.near?`<p>${e(ui.res.near)}</p>`:''}${!ui.res.ok?`<p><strong>${tr(t,'Rätt svar','Correct answer')}:</strong> ${e(solution(t,k))}</p>`:''}${explain(t,k)}</div><button class="wk-btn wk-wide" data-w="next">${ui.i<list.length-1?tr(t,'Nästa uppgift →','Next task →'):tr(t,'Till samtalet →','To the discussion →')}</button>`:
  `<button class="wk-btn wk-wide" data-w="check" ${ready(k)?'':'disabled'}>${tr(t,'Kontrollera','Check')}</button>`;
 return `${stepsBar(list)}${label}<div class="wk-card">${ask}${answerInput(t,k,done)}${helpTools(t,k,done)}${feedback}${textToggle(t,k)}</div>`;}
function openSolo(t,k,ask){return `<div class="wk-card">${ask}<p class="mut small">${tr(t,'Svara skriftligt eller muntligt. Om elevsynk är aktiv sparas inlämnad text och visas för din kopplade mentor; annars stannar den lokalt tills synk aktiveras.','Answer in writing or out loud. What you write is not saved or sent anywhere.')}</p><label class="wk-label" for="wk-open">${tr(t,'Ditt svar (frivilligt att skriva)','Your answer (writing is optional)')}</label><textarea id="wk-open" class="wk-input wk-text" rows="5" maxlength="1500">${e(ui.open)}</textarea>
 ${!ui.checked?`<button class="wk-btn wk-wide" data-w="open-done">${tr(t,'Jag har svarat – visa kriterierna','I have answered – show the criteria')}</button>`:
 `<div class="wk-feedback neutral"><b>${tr(t,'Bedöm ditt svar','Check your own answer')}</b><p class="mut small">${tr(t,'Kryssa i det ditt svar faktiskt innehåller. Det här är en självbedömning, inte en automatisk rättning.','Tick what your answer really contains. This is self-assessment, not automatic marking.')}</p>${k.criteria.map((c,j)=>`<label class="wk-check"><input type="checkbox" data-w-crit="${j}" ${ui.self.includes(j)?'checked':''}><span>${e(c)}</span></label>`).join('')}
 ${ui.modelShown?`<blockquote><small>${tr(t,'Ett exempel – andra svar kan vara lika bra','One example – other answers can be just as good')}</small><p>${e(k.model)}</p></blockquote>`:`<button type="button" class="wk-link" data-w="model">${tr(t,'Visa ett exempelsvar','Show an example answer')}</button>`}</div><button class="wk-btn wk-wide" data-w="open-next">${tr(t,'Spara bedömningen och gå vidare →','Save my assessment and continue →')}</button>`}
 ${textToggle(t,k)}</div>`;}
function pairTask(t,k,ask){const P=ui.pair;const name=n=>tr(t,'Spelare ','Player ')+(n+1);
 const score=`<div class="wk-pairscore" aria-label="Poäng"><span>${name(0)}: <b>${P.score[0]}</b></span><span>${name(1)}: <b>${P.score[1]}</b></span></div>`;
 if(k.type==='open'){const who=P.peerTurn,judge=1-who;
  if(P.phase==='answer')return `${score}<div class="wk-card">${ask}<p>${tr(t,'Båda svarar muntligt, en i taget. ','Both answer out loud, one at a time. ')}<strong>${name(first(ui.i))}</strong> ${tr(t,'börjar.','starts.')} ${tr(t,'Den andra lyssnar och får sedan bedöma.','The other listens and then assesses.')}</p><div class="wk-role"><span>${tr(t,'1 · Säg vad du tycker','1 · Say what you think')}</span><span>${tr(t,'2 · Säg varför','2 · Say why')}</span><span>${tr(t,'3 · Peka på något i texten','3 · Point to something in the text')}</span></div><button class="wk-btn wk-wide" data-w="pair-open-ready">${tr(t,'Båda har svarat – bedöm varandra','Both have answered – assess each other')}</button>${textToggle(t,k)}</div>`;
  return `${score}<div class="wk-card"><h2 tabindex="-1" data-wfocus>${name(judge)} ${tr(t,'bedömer','assesses')} ${name(who)}</h2><p class="mut small">${tr(t,'Kamratbedömning: kryssa i det som fanns med i svaret. Varje kryss ger en poäng. Var ärlig – det är så ni lär er.','Peer assessment: tick what was really in the answer. Each tick is one point. Be honest – that is how you learn.')}</p>${k.criteria.map((c,j)=>`<label class="wk-check"><input type="checkbox" data-w-peer="${j}" ${P.peer[who].includes(j)?'checked':''}><span>${e(c)}</span></label>`).join('')}<details><summary>${tr(t,'Exempelsvar','Example answer')}</summary><p>${e(k.model)}</p></details><button class="wk-btn wk-wide" data-w="peer-next">${who===first(ui.i)?tr(t,'Klart – nu bedömer vi den andra →','Done – now the other one →'):tr(t,'Klart – nästa uppgift →','Done – next task →')}</button></div>`;}
 if(P.phase==='pass'){const n=playerNow();return `${score}<div class="wk-card wk-pass"><h2 tabindex="-1" data-wfocus>${tr(t,'Lämna över mobilen till','Hand the phone to')} ${name(n)}</h2><p>${tr(t,'Svaret är låst och syns inte. Ingen tjuvkikning – båda ska tänka själva.','The answer is locked and hidden. No peeking – both of you think for yourselves.')}</p><button class="wk-btn wk-wide" data-w="pair-take">${tr(t,'Jag är','I am')} ${name(n)} – ${tr(t,'visa uppgiften','show the task')}</button></div>`;}
 if(P.phase==='reveal'){const a=P.res;return `${score}<div class="wk-card">${ask}<div class="wk-compare">${[0,1].map(n=>`<div class="${a[n].ok?'good':'try'}"><strong>${name(n)}</strong><span>${e(describeAnswer(t,k,P.ans[n]))}</span><em>${a[n].ok?(P.help[n]?tr(t,'Rätt med ledtråd · +1','Correct with hint · +1'):tr(t,'Rätt själv · +2','Correct alone · +2')):tr(t,'Inte rätt · 0','Not correct · 0')}</em></div>`).join('')}</div><div class="wk-feedback neutral" role="status" tabindex="-1" data-wfb><b>${tr(t,'Facit','Answer')}: ${e(solution(t,k))}</b>${explain(t,k)}</div><p class="wk-talk">${a[0].ok&&a[1].ok?tr(t,'Båda rätt! Den som svarade sist förklarar varför – med textbeviset.','Both correct! The one who answered last explains why – using the evidence.'):a[0].ok||a[1].ok?tr(t,'Den som hade rätt förklarar för den andra, med stöd i texten. Den andra säger sedan förklaringen med egna ord.','The one who was right explains to the other, using the text. Then the other says it in their own words.'):tr(t,'Ingen hade rätt. Leta upp textbeviset tillsammans och läs det högt.','Nobody was right. Find the evidence together and read it aloud.')}</p><button class="wk-btn wk-wide" data-w="next">${tr(t,'Vi har pratat om det →','We have talked about it →')}</button></div>`;}
 const n=playerNow();return `${score}<div class="wk-card"><p class="wk-turn">${tr(t,'Tur','Turn')}: <strong>${name(n)}</strong>${P.turn===0?` · ${name(1-n)} ${tr(t,'tittar bort','looks away')}`:''}</p>${ask}${answerInput(t,k,false)}${helpTools(t,k,false)}<button class="wk-btn wk-wide" data-w="pair-lock" ${ready(k)?'':'disabled'}>${tr(t,'Lås mitt svar','Lock my answer')}</button>${textToggle(t,k)}</div>`;}
function talkView(t){return `<div class="wk-card"><p class="wk-eyebrow">${tr(t,'SAMTAL · TURAS OM','DISCUSSION · TAKE TURNS')}</p><h2 tabindex="-1" data-wfocus>${e(t.talk.prompt)}</h2><p>${e(t.talk.follow)}</p><div class="wk-role"><span>${tr(t,'1 · En säger sin åsikt och ett skäl','1 · One says an opinion and a reason')}</span><span>${tr(t,'2 · Den andra frågar ”hur menar du?” eller ”varför?”','2 · The other asks “what do you mean?” or “why?”')}</span><span>${tr(t,'3 · Byt roller och pröva ett motargument','3 · Swap roles and try a counter-argument')}</span></div>${t.lang==='en'?'<p class="mut small">Försök prata engelska hela tiden. Fastnar ni: säg det på ett annat sätt (”I mean…”, ”It’s like…”) i stället för att byta till svenska.</p>':''}<p class="mut small">Ensam? Säg dina svar högt eller skriv tre meningar.</p><button class="wk-btn wk-wide" data-w="finish">${tr(t,'Vi är klara →','We are done →')}</button></div>`;}
function nextId(t,rec){if(rec.t.id!==t.id)return rec.t.id;const same=BANK.find(x=>x.lang===t.lang&&x.level===t.level&&x.id!==t.id);return (same||rec.t).id;}
function doneView(t,active){const lang=t.lang;const rec=recommend(active,lang);
 if(ui.mode==='pair'){const s=ui.pair.score;return `<div class="wk-card wk-result"><p class="wk-eyebrow">PARÖVNING KLAR</p><h1 tabindex="-1" data-wfocus>Bra samarbete</h1><div class="wk-pairscore big"><span>Spelare 1: <b>${s[0]}</b></span><span>Spelare 2: <b>${s[1]}</b></span></div><p>Poängen bygger på rätt svar (2 själv, 1 med ledtråd) och på kamratbedömda förklaringar. De visar hur ni tänkte i dag, inte vem som är bäst.</p><p class="mut small">Parövningar sparas inte som individuell nivå, eftersom mobilen inte kan veta vem som tänkte vad. Gör en ny text själv för att visa vad du klarar.</p><div class="wk-actions"><a class="wk-btn" href="#/verkstad/${lang}/${nextId(t,rec)}">Nästa text →</a><a class="wk-link" href="#/${lang}">Alla texter</a></div></div>`;}
 const s=ui.solo;const statusLine=s.auto?`${s.indep} av ${s.auto} automatiskt rättade uppgifter rätt helt själv${s.helped?', '+s.helped+' rätt med stöd':''}.`:'';
 return `<div class="wk-card wk-result"><p class="wk-eyebrow">${ui.mode==='listen'?'LYSSNA-LÄGE KLART':'TEXTEN KLAR'}</p><h1 tabindex="-1" data-wfocus>Du har arbetat med en hel text</h1><p>${e(statusLine)}${s.open?' '+s.open+' öppna svar bedömda mot kriterier.':''}</p><p class="mut small">Det här är inte ett betyg. En text visar inte att du behärskar något. Det syns först när du klarar en <strong>ny</strong> text på samma nivå själv – helst några dagar senare.</p>
 <div class="wk-feature"><div><span class="wk-eyebrow">FÖRSLAG</span><h2>${e((BANK.find(x=>x.id===nextId(t,rec)&&x.lang===lang)||rec.t).title)}</h2><p>${e(rec.t.id===t.id?'Gör en ny text på samma nivå själv – det visar om det du lärt dig håller i en ny text.':rec.why)}</p></div><a class="wk-btn" href="#/verkstad/${lang}/${nextId(t,rec)}">Öppna →</a></div>${saveError?'<p class="wk-note">Framstegen kunde inte sparas på den här enheten (lagringen är full eller avstängd).</p>':''}<div class="wk-actions"><a class="wk-link" href="#/${lang}">Alla texter</a></div></div>`;}

/* ---------- actions ---------- */
function redraw(){if(typeof root.MOL_RENDER==='function')root.MOL_RENDER();if(ui.focus&&typeof root.requestAnimationFrame==='function'){const sel=ui.focus==='fb'?'[data-wfb]':'[data-wfocus]';ui.focus=false;root.requestAnimationFrame(()=>{const doc=root.document,a=doc?.activeElement;/* Never steal focus from a field the learner has already entered. */if(a&&a.matches?.('input,textarea,select,[contenteditable=true]'))return;const f=doc?.querySelector(sel);if(f&&f.focus)f.focus({preventScroll:false});});}}
function current(){const route=(root.location?.hash||'').replace(/^#/,'');const p=decodeURIComponent(route).replace(/^\/verkstad\/?/,'').split('/');return getText(p[0],p[1]);}
function activeProfile(){return root.MOL_ACTIVE?.()||'grade9';}
function speak(t){const msg=t.lang==='en'?'Ingen engelsk röst hittades på enheten. Läs högt för varandra.':'Ingen svensk röst hittades på enheten. Läs högt för varandra.';
 if(!('speechSynthesis' in root)||!('SpeechSynthesisUtterance' in root)){ui.voice='Talsyntes finns inte i den här webbläsaren. Läs högt för varandra.';redraw();return;}
 try{const want=t.lang==='en'?'en':'sv';const voices=root.speechSynthesis.getVoices?.()||[];if(voices.length&&!voices.some(v=>String(v.lang).toLowerCase().startsWith(want))){ui.voice=msg;redraw();return;}
  root.speechSynthesis.cancel();const u=new root.SpeechSynthesisUtterance(t.paragraphs.join(' '));u.lang=t.lang==='en'?'en-GB':'sv-SE';u.rate=0.9;u.onerror=()=>{ui.voice='Uppläsningen fungerade inte. Läs högt för varandra.';redraw();};root.speechSynthesis.speak(u);ui.voice='Talsyntesen läser. Det är ett stöd för läsningen, inte ett hörförståelsetest.';redraw();}catch{ui.voice='Uppläsningen fungerade inte. Läs högt för varandra.';redraw();}}
function stopSpeech(){try{if('speechSynthesis' in root)root.speechSynthesis.cancel();}catch{}}
function handle(action,el){const t=current();if(!t)return;const active=activeProfile();const list=tasksFor(t,ui.mode||'solo');const k=list[ui.i];
 switch(action){
 case 'mode':ui.mode=['solo','pair','listen'].includes(el.dataset.mode)?el.dataset.mode:'solo';ui.view='read';ui.i=0;ui.pair=ui.mode==='pair'?pairState():null;ui.solo={auto:0,indep:0,helped:0,open:0};resetTask();if(ui.mode!=='pair')markText(active,t,'started');break;
 case 'listen-done':stopSpeech();ui.listenReady=true;ui.view='task';ui.i=0;resetTask();break;
 case 'start-tasks':stopSpeech();ui.view='task';ui.i=0;resetTask();break;
 case 'tts':speak(t);return;
 case 'toggle-text':ui.showText=!ui.showText;break;
 case 'hint':ui.help=Math.min(2,ui.help+1);if(ui.mode==='pair')ui.pair.help[playerNow()]=ui.help;break;
 case 'pick':if(ui.checked)return;ui.sel=Number(el.dataset.i);break;
 case 'order':{const i=Number(el.dataset.i);if(!ui.picks.includes(i))ui.picks.push(i);break;}
 case 'order-undo':ui.picks.pop();break;
 case 'fill':ui.typed=el.dataset.value||'';break;
 case 'check':{if(k?.type==='cloze')syncTyped();if(!k||ui.checked||!ready(k))return;const res=evaluate(t,k,currentAnswer(k));ui.res=res;ui.checked=true;ui.focus='fb';ui.solo.auto++;if(res.ok&&!ui.help)ui.solo.indep++;else if(res.ok)ui.solo.helped++;recordTask(active,t,k,{ok:res.ok,help:ui.help>0,mode:ui.mode});
   root.MO_STUDY?.capture({grade:active,module:'reading',question_id:t.lang+':'+t.id+':'+k.id,
     question_text:k.ask||k.claim||k.sentence||'',passage_title:t.title,
     passage_text:t.paragraphs.join('\n\n'),answer:describeAnswer(t,k,currentAnswer(k)),
     solution_text:solution(t,k),is_correct:!!res.ok,help_used:ui.help>0,type:k.type,
     mode:ui.mode,content_version:String(t.version||1)});
   break;}
 case 'next':ui.i++;resetTask();ui.showText=false;if(ui.i>=list.length)ui.view='talk';break;
 case 'open-done':ui.checked=true;ui.focus=false;break;
 case 'model':ui.modelShown=true;ui.focus=false;break;
 case 'open-next':{
 const written=root.document?.getElementById?.('wk-open')?.value??ui.open;
 root.MO_STUDY?.capture({grade:active,module:'reading',question_id:t.lang+':'+t.id+':'+k.id,
   question_text:k.ask||'',passage_title:t.title,passage_text:t.paragraphs.join('\n\n'),
   answer:String(written||'').slice(0,1500),solution_text:k.model||'',is_correct:null,
   help_used:false,type:'open',mode:ui.mode,content_version:String(t.version||1),
   criteria:ui.self.map(i=>k.criteria[i])});
 recordTask(active,t,k,{self:ui.self.length,mode:ui.mode,help:false});ui.solo.open++;ui.i++;resetTask();ui.showText=false;if(ui.i>=list.length)ui.view='talk';break;}
 case 'pair-lock':{if(k?.type==='cloze')syncTyped();if(!k||!ready(k))return;const n=playerNow();ui.pair.ans[n]=currentAnswer(k);ui.pair.help[n]=ui.help;ui.pair.res[n]=evaluate(t,k,ui.pair.ans[n]);ui.sel=null;ui.typed='';ui.picks=[];ui.help=0;ui.showText=false;
  if(ui.pair.turn===0){ui.pair.turn=1;ui.pair.phase='pass';}else{ui.pair.phase='reveal';ui.focus='fb';for(const m of [0,1])ui.pair.score[m]+=ui.pair.res[m].ok?(ui.pair.help[m]?1:2):0;}break;}
 case 'pair-take':ui.pair.phase='answer';ui.focus=true;break;
 case 'pair-open-ready':ui.pair.phase='peer';ui.pair.peerTurn=first(ui.i);break;
 case 'peer-next':{const who=ui.pair.peerTurn;ui.pair.score[who]+=ui.pair.peer[who].length;if(who===first(ui.i)){ui.pair.peerTurn=1-who;ui.focus=true;}else{ui.i++;resetTask();ui.showText=false;if(ui.i>=list.length)ui.view='talk';}break;}
 case 'finish':ui.view='done';if(ui.mode==='pair')markText(active,t,'pair');else markText(active,t,'done');break;
 case 'share':{const link=el.dataset.link;if(!link)return;const cb=root.navigator?.clipboard;if(cb&&typeof cb.writeText==='function')cb.writeText(link).then(()=>{el.textContent='Länken är kopierad';}).catch(()=>root.prompt?.('Kopiera länken',link));else root.prompt?.('Kopiera länken',link);return;}
 default:return;}
 redraw();}
if(typeof document!=='undefined'){
 document.addEventListener('click',ev=>{const b=ev.target.closest('[data-w]');if(!b||b.disabled)return;ev.preventDefault();handle(b.dataset.w,b);});
 document.addEventListener('input',ev=>{const t=ev.target;if(t.id==='wk-type'){ui.typed=t.value;const c=document.querySelector('[data-w=check],[data-w=pair-lock]');if(c)c.disabled=!norm(ui.typed);}if(t.id==='wk-open')ui.open=t.value.slice(0,1500);});
 document.addEventListener('change',ev=>{const t=ev.target;if(t.dataset.wCrit!==undefined){const j=Number(t.dataset.wCrit);ui.self=t.checked?[...new Set([...ui.self,j])]:ui.self.filter(x=>x!==j);}if(t.dataset.wPeer!==undefined){const j=Number(t.dataset.wPeer),who=ui.pair?.peerTurn??0;const arr=ui.pair.peer[who];ui.pair.peer[who]=t.checked?[...new Set([...arr,j])]:arr.filter(x=>x!==j);}});
 /* Sentence spans act as buttons: they wrap like text in every engine (a <button> does not in WebKit). */
 document.addEventListener('keydown',ev=>{const t=ev.target;if((ev.key==='Enter'||ev.key===' ')&&t?.getAttribute?.('role')==='button'&&t.dataset?.w){ev.preventDefault();handle(t.dataset.w,t);return;}});
 document.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target?.id==='wk-type'){ev.preventDefault();const c=document.querySelector('[data-w=check]:not([disabled]),[data-w=pair-lock]:not([disabled])');if(c)c.click();}});
 root.addEventListener('hashchange',()=>{stopSpeech();const h=decodeURIComponent(root.location.hash||'');if(!h.startsWith('#/verkstad/'+(ui.key.split(':')[1]||'-')+'/'+(ui.key.split(':')[2]||'-')))ui=fresh('');});
}

/* ---------- backup and reset hooks for the host app ---------- */
function exportData(){let v2=null;try{v2=JSON.parse(storage()?.getItem(OLD_STORE)||'null');}catch{}return {v3:JSON.parse(JSON.stringify(store)),v2};}
function importData(obj){if(!obj||typeof obj!=='object')return false;let changed=false;
 if(obj.v3&&obj.v3.v===3){store=sanitize(obj.v3);save();changed=true;}
 if(obj.v2&&obj.v2.v===2){try{storage().setItem(OLD_STORE,JSON.stringify(obj.v2));changed=true;}catch{}}
 return changed;}
function resetProfile(p){if(!PROFILES.includes(p))return;store.profiles[p]=emptyProfile();save();ui=fresh('');}
const audit=()=>({texts:BANK.length,perLang:Object.fromEntries(Object.keys(LANG).map(l=>[l,BANK.filter(t=>t.lang===l).length])),tasks:BANK.reduce((a,t)=>a+t.tasks.length,0),store:STORE,engine:ENGINE});
return {library,page,mistakes,audit,exportData,importData,resetProfile,STORE,OLD_STORE,ENGINE,
 _test:{BANK,hash,permutation,displayOrder,sentences,sentenceList,evaluate,sanitize,empty,norm,skillStatus,recommend,textStats,code,words,tasksFor,setStore:s=>{store=sanitize(s);},getStore:()=>JSON.parse(JSON.stringify(store)),SKILLS,LEVEL},
 _debug:()=>({ui:JSON.parse(JSON.stringify(ui)),store:JSON.parse(JSON.stringify(store))})};
});
