/* Study Cloud account and guardian link UI. Browser never contains administrative credentials. */
(function(){
'use strict';
const S=window.MO_STUDY,app=document.getElementById('app');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gradeText=g=>g==='grade8'?'Årskurs 8':'Årskurs 9';
let error='',notice='',invitation='',invitations=[],links=[],busy=false,ready=false,updating=false;
function header(){return '<header class="topbar"><div class="topinner"><a class="brand" href="../"><span class="monogram">M</span><span><b>MATTE OS</b><small>MINA STUDIER</small></span></a>'+(S.profile()?.role==='mentor'?'<a class="tiny" href="../foralder/">Mentoröversikt</a>':'')+''+(S.info().online?'<button type="button" class="quick-logout" data-action="logout">Logga ut</button>':'')+'</div></header>'}
function field(label,name,type='text',extra=''){return '<div class="field"><label for="'+name+'">'+label+'</label><input id="'+name+'" name="'+name+'" type="'+type+'" '+extra+' required></div>'}
function alerts(){return (error?'<div class="notice error" role="alert">'+esc(error)+'</div>':'')+(notice?'<div class="notice" role="status">'+esc(notice)+'</div>':'')}
function shell(inner){app.innerHTML=header()+'<main class="container study-main study-bottom">'+alerts()+inner+'<footer>Dina elevsvar är privata och delas endast med en befintligt kopplad mentor. Delning kan avslutas under Integritet och hjälp. Tidigare exporterade kopior påverkas inte. <a href="../">Till elevappen</a>.</footer></main>'}
function authView(){
 const intro='<section class="hero setup-hero"><span class="eyebrow">MATTE OS · VÄLKOMMEN</span><h1>Logga in i Matte OS.</h1><p>Logga in en gång och gå direkt till dina ämnen.</p></section>';
 const form='<form id="auth" class="card"><span class="eyebrow">Ett kontosystem</span><h2>Välkommen tillbaka</h2>'
  +field('E-postadressen för ditt Matte OS-konto','email','email','autocomplete="username" maxlength="180"')
  +field('Lösenord','password','password','autocomplete="current-password"')
  +'<button type="submit" class="btn">'+(busy?'Kontrollerar …':'Logga in')+'</button>'
  +'<p class="note">Har du inget konto? Be den som ansvarar för Matte OS om dina inloggningsuppgifter. Använd inte lösenordet till din privata e-post.</p></form>';
  // Keep the learner sign-in focused; administrative instructions belong outside this public flow.
  return intro+'<div class="auth-layout">'+form+'</div>';

}
function createProfile(){
 return '<section class="hero setup-hero"><span class="eyebrow">Nästan klart</span><h1>Din profil väntar på aktivering.</h1><p>Du är inloggad, men en ansvarig administratör behöver koppla rätt roll och årskurs till ditt konto. Du ska aldrig behöva välja någon annans profil.</p></section>'+
 '<div class="card"><h2>Vad händer nu?</h2><p>Be Matte OS-administratören aktivera din personliga elev- eller mentorprofil. Logga sedan in igen. Dina tidigare svar och konton raderas inte.</p><button type="button" class="btn secondary" data-action="logout">Logga ut</button></div>';
}
function memberView(){
 const u=S.profile(),inf=S.info(),isMentor=u.role==='mentor';
 const linked=links.some(l=>l.learner_id===u.user_id);
 let s='<section class="hero study-welcome"><span class="eyebrow">'+(isMentor?'MENTOR · PRIVAT ÖVERSIKT':esc(gradeText(u.grade))+' · MINA STUDIER')+'</span>'+
 '<h1>'+(isMentor?'Följ deras lärande.':'Vad vill du lära dig idag?')+'</h1>'+
 '<p>'+(isMentor?'Dina två befintliga elevkopplingar och deras sparade framsteg hämtas automatiskt.':'Välj ett ämne och fortsätt direkt. Dina framsteg sparas automatiskt när du är inloggad.')+'</p></section>';
 if(isMentor){
  const gradeStatus=g=>links.some(l=>l.grade===g);
  s+='<section class="card study-main-card"><h2>Dina elever</h2><p class="study-note">Du behöver inte skapa inbjudningar eller klicka på uppdatera för redan kopplade konton.</p>'+
  '<div class="study-grade-grid">'+['grade8','grade9'].map(g=>'<div class="study-grade"><strong>'+gradeText(g)+'</strong><span class="'+(gradeStatus(g)?'state done':'state')+'">'+(gradeStatus(g)?'Ansluten':'Inte ansluten')+'</span></div>').join('')+'</div>'+
  '<a class="btn study-cta" href="../foralder/">Se deras framsteg</a><a class="btn secondary" href="../studera/">Studera tillsammans</a></section>';
  s+='<details class="study-advanced"'+(invitation?' open':'')+'><summary>Hantera nya elever (senare)</summary><div class="card"><p>Endast för nya elevkonton. De befintliga årskurserna behöver ingen ny inbjudan.</p>'+
  '<div class="setup-actions"><button class="btn secondary" data-action="invite" data-grade="grade8">Ny elev · åk 8</button><button class="btn secondary" data-action="invite" data-grade="grade9">Ny elev · åk 9</button></div>'+
  (invitation?'<div class="code" id="invite-code">'+esc(invitation)+'</div><button class="btn secondary" data-action="copy">Kopiera privat länk</button>':'')+'</div></details>';
 }else{
  s+='<div class="study-quick-grid">'+
  '<a class="study-subject study-math" href="../#/trana"><span class="study-subject-icon">∑</span><strong>Matematik</strong><small>Förstå · Träna · Klara själv</small></a>'+
  '<a class="study-subject study-sv" href="../lara/#/studio/sv"><span class="study-subject-icon">S</span><strong>Svenska</strong><small>Läsa · Skriva · Tala</small></a>'+
  '<a class="study-subject study-en" href="../lara/#/studio/en"><span class="study-subject-icon">E</span><strong>Engelska</strong><small>Read · Write · Speak</small></a>'+
  '<a class="study-subject study-play" href="../lara/#/spel"><span class="study-subject-icon">✦</span><strong>Spela</strong><small>Öva själv eller tillsammans</small></a></div>';
  s+='<p class="study-autosave" role="status">'+(inf.waiting?'Dina senaste svar skickas automatiskt när internet fungerar.':'Dina framsteg sparas i bakgrunden. Du behöver inte synkronisera manuellt.')+'</p>';
  s+='<details class="study-advanced"><summary>Integritet och hjälp</summary><div class="card">'+
  (linked?'<p>Din redan kopplade mentor kan se dina inlämnade svar. Du kan när som helst avsluta den delningen.</p><button class="btn secondary" data-action="unlink">Avsluta mentordelning</button>':
  '<p>Du kan lära dig direkt. Ingen mentor kan läsa dina svar förrän en privat koppling har gjorts.</p><details><summary>Har du fått en privat inbjudan?</summary><form id="redeem">'+field('Engångskod','invite-code','text','maxlength="32" minlength="32" inputmode="text" autocapitalize="off" autocomplete="off" spellcheck="false"')+
  '<label class="checkbox-row"><input type="checkbox" required><span>Jag godkänner att den inbjudande mentorn får läsa mina inskickade svar och framsteg. Jag kan avsluta delningen senare.</span></label><button class="btn" type="submit">Aktivera mentordelning</button></form></details>')+
  '<hr><p>För felsökning kan du återställa tidigare resultat från ditt eget konto. Först skapas en lokal säkerhetskopia.</p><button class="btn secondary" data-action="recover">Återställ mina egna framsteg</button></div></details>';
  if(u.grade==='grade9')s+='<div class="study-next-card"><strong>Muntlig träning · Årskurs 9</strong><span>Öva på presentation och diskussion.</span><a href="../lara/np-muntligt.html#/home">Börja öva ›</a></div>';
 }
 return s;
}
async function updateLinks(){
 if(!S.profile())return;
 try{links=await S.links();}catch(e){error='Kunde inte läsa kopplingar: '+e.message;}
}
function render(){
 const inf=S.info();if(!ready){shell('<div class="card"><h2>Kontrollerar kontot …</h2></div>');return;}
 if(!inf.online){shell(authView());return;}
 if(!S.profile()){shell(createProfile());return;}
 shell(memberView());
 // Preserve the invitation code across first signup, email verification and role selection.
 if(S.profile().role==='learner'&&location.hash.startsWith('#/connect/')){
  const code=location.hash.split('/')[2]||'';
  const field=document.getElementById('invite-code');
  if(field&&/^[0-9a-f]{32}$/i.test(code))field.value=code;
 }
}
async function initial(){
 try{
  await S.init();
  // Logout links from other rooms route here, where the Supabase SDK is loaded.
  const url=new URL(location.href);
  if(url.searchParams.get('logout')==='1'){
   url.searchParams.delete('logout');
   history.replaceState(null,'',url.pathname+url.search+url.hash);
   await S.signOut();
   links=[];notice='Du har loggat ut.';
  }else await updateLinks();
 }catch(e){error=e.message}finally{ready=true;render()}
}
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 const action=el.dataset.action;
 if(busy)return;
 try{
  if(action==='invite'){
   busy=true;const code=await S.issueInvite(el.dataset.grade);invitation=code;
   notice='Ny privat engångskod skapad för '+gradeText(el.dataset.grade)+'.';
  }
  if(action==='copy'){
   const url=new URL('./',location.href);url.hash='/connect/'+invitation;
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url.href);
   else window.prompt('Kopiera länken',url.href);
   notice='Inbjudningslänken har kopierats.';
  }
  if(action==='sync'){await S.syncAll();await S.flush();notice='Synkstatus har uppdaterats.';}
  if(action==='recover'){
   if(!window.confirm('Hämta din tidigare sparade studiehistorik från molnet? Det skapas först en lokal säkerhetskopia. Dina egna resultat i andra årskurser påverkas inte.'))return;
   await S.flush();
   const r=await S.recover();
   notice='Återställda delar: '+r.parts.join(', ')+'. Din tidigare lokala kopia finns kvar som återställningspunkt. Öppna Matte OS igen för att se sammanslagningen.';
  }
  if(action==='logout'){await S.signOut();links=[];notice='Du har loggat ut.';}
  if(action==='reload'){await updateLinks();notice='Kopplingarna uppdaterade.';}
  if(action==='unlink'){
   if(!window.confirm('Avsluta delning med mentorn? Din mentor kan därefter inte läsa nya eller gamla svar direkt från databasen.'))return;
   for(const l of links)await S.unlink(l.learner_id);
   await updateLinks();notice='Delningen avslutad.';
  }
 }catch(x){error=x.message||'Kunde inte slutföra åtgärden.';}
 finally{busy=false;render();}
});
document.addEventListener('submit',async e=>{
 if(!['auth','redeem'].includes(e.target.id))return;e.preventDefault();if(busy)return;busy=true;error='';notice='';
 try{
  const f=new FormData(e.target);
  if(e.target.id==='auth'){
   const email=String(f.get('email')||''),password=String(f.get('password')||'');
   if(!email||!password)throw Error('Ange både e-postadress och lösenord.');
   await S.signIn(email,password);await updateLinks();S.syncAll();S.flush().catch(()=>{});notice='Välkommen tillbaka!';if(S.profile()?.role==='learner')location.assign('../');
  }
  if(e.target.id==='redeem'){
   const code=String(f.get('invite-code')||'').replace(/\s/g,'');
   if(code.length!==32)throw Error('Koden måste vara 32 tecken.');
   await S.redeem(code);await updateLinks();await S.syncAll();notice='Mentor kopplad. Dina framtida svar och synkade framsteg blir synliga i mentorvyn.';
  }
 }catch(ex){
  const m=String(ex.message||'');
  const code=String(ex.code||'');
  if(e.target.id==='auth'){
   if(code==='email_not_confirmed'||/email not confirmed/i.test(m))
    error='E-postadressen är inte bekräftad i Supabase. Be administratören öppna Authentication → Users, välja ditt konto och bekräfta adressen. Försök sedan logga in igen. Skapa inte ett nytt konto.';
   else if(code==='invalid_credentials'||/invalid login credentials/i.test(m))
    error='E-post eller lösenord stämmer inte. Använd e-postadressen och det separata Matte OS-lösenordet som skapades i Supabase.';
   else if(code==='over_request_rate_limit'||code==='over_email_send_rate_limit')
    error='För många inloggningsförsök. Försök igen senare; ditt konto och dina resultat finns kvar.';
   else error='Inloggningen misslyckades. Kontrollera kontot i Supabase Authentication → Users och försök igen. Inga elevresultat ändrades.';
  }else error=m||'Något gick fel. Inga elevdata ändrades.';
 }
 finally{busy=false;render()}
});
window.addEventListener('matte-study-status',()=>{if(ready&&!busy&&document.visibilityState==='visible')render()});
window.addEventListener('online',()=>{notice='Anslutningen är tillbaka. Synk återupptas.';render()});
window.addEventListener('hashchange',()=>{if(S.profile()?.role==='learner'&&location.hash.startsWith('#/connect/')){
 const code=location.hash.split('/')[2];const field=document.getElementById('invite-code');if(field)field.value=code;
}});
initial().then(()=>{if(location.hash.startsWith('#/connect/')){const code=location.hash.split('/')[2];const field=document.getElementById('invite-code');if(field)field.value=code;}});
})();
