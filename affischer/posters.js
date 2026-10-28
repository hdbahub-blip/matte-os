(function(){
 'use strict';
 var tableRoot=document.getElementById('mult-grid');
 var buttons=Array.from(document.querySelectorAll('[data-poster]'));
 var sections={formler:document.getElementById('poster-formler'),formler8:document.getElementById('poster-formler8'),tabeller:document.getElementById('poster-tabeller')};
 var gradeButtons=Array.from(document.querySelectorAll('[data-grade]'));
 var grade='9';
 var escapeHTML=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
 if(tableRoot){
   var cards=[];
   for(var n=1;n<=10;n++){
     var rows=[];
     for(var m=1;m<=10;m++){
       rows.push('<div class="mult-row"><span>'+n+' × '+m+'</span><span aria-hidden="true">=</span><span class="answer-number">'+(n*m)+'</span></div>');
     }
     cards.push('<article class="mult-card" aria-label="'+n+':ans tabell"><header><span class="number">'+String(n).padStart(2,'0')+'</span><div><h2>'+n+':ans tabell</h2><p>'+n+' gånger 1 till 10</p></div></header><div class="mult-rows">'+rows.join('')+'</div><div class="mult-footer">Tänk på: <strong>'+n+' × 10 = '+(n*10)+'</strong></div></article>');
   }
   tableRoot.innerHTML=cards.join('');
 }
 function show(which,updateUrl){
   which=which==='tabeller'?'tabeller':'formler';
   var target=which==='formler' && grade==='8'?'formler8':which;
   for(var k in sections)sections[k].hidden=(k!==target);
   document.body.dataset.grade=grade;
   var meta=document.getElementById('poster-theme-color');
   if(meta)meta.setAttribute('content',grade==='8'?'#092f5b':'#6e0927');
   var tablesGrade=document.getElementById('tables-grade');
   if(tablesGrade)tablesGrade.textContent=grade==='8'?'ÅK 8 · TABELLARENAN':'TABELLARENAN';
   buttons.forEach(function(btn){
     var selected=btn.dataset.poster===which;
     btn.setAttribute('aria-pressed',selected?'true':'false');
     var label=btn.querySelector('small');
     if(label && btn.dataset.poster==='formler')label.textContent='Åk '+grade;
   });
   gradeButtons.forEach(function(btn){btn.setAttribute('aria-pressed',btn.dataset.grade===grade?'true':'false')});
   document.title=which==='tabeller'?'Matte OS · Multiplikationstabeller 1–10 · Åk '+grade:'Matte OS · Formelaffisch Åk '+grade;
   if(updateUrl && window.history && window.history.replaceState){
     try{var u=new URL(window.location.href);u.searchParams.set('visa',which);u.searchParams.set('ak',grade);history.replaceState(null,'',u.pathname+u.search+u.hash)}catch(e){}
   }
 }
 function setGrade(which,updateUrl){grade=which==='8'?'8':'9';show(document.getElementById('poster-tabeller').hidden?'formler':'tabeller',updateUrl)}
 buttons.forEach(function(btn){btn.addEventListener('click',function(){show(btn.dataset.poster,true);window.scrollTo(0,0)})});
 gradeButtons.forEach(function(btn){btn.addEventListener('click',function(){setGrade(btn.dataset.grade,true);window.scrollTo(0,0)})});
 document.getElementById('print').addEventListener('click',function(){window.print()});
 var initial='formler';
 try{var params=new URL(window.location.href).searchParams;initial=params.get('visa')||'formler';grade=params.get('ak')==='8'?'8':'9'}catch(e){}
 show(initial,false);
 window.MattePoster={tableCount:10,rowsPerTable:10,getResult:function(n,m){return n*m},show:show,setGrade:setGrade,getGrade:function(){return grade}};
})();
