'use strict';
/* Grade-separated vocabulary & mistake retention, content breadth and palette audit. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const SV=require('../lara/texts-sv.js'),EN=require('../lara/texts-en.js'),W=require('../lara/sprak.js'),O=require('../lara/ordlek.js');
const X=O._test;let n=0;const ok=(pass,msg)=>{n++;assert(pass,msg)};
ok(SV.length===8&&EN.length===8,'8 original texts per language after expansion');
ok(W._test.BANK.length===16,'workshop loads all 16 books');
ok(W._test.BANK.reduce((a,t)=>a+t.tasks.length,0)===143,'143 reading tasks');
ok(X.WORDS.length===32,'16 distinct vocabulary words per language');
const ids=new Set(),pos=[0,0,0];
for(const w of X.WORDS){
 ok(['sv','en'].includes(w.lang)&&w.word&&w.meaning&&w.sentence,'valid word '+w.word);
 ok(!ids.has(w.lang+':'+w.word),'unique word '+w.word);ids.add(w.lang+':'+w.word);
 ok(w.sentence.toLocaleLowerCase().includes(w.word.toLocaleLowerCase()),'fill-in-the-gap can remove the exact word '+w.word);
 for(const kind of ['meaning','sentence']){
  const {items,correct}=X.options(w,kind);
  ok(items.length===3&&new Set(items).size===3,'three real choices for '+w.word+kind);
  ok(items[correct]===(kind==='meaning'?w.meaning:w.word),'correct option '+w.word+kind);
  ok(correct===X.options(w,kind).correct,'repeatable shuffle '+w.word+kind);
  pos[correct]++;
 }
}
ok(Math.max(...pos)/64<=0.42,'no single option position can be gamed: '+pos);
const empty=X.startData(),grade9='grade9',grade8='grade8',word=X.WORDS[0];
X.set(empty);const item={w:word,kind:'meaning',key:word.lang+':'+word.word+':meaning'};
X.remember(item,false);
let curr=X.get();
ok(curr.profiles.grade9.attempts[item.key].wrong===1,'wrong response retained');
ok(curr.profiles.grade9.attempts[item.key].first===false,'first attempt stays wrong');
ok(!curr.profiles.grade8.attempts[item.key],'grade 8 does not inherit grade 9 work');
ok(X.pending('sv',grade9).includes(item.key),'wrong task available for retry');
X.remember(item,true);curr=X.get();
ok(curr.profiles.grade9.attempts[item.key].wrong===1,'wrong history remains after a correct retry');
ok(curr.profiles.grade9.attempts[item.key].last===true,'latest answer recorded');
ok(!X.pending('sv',grade9).includes(item.key),'correct retry removes it from outstanding review');
ok(X.sanitized(curr).profiles.grade9.attempts[item.key].wrong===1,'backup round trip retains wrong count');
ok(X.sanitized(curr).profiles.grade8.attempts[item.key]===undefined,'backup does not cross profile');
const now=Date.now(),dirty=W._test.sanitize({v:3,profiles:{grade8:{tasks:{'sv:buss:t1':{at:now,mode:'solo',ok:false,help:false,n:2,wrong:2,lastOk:false,lastAt:now}},texts:{}},grade9:{tasks:{},texts:{}}}});
ok(dirty.profiles.grade8.tasks['sv:buss:t1'].wrong===2,'workshop error count survives sanitation');
ok(dirty.profiles.grade9.tasks['sv:buss:t1']===undefined,'workshop error count isolated');
const source=fs.readFileSync(path.join(__dirname,'../lara/ordlek.js'),'utf8');
ok(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon/.test(source),'no network transfer of learners answers');
ok(!/setItem\s*\([^,]+\s*,\s*(?:ui\.open|\.typed)/.test(source),'no raw writing stored');
const app=fs.readFileSync(path.join(__dirname,'../lara/app.js'),'utf8');
ok(app.includes('ordlek:window.MO_ORDLEK?.exportData?.()'),'word progress included in backup');
const css=fs.readFileSync(path.join(__dirname,'../lara/style.css'),'utf8');
const mathCss=fs.readFileSync(path.join(__dirname,'../css/app.css'),'utf8');
ok(css.includes('html[data-mode="dark"][data-profile="grade8"]'),'grade8 night palette');
ok(mathCss.includes('html[data-mode="dark"][data-theme="navy"]'),'grade8 maths night palette');
const light=(c)=>{c=c.replace('#','');const x=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));return x[0]*0.2126+x[1]*0.7152+x[2]*0.0722};
const contrast=(a,b)=>(Math.max(light(a),light(b))+0.05)/(Math.min(light(a),light(b))+0.05);
ok(contrast('#f3f5f7','#101820')>=7,'night text contrast AAA');
ok(contrast('#b7d6ff','#101820')>=7,'grade 8 night accent contrast');
ok(contrast('#f4bdd0','#101820')>=7,'grade 9 night accent contrast');
console.log('Ordlek + mistakes + colours: '+n+' PASS; answer distribution '+pos.join('/'));
