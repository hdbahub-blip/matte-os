/* Together Live: derive exercises from existing authored Matte OS content, never pupils' local data. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.MO_LIVE_SOURCES=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const topics={sv:'Svenska',en:'Engelska',study:'Studieteknik',math:'Matematik',table:'Multiplikation'};
 const bank=()=>root.MO_BANK3||[];
 const lessons=()=>root.MOL_CONTENT?.lessons||[];
 const skills=()=>[].concat(root.MO_CONTENT8||[],root.MO_CONTENT9||[]);
 function hash(s){let h=2166136261>>>0;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h;}
 function shuffle(options,correct,seed){
  const arr=options.map((x,i)=>({text:String(x),i}));let h=hash(seed);
  for(let i=arr.length-1;i>0;i--){h=(Math.imul(h,1664525)+1013904223)>>>0;const k=h%(i+1);[arr[i],arr[k]]=[arr[k],arr[i]];}
  return {options:arr.map(x=>x.text),correct:arr.findIndex(x=>x.i===correct)};
 }
 function choiceFor(s){return [s.g].concat(s.p||[]).filter(q=>{const opts=q&&(q.opts||q.ro);
  return q?.type==='choice'&&Array.isArray(opts)&&opts.length>=2&&opts.length<=8&&opts.some(x=>String(x)===String(q.a));
 });}
 function sources(topic) {
  if(topic==='sv'||topic==='en')return [{ref:topic+':micro:v1',label:'Korta lektioner'}]
   .concat(bank().filter(t=>t.lang===topic&&t.tasks?.some(q=>q.type==='choice'&&Array.isArray(q.options)))
    .sort((a,b)=>a.level-b.level||a.title.localeCompare(b.title))
    .map(t=>({ref:topic+':'+t.id+':v'+t.version,label:'Nivå '+t.level+' · '+t.title})));
  if(topic==='study')return [{ref:'study:micro:v1',label:'Studieteknik · korta övningar'}];
  if(topic==='table')return Array.from({length:9},(_,i)=>({ref:'table:'+(i+2)+':v1',label:(i+2)+':ans multiplikationstabell'}));
  if(topic==='math') {
   const priority=['f8-perimeter','f8-area','f8-circle-area','f8-negative','f8-fractions-compare','s9-symmetry','s9-angles','s9-percent-share','s9-pythagoras'];
   return skills().filter(s=>choiceFor(s).length).sort((a,b)=>{const x=priority.indexOf(a.id),y=priority.indexOf(b.id);return (x<0?100:x)-(y<0?100:y);})
    .map(s=>({ref:'math:'+s.id,label:(s.id.startsWith('f8')?'Åk 8 · ':'Åk 9 · ')+s.title}));
  }
  return [];
 }
 function questions(ref){
  if(typeof ref!=='string'||! /^(sv|en|study|math|table):[A-Za-z0-9_-]{1,64}(:v[0-9]{1,3})?$/.test(ref))return [];
  const [topic,id,version]=ref.split(':');
  if(topic==='table'){
   const n=Number(id);if(!Number.isInteger(n)||n<2||n>10)return [];
   return Array.from({length:10},(_,i)=>{const k=i+1,val=n*k,wrong=new Set([val]);
    for(const c of [n*(k+1),n*Math.max(1,k-1),val+n+1,val-2,n*(k+2),val+5])if(c>0&&wrong.size<4)wrong.add(c);
    while(wrong.size<4)wrong.add(val+wrong.size*2+1);
    const mixed=shuffle([...wrong].map(String),0,'table:'+n+':'+k);
    return {key:'tab-'+n+'-'+k,topic,prompt:n+' × '+k+' = ?',options:mixed.options,correct:mixed.correct,why:'Multiplikation betyder '+k+' grupper med '+n+' i varje.'};
   });
  }
  if(topic==='math'){
   const s=skills().find(x=>x.id===id);if(!s)return [];
   return choiceFor(s).map((q,i)=>{const opts=q.opts||q.ro,correct=opts.findIndex(x=>String(x)===String(q.a));
    const m=shuffle(opts,correct,ref+':'+i);return {key:s.id+':'+i,topic,prompt:String(q.q),options:m.options,correct:m.correct,why:String((q.sol||[]).join(' · ')||s.anchor||'')};}).slice(0,10);
  }
  if(topic==='study'||id==='micro')return lessons().filter(l=>l.subject===topic).flatMap(l=>
   ['guided','solo'].filter(k=>l[k]?.type==='choice'&&Array.isArray(l[k].options)).map(k=>{const q=l[k],m=shuffle(q.options,q.correct,topic+':'+l.id+':'+k);
    return {key:l.id+':'+k,topic,prompt:String(q.prompt),options:m.options,correct:m.correct,why:String(q.why||'')};})
  ).slice(0,12);
  const t=bank().find(x=>x.lang===topic&&x.id===id&&'v'+x.version===version);
  if(!t)return [];
  return t.tasks.filter(q=>q.type==='choice'&&Array.isArray(q.options)).map(q=>{
   const m=shuffle(q.options,0,ref+':'+q.id);
   return {key:t.id+':'+q.id,topic,prompt:String(q.ask),options:m.options,correct:m.correct,why:String(q.why||'')};
  }).slice(0,12);
 }
 function text(ref){const [lang,id,v]=String(ref||'').split(':');
  return bank().find(t=>t.lang===lang&&t.id===id&&'v'+t.version===v)||null;}
 return {topics,sources,questions,text};
});