/* Matte Prov v1 — pure exam selection/scoring helpers. */
(function(root){
  'use strict';

  const LEVEL_ORDER = {
    diagnos: ['C','B','D','F','A'],
    prov: ['F','D','C','B','A']
  };

  function hash(str){
    let h = 2166136261 >>> 0;
    for (let i=0;i<String(str).length;i++){
      h ^= String(str).charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed){
    let x = seed >>> 0 || 123456789;
    return function(){
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, r){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(r()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function preferred(skill, mode, r, used){
    const order=LEVEL_ORDER[mode]||LEVEL_ORDER.diagnos;
    for(const lv of order){
      const xs=skill.p.map((q,i)=>({q,i})).filter(x=>x.q.lv===lv&&!used.has(i));
      if(xs.length) return xs[Math.floor(r()*xs.length)];
    }
    const xs=skill.p.map((q,i)=>({q,i})).filter(x=>!used.has(i));
    return xs.length?xs[Math.floor(r()*xs.length)]:null;
  }

  function selectRun(skills, chapter, mode, attemptNo){
    const ss=skills.filter(s=>s.ch===chapter);
    const r=rng(hash(chapter+'|'+mode+'|'+attemptNo));
    const picked=[];
    const usedBySkill={};

    for(const s of shuffle(ss,r)){
      const used=usedBySkill[s.id]||(usedBySkill[s.id]=new Set());
      const x=preferred(s,mode,r,used);
      if(x){
        used.add(x.i);
        picked.push({sid:s.id,skillTitle:s.title,key:'p'+x.i,item:x.q});
      }
    }

    if(mode==='prov'){
      const target=Math.min(18,Math.max(ss.length+2,Math.ceil(ss.length*1.25)));
      const pool=[];
      for(const s of ss){
        const used=usedBySkill[s.id]||(usedBySkill[s.id]=new Set());
        for(const lv of ['F','D','C','B','A']){
          s.p.forEach((q,i)=>{
            if(q.lv===lv&&!used.has(i)) pool.push({sid:s.id,skillTitle:s.title,key:'p'+i,item:q,rank:lv});
          });
        }
      }
      for(const x of shuffle(pool,r)){
        if(picked.length>=target) break;
        const idx=Number(x.key.slice(1));
        if(usedBySkill[x.sid].has(idx)) continue;
        usedBySkill[x.sid].add(idx);
        picked.push(x);
      }
    }
    return shuffle(picked,r);
  }

  function answerText(item){
    if(item.type==='sci' && Array.isArray(item.a)) return item.a[0]+' · 10^'+item.a[1];
    if(item.type==='roots' && Array.isArray(item.a)) return item.a.length?item.a.join(' och '):'ingen reell lösning';
    if(item.radical){
      const [k,n]=item.radical;
      return (k===1?'':k)+'√'+n+(item.u?' '+item.u:'');
    }
    return String(item.a)+(item.u?' '+item.u:'');
  }

  function isoWeek(d=new Date()){
    const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    const day=x.getUTCDay()||7;
    x.setUTCDate(x.getUTCDate()+4-day);
    const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));
    return Math.ceil((((x-y)/86400000)+1)/7);
  }

  function recommendedChapter(profile, week=isoWeek()){
    const upcoming=(profile.chapters||[]).filter(c=>c.examWeek>=week).sort((a,b)=>a.examWeek-b.examWeek);
    if(upcoming.length) return upcoming[0];
    return profile.chapters[profile.chapters.length-1];
  }

  const API={selectRun,answerText,isoWeek,recommendedChapter,hash};
  if(typeof module!=='undefined'&&module.exports) module.exports=API;
  else root.MOProvCore=API;
})(typeof window!=='undefined'?window:globalThis);
