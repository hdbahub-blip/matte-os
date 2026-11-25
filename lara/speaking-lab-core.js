/* Stateless, testable original speaking-practice rules. No real pupil data. */
(function(root,factory){const out=factory(root.MO_SPEAKING_DATA||(typeof require==='function'?require('./speaking-lab-content.js'):null));if(typeof module==='object'&&module.exports)module.exports=out;root.MO_SPEAKING_CORE=out;})(typeof window!=='undefined'?window:globalThis,function(D){
'use strict';
const KEY='matteos.speaking-lab.session.v1';
const MODES=['solo','pair','group'];
const INTEREST=['neutral','blank','bored','excited'];
const TOPICS=D.topics.map(t=>t.id);
const categoryIds=['all',...D.categories.map(c=>c.id)];
const cleanMode=x=>MODES.includes(x)?x:'solo';
const cleanCategory=x=>categoryIds.includes(x)?x:'all';
const cleanInterest=x=>INTEREST.includes(x)?x:'neutral';
function participants(mode){return mode==='group'?4:mode==='pair'?2:1;}
function hash(s){let h=2166136261>>>0;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;}
function shuffle(a,seed){const b=a.slice();let h=hash(seed);for(let i=b.length-1;i>0;i--){h^=h<<13;h^=h>>>17;h^=h<<5;const j=(h>>>0)%(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
function make(opt={}){
 const mode=cleanMode(opt.mode),category=cleanCategory(opt.category),interest=cleanInterest(opt.interest);
 const ids=D.topics.filter(t=>category==='all'||t.category===category).map(t=>t.id);
 if(!ids.length)throw Error('No speaking cards in this category');
 return {version:1,mode,category,interest,deck:shuffle(ids,String(opt.seed||Date.now())),index:0,turn:0,stage:'card',support:false,completed:0,rounds:0};
}
function safe(s){
 if(!s||typeof s!=='object'||s.version!==1)return null;
 const mode=cleanMode(s.mode),category=cleanCategory(s.category);
 const allowed=D.topics.filter(t=>category==='all'||t.category===category).map(t=>t.id);
 if(!Array.isArray(s.deck)||s.deck.length!==allowed.length||new Set(s.deck).size!==allowed.length||!s.deck.every(x=>allowed.includes(x)))return null;
 const index=Number(s.index),turn=Number(s.turn);
 if(!Number.isInteger(index)||index<0||index>=s.deck.length||!Number.isInteger(turn)||turn<0||turn>=participants(mode))return null;
 return {version:1,mode,category,interest:cleanInterest(s.interest),deck:s.deck.slice(),index,turn,stage:['card','reflect','review'].includes(s.stage)?s.stage:'card',support:s.support===true,completed:Math.min(1000,Math.max(0,Math.trunc(s.completed||0))),rounds:Math.min(1000,Math.max(0,Math.trunc(s.rounds||0)))};
}
function card(s){const valid=safe(s);if(!valid)return null;return D.topics.find(t=>t.id===valid.deck[valid.index])||null;}
function follow(s){const a=card(s);if(!a)return null;return a.follow;}
function advance(s){
 const a=safe(s);if(!a)return null;
 if(a.stage==='card'){a.stage='reflect';return a;}
 if(a.stage==='reflect'){
  a.completed++;
  if(a.turn+1<participants(a.mode)){a.turn++;a.stage='card';return a;}
  a.stage='review';a.rounds++;return a;
 }
 a.index=(a.index+1)%a.deck.length;a.turn=0;a.stage='card';a.support=false;return a;
}
function skip(s){const a=safe(s);if(!a)return null;a.index=(a.index+1)%a.deck.length;a.turn=0;a.stage='card';a.support=false;return a;}
function insights(ids){
 const checked=new Set(Array.isArray(ids)?ids:[]);
 const strengths=D.checks.filter(x=>checked.has(x.id)).map(x=>x.id);
 const missing=D.checks.filter(x=>!checked.has(x.id));
 const next=missing[0]||D.checks[3];
 return {count:strengths.length,total:D.checks.length,next:next.id,nextTip:next.help,message:strengths.length>=5?'Good variety. Try a fresh card without the hints.':strengths.length>=3?'A solid practice turn. Choose one thing to improve.':'Keep it simple: one opinion, one reason, one example, and a question.'};
}
function load(store){try{return safe(JSON.parse(store.getItem(KEY)||'null'))}catch{return null;}}
function save(store,state){const s=safe(state);if(!s)return false;try{store.setItem(KEY,JSON.stringify(s));return true}catch{return false}}
function clear(store){try{store.removeItem(KEY);return true}catch{return false}}
return Object.freeze({KEY,MODES,INTEREST,TOPICS,shuffle,make,safe,card,follow,advance,skip,insights,load,save,clear,participants});
});
