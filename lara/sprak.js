/* Matte OS · Språkverkstad 2.0 · shared content, separate learner progress.
 * No user text, audio or names stored. No external APIs. All question orders stable across grades and devices.
 */
(function(root,factory){const o=factory(root);if(typeof module==='object'&&module.exports)module.exports=o;root.MO_WORKSHOP=o;})(typeof window!=='undefined'?window:globalThis,function(root){
'use strict';
const BOOKS=root.MO_STORIES||[];
const LANG={sv:'Svenska',en:'Engelska'};
const LEVEL=['','Starta lugnt','Bygg vidare','Tänk djupare'];
const STAGES=['Läs eller lyssna','Förstå texten','Ordexperten','Fyll i luckorna','Återberätta','Två tillsammans','Klart'];
const STORE='matteos.sprak.v2';
const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idValid=x=>x==='grade8'||x==='grade9';
function empty(){return {v:2,profiles:{grade8:{done:{}},grade9:{done:{}}}};}
function load(){let raw;try{raw=JSON.parse(root.localStorage.getItem(STORE));}catch{}const out=empty();if(!raw||raw.v!==2)return out;for(const id of ['grade8','grade9']){const known=new Set(BOOKS.filter(b=>LANG[b.subject]).flatMap(b=>[1,2,3].map(n=>b.subject+':'+b.id+':'+n)));for(const [key,d] of Object.entries(raw.profiles?.[id]?.done||{})){if(known.has(key)&&d&&Number.isFinite(d.at)&&d.at>1600000000000){out.profiles[id].done[key]={at:Math.floor(d.at),correct:Math.max(0,Math.min(6,Number(d.correct)||0))};}}}return out;}
let storage=load();
let ui={key:'',profile:'',stage:0,paragraph:0,all:false,chosen:'',revealed:false,q:0,word:0,blank:0,typed:'',hints:false,retold:false,feedback:'',correct:0,attempts:0,partnerA:'',partnerB:'',partnerReveal:false,partnerIndex:0,showText:true,voiceMsg:''};
function save(){try{root.localStorage.setItem(STORE,JSON.stringify(storage));return true;}catch{return false;}}
function getBook(s,id){return BOOKS.find(b=>b.subject===s&&b.id===id);}
function identifier(b,n){return b.subject+':'+b.id+':'+n;}
function reset(id,profile){if(ui.key!==id||ui.profile!==profile){ui={key:id,profile:profile,stage:0,paragraph:0,all:false,chosen:'',revealed:false,q:0,word:0,blank:0,typed:'',hints:false,retold:false,feedback:'',correct:0,attempts:0,partnerA:'',partnerB:'',partnerReveal:false,partnerIndex:0,showText:true,voiceMsg:''};}}
function localDay(){try{return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}catch{return new Date().toISOString().slice(0,10);}}
function featured(s){const pool=BOOKS.filter(b=>b.subject===s);const d=localDay();let hash=0;for(const char of d)hash=(hash*31+char.charCodeAt(0))>>>0;return pool[hash%pool.length];}
function urlFor(b,n){return '#/verkstad/'+b.subject+'/'+b.id+'/'+n;}
function progress(b,n,p){const rec=storage.profiles[p]?.done?.[identifier(b,n)];return rec?'<span class="wk-complete">Tränad</span>':'';}
function library(s,active){const pool=BOOKS.filter(b=>b.subject===s),f=featured(s),done=pool.reduce((sum,b)=>sum+[1,2,3].filter(n=>storage.profiles[active]?.done?.[identifier(b,n)]).length,0);
 const intro=s==='sv'?'Läs mellan raderna, träna viktiga ord, skriv rätt ord i luckorna och diskutera tillsammans.':'Read between the lines, practise vocabulary, fill in missing words and explain your ideas together.';
 return `<a class="back" href="#/">‹ Till start</a><p class="wk-eyebrow">SPRÅKVERKSTAD · SAMMA MATERIAL FÖR BÅDA</p><h1>${LANG[s]} – texter och samtal</h1><p class="wk-lead">${intro}</p><div class="wk-inline"><span>${pool.length} texter · 3 nivåer per tema</span><span>${done}/${pool.length*3} nivåer tränade på denna profil</span></div>
 <section class="wk-feature"><div><span class="wk-eyebrow">SAMMA DAGENS UTMANING FÖR ÅK 8 OCH 9</span><h2>${e(f.title)}</h2><p>${e(f.lead)}</p><small>Välj nivå. Samma fråga och ordning på båda mobilerna om ni öppnar samma text.</small></div><a class="wk-btn" href="${urlFor(f,2)}">Starta tillsammans →</a></section>
 <h2 class="wk-section">Välj en text</h2><p class="mut small">Nivån beskriver hur krävande texten är – inte vilken årskurs du går i.</p>
 <div class="wk-booklist">${pool.map(b=>`<article class="wk-book"><div class="wk-book-top"><span>${e(b.genre)}</span><h3>${e(b.title)}</h3><p>${e(b.lead)}</p></div><div class="wk-levels">${[1,2,3].map(n=>`<a href="${urlFor(b,n)}" class="wk-level" aria-label="${e(b.title)}, ${e(LEVEL[n])}"><b>${n}</b><span>${e(LEVEL[n])}</span>${progress(b,n,active)}</a>`).join('')}</div></article>`).join('')}</div>
 <a class="wk-quick" href="#/korta/${s}"><strong>Snabbövningar i ${LANG[s].toLowerCase()}</strong><span>Ordförståelse, hörförståelse, skriva och tala – korta pass ›</span></a><section class="wk-explain"><h2>Så gör ni tillsammans</h2><ol><li>Båda öppnar <strong>samma text och nivå</strong>, oavsett årskurs.</li><li>Läs var sitt stycke och säg vad som hände.</li><li>Svara var för sig först. Visa sedan textbevis och diskutera.</li><li>Byt roller: en är detektiv, den andra ställer följdfrågor.</li></ol><p class="mut small">På två mobiler får ni samma innehåll och frågeföljd. Svaren och poängen synkroniseras inte automatiskt; prata och jämför tillsammans. Framsteg sparas individuellt.</p></section>`;
}
function bar(){return `<div class="wk-steps" aria-label="Träningssteg">${STAGES.map((name,i)=>`<span class="${ui.stage===i?'active':ui.stage>i?'past':''}" title="${e(name)}">${i+1}</span>`).join('')}</div><p class="wk-stepname">Steg ${ui.stage+1} av 7 · ${STAGES[ui.stage]}</p>`;}
function questions(b,n){const list=b.questions.slice();if(n>=2&&b.extra?.[String(n)])list.push(b.extra[String(n)]);return list;}
function reading(b,v){const paras=v.text;
 return `<div class="wk-card"><h2>Texten · ${e(LEVEL[v.level])}</h2><p class="mut small">Läs ett stycke och sammanfatta det i en mening. När du är redo går du vidare.</p>
 <div class="wk-toolbar"><button type="button" data-w="toggle-all" class="wk-link">${ui.all?'Visa ett stycke åt gången':'Visa hela texten'}</button><button type="button" data-w="read" class="wk-link">Lyssna på texten</button></div>
 ${ui.voiceMsg?`<p class="wk-note" role="status">${e(ui.voiceMsg)}</p>`:''}
 <article class="wk-reading" lang="${b.subject==='sv'?'sv':'en'}">${(ui.all?paras:[paras[ui.paragraph]]).map(x=>`<p>${e(x)}</p>`).join('')}</article>
 ${!ui.all?`<div class="wk-between"><span>Stycke ${ui.paragraph+1} av ${paras.length}</span>${ui.paragraph<paras.length-1?`<button class="wk-btn" data-w="next-paragraph">Nästa stycke →</button>`:`<button class="wk-btn" data-w="next-stage">Jag har läst klart →</button>`}</div>`:`<button class="wk-btn wk-wide" data-w="next-stage">Till frågorna →</button>`}
 </div>`;
}
function optionBoxes(opts,name,chosen){return `<div class="wk-options" role="group" aria-label="Svarsalternativ">${opts.map((v,i)=>`<label class="wk-option"><input type="radio" name="${name}" value="${i}" ${chosen===String(i)?'checked':''}><span>${e(v)}</span></label>`).join('')}</div>`;}
function quiz(b,n){const list=questions(b,n),q=list[ui.q];return `<div class="wk-card"><p class="wk-eyebrow">FRÅGA ${ui.q+1} AV ${list.length} · ${e(q.kind)}</p><h2>${e(q.ask)}</h2><p class="mut small">Hitta först en ledtråd i texten. Svara sedan.</p>${optionBoxes(q.options,'wk-answer',ui.chosen)}
 ${!ui.revealed?`<div class="wk-actions"><button data-w="check-question" class="wk-btn" ${ui.chosen===''?'disabled':''}>Kontrollera</button><button data-w="back-text" class="wk-link">Läs texten igen</button></div>`:`<div class="wk-feedback ${ui.feedback==='Rätt svar'?'good':'try'}" role="status"><b>${e(ui.feedback)}</b><p>${e(q.why)}</p><blockquote><small>Textbevis</small><p>”${e(q.evidence)}”</p></blockquote><p class="mut small">Din slutsats ska gå att förankra i texten, inte bara kännas rätt.</p></div><button data-w="next-question" class="wk-btn">${ui.q===b.questions.length-1?'Till orden →':'Nästa fråga →'}</button>`}</div>`;}
function words(b){const w=b.words[ui.word];return `<div class="wk-card"><p class="wk-eyebrow">ORD ${ui.word+1} AV ${b.words.length} · FÖRKLARA MED EGNA ORD</p><h2 class="wk-word">${e(w.term)}</h2><p>${e(w.ask)}</p><p class="mut small">Förklara högt för den andra. Försök först utan hjälp.</p>
 ${!ui.revealed?`<button data-w="reveal-word" class="wk-btn">Visa betydelsen</button>`:`<div class="wk-feedback good"><b>Så kan ordet förklaras</b><p>${e(w.explain)}</p><p><strong>Exempel:</strong> ${e(w.example)}</p></div><div class="wk-mini"><span>Kan du använda ordet i en ny mening?</span><button data-w="next-word" class="wk-btn">${ui.word===b.words.length-1?'Till luckorna →':'Nästa ord →'}</button></div>`}</div>`;}
function blanks(b){const x=b.blanks[ui.blank];const val=ui.typed.trim();return `<div class="wk-card"><p class="wk-eyebrow">LUCKA ${ui.blank+1} AV ${b.blanks.length}</p><h2>Vilket ord passar bäst?</h2><p class="wk-sentence">${e(x.sentence).replace('___','<span class="wk-blank">________</span>')}</p><label for="wk-input" class="wk-label">Skriv ordet som saknas</label><input id="wk-input" class="wk-input" type="text" value="${e(ui.typed)}" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="70" ${ui.revealed?'readonly':''} placeholder="Skriv ditt ord här">
 ${!ui.revealed?`${ui.hints?`<div class="wk-chips">${x.options.map(v=>`<button type="button" data-w="fill-option" data-value="${e(v)}">${e(v)}</button>`).join('')}</div>`:''}<div class="wk-actions"><button class="wk-btn" data-w="check-blank" ${!val?'disabled':''}>Kontrollera</button><button data-w="show-choices" class="wk-link">${ui.hints?'Alternativen är synliga':'Visa tre alternativ (hjälp)'}</button></div>`:`<div class="wk-feedback ${ui.feedback==='Rätt ord'?'good':'try'}" role="status"><b>${e(ui.feedback)}</b><p>Rätt ord: <strong>${e(x.options[x.answer])}</strong>. ${e(x.why)}</p></div><button data-w="next-blank" class="wk-btn">${ui.blank===b.blanks.length-1?'Till återberättandet →':'Nästa mening →'}</button>`}</div>`;}
function retell(b){const r=b.retell;return `<div class="wk-card"><p class="wk-eyebrow">ÅTERBERÄTTA · UTAN ATT LÄSA AV</p><h2>Kan du berätta texten för någon annan?</h2><p>Välj tre viktiga händelser eller tankar. Berätta i egna ord, inte ordagrant.</p><ol class="wk-questions">${r.steps.map(t=>`<li>${e(t)}</li>`).join('')}</ol><p class="mut small">En partner kan lyssna och hjälpa dig att komma på vad som saknas. Spela inte in och skriv inga privata uppgifter.</p>
 ${!ui.retold?`<button data-w="reveal-retell" class="wk-btn">Vi har försökt – visa exempel</button>`:`<div class="wk-feedback good"><b>Ett exempel på återberättande</b><p>${e(r.model)}</p><p class="mut small">Andra formuleringar kan vara lika bra om innehållet stämmer.</p></div><button data-w="next-stage" class="wk-btn">Diskutera tillsammans →</button>`}</div>`;}
function together(b,n){const list=questions(b,n),q=list[ui.partnerIndex%list.length],t=b.talk;return `<div class="wk-card"><p class="wk-eyebrow">TVÅ TILLSAMMANS · BÅDA SVARAR PÅ SAMMA FRÅGA</p><h2>Detektivduell: hitta textbeviset</h2><p>En läser frågan. Båda väljer svar var för sig. Visa sedan facit och förklara vilken mening som stödjer svaret.</p><p class="wk-sentence">${e(q.ask)}</p>
 <div class="wk-twoplayers"><div><strong>Elev åk 8</strong>${optionBoxes(q.options,'wk-partner-a',ui.partnerA)}</div><div><strong>Elev åk 9</strong>${optionBoxes(q.options,'wk-partner-b',ui.partnerB)}</div></div>
 ${!ui.partnerReveal?`<button data-w="partner-reveal" class="wk-btn wk-wide" ${ui.partnerA===''||ui.partnerB===''?'disabled':''}>Båda har svarat – visa facit</button>`:`<div class="wk-feedback good"><b>Facit och textbevis</b><p>${e(q.options[q.answer])}</p><p>${e(q.why)}</p><blockquote>”${e(q.evidence)}”</blockquote><p>${ui.partnerA===String(q.answer)?'Åk 8 valde rätt. ':'Åk 8 får en ny chans att förklara. '}${ui.partnerB===String(q.answer)?'Åk 9 valde rätt.':'Åk 9 får en ny chans att förklara.'}</p></div><button data-w="partner-next" class="wk-btn">${ui.partnerIndex<questions(b,n).length-1?'Nästa gemensamma fråga →':'Diskutera frågan nedanför ↓'}</button>`}
 </div><div class="wk-card"><p class="wk-eyebrow">SAMTAL · TURAS OM</p><h2>${e(t.prompt)}</h2><p>${e(t.follow)}</p><div class="wk-role"><span>1 · En berättar sin åsikt</span><span>2 · Den andra frågar varför</span><span>3 · Byt roller och pröva ett motargument</span></div><details><summary>Svårare bonusfråga</summary><p>${e(t.challenge)}</p></details>${n===3 && Array.isArray(b.sourceQuestions) && b.sourceQuestions.length ? `<details class="wk-original-questions"><summary>Provfrågorna till originaltexten (${b.sourceQuestions.length} frågor)</summary><ol>${b.sourceQuestions.map(q=>`<li>${e(q)}</li>`).join('')}</ol><details><summary>Visa originalfacit när ni svarat</summary><ol>${(b.sourceAnswers||[]).map(a=>`<li>${e(a)}</li>`).join('')}</ol></details></details>` : ''}<button data-w="finish" class="wk-btn wk-wide">Vi är klara →</button></div>`;}
function finish(b,n,active){const saved=!!storage.profiles[active].done[identifier(b,n)];return `<div class="wk-card wk-result"><p class="wk-eyebrow">BRA JOBBAT · EN HEL TEXT</p><h1>Ni har tränat på flera sätt</h1><p>Ni har läst, hittat textbevis, förklarat ord, fyllt i luckor och återberättat. Det är mer användbart än att bara gissa rätt på en fråga.</p><div class="wk-score"><b>${ui.correct}</b><span>rätta av ${ui.attempts} automatiskt kontrollerade svar</span></div><p class="mut small">Öppna muntliga svar och förklaringar räknas inte som automatiskt rättade. Detta är inte ett skolbetyg.</p>${saved?'<p class="wk-saved">Träningen är sparad på denna elevprofil och enhet.</p>':''}<div class="wk-actions"><a class="wk-btn" href="#/${b.subject}">Välj ny text →</a><button data-w="restart" class="wk-link">Gör om samma text</button></div></div>`;}
function page(route,active){const parts=route.replace(/^\/verkstad\/?/,'').split('/').filter(Boolean),[s,id,num]=parts,b=getBook(s,id),n=Number(num);
 if(!LANG[s]||!b||![1,2,3].includes(n))return `<a href="#/">Till start</a><p>Texten hittades inte. Välj språk och text igen.</p>`;
 const v=b.levels[n-1];reset(identifier(b,n)+':'+active);if(ui.stage>6)ui.stage=6;
 const link=location.origin+location.pathname+urlFor(b,n);
 const stageContent=[()=>reading(b,v),()=>quiz(b,n),()=>words(b),()=>blanks(b),()=>retell(b),()=>together(b,n),()=>finish(b,n,active)][ui.stage]();
 return `<a class="back" href="#/${s}">‹ Alla texter i ${LANG[s].toLowerCase()}</a><p class="wk-eyebrow">${LANG[s].toUpperCase()} · ${e(b.genre)} · ${e(LEVEL[n])}</p><h1>${e(b.title)}</h1><p class="wk-lead">${e(b.lead)}</p><div class="wk-challenge"><span>Samma text och uppgifter för båda årskurserna</span><button data-w="share" data-link="${e(link)}" class="wk-link">Kopiera textlänken</button></div>${bar()}${stageContent}`;
}
function current(){const route=location.hash.replace(/^#/,'');const p=route.replace(/^\/verkstad\/?/,'').split('/');return {b:getBook(p[0],p[1]),n:Number(p[2])};}
function more(){ui.revealed=false;ui.chosen='';ui.typed='';ui.hints=false;ui.feedback='';}
function nextStage(){ui.stage=Math.min(6,ui.stage+1);more();ui.paragraph=0;ui.all=false;document.activeElement?.blur?.();root.scrollTo?.({top:0,behavior:'instant'});redraw();}
function setMessage(msg){ui.voiceMsg=msg;redraw();}
function spoken(b,n){if(!('speechSynthesis' in root)||!('SpeechSynthesisUtterance' in root)){setMessage('Ingen uppläsningsröst finns här. Låt din partner läsa högt.');return;}
 try{root.speechSynthesis.cancel();const u=new root.SpeechSynthesisUtterance(b.levels[n-1].text.join(' '));u.lang=b.subject==='sv'?'sv-SE':'en-GB';u.rate=0.87;u.onerror=()=>setMessage('Uppläsningen fungerade inte på den här enheten. Läs högt för varandra.');root.speechSynthesis.speak(u);}catch{setMessage('Uppläsningen fungerade inte. Prova att läsa högt för varandra.');}}
function redraw(){if(typeof root.MOL_RENDER==='function')root.MOL_RENDER();}
function normal(x){return String(x).trim().toLocaleLowerCase().normalize('NFC').replace(/[.?!,;:]$/,'');}
function handle(action,button){const {b,n}=current();if(!b)return;
 if(action==='toggle-all'){ui.all=!ui.all;redraw();return;}
 if(action==='next-paragraph'){ui.paragraph=Math.min(b.levels[n-1].text.length-1,ui.paragraph+1);redraw();return;}
 if(action==='next-stage'){nextStage();return;}
 if(action==='read'){spoken(b,n);return;}
 if(action==='back-text'){ui.stage=0;ui.all=true;ui.paragraph=0;redraw();return;}
 if(action==='check-question'){const list=questions(b,n),q=list[ui.q];if(!/^[0-9]+$/.test(ui.chosen))return;ui.feedback=Number(ui.chosen)===q.answer?'Rätt svar':'Vi lär oss av svaret';ui.correct+=Number(ui.chosen)===q.answer?1:0;ui.attempts++;ui.revealed=true;redraw();return;}
 if(action==='next-question'){if(ui.q>=questions(b,n).length-1){nextStage();}else{ui.q++;more();redraw();}return;}
 if(action==='reveal-word'){ui.revealed=true;redraw();return;}
 if(action==='next-word'){if(ui.word>=b.words.length-1)nextStage();else{ui.word++;more();redraw();}return;}
 if(action==='show-choices'){ui.hints=true;redraw();return;}
 if(action==='fill-option'){ui.typed=button.dataset.value||'';redraw();return;}
 if(action==='check-blank'){const x=b.blanks[ui.blank];if(!ui.typed.trim())return;const correct=normal(ui.typed)===normal(x.options[x.answer]);ui.feedback=correct?'Rätt ord':'Vi lär oss av svaret';ui.correct+=correct?1:0;ui.attempts++;ui.revealed=true;redraw();return;}
 if(action==='next-blank'){if(ui.blank>=b.blanks.length-1)nextStage();else{ui.blank++;more();redraw();}return;}
 if(action==='reveal-retell'){ui.retold=true;redraw();return;}
 if(action==='partner-reveal'){if(ui.partnerA===''||ui.partnerB==='')return;ui.partnerReveal=true;redraw();return;}
 if(action==='partner-next'){if(ui.partnerIndex>=questions(b,n).length-1){ui.partnerIndex=questions(b,n).length-1;ui.partnerReveal=true;redraw();}else{ui.partnerIndex++;ui.partnerReveal=false;ui.partnerA='';ui.partnerB='';redraw();}return;}
 if(action==='finish'){ui.stage=6;storage.profiles[(root.MOL_ACTIVE?.()||'grade9')].done[identifier(b,n)]={at:Date.now(),correct:ui.correct};save();redraw();return;}
 if(action==='restart'){ui.key='';reset(identifier(b,n)+':'+(root.MOL_ACTIVE?.()||'grade9'));redraw();return;}
 if(action==='share'){const link=button.dataset.link;if(!link)return;const clipboard=navigator.clipboard;if(clipboard&&typeof clipboard.writeText==='function')clipboard.writeText(link).then(()=>{const prior=button.textContent;button.textContent='Länken är kopierad';setTimeout(()=>button.textContent=prior,2000);}).catch(()=>root.prompt?.('Kopiera denna länk',link));else root.prompt?.('Kopiera denna länk',link);}
}
if(typeof document!=='undefined'){
 document.addEventListener('click',event=>{const b=event.target.closest('[data-w]');if(!b)return;event.preventDefault();handle(b.dataset.w,b);});
 document.addEventListener('input',event=>{if(event.target.id==='wk-input'){ui.typed=event.target.value;const b=document.querySelector('[data-w=check-blank]');if(b)b.disabled=!ui.typed.trim();}});
 document.addEventListener('change',event=>{const t=event.target;if(t.name==='wk-answer'){ui.chosen=t.value;const b=document.querySelector('[data-w=check-question]');if(b)b.disabled=false;}if(t.name==='wk-partner-a')ui.partnerA=t.value;if(t.name==='wk-partner-b')ui.partnerB=t.value;if(t.name==='wk-partner-a'||t.name==='wk-partner-b'){const b=document.querySelector('[data-w=partner-reveal]');if(b)b.disabled=ui.partnerA===''||ui.partnerB==='';}});
 root.addEventListener('beforeunload',()=>{if('speechSynthesis'in root)root.speechSynthesis.cancel();});
}
const audit=()=>({books:BOOKS.length,variants:BOOKS.reduce((a,b)=>a+b.levels.length,0),subjects:Object.keys(LANG),perSubject:Object.fromEntries(Object.keys(LANG).map(s=>[s,BOOKS.filter(b=>b.subject===s).length])),questions:BOOKS.reduce((a,b)=>a+b.questions.length*b.levels.length+2,0),blanks:BOOKS.reduce((a,b)=>a+b.blanks.length*b.levels.length,0),store:STORE});
return {library,page,featured,audit,STORE,_test:{normal,empty,load,identifier,getBook,STAGES,LEVEL},_debug:()=>({ui:{...ui},storage:JSON.parse(JSON.stringify(storage))})};
});
