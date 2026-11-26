/* English learning context. Translates interface chrome, never pupil names or lesson text. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.MO_ENGLISH_CONTEXT=api})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const text={
 'TILLSAMMANS':'TOGETHER','MATTE OS · SPELA OCH LÄR':'MATTE OS · LEARN & PLAY',
 'Vad vill ni öva?':'What would you like to practise?',
 'Välj ämne. Spela sedan själv eller tillsammans.':'Choose a subject, then play solo or with friends.',
 'Vald Joker: ':'Guest: ','Vald profil: ':'Selected profile: ','Valt: ':'Selected: ',
 'Svenska':'Swedish','Engelska':'English','Matematik':'Maths','Studieteknik':'Study skills','Multiplikation':'Times tables',
 'Tabeller eller studieteknik':'Times tables or study skills',
 'Jag kör själv':'Play solo','Vi kör ihop':'Play together',
 'Välj deltagare · 5 frågor':'Choose players · 5 questions',
 'Starta ›':'Start ›','Välj spelare ›':'Choose players ›','Fler spel och profiler':'More games and profiles',
 '5 frågor · ':'5 questions · ','MATTE OS · VÄLKOMMEN':'MATTE OS · WELCOME',
 'Gästprofilernas framsteg sparas bara på den här enheten. Gruppresultat räknas inte som skolprov. Ingen automatisk molnöverföring.':'Guest progress stays on this device. These practice results are not official school tests. Nothing syncs automatically.',
 'Start':'Home','Matte':'Maths','Spela':'Games',
 '‹ Tillsammans':'‹ Together','‹ Tillbaka':'‹ Back',
 'ENGELSKA':'ENGLISH',
 'Fråga ':'Question ',' av ':' of ','Deltagare ':'Player ',
 'Egen träning':'Solo practice',
 'Välj ett alternativ. Ingen annan ser ditt svar förrän facit visas.':'Choose one answer. No one sees your choice until the answer is revealed.',
 'Välj svar':'Choose an answer','Lämna mitt svar':'Submit my answer','Avsluta pass':'End session',
 'Rätt · +1':'Correct · +1','Vi övar vidare':'Keep practising',
 'Inget svar':'No answer','Poäng hittills':'Points so far',
 'Nästa fråga':'Next question','Se slutresultat':'See results','Avsluta passet':'Finish session',
 'Något gick fel':'Something went wrong',
 'SAMMA MOBIL · SNABBSTART':'ONE PHONE · QUICK START',
 'Redo att köra ihop?':'Ready to play together?',
 'Välj ämne och deltagare. Vi börjar med fem korta frågor.':'Choose a subject and players. Start with five short questions.',
 'Vem är med?':'Who is playing?',
 ' valda · max ':' selected · max ',
 'Åk 8':'Year 8','Åk 9':'Year 9',
 'Årskurs · ingen skolprogress påverkas':'School year · saved progress stays unchanged',
 'Joker · lokal profil':'Guest · local profile',
 'Kompis utan profil?':'A friend without a profile?',
 'Lägg till en Joker för bara det här passet. Namn och svar sparas inte som skolresultat.':'Add a guest for this round. Their answers will not be added to school results.',
 '+ Lägg till':'+ Add',
 'Välj text eller uppgift':'Choose a story or task',
 'Starta ':'Start ',' frågor · ':' questions · ',' personer':' players',
 'Byt text, kapitel eller övning':'Change story or activity',
 'Resultaten från det här passet ändrar inga skolprov eller skolprofiler.':'This practice does not change any official tests or school profiles.',
 'Nivå ':'Level ','Välj':'Choose','Vald Joker':'Guest',
 'Enheten kan inte spara gästdata. Kontrollera privat läge eller lagringsutrymme.':'Guest data cannot be saved on this device. Check private mode or available storage.',
 'Växla dag och kväll':'Switch day and night','Byt ljust och mörkt läge':'Switch light or dark mode',
 'Till Tillsammans startsida':'Back to Together home',
 'Byt profil, vald ':'Change profile, current ',
 'Välj ämne eller spel':'Choose a subject or game',
 'Välj hur ni vill spela':'Choose how to play',
 'Årskurs ':'Year ',
 'Fortsätt passet ›':'Resume round ›','Ni har ett pausat pass':'You have an unfinished round',
 'Kolla svar':'Check answer','Försök igen':'Try again',
 'Visa facit':'Show answer','Samma mobil':'One phone'
};
const keys=Object.keys(text).sort((a,b)=>b.length-a.length);
const pattern=new RegExp(keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
const skip='script,style,textarea,input,.question,.options .choice,.guest strong,.score strong,[contenteditable]';
function translate(t){return String(t).replace(pattern,k=>text[k]);}
function apply(app,topic){
 const en=topic==='en';document.documentElement.lang=en?'en':'sv';
 document.documentElement.dataset.studyLanguage=en?'en':'sv';
 if(!en||!app)return;
 const walker=document.createTreeWalker(app,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,el=node.parentElement;
  if(!el||el.closest(skip))continue;
  const before=node.nodeValue,after=translate(before);
  if(before!==after)node.nodeValue=after;
 }
 for(const el of app.querySelectorAll('[aria-label],[title]')){
  for(const key of ['aria-label','title']){
   const v=el.getAttribute(key);if(!v)continue;
   const next=translate(v);if(next!==v)el.setAttribute(key,next);
  }
 }
 document.title='Matte OS · Together · English';
}
return Object.freeze({apply,translate});
});
