/* Study Cloud account and guardian link UI. Browser never contains administrative credentials. */
(function(){
'use strict';
const S=window.MO_STUDY,app=document.getElementById('app');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gradeText=g=>g==='grade8'?'Årskurs 8':'Årskurs 9';
let error='',notice='',invitation='',invitations=[],links=[],busy=false,ready=false,updating=false;
function header(){return '<header class="topbar"><div class="topinner"><a class="brand" href="../"><span class="monogram">M</span><span><b>MATTE OS</b><small>STUDY CLOUD · MINA KONTON</small></span></a><a class="tiny" href="../foralder/">Min översikt</a></div></header>'}
function field(label,name,type='text',extra=''){return '<div class="field"><label for="'+name+'">'+label+'</label><input id="'+name+'" name="'+name+'" type="'+type+'" '+extra+' required></div>'}
function alerts(){return (error?'<div class="notice error" role="alert">'+esc(error)+'</div>':'')+(notice?'<div class="notice" role="status">'+esc(notice)+'</div>':'')}
function shell(inner){app.innerHTML=header()+'<main class="container study-main study-bottom">'+alerts()+inner+'<footer>Matte OS Study Cloud. Elevsvar delas endast med en kopplad mentorprofil. Ingen offentlig elevlista, inga anonyma profiler eller dold insamling. Vid frånkoppling upphör mentoråtkomst till elevens privata svar. Kopior du redan har exporterat påverkas inte. <a href="../">Till elevappen</a>.</footer></main>'}
function authView(){
 const intro='<section class="hero setup-hero"><span class="eyebrow">Study Cloud · Privata elevkonton</span><h1>Logga in i Matte OS.</h1><p>Samma konto på telefon, surfplatta och dator. Dina uppgifter och framsteg synkas när du är inloggad och har internet.</p></section>';
 const form='<form id="auth" class="card"><span class="eyebrow">Ett kontosystem</span><h2>Välkommen tillbaka</h2>'
  +field('E-postadressen för ditt Matte OS-konto','email','email','autocomplete="username" maxlength="180"')
  +field('Lösenord','password','password','autocomplete="current-password"')
  +'<button type="submit" class="btn">'+(busy?'Kontrollerar …':'Logga in')+'</button>'
  +'<p class="note">Har du inget konto än? Konton skapas av Matte OS-administratören i Supabase. Be ansvarig mentor om inloggningsuppgifter. Använd inte ditt privata Gmail-lösenord.</p></form>';
 const help='<aside class="card"><h2>Så kommer du igång</h2>'
  +'<ol class="study-steps"><li>Administratören skapar ett eget konto för varje person i Supabase.</li>'
  +'<li>Öppna Matte OS och logga in med din e-postadress och ditt Matte OS-lösenord.</li>'
  +'<li>Första gången väljer du <b>Mentor</b> eller <b>Elev</b> med rätt årskurs och sparar profilen.</li>'
  +'<li>Mentorn skickar en privat inbjudan som eleven godkänner. Sedan följer resultaten med mellan enheter.</li></ol>'
  +'<details><summary>Information för den som administrerar kontona</summary>'
  +'<p>Öppna kontohanteringen i Supabase:</p><p><a class="btn secondary" href="https://supabase.com/dashboard/project/bjyahpcpthumpbktrxnc/auth/users" target="_blank" rel="noopener noreferrer">Öppna Supabase – användare</a></p>'
  +'<p>Välj <b>Add user → Create new user</b>. Ange personens egen e-postadress, ett separat starkt lösenord och välj e-postbekräftelse enligt projektets inställningar.</p>'
  +'<p>Varje elev får ett eget konto. Lägg aldrig till eleverna som projektmedlemmar i Supabase Dashboard. Dela inloggningen privat.</p>'
  +'<p>För att hindra självregistrering även genom Auth-API:t måste administratören också stänga <b>Allow new users to sign up</b> under Supabase Authentication → Sign In / Providers. Att dölja registrering här räcker inte som serverbaserad spärr.</p></details>'
  +'<p class="note"><b>Viktigt om gamla resultat:</b> Om du redan tränat på en annan telefon eller installerad ikon, synka först därifrån innan du raderar den gamla installationen.</p></aside>';
 return intro+'<div class="auth-layout"><div>'+form+'</div>'+help+'</div>';
}
function createProfile(){
 return '<section class="hero"><span class="eyebrow">Nästa steg</span><h1>Ställ in din profil.</h1><p>Ditt konto finns redan i Supabase. Här väljer du hur du ska använda Matte OS. Rollen och årskursen låses för att skydda separata elevuppgifter.</p></section>'+
 '<div class="card"><form id="create-profile"><h2>Vem ska använda det här kontot?</h2><div class="field"><label for="role">Profil</label><select id="role" name="role" required><option value="">Välj ...</option><option value="mentor">Min Marble Green-mentorprofil</option><option value="learner">Elevprofil</option></select></div>'+
 '<div class="field" id="grade-field"><label for="grade">Årskurs (för elev)</label><select id="grade" name="grade"><option value="">Ingen vald</option><option value="grade8">Årskurs 8</option><option value="grade9">Årskurs 9</option></select></div>'+
 field('Visningsnamn (valfritt alias)','name','text','maxlength="48" value="Elev"')+
 '<label class="checkbox-row"><input type="checkbox" required><span>Jag väljer min egen profil. Jag förstår att den här rollen/årskursen inte går att byta till en annan persons profil.</span></label>'+
 '<button type="submit" class="btn">Spara min profil</button></form></div>';
}
function memberView(){
 const u=S.profile(),inf=S.info(),isMentor=u.role==='mentor';
 let s='<section class="hero"><span class="eyebrow">Kontot är anslutet</span><h1>'+(isMentor?'Min mentorprofil':gradeText(u.grade))+'.</h1><p>'+(isMentor?'Följ elever efter att de använt din privata inbjudan.':'Dina inlämnade svar och framsteg kan sparas automatiskt. En mentor kan bara se dem efter att du själv kopplat profilen.')+'</p></section>';
 s+='<div class="card"><div class="card-head"><div><h2>Konto och synk</h2><p>Inloggat som '+esc(u.display_name||gradeText(u.grade)||'Mentor')+'</p></div><button data-action="logout" class="btn secondary">Logga ut</button></div><p class="study-status">Status: '+esc(inf.status)+'</p>'+
 (isMentor?'<p class="note">Din profil läser elevers resultat. Den kan inte skriva över deras enskilda framsteg.</p>':
 '<p class="note">Väntande svar: '+inf.waiting+'. Ditt arbete sparas också lokalt. Om du är offline skickas det vid nästa uppkoppling.</p><div class="actions"><button class="btn" data-action="sync">Synkronisera nu</button><button class="btn secondary" data-action="recover">Återställ framsteg från molnet</button></div><p class="note">Återställning gör först en lokal säkerhetskopia och slår samman bara din egen årskurs. Gör detta först när väntande svar är synkade; öppna därefter elevappen på nytt.</p>')+'</div>';
 if(isMentor){
  s+='<div class="card"><h2>Koppla en elev</h2><p>Skapa en engångsinbjudan för rätt årskurs. Eleven öppnar sin egen inloggning och skriver in koden. Efter godkännandet börjar din översikt uppdateras.</p>'+
  '<div class="setup-actions"><button class="btn" data-action="invite" data-grade="grade8">Bjud in årskurs 8</button><button class="btn" data-action="invite" data-grade="grade9">Bjud in årskurs 9</button></div>'+
  (invitation?'<div class="code" id="invite-code">'+esc(invitation)+'</div><div class="actions"><button class="btn secondary" data-action="copy">Kopiera inbjudningslänk</button></div><p class="note">Koden gäller i 48 timmar och fungerar bara en gång. Dela den privat, inte i offentliga grupper.</p>':'')+
  '<h3>Kopplade elevkonton</h3>'+(links.length?links.map(l=>'<div class="rowline"><strong>'+gradeText(l.grade)+'</strong><span class="state done">Kopplad</span></div>').join(''):'<p class="note">Inget elevkonto har ännu godkänt en inbjudan.</p>')+
  '<button data-action="reload" class="btn secondary">Uppdatera kopplingar</button><p style="margin-top:16px"><a class="btn" href="../foralder/">Öppna min Marble Green-översikt</a></p></div>';
 }else{
  s+='<div class="card"><h2>Dela dina studieresultat med din mentor</h2>'+
  (links.length?'<div class="notice">Kopplad! Din mentor kan nu se sparade svar och framsteg. <button data-action="unlink" class="btn warning">Koppla bort</button></div>':
  '<p class="note">Du bestämmer vilken mentor som får läsa dina inlämnade svar. Den 32 tecken långa engångskoden kommer från mentorns profil.</p><form id="redeem">'+field('Engångskod','invite-code','text','maxlength="32" minlength="32" inputmode="text" autocapitalize="off" autocomplete="off" spellcheck="false"')+
  '<label class="checkbox-row"><input type="checkbox" required><span>Jag godkänner att mentorn får se mina inlämnade svar, texter, resultat och framsteg i Matte OS. Jag kan senare koppla bort mentorn.</span></label>'+
  '<button class="btn" type="submit">Koppla min profil</button></form>')+
  '<p class="note">Dina privata svar skickas bara när du är inloggad som rätt elev och skolanvändaren känner till delningen. Övningarna fortsätter fungera offline.</p></div>';
  s+='<div class="card"><h2>Se dina studiepass</h2><p><a class="btn" href="../studera/">Öppna Studera tillsammans</a></p><p class="note">Gemensamma pass kräver uppkoppling. Dina egna försök i Matte OS påverkas inte av mentorns svar.</p></div>';
 }
 if(!isMentor&&u.grade==='grade9'){
  let privateNP=false;try{privateNP=!!sessionStorage.getItem('matteos.np.private-claim.v1')}catch(e){}
  s+='<div class="card"><h2>En stark nolla · muntliga NP</h2><p>'+(privateNP?
   'Din privata aktiveringslänk är redo. Fortsätt så läses hela skoltexten och frågorna in automatiskt.':
   'Öppna NP-övningen. Skoltexten hämtas automatiskt om kontot har tillgång; dina svar följer med mellan enheter.')+
   '</p><p><a class="btn" href="../lara/np-muntligt.html#/home">Fortsätt till En stark nolla</a></p></div>';
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
 try{await S.init();await updateLinks();}catch(e){error=e.message}finally{ready=true;render()}
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
 if(!['auth','create-profile','redeem'].includes(e.target.id))return;e.preventDefault();if(busy)return;busy=true;error='';notice='';
 try{
  const f=new FormData(e.target);
  if(e.target.id==='auth'){
   const email=String(f.get('email')||''),password=String(f.get('password')||'');
   if(!email||!password)throw Error('Ange både e-postadress och lösenord.');
   await S.signIn(email,password);notice='Du är inloggad.';
  }
  if(e.target.id==='create-profile'){
   const role=String(f.get('role')||''),grade=String(f.get('grade')||'');
   if(role==='learner'&&!['grade8','grade9'].includes(grade))throw Error('Välj årskurs för elevprofilen.');
   await S.enroll(role,grade,String(f.get('name')||''));notice='Profilen är skapad. Detta konto har en egen säker datagräns.';
  }
  if(e.target.id==='redeem'){
   const code=String(f.get('invite-code')||'').replace(/\s/g,'');
   if(code.length!==32)throw Error('Koden måste vara 32 tecken.');
   await S.redeem(code);await updateLinks();await S.syncAll();notice='Mentor kopplad. Dina framtida svar och synkade framsteg blir synliga i mentorvyn.';
  }
 }catch(ex){
  const m=String(ex.message||'');
  const code=String(ex.code||'');
  error=e.target.id==='auth'?'Kunde inte logga in. Kontrollera e-post och lösenord samt att administratören har skapat ditt konto i Supabase. Inga elevresultat ändrades.':m||'Något gick fel. Inga elevdata ändrades.';
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
