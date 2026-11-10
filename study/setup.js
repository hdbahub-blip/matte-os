/* Study Cloud account and guardian link UI. Browser never contains administrative credentials. */
(function(){
'use strict';
const S=window.MO_STUDY,app=document.getElementById('app');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gradeText=g=>g==='grade8'?'Årskurs 8':'Årskurs 9';
let error='',notice='',invitation='',invitations=[],links=[],form='login',busy=false,ready=false,showReset=false,updating=false;
function header(){return '<header class="topbar"><div class="topinner"><a class="brand" href="../"><span class="monogram">M</span><span><b>MATTE OS</b><small>STUDY CLOUD · MINA KONTON</small></span></a><a class="tiny" href="../foralder/">Min översikt</a></div></header>'}
function field(label,name,type='text',extra=''){return '<div class="field"><label for="'+name+'">'+label+'</label><input id="'+name+'" name="'+name+'" type="'+type+'" '+extra+' required></div>'}
function alerts(){return (error?'<div class="notice error" role="alert">'+esc(error)+'</div>':'')+(notice?'<div class="notice" role="status">'+esc(notice)+'</div>':'')}
function shell(inner){app.innerHTML=header()+'<main class="container study-main study-bottom">'+alerts()+inner+'<footer>Matte OS Study Cloud. Elevsvar delas endast med en kopplad mentorprofil. Ingen offentlig elevlista, inga anonyma profiler eller dold insamling. Vid frånkoppling upphör mentoråtkomst till elevens privata svar. Kopior du redan har exporterat påverkas inte. <a href="../">Till elevappen</a>.</footer></main>'}
function authView(){
 let intro='<section class="hero setup-hero"><span class="eyebrow">Synk och privat familjestöd</span><h1>Studera tryggt, tillsammans.</h1><p>Eleverna får egna konton och kan arbeta på sina telefoner. En mentor kan se svar först efter att eleven godkänt en privat inbjudan.</p></section>';
 let nav='<div class="seg"><button data-mode="login" aria-pressed="'+(form==='login')+'">Logga in</button><button data-mode="signup" aria-pressed="'+(form==='signup')+'">Skapa konto</button></div>';
 let forms='<form id="auth" class="card"><h2>'+(form==='login'?'Välkommen tillbaka':'Skapa ditt konto')+'</h2>'+field('Din e-post','email','email','autocomplete="email" maxlength="180"')+field('Lösenord (minst 10 tecken)','password','password','passwordlength="10" minlength="10" autocomplete="'+(form==='login'?'current-password':'new-password')+'"')+
 (form==='signup'?'<label class="checkbox-row"><input name="consent" type="checkbox" required><span>Jag förstår att jag skapar mitt eget konto och att mina studieresultat kan delas med kopplad mentor efter att jag själv löst in en inbjudan.</span></label>':'')+
 '<button type="submit" class="btn">'+(busy?'Kontrollerar …':form==='login'?'Logga in':'Skapa konto')+'</button></form>';
 return intro+'<div class="auth-layout"><div>'+nav+forms+'</div><div class="card"><h2>Varför behövs konto?</h2><p>Utan inloggning finns resultaten bara på den aktuella telefonen. Med konto sparas nya inlämnade svar automatiskt i en skyddad databas, även efter att du byter enhet.</p><p>Det som gjorts innan aktiveringen kan synkroniseras som sammanfattade framsteg. Äldre skrivna svar som aldrig sparats kan inte återställas.</p><p class="note">Bekräftelse till e-posten kan krävas. Använd en egen e-postadress som du har tillgång till. Konton delas inte mellan personer.</p></div></div>';
}
function createProfile(){
 return '<section class="hero"><span class="eyebrow">Nästa steg</span><h1>Välj din roll.</h1><p>Din roll låses vid skapandet så att elever och mentorer inte kan ta över varandras data.</p></section>'+
 '<div class="card"><form id="create-profile"><h2>Vem ska använda det här kontot?</h2><div class="field"><label for="role">Profil</label><select id="role" name="role" required><option value="">Välj ...</option><option value="mentor">Min Marble Green-mentorprofil</option><option value="learner">Elevprofil</option></select></div>'+
 '<div class="field" id="grade-field"><label for="grade">Årskurs (för elev)</label><select id="grade" name="grade"><option value="">Ingen vald</option><option value="grade8">Årskurs 8</option><option value="grade9">Årskurs 9</option></select></div>'+
 field('Visningsnamn (valfritt alias)','name','text','maxlength="48" value="Elev"')+
 '<label class="checkbox-row"><input type="checkbox" required><span>Jag väljer min egen profil. Jag förstår att den här rollen/årskursen inte går att byta till en annan persons profil.</span></label>'+
 '<button type="submit" class="btn">Skapa min profil</button></form></div>';
}
function memberView(){
 const u=S.profile(),inf=S.info(),isMentor=u.role==='mentor';
 let s='<section class="hero"><span class="eyebrow">Kontot är anslutet</span><h1>'+(isMentor?'Min mentorprofil':gradeText(u.grade))+'.</h1><p>'+(isMentor?'Följ elever efter att de använt din privata inbjudan.':'Dina inlämnade svar och framsteg kan sparas automatiskt. En mentor kan bara se dem efter att du själv kopplat profilen.')+'</p></section>';
 s+='<div class="card"><div class="card-head"><div><h2>Konto och synk</h2><p>Inloggat som '+esc(u.display_name||gradeText(u.grade)||'Mentor')+'</p></div><button data-action="logout" class="btn secondary">Logga ut</button></div><p class="study-status">Status: '+esc(inf.status)+'</p>'+
 (isMentor?'<p class="note">Din profil läser elevers resultat. Den kan inte skriva över deras enskilda framsteg.</p>':
 '<p class="note">Väntande svar: '+inf.waiting+'. Ditt arbete sparas också lokalt. Om du är offline skickas det vid nästa uppkoppling.</p><button class="btn" data-action="sync">Synkronisera nu</button>')+'</div>';
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
}
async function initial(){
 try{await S.init();await updateLinks();}catch(e){error=e.message}finally{ready=true;render()}
}
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-action],[data-mode]');if(!el)return;
 if(el.dataset.mode){form=el.dataset.mode;error='';notice='';render();return;}
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
   if(password.length<10)throw Error('Lösenordet behöver minst 10 tecken.');
   if(form==='login'){await S.signIn(email,password);notice='Du är inloggad.';}
   else{const v=await S.signUp(email,password);notice=v.confirmationNeeded?'Bekräfta e-postmeddelandet och logga sedan in.':'Kontot är registrerat. Välj din profil.';}
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
 }catch(ex){error=ex.message||'Något gick fel. Inga elevdata ändrades.';}
 finally{busy=false;render()}
});
window.addEventListener('matte-study-status',()=>{if(ready&&!busy&&document.visibilityState==='visible')render()});
window.addEventListener('online',()=>{notice='Anslutningen är tillbaka. Synk återupptas.';render()});
window.addEventListener('hashchange',()=>{if(S.profile()?.role==='learner'&&location.hash.startsWith('#/connect/')){
 const code=location.hash.split('/')[2];const field=document.getElementById('invite-code');if(field)field.value=code;
}});
initial().then(()=>{if(location.hash.startsWith('#/connect/')){const code=location.hash.split('/')[2];const field=document.getElementById('invite-code');if(field)field.value=code;}});
})();
