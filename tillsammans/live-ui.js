/* Matte OS Together Live: optional authenticated room UI. Polling only; server owns state. */
(function(){
'use strict';
const A=window.MO_LIVE_API,B=window.MO_LIVE_SOURCES,S=window.MOTogether,app=document.getElementById('app');
if(!A||!B||!app)return;
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rawInvite=location.hash.match(/^#join=([0-9a-fA-F]{32})$/)?.[1]||null;
if(rawInvite){try{history.replaceState(null,'',location.pathname+location.search);}catch(_){}}
const defaults=S?.load()?.guests||[];
const active=defaults.find(g=>g.id===S?.load()?.activeGuestId);
const firstText=(B.sources('sv').find(x=>x.ref!=='sv:micro:v1')||B.sources('sv')[0]);
const ui={phase:'loading',user:null,room:null,state:null,invite:null,pendingInvite:rawInvite,
 error:'',notice:'',busy:false,alias:active?.name||defaults[0]?.name||'Gäst',
 topic:'sv',ref:firstText?.ref||'',selected:null,submittedKey:'',lastRevision:-1,offline:false};
let fetching=false;
function theme(){const dark=matchMedia?.('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.mode=dark?'dark':'light';}
function header(){return '<header><div class="topline"><a class="logo" href="../tillsammans/"><span class="mark">M</span><span class="brand">MATTE OS<small>TILLSAMMANS LIVE · TEST</small></span></a><div class="top-actions"><a class="button secondary small" href="../tillsammans/">Samma mobil</a></div></div></header>';}
function shell(body){
 theme();
 app.innerHTML=header()+'<main id="main" tabindex="-1">'
 +(ui.error?'<div class="notice warning" role="alert">'+esc(ui.error)+'</div>':'')
 +(ui.notice?'<div class="notice" role="status">'+esc(ui.notice)+'</div>':'')
 +body+'<div class="live-footer">Frivilligt onlineläge. Endast alias, valt övningsmaterial och rumsvar skickas till en skyddad server. Ingen skolprogression, elevbackup eller privat mentorinformation kopieras. Svar blir synliga först efter att alla har svarat. Rummet upphör att vara åtkomligt senast efter 4 timmar; fysisk datarensning kräver separat driftkontroll.</div></main>'
 +'<nav class="bottom" aria-label="Moduler"><a href="../"><span aria-hidden="true">∑</span>Matte</a><a href="../lara/"><span aria-hidden="true">Aa</span>Lärande</a><a href="./"><span aria-hidden="true">◈</span>Tillsammans</a></nav>';
}
function viewLogin(){return '<div class="hero"><p class="kicker">VALFRITT · ONLINELÄGE</p><h1>Spela ihop på olika telefoner</h1><p class="lead">För ett privat live-rum krävs ett eget inloggat Matte OS Study Cloud-konto per telefon och deltagare. Jokrarna på samma mobil fungerar utan konto och internet.</p><p>Vi använder befintliga Matte OS-konton. Vi skapar inga extra skolkonton eller nya behörigheter.</p><div class="button-row"><a class="button" href="../study/">Logga in eller hantera konto</a><button class="button secondary" data-action="retry-login">Jag är redan inloggad</button></div></div>';}
function sourcePicker(){
 const list=B.sources(ui.topic);
 if(!list.some(x=>x.ref===ui.ref))ui.ref=list[0]?.ref||'';
 return '<div class="form-row"><div><label class="field" for="live-topic">Ämne</label><select id="live-topic">'
  +Object.entries(B.topics).map(([id,label])=>'<option value="'+id+'"'+(id===ui.topic?' selected':'')+'>'+esc(label)+'</option>').join('')
  +'</select></div><div><label class="field" for="live-ref">Originalmaterial</label><select id="live-ref">'
  +list.map(x=>'<option value="'+esc(x.ref)+'"'+(x.ref===ui.ref?' selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select></div></div>';
}
function viewHome(){
 return '<div class="hero"><p class="kicker">PRIVAT SAMARBETE · INLOGGAD</p><h1>Öva tillsammans, på varsin telefon.</h1>'
  +'<p class="lead">Skapa ett rum, dela den privata inbjudan och vänta på de andra. Facit och individuella svar hålls dolda medan rundan pågår.</p>'
  +'<p class="help">Inloggat konto: '+esc(ui.user?.name||'Deltagare')+' · resultatet är bara träning och förs inte in i skolarbetet.</p></div>'
  +'<div class="live-rooms"><section class="card"><h2>Skapa ett rum</h2><label class="field" for="live-alias">Ditt visningsnamn i rummet</label>'
  +'<input id="live-alias" type="text" class="live-large-input" maxlength="24" autocomplete="off" value="'+esc(ui.alias)+'">'
  +sourcePicker()+'<p class="help">Högst 12 frågor och 10 inloggade deltagare. Rummet kan stängas av värden direkt.</p>'
  +'<button class="button block" data-action="create"'+(ui.busy?' disabled':'')+'>Skapa privat rum</button></section>'
  +'<section class="card"><h2>Gå med via kod</h2><p>Använd inbjudan från rummets värd. Koden är privat och gäller endast under rummets öppna väntrum.</p>'
  +'<label class="field" for="join-alias">Ditt visningsnamn</label><input id="join-alias" type="text" class="live-large-input" maxlength="24" value="'+esc(ui.alias)+'">'
  +'<label class="field section" for="join-code">Privat rumskod</label><input id="join-code" type="text" class="live-large-input" maxlength="32" inputmode="text" autocapitalize="off" spellcheck="false" autocomplete="off" placeholder="32 tecken">'
  +'<button class="button block section" data-action="join"'+(ui.busy?' disabled':'')+'>Gå med i rummet</button></section></div>';
}
function viewInvite(){
 return '<div class="hero"><p class="kicker">PRIVAT INBJUDAN</p><h1>Välj ditt visningsnamn</h1>'
 +'<p class="lead">Du har öppnat en inbjudan till ett privat rum. Skriv det alias du vill att de andra ska se.</p>'
 +'<label class="field" for="invited-alias">Alias</label><input id="invited-alias" type="text" class="live-large-input" maxlength="24" value="'+esc(ui.alias)+'">'
 +'<div class="button-row"><button class="button" data-action="accept-invite"'+(ui.busy?' disabled':'')+'>Gå med i rummet</button><button class="button secondary" data-action="cancel-invite">Avbryt</button></div></div>';
}
function shareSection(){
 if(!ui.invite)return '';
 const url=new URL('./live.html',location.href);url.hash='join='+ui.invite;
 return '<div class="card section"><h2>Bjud in deltagare</h2><p>Skicka länken privat till de inloggade personerna. Länken ger möjlighet att ansöka om medlemskap under väntrummet, men ger aldrig åtkomst till skoldata.</p>'
 +'<input id="live-link" readonly class="live-large-input" aria-label="Privat inbjudningslänk" value="'+esc(url.href)+'">'
 +'<div class="button-row"><button class="button secondary" data-action="copy-invite">Kopiera länk</button>'
 +'<button class="button secondary" data-action="share-invite">Dela privat</button></div>'
 +'<p class="help">Länken visas bara här medan den finns kvar på värdens enhet. Spara den innan du laddar om sidan.</p></div>';
}
function memberList(s){
 return '<div class="card section"><h2>Deltagare · '+s.members.length+' av 10</h2>'
 +s.members.map(m=>'<div class="live-member"><strong>'+esc(m.name)+'</strong><span>'+m.score+' rätt'+(m.id===s.me?' · du':'')+(m.id===s.owner_id?' · värd':'')+'</span></div>').join('')
 +'</div>';
}
function reading(ref){
 const t=B.text(ref);if(!t)return '';
 return '<details><summary>Gemensam originaltext · '+esc(t.title)+'</summary><div class="reading-box"><article class="reading">'
 +(t.lead?'<p>'+esc(t.lead)+'</p>':'')+(t.paragraphs||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'</article></div></details>';
}
function viewRoom(){
 const s=ui.state;if(!s)return '<p>Laddar rum …</p>';
 const owner=s.owner_id===s.me;
 const head='<div class="live-meta"><span>'+esc(s.phase==='lobby'?'Väntrum':s.phase==='answering'?'Svara':s.phase==='reveal'?'Facit':'Klart')+'</span>'
 +'<span>Fråga '+(s.round+1)+' / '+s.total+'</span><span class="live-connection'+(ui.offline?' offline':'')+'">'+(ui.offline?'Tillfälligt frånkopplad':'Synkas var 2,5 sekund')+'</span></div>';
 const exit='<div class="button-row"><button class="button secondary" data-action="refresh">Uppdatera</button><button class="button danger" data-action="leave">'+(owner?'Stäng rum':'Lämna rum')+'</button></div>';
 const intro='<p class="kicker">TILLSAMMANS LIVE · PRIVAT RUM</p><h1>Vi tänker tillsammans.</h1>'+head;
 if(s.phase==='lobby')return intro+'<div class="card"><h2>Vänta in alla</h2>'
  +'<p>Varje person loggar in på sitt konto och öppnar inbjudan. Värden startar när alla är med.</p>'
  +memberList(s)+shareSection()
  +(owner?'<button class="button block" data-action="start"'+(ui.busy?' disabled':'')+'>Starta rundorna</button>':'<p class="live-answer-note">Värden startar snart. Din telefon följer automatiskt.</p>')
  +exit+'</div>';
 const q=s.question||{},selected=ui.selected,submitted=!!s.my_answered||ui.submittedKey===s.room_id+':'+s.round;
 if(s.phase==='answering'){
  const options=(q.options||[]).map((x,i)=>'<button class="choice'+(selected===i?' selected':'')+'" type="button" data-action="select" data-index="'+i+'" aria-pressed="'+(selected===i)+'"'+(submitted||ui.busy?' disabled':'')+'>'+esc(x)+'</button>').join('');
  return intro+reading(s.content_ref)+'<section class="turncard"><h2>Fundera och välj ditt svar</h2><p class="question">'+esc(q.prompt||'')+'</p>'
   +'<div class="live-options">'+options+'</div>'
   +(submitted?'<p class="live-answer-note">Ditt svar är inskickat. '+s.answer_count+' av '+s.members.length+' har svarat. Facit visas först när alla har svarat.</p>'
    :'<button class="button block" data-action="answer"'+(selected===null||ui.busy?' disabled':'')+'>Lämna in mitt svar</button>')
   +'</section>'+memberList(s)+exit;
 }
 const answers=new Map((s.answers||[]).map(x=>[x.id,x.choice]));
 const byPerson=(s.members||[]).map(m=>'<div class="score"><strong>'+esc(m.name)+'</strong><p>'+esc((q.options||[])[answers.get(m.id)]??'Inget svar')+'</p>'
  +(s.phase==='reveal'?'<small>'+(answers.get(m.id)===q.correct?'Rätt':'Vi övar vidare')+'</small>':'')+'</div>').join('');
 if(s.phase==='reveal')return intro+'<section class="turncard"><p class="kicker">ALLA HAR SVARAT · FACIT</p>'
  +'<p class="question">'+esc(q.prompt||'')+'</p><p class="good">Rätt svar: '+esc((q.options||[])[q.correct])+'</p>'
  +(q.why?'<p>'+esc(q.why)+'</p>':'')+'<div class="score-grid">'+byPerson+'</div>'
  +(owner?'<button class="button block" data-action="next"'+(ui.busy?' disabled':'')+'>'+(s.round+1>=s.total?'Visa slutresultat':'Nästa fråga')+'</button>'
  :'<p class="live-answer-note">Värden går vidare till nästa fråga.</p>')+'</section>'
  +memberList(s)+exit;
 return intro+'<section class="card"><h2>Ni är klara!</h2><p>Det här är gemensam övning, inte ett betyg.</p>'
 +'<div class="score-grid">'+s.members.map(m=>'<div class="score"><strong>'+esc(m.name)+'</strong><b>'+m.score+'</b> rätt</div>').join('')+'</div>'
 +(owner?'<button class="button" data-action="leave">Stäng rummet och radera svar</button>':'<button class="button secondary" data-action="leave">Lämna rummet</button>')+'</section>';
}
function render(){
 if(ui.phase==='loading')shell('<p>Läser ditt konto …</p>');
 else if(ui.phase==='login')shell(viewLogin());
 else if(ui.phase==='invite')shell(viewInvite());
 else if(ui.phase==='room')shell(viewRoom());
 else shell(viewHome());
}
async function fetchRoom(force=false){
 if(!ui.room||fetching||(!force&&(ui.busy||document.visibilityState==='hidden')))return;
 fetching=true;
 try{const fresh=await A.call('together_live_state',{p_room:ui.room});
  if(ui.state&&fresh.round!==ui.state.round){ui.selected=null;ui.submittedKey='';}
  ui.state=fresh;ui.offline=false;ui.error='';render();
 }catch(e){
  if(/NOT_FOUND|NOT_MEMBER|JWT|unauthoriz|invalid.*token/i.test(e.message)){A.forget();ui.room=null;ui.state=null;ui.phase='home';ui.error='Rummet finns inte längre eller du saknar åtkomst.';}
  else {ui.offline=true;ui.error='Kunde inte hämta senaste rumsstatus. Kontrollera uppkopplingen. '+e.message;}
  render();
 }finally{fetching=false;}
}
async function action(fn){
 if(ui.busy)return;
 ui.busy=true;ui.error='';ui.notice='';
 try{await fn();}
 catch(e){ui.error=e.message||'Något gick fel.';}
 finally{ui.busy=false;render();}
}
async function openRoom(room){
 ui.room=room;ui.phase='room';ui.selected=null;ui.submittedKey='';A.remember(room);
 await fetchRoom(true);
}
async function bootstrap(){
 render();
 try{
  ui.user=await A.init();
  if(!ui.user){ui.phase='login';render();return;}
  if(ui.pendingInvite){ui.phase='invite';render();return;}
  const room=A.resume();
  if(room){ui.room=room;ui.phase='room';await fetchRoom();}
  else ui.phase='home';
 }catch(e){ui.error=e.message;ui.phase='login';}
 render();
}
async function make(){
 const alias=document.getElementById('live-alias')?.value.trim();
 if(!alias)throw Error('Välj ett visningsnamn.');
 const ref=ui.ref,deck=B.questions(ref).slice(0,12);
 if(!deck.length)throw Error('Det valda originalmaterialet har inga kompatibla frågor.');
 const result=await A.call('together_live_create',{p_ref:ref,p_deck:deck,p_alias:alias});
 ui.alias=alias;ui.invite=result.invite;await openRoom(result.room_id);
}
async function join(code,alias){
 if(!/^[0-9a-fA-F]{32}$/.test(code||''))throw Error('Koden behöver ha 32 tecken.');
 if(!alias?.trim())throw Error('Välj ett visningsnamn.');
 const result=await A.call('together_live_join',{p_invite:code,p_alias:alias.trim()});
 ui.alias=alias.trim();ui.pendingInvite=null;ui.invite=null;await openRoom(result.room_id);
}
app.addEventListener('change',e=>{
 if(e.target.id==='live-topic'){ui.topic=e.target.value;ui.ref=B.sources(ui.topic)[0]?.ref||'';render();}
 if(e.target.id==='live-ref')ui.ref=e.target.value;
});
app.addEventListener('click',async e=>{
 const btn=e.target.closest('[data-action]');if(!btn||ui.busy)return;
 const key=btn.dataset.action;
 if(key==='retry-login'){ui.phase='loading';await bootstrap();return;}
 if(key==='cancel-invite'){ui.pendingInvite=null;ui.phase='home';render();return;}
 if(key==='select'){ui.selected=Number(btn.dataset.index);render();return;}
 if(key==='copy-invite'||key==='share-invite'){
  const link=document.getElementById('live-link')?.value;if(!link)return;
  if(key==='share-invite'&&navigator.share){try{await navigator.share({title:'Matte OS · privat rum',url:link});return;}catch(e){if(e.name==='AbortError')return;}}
  try{await navigator.clipboard.writeText(link);ui.notice='Inbjudningslänken är kopierad.';}
  catch(_){document.getElementById('live-link')?.select();ui.notice='Markera och kopiera länken manuellt.';}
  render();return;
 }
 if(key==='refresh'){await fetchRoom();return;}
 await action(async()=>{
  if(key==='create')await make();
  else if(key==='join')await join(document.getElementById('join-code')?.value.trim(),document.getElementById('join-alias')?.value.trim());
  else if(key==='accept-invite')await join(ui.pendingInvite,document.getElementById('invited-alias')?.value.trim());
  else if(key==='start'){const ok=await A.call('together_live_start',{p_room:ui.room});if(!ok)throw Error('Rummet kan inte startas.');await fetchRoom(true);}
  else if(key==='answer'){
   if(ui.selected===null)throw Error('Välj ett svar först.');
   const round=ui.state.round;const yes=await A.call('together_live_answer',{p_room:ui.room,p_round:round,p_choice:ui.selected});
   if(!yes)throw Error('Svaret kunde inte lämnas in eller har redan registrerats annorlunda.');
   ui.submittedKey=ui.room+':'+round;await fetchRoom(true);
  }
  else if(key==='next'){const ok=await A.call('together_live_next',{p_room:ui.room,p_expected_round:ui.state.round});
   if(!ok)throw Error('Rundan kan inte flyttas fram.');ui.selected=null;await fetchRoom(true);}
  else if(key==='leave'){
   if(!confirm(ui.state?.owner_id===ui.state?.me?'Stäng rummet och radera dess svar?':'Lämna rummet?'))return;
   const ok=await A.call('together_live_leave',{p_room:ui.room});
   if(!ok)throw Error('Kunde inte lämna rummet.');A.forget();ui.room=null;ui.state=null;ui.invite=null;ui.phase='home';ui.notice='Rummet är stängt eller lämnat.';
  }
 });
});
window.addEventListener('online',()=>fetchRoom());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')fetchRoom();});
setInterval(()=>{if(ui.phase==='room')fetchRoom();},2500);
bootstrap();
})();