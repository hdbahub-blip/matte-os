/* Matte OS · Together v1 UI. Reuses original authored math, lessons and reading banks.
   This is LOCAL pass-and-play. Links on different phones share material, NOT live answers. */
(function () {
  'use strict';
  const S = window.MOTogether, D = window.MOL_CONTENT || { lessons: [] };
  const app = document.getElementById('app'), BANK = window.MO_BANK3 || [];
  if (!S || !app) return;
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;');
  const school = { grade8: { id:'grade8',name:'Åk 8',theme:'navy',accent:'#1d3557' },
    grade9: { id:'grade9',name:'Åk 9',theme:'burgundy',accent:'#7a1f35' } };
  const titles = { sv:'Svenska',en:'Engelska',study:'Studieteknik',math:'Matematik',table:'Multiplikation' };
  const ui = { page: 'home', notice:'', edit:null, topic:'sv', ref:'', pickProfiles:false, selectedSchool:null, members:new Set(),
    answer:null, selectedGuest:null, groupAppearance:'system', revealReading:false };
  const PREF_KEY='matteos.together.flow.v1';
  function loadPrefs() {
    try {
      const p=JSON.parse(localStorage.getItem(PREF_KEY)||'null');
      if(!p||p.v!==1||!Object.prototype.hasOwnProperty.call(titles,p.topic))return null;
      return {topic:p.topic,ref:typeof p.ref==='string'&&p.ref.length<=90?p.ref:'',
        members:Array.isArray(p.members)?p.members.slice(0,S.MEMBER_LIMIT).filter(x=>typeof x==='string'&&!S.dropIns().some(g=>g.id===x)):[],selectedSchool:['grade8','grade9'].includes(p.selectedSchool)?p.selectedSchool:null};
    } catch(_) {return null;}
  }
  function savePrefs() {
    try {
      localStorage.setItem(PREF_KEY,JSON.stringify({v:1,topic:ui.topic,ref:ui.ref,
        members:[...ui.members].filter(id=>member(id)&&!S.dropIns().some(g=>g.id===id)).slice(0,S.MEMBER_LIMIT),selectedSchool:ui.selectedSchool}));
    } catch(_) { /* Local preferences are optional. Never touch school storage. */ }
  }
  const prefs=loadPrefs();
  if(prefs){ui.topic=prefs.topic;ui.ref=prefs.ref;ui.selectedSchool=prefs.selectedSchool;}
  const entryParams = new URLSearchParams(location.search);
  const startRef = entryParams.get('text');
  const challengeTopic=entryParams.get('topic'), challengeRef=entryParams.get('ref');
  if(Object.prototype.hasOwnProperty.call(titles,challengeTopic) && entryList(challengeTopic).some(e=>e.ref===challengeRef)){
    ui.topic=challengeTopic;ui.ref=challengeRef;
  }
  const rawGuest = S.load().guests;
  const rememberedMembers=[...new Set((prefs?.members||[]).filter(id=>school[id]||rawGuest.some(g=>g.id===id)))];
  const gradeEntry=entryParams.get('grade');
   if(school[gradeEntry])ui.selectedSchool=gradeEntry;
  const suggested=school[gradeEntry]?[gradeEntry,rawGuest[0]?.id].filter(Boolean):rawGuest.slice(0,2).map(g=>g.id);
  (rememberedMembers.length?rememberedMembers:suggested).forEach(id=>ui.members.add(id));
  // Deep-link from the main Netflix-style profile chooser. Never change school profiles.
  const entryGuest = entryParams.get('guest');
  if (entryGuest && rawGuest.some(g=>g.id===entryGuest)) {
    ui.selectedGuest = entryGuest;ui.selectedSchool=null;
    S.activate(entryGuest);savePrefs();
    if (entryParams.get('edit')==='1') {ui.page='guests';ui.edit=entryGuest;}
  } else if (entryParams.get('dropin')==='1') {
    ui.dropInRequested=true;
    const drop=S.dropIns()[0]||S.addDropIn('Joker');
    if(drop){ui.selectedGuest=drop.id;ui.selectedSchool=null;ui.members=new Set([drop.id]);}
    else {ui.notice='Tillfälligt Jokerläge kan inte användas: den här webbläsaren blockerar sessionslagring. Inga svar har sparats.';}
    // Keep ?dropin=1 so reload stays in transient guest mode (no names or secrets in URL).

  } else if (entryParams.get('profiles')==='1') {
    ui.page='guests';
  }
  if (entryParams.get('start')==='group' && ui.page==='home' && !startRef) {
    if(!S.restoreSession()){
      ui.page='setup'; ui.ref=entryList(ui.topic).some(x=>x.ref===ui.ref)?ui.ref:defaultRef(ui.topic);
    }
    // The launch instruction is one-time. Reload must not restart navigation or lose paused-session recovery.
    try {
      const next=new URL(location.href);next.searchParams.delete('start');next.searchParams.delete('grade');
      history.replaceState(null,'',next.pathname+next.search+next.hash);
    } catch(_) { /* Launch works even when history is unavailable. */ }
  }
  if (startRef && /^(sv|en):[a-zA-Z0-9_-]+:v[0-9]+$/.test(startRef)) {
    ui.page='read'; ui.ref=startRef;
  }
  function member(id) {
    if (school[id]) return school[id];
    return S.load().guests.find(g=>g.id===id) || S.dropIns().find(g=>g.id===id) || null;
  }
  function currentProfile(){
    if(ui.selectedGuest&&member(ui.selectedGuest))return member(ui.selectedGuest);
    if(ui.selectedSchool&&school[ui.selectedSchool])return school[ui.selectedSchool];
    const st=S.load();return st.guests.find(g=>g.id===st.activeGuestId)||st.guests[0]||school.grade9;
  }
  function allMembers() { return [school.grade8,school.grade9].concat(S.load().guests,S.dropIns()); }
  function initials(name) {
    const words=String(name||'?').trim().split(/\s+/);
    return words.length>1 ? words.slice(0,2).map(w=>w.charAt(0).toLocaleUpperCase('sv-SE')).join('') : words[0].slice(0,2).toLocaleUpperCase('sv-SE');
  }
  function styleColor(m) {return S.THEMES[m.theme]?.accent || m.accent || '#176B50';}
  function appearance() {
    const g = ui.selectedGuest ? member(ui.selectedGuest) : null;
    const v = g && !school[g.id] ? g.appearance : ui.groupAppearance;
    return v==='system' ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light') : v;
  }
  function theme() {
    const root=document.documentElement;
    const g=ui.selectedGuest && ui.page!=='session' ? member(ui.selectedGuest) : null;
    const p=g && S.THEMES[g.theme] ? S.THEMES[g.theme] : S.THEMES.emerald;
    root.dataset.mode=appearance();
    const darkColors={emerald:'#9AE2C1',plum:'#E3C3F0',teal:'#A9E3E8',champagne:'#E9CFAB'};
    const effective=ui.page==='session'?'emerald':(g?.theme||'emerald');
    root.style.setProperty('--accent',root.dataset.mode==='dark'?darkColors[effective]:p.accent);
    root.style.setProperty('--action',ui.page==='session'?'#176B50':p.accent);
    root.style.setProperty('--guest-light',p.light);
    root.style.setProperty('--guest-dark',p.dark);
    const meta=document.querySelector('meta[name=theme-color]');
    if(meta)meta.content=root.dataset.mode==='dark'?'#151d20':'#F7F5F1';
  }
  function entryList(topic) {
    const list=[];
    if(topic==='sv'||topic==='en') {
      list.push({ref:topic+':micro:v1',label:topic==='sv'?'Korta lektioner · Svenska':'Short lessons · English',kind:'micro'});
      BANK.filter(t=>t.lang===topic&&t.tasks.some(q=>q.type==='choice'&&Array.isArray(q.options))).sort((a,b)=>a.level-b.level||a.title.localeCompare(b.title))
        .forEach(t=>list.push({ref:topic+':'+t.id+':v'+t.version,label:'Nivå '+t.level+' · '+t.title,kind:'text',text:t}));
    } else if(topic==='study') {
      list.push({ref:'study:micro:v1',label:'Studieteknik · korta övningar',kind:'micro'});
    } else if(topic==='table') {
      for(let i=2;i<=10;i++)list.push({ref:'table:'+i+':v1',label:i+':ans multiplikationstabell',kind:'table'});
    } else if(topic==='math') {
      const priority=['f8-perimeter','f8-area','f8-circle-area','f8-negative','f8-fractions-compare','s9-symmetry','s9-angles','s9-percent-share','s9-pythagoras'];
      const skills=(window.MO_CONTENT8||[]).concat(window.MO_CONTENT9||[]);
      skills.sort((a,b)=>{
        const ai=priority.indexOf(a.id),bi=priority.indexOf(b.id);
        return (ai<0?100:ai)-(bi<0?100:bi);
      });
      skills.forEach(s=> {
        if(choiceQuestionsForSkill(s).length)list.push({ref:'math:'+s.id,label:(s.id.startsWith('f8')?'Åk 8-material · ':'Åk 9-material · ')+s.title,kind:'math'});
      });
    }
    return list;
  }
  function hash(s) {
    let h=2166136261>>>0;
    for(const c of s) {h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}
    return h;
  }
  function shuffle(options,correct,seed) {
    const arr=options.map((text,i)=>({text:String(text),i}));
    let h=hash(seed);
    for(let i=arr.length-1;i>0;i--){
      h=(Math.imul(h,1664525)+1013904223)>>>0;
      const k=h%(i+1); const old=arr[i];arr[i]=arr[k];arr[k]=old;
    }
    return { options:arr.map(x=>x.text), correct:arr.findIndex(x=>x.i===correct) };
  }
  function choiceQuestionsForSkill(skill) {
    return [skill.g].concat(skill.p||[]).filter(q=>{
      const opts=q&&(q.opts||q.ro);
      return q&&q.type==='choice'&&Array.isArray(opts)&&opts.length>=2&&opts.length<=8
        &&opts.some(x=>String(x)===String(q.a));
    });
  }
  function questions(ref) {
    const parts=ref.split(':'), topic=parts[0], id=parts[1];
    if(topic==='table') {
      const n=Number(id);
      if(!Number.isInteger(n)||n<2||n>10)return [];
      const deck=[];
      for(let k=1;k<=10;k++){
        const val=n*k, wrong=new Set([val]);
        for(const candidate of [n*(k+1),n*(Math.max(1,k-1)),val+n+1,val-2,n*(k+2),val+5])
          if(candidate>0&&wrong.size<4)wrong.add(candidate);
        while(wrong.size<4) wrong.add(val+wrong.size*2+1);
        const mixed=shuffle(Array.from(wrong).map(String),0,'table:'+n+':'+k);
        deck.push({key:'tab-'+n+'-'+k,topic:'table',prompt:n+' × '+k+' = ?',options:mixed.options,
          correct:mixed.correct,why:'Multiplikation betyder '+k+' grupper med '+n+' i varje.'});
      }
      return deck;
    }
    if(topic==='math') {
      const s=(window.MO_CONTENT8||[]).concat(window.MO_CONTENT9||[]).find(x=>x.id===id);
      if(!s)return [];
      return choiceQuestionsForSkill(s).map((q,i)=>{
        const opts=q.opts||q.ro,correct=opts.findIndex(x=>String(x)===String(q.a));
        const m=shuffle(opts,correct,ref+':'+i);
        return {key:s.id+':'+i,topic:'math',prompt:q.q,options:m.options,correct:m.correct,
          why:(q.sol||[]).join(' · ')||s.anchor};
      }).slice(0,10);
    }
    if(topic==='study'||id==='micro') {
      return D.lessons.filter(l=>l.subject===topic).flatMap(l=>{
        return ['guided','solo'].filter(k=>l[k]?.type==='choice'&&Array.isArray(l[k].options)).map(k=>{
          const q=l[k];
          const m=shuffle(q.options,q.correct,topic+':'+l.id+':'+k);
          return {key:l.id+':'+k,topic,prompt:q.prompt,options:m.options,correct:m.correct,why:q.why||''};
        });
      }).slice(0,12);
    }
    const t=BANK.find(x=>x.lang===topic&&x.id===id&&'v'+x.version===parts[2]);
    if(!t)return [];
    return t.tasks.filter(k=>k.type==='choice'&&Array.isArray(k.options)).map(k=>{
      // Authored Workshop choice banks put the correct choice at position zero.
      const m=shuffle(k.options,0,ref+':'+k.id);
      return {key:t.id+':'+k.id,topic,prompt:k.ask,options:m.options,correct:m.correct,
        why:k.why||'',textRef:ref};
    }).slice(0,12);
  }
  function sourceText(ref) {
    const p=ref.split(':');
    return BANK.find(t=>t.lang===p[0]&&t.id===p[1]&&'v'+t.version===p[2])||null;
  }
  function currentEntries() { return entryList(ui.topic); }
  function defaultRef(topic) { return entryList(topic)[0]?.ref || ''; }
  function note(txt){ui.notice=txt;render();}
  function fmt(str,math) {
    return math && window.MOMath?.rich ? window.MOMath.rich(str) : esc(str);
  }
  function profileOverlay() {
    const saved=S.load(),gs=saved.guests||[],all=gs.concat(S.dropIns());
    let schoolActive='grade9',names={grade8:'Åk 8',grade9:'Åk 9'};
    try {const v=JSON.parse(localStorage.getItem('matteos.v5')||'null');if(v?.v===5){schoolActive=v.active||schoolActive;for(const k of ['grade8','grade9'])names[k]=v.profiles?.[k]?.name||names[k];}} catch(_){}
    const schools=['grade9','grade8'].map(k=>'<button type="button" class="ux-identity '+(ui.selectedSchool===k?'current':'')+'" data-action="select-school" data-id="'+k+'"><span class="ux-avatar">'+(k==='grade9'?'Å9':'Å8')+'</span><strong>'+esc(names[k])+'</strong><small>Skolprofil · eget resultat</small></button>').join('');
    const guests=all.map(g=>'<button type="button" class="ux-identity '+(currentProfile().id===g.id?'current':'')+'" data-action="pick-guest" data-id="'+esc(g.id)+'"><span class="ux-avatar">'+esc(initials(g.name))+'</span><strong>'+esc(g.name)+'</strong><small>Joker · eget läge</small></button>').join('');
    return '<div class="ux-profile-layer"><button class="ux-profile-backdrop" type="button" data-action="profiles-close" aria-label="Stäng profilväljaren"></button><section role="dialog" aria-modal="true" aria-labelledby="ux-profile-title" class="ux-profile-dialog">'
      +'<div class="ux-profile-heading"><div><p class="kicker">MATTE OS · PROFILER</p><h2 id="ux-profile-title">Vem pluggar?</h2></div><button class="icon-button" data-action="profiles-close" aria-label="Stäng profilvalet">×</button></div>'
      +'<div class="ux-profile-grid">'+schools+guests+'</div>'
      +'<div class="ux-profile-links"><a href="./?dropin=1">Engångs-Joker ›</a><button data-action="guests">Hantera profiler ›</button></div>'
      +'<p class="help">Skolresultat och Jokersvar blandas aldrig.</p></section></div>';
  }
  function shell(body) {
    theme();
    const modes=ui.page==='home'?'page':'';
    app.innerHTML='<header><div class="topline"><a class="logo" href="../" aria-label="Matte OS · matematik">'
      +'<span class="mark" aria-hidden="true">M</span><span class="brand">MATTE OS<small>TILLSAMMANS</small></span></a>'
      +'<div class="top-actions"><button class="icon-button" type="button" data-action="toggle-mode" aria-label="Byt ljust och mörkt läge" title="Byt visning">'+(document.documentElement.dataset.mode==='dark'?'☀':'☾')+'</button>'
      +'<button class="icon-button" type="button" data-action="home" aria-label="Till Tillsammans startsida">⌂</button>'
      +'<button class="icon-button ux-profile-button" type="button" data-action="profiles" aria-expanded="'+!!ui.pickProfiles+'" aria-label="Byt profil, vald '+esc(currentProfile().name)+'" title="Byt profil"><span class="ux-active-avatar" aria-hidden="true">'+esc(currentProfile().id==='grade8'?'Å8':currentProfile().id==='grade9'?'Å9':initials(currentProfile().name))+'</span></button></div></div></header>'
      +'<main id="main" tabindex="-1">'+(ui.notice?'<div class="notice" role="status">'+esc(ui.notice)+'</div>':'')+body
      +'<footer>Gästprofilernas framsteg sparas bara på den här enheten. Gruppresultat räknas inte som skolprov. Ingen automatisk molnöverföring.</footer>'
      +'</main><nav class="bottom" aria-label="Välj ämne eller spel">'
      +'<a href="../"><span aria-hidden="true">⌂</span>Start</a><a href="../#/trana"><span aria-hidden="true">∑</span>Matte</a>'
      +'<a href="../lara/#/sv"><span aria-hidden="true">S</span>Svenska</a><a href="../lara/#/en"><span aria-hidden="true">E</span>Engelska</a>'
      +'<a href="./" aria-current="page"><span aria-hidden="true">◈</span>Spela</a></nav>'+(ui.pickProfiles?profileOverlay():'');
    document.title='Matte OS · Tillsammans';
    if(!S.status().storageOk){
      const w=document.createElement('div');w.className='notice warning';w.role='alert';
      w.textContent='Enheten kan inte spara gästdata. Kontrollera privat läge eller lagringsutrymme.';
      document.getElementById('main').prepend(w);
    }
  }
  function welcome() {
    const existing=S.restoreSession(), selected=currentProfile();
    const mainTopics=['sv','en','math'];
    const pickTopic=t=>'<button class="ux-topic'+(ui.topic===t?' chosen':'')+'" type="button" data-action="choose-topic" data-topic="'+t+'" aria-pressed="'+(ui.topic===t)+'"><span aria-hidden="true">'+(t==='sv'?'S':t==='en'?'E':'∑')+'</span><strong>'+esc(titles[t])+'</strong></button>';
    return '<section class="hero flow-welcome ux-together-home"><p class="caps">MATTE OS · SPELA OCH LÄR</p>'
      +'<h1>Vad vill ni öva?</h1><p class="lead">Välj ämne. Spela sedan själv eller tillsammans.</p>'
      +'<p class="ux-selected-identity">'+(ui.selectedSchool?'Vald profil: ':'Vald Joker: ')+'<strong>'+esc(selected.name)+'</strong></p>'
      +(existing?'<div class="flow-resume"><strong>Ni har ett pausat pass</strong><button class="button" data-action="resume">Fortsätt passet ›</button></div>':'')
      +'<div class="ux-topics" role="group" aria-label="Välj ämne">'+mainTopics.map(pickTopic).join('')+'</div>'
      +'<details class="ux-topic-extra"><summary>Tabeller eller studieteknik</summary><div class="ux-topics">'+['table','study'].map(pickTopic).join('')+'</div></details>'
      +'<p class="ux-selected-topic" role="status">Valt: <strong>'+esc(titles[ui.topic])+'</strong></p>'
      +'<div class="flow-choices" role="group" aria-label="Välj hur ni vill spela">'
      +'<button class="flow-choice flow-choice-solo" data-action="quick-solo"><span class="flow-glyph" aria-hidden="true">✎</span><strong>Jag kör själv</strong><span>5 frågor · '+esc(selected.name)+'</span><b>Starta ›</b></button>'
      +'<button class="flow-choice flow-choice-group" data-action="setup"><span class="flow-glyph" aria-hidden="true">◈</span><strong>Vi kör ihop</strong><span>Välj deltagare · 5 frågor</span><b>Välj spelare ›</b></button>'
      +'</div></section>'
      +'<details class="ux-more-games"><summary>Fler spel och profiler</summary><div class="ux-more-games-in">'
      +'<h2>På varsin mobil?</h2><p class="help">Cup fungerar utan konto. Privat Live kräver konto.</p>'
      +'<div class="flow-option-links"><a class="button secondary" href="../#/cup">Spela Cup</a><a class="button secondary" href="./live.html">Privat Live</a><button class="button secondary" data-action="share-setup">Dela lästext</button></div>'
      +'<h2>Jokrar</h2><button class="button secondary" data-action="guests">Hantera Jokerprofiler</button>'
      +'<details class="flow-guest-fold"><summary>Visa Jokrar</summary>'+guestTiles(false)+'</details>'
      +'</div></details>';
  }
  function guestTiles(editable) {
    return '<div class="guest-grid">'+S.load().guests.map(g=>{
      const color=styleColor(g),selected=ui.selectedGuest===g.id;
      const total=Object.values(g.stats||{}).reduce((a,b)=>a+(b.total||0),0);
      return '<article class="guest'+(selected?' active':'')+'" style="--gaccent:'+color+'"><span class="avatar" aria-hidden="true">'+esc(initials(g.name))+'</span>'
       +'<strong>'+esc(g.name)+'</strong><div class="help">'+esc(S.THEMES[g.theme].label)+' · '+(g.appearance==='system'?'Enhetens läge':g.appearance==='dark'?'Nattläge':'Dagsläge')+'</div>'
       +'<div class="help">'+total+' egna svar</div><div class="guest-actions">'
       +(editable?'<button class="button small secondary" data-action="edit" data-id="'+esc(g.id)+'" aria-label="Ändra '+esc(g.name)+'">Ändra</button><button class="button small secondary" data-action="activate" data-id="'+esc(g.id)+'">Visa tema</button>':'<button class="button small secondary" data-action="pick-guest" data-id="'+esc(g.id)+'">Välj</button>')
       +'</div></article>';
    }).join('')+'</div>';
  }
  function guestsPage() {
    const g=ui.edit?member(ui.edit):null;
    return '<button class="back button tertiary" data-action="home">‹ Tillbaka</button><p class="kicker">PROFILER · EJ SKOLKONTON</p><h1>Jokrarna</h1>'
      +'<p class="lead">Namn och färger är bara till för att känna igen varandra. Varje gäst har ett eget beständigt ID och sin egen lokala statistik.</p>'
      +guestTiles(true)
      +(g?'<section class="card section"><h2>Ändra '+esc(g.name)+'</h2><label class="field" for="guest-name">Visningsnamn</label><input id="guest-name" type="text" maxlength="24" autocomplete="off" value="'+esc(g.name)+'">'
        +'<div class="form-row section"><div><label class="field" for="guest-theme">Färgtema</label><select id="guest-theme">'+Object.entries(S.THEMES).map(([id,v])=>'<option value="'+id+'" '+(id===g.theme?'selected':'')+'>'+esc(v.label)+'</option>').join('')+'</select></div>'
        +'<div><label class="field" for="guest-mode">Visning</label><select id="guest-mode"><option value="system"'+(g.appearance==='system'?' selected':'')+'>Enhetens inställning</option><option value="light"'+(g.appearance==='light'?' selected':'')+'>Ljust läge</option><option value="dark"'+(g.appearance==='dark'?' selected':'')+'>Nattläge</option></select></div></div>'
        +'<div class="button-row"><button class="button" data-action="save-guest" data-id="'+esc(g.id)+'">Spara ändringar</button><button class="button secondary" data-action="cancel-edit">Avbryt</button>'
        +'<button class="button danger" data-action="delete-guest" data-id="'+esc(g.id)+'">Radera gäst</button></div></section>':'')
      +'<section class="card section"><h2>Lägg till en gäst</h2><label class="field" for="new-guest-name">Valfritt namn</label>'
      +'<input id="new-guest-name" type="text" maxlength="24" placeholder="Joker Four">'
      +'<div class="button-row"><button class="button" data-action="add-guest">+ Lägg till</button></div><p class="help">Högst '+S.GUEST_LIMIT+' lokala gästprofiler. Skolprofilerna finns kvar separat.</p></section>'
      +'<section class="card section"><h2>Säkerhetskopia</h2><p class="muted">Exportera gästernas namn, temaval och individuella övningsstatistik. Befintlig skolbackup påverkas inte.</p>'
      +'<div class="button-row"><button class="button secondary" data-action="export">Hämta gästbackup</button>'
      +'<label class="button secondary" for="guest-backup">Återställ gästbackup</label><input class="sr" id="guest-backup" type="file" accept=".json,application/json"></div></section>';
  }
  function setupPage(shareOnly) {
    const topics=Object.keys(titles);
    if(!topics.includes(ui.topic))ui.topic=topics[0];
    const entries=currentEntries();
    if(!entries.some(x=>x.ref===ui.ref))ui.ref=entries[0]?.ref||'';
    const selectedEntry=entries.find(x=>x.ref===ui.ref);
    const current=sourceText(ui.ref);
    const players=allMembers();
    const count=[...ui.members].filter(id=>member(id)).length;
    return '<button class="back button tertiary" data-action="home">‹ Tillbaka</button>'
      +'<p class="kicker">'+(shareOnly?'SAMMA FRÅGOR PÅ OLIKA MOBILER':'SAMMA MOBIL · SNABBSTART')+'</p>'
      +'<h1>'+(shareOnly?'Dela samma övning':'Redo att köra ihop?')+'</h1>'
      +'<p class="lead">'+(shareOnly?'Välj ämne och uppgifter. Den andra mobilen får samma frågor utan konto eller sparade gästsvar. Jämför svaren själva.':'Välj ämne och deltagare. Vi börjar med fem korta frågor.')+'</p>'
      +'<section class="card section flow-setup"><label class="field" for="topic">Vad vill ni öva?</label>'
      +'<select id="topic" data-role="topic">'+topics.map(t=>'<option value="'+t+'"'+(t===ui.topic?' selected':'')+'>'+esc(titles[t])+'</option>').join('')+'</select>'
      +(!shareOnly?'<div class="flow-players-head"><h2>Vem är med?</h2><span>'+count+' valda · max '+S.MEMBER_LIMIT+'</span></div>'
        +'<div class="participants flow-players">'+players.map(g=>{
          const selected=ui.members.has(g.id);
          return '<label class="selector" style="--gaccent:'+styleColor(g)+'"><input type="checkbox" data-role="participant" value="'+esc(g.id)+'" '+(selected?'checked':'')+'>'
            +'<span class="bubble" aria-hidden="true">'+esc(initials(g.name))+'</span>'
            +'<span><b>'+esc(g.name)+'</b><small>'+(school[g.id]?'Årskurs · ingen skolprogress påverkas':g.type==='dropin'?'Engångs-Joker · inget sparas':'Joker · lokal profil')+'</small></span></label>';
        }).join('')+'</div>'
        +'<div class="flow-dropin"><div><strong>Kompis utan profil?</strong><small>Lägg till en Joker för bara det här passet. Namn och svar sparas inte som skolresultat.</small></div>'
        +'<div class="flow-dropin-fields"><input id="flow-dropin-name" type="text" maxlength="24" autocomplete="off" placeholder="Valfritt smeknamn" aria-label="Namn på tillfällig Joker">'
        +'<button class="button secondary" type="button" data-action="add-dropin">+ Lägg till</button></div></div>':'')
      +'<label class="field" for="source">Välj text eller uppgift</label><select id="source" data-role="source">'+entries.map(x=>'<option value="'+esc(x.ref)+'"'+(x.ref===ui.ref?' selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select>'
      +'<div class="flow-launch"><button class="button block" data-action="'+(shareOnly?'share-challenge':'start-session')+'" '+(!ui.ref||(!shareOnly&&!count)?'disabled':'')+'>'
      +(shareOnly?'Dela frågor till varsin mobil':'Starta 5 frågor · '+count+' '+(count===1?'person':'personer'))+'</button></div>'
      +'<details class="flow-extra-content"><summary>'+(shareOnly?'Välj andra frågor':'Byt text, kapitel eller övning')+'</summary>'
      +'<p class="help">Välj material ovan. Öppna texten här för att läsa före frågorna.</p>'
      +(selectedEntry?'<p class="help">'+(current?'Originaltext · '+current.paragraphs.length+' stycken · version '+current.version:'Frågor från Matte OS egen undervisningsbank')+'</p>':'')
      +(current?'<details><summary>Läs texten först · '+esc(current.title)+'</summary>'+textMarkup(current)+'</details>':'')
      +'</details></section>'
      +(shareOnly?'<p class="help">Gästlänken innehåller bara en publik referens till frågorna. Svaren synkas inte live. Vill ni enbart dela texten? <button class="button tertiary small" data-action="share-current">Dela bara text</button></p>':'<p class="help">Resultaten från det här passet ändrar inga skolprov eller skolprofiler.</p>');
  }
  function textMarkup(t) {
    return '<article class="reading"><h2>'+esc(t.title)+'</h2>'
      +(t.lead?'<p class="subtitle">'+esc(t.lead)+'</p>':'')
      +(t.paragraphs||[]).map(p=>'<p>'+esc(p)+'</p>').join('')
      +'</article>';
  }
  function readPage() {
    const t=sourceText(ui.ref);
    if(!t)return '<h1>Texten hittades inte</h1><p>Öppna en annan text via Tillsammans.</p><button class="button" data-action="share-setup">Välj text</button>';
    return '<button class="back button tertiary" data-action="home">‹ Tillsammans</button><p class="kicker">'+(t.lang==='en'?'ENGLISH':'SVENSKA')+' · NIVÅ '+t.level+' · VERSION '+t.version+'</p>'
      +'<h1>'+esc(t.title)+'</h1><p class="lead">'+esc(t.purpose||t.lead||'')+'</p>'
      +'<div class="reading-box">'+textMarkup(t)+'</div>'
      +'<div class="button-row"><button class="button" data-action="setup-from-text" data-ref="'+esc(ui.ref)+'">Svara tillsammans på samma mobil</button>'
      +'<button class="button secondary" data-action="share-guest-reading">Dela frågor · varsin mobil</button></div>'
      +'<p class="help">Länken öppnar samma originaltext och samma frågor i gästläge utan sparade svar. Ni jämför själva efter varje fråga; mobilerna synkroniseras inte live.</p>';
  }
  function scoreGrid(s) {
    return '<div class="score-grid">'+s.members.map(id=>{
      const m=member(id);if(!m)return '';
      return '<div class="score"><small>'+esc(m.name)+'</small><strong>'+esc(S.THEMES[m.theme]?.label||'Elev')+'</strong><b>'+s.scores[id]+'</b><small> rätt</small></div>';
    }).join('')+'</div>';
  }
  function sessionPage() {
    const s=S.restoreSession();
    if(!s){ui.page='home';return '<h1>Passet finns inte längre</h1><p>Välj deltagare och börja ett nytt pass.</p><button class="button" data-action="setup">Starta</button>';}
    const deck=questions(s.contentRef);
    if(deck.length<s.count)return '<div class="notice warning" role="alert">Innehållet har ändrats sedan passet skapades. Ingen poäng ändras. Avsluta passet och välj innehållet på nytt.</div><button class="button danger" data-action="finish-session">Avsluta pass</button>';
    const q=deck[s.round],m=member(s.members[s.turn]);
    const status='<div class="status"><span>Fråga '+(s.round+1)+' av '+s.count+'</span><span>Deltagare '+(s.turn+1)+' av '+s.members.length+'</span>'
      +'<span>'+(s.members.length===1?'Egen träning':'Samma mobil')+'</span></div>';
    const t=sourceText(s.contentRef);
    const read=t?'<details '+(s.round===0&&s.turn===0?'open':'')+'><summary>Läs den gemensamma texten · '+esc(t.title)+'</summary>'
      +'<div class="reading-box">'+textMarkup(t)+'</div></details>':'';
    const intro='<button class="back button tertiary" data-action="home">‹ Tillsammans</button><p class="kicker">'+esc(titles[q.topic]||'Övning')+'</p>'+status+read;
    if(s.phase==='done')return intro+'<div class="card"><h1>Bra jobbat tillsammans!</h1><p>Det här är ett träningsresultat, inte ett skolbetyg.</p>'
       +scoreGrid(s)+'<div class="button-row"><button class="button" data-action="new-session">Nytt pass</button><button class="button secondary" data-action="finish-session">Avsluta</button></div></div>';
    if(s.phase==='handoff')return intro+'<div class="turncard"><p class="kicker">NU ÄR DET DIN TUR</p>'
      +'<div class="turnperson" style="--person-accent:'+styleColor(m)+'"><span class="avatar" aria-hidden="true">'+esc(initials(m.name))+'</span><span><strong>'+esc(m.name)+'</strong><small>De tidigare svaren är dolda tills alla är klara.</small></span></div>'
      +'<p>Ge telefonen till rätt person och tryck när du är redo. Inget facit visas innan alla har svarat.</p>'
      +'<button class="button block" data-action="begin-turn">Jag är redo</button></div>'
      +'<div class="button-row"><button class="button tertiary" data-action="finish-session">Avsluta pass</button></div>';
    if(s.phase==='answer')return intro+'<div class="turncard"><div class="turnperson" style="--person-accent:'+styleColor(m)+'"><span class="avatar" aria-hidden="true">'+esc(initials(m.name))+'</span>'
      +'<span><strong>'+esc(m.name)+'</strong><small>Välj ett alternativ. Ingen annan ser ditt svar förrän facit visas.</small></span></div>'
      +'<p class="question">'+fmt(q.prompt,q.topic==='math')+'</p><fieldset><legend class="sr">Välj svar</legend><div class="options">'
      +q.options.map((v,i)=>'<button type="button" class="choice'+(ui.answer===i?' selected':'')+'" data-action="choose" data-choice="'+i+'" aria-pressed="'+(ui.answer===i?'true':'false')+'">'+fmt(v,q.topic==='math')+'</button>').join('')
      +'</div></fieldset><button class="button block" data-action="submit-turn" '+(ui.answer===null?'disabled':'')+'>Lämna mitt svar</button></div>'
      +'<div class="button-row"><button class="button tertiary" data-action="finish-session">Avsluta pass</button></div>';
    if(s.phase==='reveal'){
      const record=s.answers[s.round]||{};
      return intro+'<div class="turncard"><p class="kicker">ALLA HAR SVARAT · NU VISAS FACIT</p>'
        +'<h1>Jämför era tankar</h1><p class="question">'+fmt(q.prompt,q.topic==='math')+'</p>'
        +'<p class="good">Rätt svar: '+fmt(q.options[q.correct],q.topic==='math')+'</p>'
        +(q.why?'<p>'+fmt(q.why,q.topic==='math')+'</p>':'')
        +'<div class="score-grid">'+s.members.map(id=>{
          const r=record[id],correct=r===q.correct,p=member(id);
          return '<div class="score"><strong>'+esc(p?.name||'Deltagare')+'</strong><div class="'+(correct?'good':'bad')+'">'+(correct?'Rätt · +1':'Vi övar vidare')+'</div><small>'+fmt(q.options[r]||'Inget svar',q.topic==='math')+'</small></div>';
        }).join('')+'</div><h3>Poäng hittills</h3>'+scoreGrid(s)
        +'<button class="button block" data-action="next-round">'+(s.round+1===s.count?'Se slutresultat':'Nästa fråga')+'</button>'
        +'<button class="button tertiary block" data-action="finish-session">Avsluta passet</button></div>';
    }
    return '<h1>Något gick fel</h1>';
  }
  function render() {
    const builders={home:welcome,guests:guestsPage,setup:()=>setupPage(false),share:()=>setupPage(true),read:readPage,session:sessionPage};
    shell((builders[ui.page]||welcome)());
  }
  function page(next) {
    ui.page=next;ui.notice='';ui.answer=null;
    if(next==='setup'||next==='share'){if(next==='share'&&!['sv','en'].includes(ui.topic))ui.topic='sv';if(!entryList(ui.topic).some(x=>x.ref===ui.ref))ui.ref=defaultRef(ui.topic);}
    if(next!=='guests')ui.edit=null;
    render();window.scrollTo({top:0,behavior:'instant'});
  }
  function fileDownload(filename,data) {
    const blob=new Blob([data],{type:'application/json;charset=utf-8'});
    const u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(u),5000);
  }
  function getShareUrl(ref) {
    const url=new URL('./',location.href);
    url.searchParams.set('text',ref);url.hash='';
    return url.toString();
  }
  async function shareCurrent() {
    const ref=ui.ref,t=sourceText(ref);
    if(!t) { note('Välj en originaltext i svenska eller engelska först.');return; }
    const url=getShareUrl(ref);
    if(navigator.share) {
      try {await navigator.share({title:'Matte OS · '+t.title,text:'Vi läser samma text.',url});return;}
      catch(e){if(e.name==='AbortError')return;}
    }
    if(navigator.clipboard?.writeText) {
      try {await navigator.clipboard.writeText(url);note('Textlänken kopierades. Alla kan läsa samma version.');return;}
      catch(e){}
    }
    window.prompt('Kopiera länken till samma text',url);
  }
  async function shareGuestReading() {
    const text=sourceText(ui.ref);
    if(!text){note('Välj en svensk eller engelsk originaltext först.');return;}
    const url=new URL('../lara/',location.href);
    url.searchParams.set('guest','1');
    url.hash='#/verkstad/'+text.lang+'/'+text.id;
    const link=url.toString();
    if(navigator.share){try{await navigator.share({title:'Matte OS · läs tillsammans',text:'Samma frågor · ingen inloggning eller sparning av gästsvar',url:link});return;}
      catch(e){if(e.name==='AbortError')return;}}
    if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(link);note('Gästlänken kopierades. Båda får samma frågor utan sparade gästsvar.');return;}catch(_){}}
    window.prompt('Kopiera gästlänken',link);
  }
  async function shareChallenge() {
    if(!questions(ui.ref).length){note('De här frågorna går inte att dela. Välj en annan övning.');return;}
    // Keep both phones in the Together engine for IDENTICAL authored question subsets.
    // A separate "full workshop" invite is available from each original reading text.
    const url=new URL('./',location.href);
    url.searchParams.set('dropin','1');
    url.searchParams.set('topic',ui.topic);
    url.searchParams.set('ref',ui.ref);
    url.hash='';
    const link=url.toString();
    if(navigator.share){try{await navigator.share({title:'Matte OS · samma frågor',text:'Jokerläge, inga sparade gästsvar',url:link});return;}
      catch(e){if(e.name==='AbortError')return;}}
    if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(link);note('Samma övning har kopierats. Ingen inloggning krävs och inga gästsvar sparas.');return;}catch(_){}}
    window.prompt('Kopiera samma övning',link);
  }
  function switchMode() {
    const cur=appearance();
    if(ui.selectedGuest && ui.page!=='session')S.updateGuest(ui.selectedGuest,{appearance:cur==='dark'?'light':'dark'});
    else ui.groupAppearance=cur==='dark'?'light':'dark';
    render();
  }
  function action(el) {
    const a=el.dataset.action,id=el.dataset.id;
    if(a==='profiles'){ui.pickProfiles=!ui.pickProfiles;render();if(ui.pickProfiles)app.querySelector('.ux-profile-heading [data-action="profiles-close"]')?.focus();return;}
    if(a==='profiles-close'){ui.pickProfiles=false;render();return;}
    if(a==='select-school'){if(!['grade8','grade9'].includes(id))return;if(ui.page==='session'&&S.restoreSession()&&!window.confirm('Det pågående passet pausas när du byter profil. Vill du fortsätta?'))return;
      try{const key='matteos.v5',v=JSON.parse(localStorage.getItem(key)||'null');if(v?.v===5&&v.profiles?.grade8&&v.profiles?.grade9){v.active=id;localStorage.setItem(key,JSON.stringify(v));}}
      catch(_){note('Det gick inte att spara aktiv skolprofil på den här enheten.');return;}
      ui.selectedSchool=id;ui.selectedGuest=null;ui.pickProfiles=false;ui.members.add(id);savePrefs();page('home');return;}
    if(a==='choose-topic'){const t=el.dataset.topic;if(!Object.prototype.hasOwnProperty.call(titles,t))return;ui.topic=t;ui.ref=defaultRef(t);savePrefs();render();return;}
    if(a==='home'){ui.pickProfiles=false;page('home');return;}
    if(a==='guests'){page('guests');return;}
    if(a==='quick-solo'){
      if(ui.dropInRequested&&(!ui.selectedGuest||!S.dropIns().some(g=>g.id===ui.selectedGuest))){
        note('Gästläget kräver fungerande sessionslagring. Inga svar sparades.');return;
      }
      const selected=currentProfile();
      if(!selected){note('Skapa en Joker-profil först.');return;}
      const ref=entryList(ui.topic).some(x=>x.ref===ui.ref)?ui.ref:defaultRef(ui.topic);
      const deck=questions(ref);
      if(!deck.length){note('Inga övningar kunde startas. Välj ett annat ämne.');return;}
      if(S.restoreSession()&&!window.confirm('Ersätta det pausade passet?'))return;
      const session=S.startSession([selected.id],ref,Math.min(5,deck.length));
      if(!session){note('Kunde inte spara det nya passet.');return;}
      S.beginTurn(session);ui.answer=null;page('session');return;
    }
    if(a==='add-dropin'){
      const input=document.getElementById('flow-dropin-name');
      const name=S.cleanName(input?.value)||'Joker';
      if(ui.members.size>=S.MEMBER_LIMIT){note('Högst tio deltagare per pass.');return;}
      const guest=S.addDropIn(name);
      if(!guest){note('Tillfälliga Jokrar kräver tillgänglig sessionslagring i den här fliken.');return;}
      ui.members.add(guest.id);
      render();document.getElementById('flow-dropin-name')?.focus();
      return;
    }
    if(a==='setup'){page('setup');return;}
    if(a==='share-setup'){page('share');return;}
    if(a==='toggle-mode'){switchMode();return;}
    if(a==='pick-guest'||a==='activate'){
      if(ui.page==='session'&&S.restoreSession()&&!window.confirm('Ett gemensamt pass pågår. Byta till en annan profil?'))return;
      ui.selectedGuest=id;ui.selectedSchool=null;ui.pickProfiles=false;S.activate(id);savePrefs();if(ui.page==='session')ui.page='home';
      try{const u=new URL(location.href);u.searchParams.set('guest',id);u.searchParams.delete('dropin');history.replaceState(null,'',u.pathname+u.search+u.hash);}catch(_){}
      note('Profilen '+(member(id)?.name||'')+' är vald. Gästtema visas här, skolprofiler påverkas inte.');return;
    }
    if(a==='edit'){ui.edit=id;ui.selectedGuest=id;render();return;}
    if(a==='cancel-edit'){ui.edit=null;render();return;}
    if(a==='save-guest'){
      const patch={name:document.getElementById('guest-name')?.value,theme:document.getElementById('guest-theme')?.value,
        appearance:document.getElementById('guest-mode')?.value};
      if(!S.updateGuest(id,patch)){note('Välj ett giltigt namn och tema.');return;}
      ui.edit=null;note('Namnet och temat har ändrats. Gästens ID och framsteg är kvar.');return;
    }
    if(a==='delete-guest'){
      if(!window.confirm('Radera gästprofilen och dess egen statistik? Detta går inte att ångra utan en gästbackup. Skolprofiler påverkas inte.'))return;
      S.deleteGuest(id);ui.edit=null;if(ui.selectedGuest===id)ui.selectedGuest=null;ui.members.delete(id);note('Gästen har raderats lokalt.');return;
    }
    if(a==='add-guest'){
      const name=document.getElementById('new-guest-name')?.value||'Joker '+(S.load().guests.length+1);
      const g=S.addGuest(name);
      if(!g){note('Maximalt antal gäster uppnått.');return;}
      ui.members.add(g.id);ui.selectedGuest=g.id;note('Ny gäst tillagd.');return;
    }
    if(a==='export'){
      fileDownload('matte-os-guests-'+new Date().toISOString().slice(0,10)+'.json',S.exportGuests());return;
    }
    if(a==='setup-from-text'){
      ui.topic=ui.ref.split(':')[0];
      ui.ref=el.dataset.ref;page('setup');ui.ref=el.dataset.ref;render();return;
    }
    if(a==='share-current'){shareCurrent();return;}
    if(a==='share-guest-reading'){shareGuestReading();return;}
    if(a==='share-challenge'){shareChallenge();return;}
    if(a==='start-session'){
      const members=[...ui.members].filter(m=>member(m));
      if(!members.length){note('Välj minst en deltagare.');return;}
      if(members.length>S.MEMBER_LIMIT){note('Högst tio deltagare i samma pass.');return;}
      const deck=questions(ui.ref);
      if(!deck.length){note('Välj en övning som har flervalsfrågor.');return;}
      const old=S.restoreSession();
      if(old&&!window.confirm('Ersätta ert pågående pass? Det tidigare gruppresultatet sparas inte.'))return;
      savePrefs();
      const s=S.startSession(members,ui.ref,Math.min(5,deck.length));
      if(!s){note('Kunde inte starta passet. Kontrollera enhetens lagring.');return;}
      ui.selectedGuest=null;page('session');return;
    }
    if(a==='resume'){const old=S.restoreSession();if(old?.members.length===1&&old.phase==='handoff')S.beginTurn(old);ui.selectedGuest=null;page('session');return;}
    const s=S.restoreSession();
    if(['begin-turn','submit-turn','next-round','choose','finish-session','new-session'].includes(a)){
      if(a==='finish-session') {
        if(s?.phase!=='done'&&!window.confirm('Avsluta pågående pass? Gruppresultatet försvinner, men gästernas egna övningar finns kvar.'))return;
        S.endSession();page('home');return;
      }
      if(a==='new-session'){S.endSession();page('setup');return;}
      if(!s){note('Passet hittades inte.');return;}
      if(a==='begin-turn') {if(S.beginTurn(s)){ui.answer=null;render();}return;}
      if(a==='choose'){
        ui.answer=Number(el.dataset.choice);
        app.querySelectorAll('[data-action="choose"]').forEach(b=>{
          const selected=b===el;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
        });
        const submit=app.querySelector('[data-action="submit-turn"]');if(submit)submit.disabled=false;
        return;
      }
      if(a==='submit-turn'){
        const deck=questions(s.contentRef),q=deck[s.round],m=s.members[s.turn],answer=ui.answer;
        if(answer===null||!q){note('Välj ett svar.');return;}
        if(S.answerTurn(s,answer,q.options.length,q.correct)){
          if(s.members.length===1&&m!=='grade8'&&m!=='grade9')S.recordSolo(m,q.topic,answer===q.correct);
          ui.answer=null;render();window.scrollTo({top:0,behavior:'instant'});
        }return;
      }
      if(a==='next-round'){if(S.nextRound(s)){if(s.members.length===1&&s.phase==='handoff')S.beginTurn(s);ui.answer=null;render();window.scrollTo({top:0,behavior:'instant'});}return;}
    }
  }
  app.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.pickProfiles){e.preventDefault();ui.pickProfiles=false;render();}});
  app.addEventListener('click',e=>{
    const el=e.target.closest('[data-action]');if(!el)return;
    e.preventDefault();action(el);
  });
  app.addEventListener('change',e=>{
    const el=e.target;
    if(el.dataset.role==='participant'){
      if(el.checked)ui.members.add(el.value);else ui.members.delete(el.value);
      if(ui.members.size>S.MEMBER_LIMIT){ui.members.delete(el.value);el.checked=false;note('Högst tio personer per pass.');return;}
      savePrefs();
      const count=[...ui.members].filter(id=>member(id)).length;
      const label=app.querySelector('.flow-players-head span');
      if(label)label.textContent=count+' valda · max '+S.MEMBER_LIMIT;
      const launch=app.querySelector('[data-action="start-session"]');
      if(launch){launch.disabled=!count||!ui.ref;launch.textContent='Starta 5 frågor · '+count+' '+(count===1?'person':'personer');}
    }
    if(el.dataset.role==='topic'){
      ui.topic=el.value;ui.ref=defaultRef(ui.topic);savePrefs();render();
    }
    if(el.dataset.role==='source'){ui.ref=el.value;savePrefs();}
    if(el.id==='guest-backup'&&el.files?.length){
      const file=el.files[0];if(file.size>250000){note('Gästbackupen är för stor.');return;}
      if(!window.confirm('Återställa gäster från denna fil? Nuvarande gästprofiler ersätts. Åk 8/9 berörs inte.'))return;
      file.text().then(t=>{
        const result=S.importGuests(t);ui.edit=null;ui.selectedGuest=null;ui.members=new Set(S.load().guests.map(g=>g.id));
        note(result.message);
      }).catch(()=>note('Kunde inte läsa filen.'));
    }
  });
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(ui.groupAppearance==='system')render();});
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('../sw.js').catch(()=>{});
  render();
})();
