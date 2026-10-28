(function(){
 'use strict';
 var tableRoot=document.getElementById('mult-grid');
 var buttons=Array.from(document.querySelectorAll('[data-poster]'));
 var sections={formler:document.getElementById('poster-formler'),tabeller:document.getElementById('poster-tabeller')};
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
   which=sections[which] ? which : 'formler';
   for(var k in sections) sections[k].hidden=(k!==which);
   buttons.forEach(function(btn){var selected=btn.dataset.poster===which;btn.setAttribute('aria-pressed',selected?'true':'false')});
   document.title=which==='tabeller'?'Matte OS · Multiplikationstabeller 1–10':'Matte OS · Formelaffisch Tal';
   if(updateUrl && window.history && window.history.replaceState){
     try{var u=new URL(window.location.href);u.searchParams.set('visa',which);history.replaceState(null,'',u.pathname+u.search+u.hash)}catch(e){}
   }
 }
 buttons.forEach(function(btn){btn.addEventListener('click',function(){show(btn.dataset.poster,true);window.scrollTo(0,0)})});
 document.getElementById('print').addEventListener('click',function(){window.print()});
 var initial='formler';
 try{initial=new URL(window.location.href).searchParams.get('visa')||'formler'}catch(e){}
 show(initial,false);
 window.MattePoster={tableCount:10,rowsPerTable:10,getResult:function(n,m){return n*m},show:show};
})();
