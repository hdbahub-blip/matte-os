'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const MODEL=require('../foralder/model.js');
const script=fs.readFileSync('study/cloud.js','utf8');
const user='55550000-0000-4000-8000-000000000002';
let n=0;
function store(seed={}){
 const map=new Map(Object.entries(seed));
 return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>{map.set(k,String(v));},removeItem:k=>map.delete(k)};
}
function harness(local,opts={}){
 const sent={events:[],snapshots:[]};
 const p={user_id:user,role:opts.role||'learner',grade:opts.grade||'grade8'};
 let session={user:{id:user}};
 const remote=opts.remote||[];
 const api={
  auth:{
   async getSession(){return {data:{session}};},
   onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};},
   async signOut(){session=null;return {error:null};}
  },
  from(table){
   const q={
    select(){return q},eq(){return q},order(){return q},
    async maybeSingle(){return {data:table==='study_profiles'?p:null,error:null}},
    async limit(){return {data:remote,error:null}},
    async upsert(payload){sent[table==='study_events'?'events':'snapshots'].push(payload);return {error:null}}
   };
   return q;
  }
 };
 const ctx={
  console,TextEncoder,Uint8Array,Date,Math,JSON,Map,Set,URL,crypto:crypto.webcrypto,
  localStorage:local,navigator:{onLine:opts.online!==false},
  location:{pathname:'/matte-os/',origin:'https://example.test'},
  supabase:{createClient(){return api;}},MO_PARENT_MODEL:MODEL,
  setTimeout(){return 1},clearTimeout(){},
  dispatchEvent(){},CustomEvent:function(){},
 };
 ctx.globalThis=ctx;
 vm.runInNewContext(script,ctx,{filename:'study/cloud.js',timeout:1000});
 return {S:ctx.MO_STUDY,sent,local,ctx};
}
async function test(){
 let local=store({
 'matteos.v5':JSON.stringify({v:5,active:'grade8',profiles:{
  grade8:{name:'Elev',attempts:[{s:'f8-fractions',x:'A',t:1762820000000,first:true,ok:true}],lessons:{},tests:[],tables:{facts:{},sessions:[]}},
  grade9:{name:'Privat syster',attempts:[{s:'s9-geometry',x:'B',t:1762820000000,ok:true}]}}}),
 'matteos.sprak.v3':JSON.stringify({v:3,profiles:{grade8:{tasks:{},texts:{}},grade9:{tasks:{},texts:{}}}})
 });
 const {S,sent}=harness(local);
 await S.init();assert.equal(S.profile().grade,'grade8');n++;
 assert.equal(S.capture({grade:'grade9',module:'reading',question_id:'blocked',answer:'Other pupil'}),false);n++;
 assert.equal(S.capture({grade:'grade8',module:'reading',question_id:'sv:buss:q1',
   answer:'Min text',question_text:'Vad hände?',passage_title:'Bussen 07.42',passage_text:'En liten text',solution_text:'Svar'}),true);n++;
 assert.equal(S.capture({grade:'grade8',module:'invalid',question_id:'id',answer:'x'}),false);n++;
 let events=JSON.parse(local.getItem('matteos.study.outbox.v1')).events;
 assert.equal(events.length,1);assert.equal(events[0].answer.value,'Min text');n++;
 await S.flush();
 assert.equal(sent.events.length,1);assert.equal(JSON.parse(local.getItem('matteos.study.outbox.v1')).events.length,0);n++;
 assert.equal(sent.snapshots.some(x=>x.module==='math'),true);n++;
 const snap=sent.snapshots.find(x=>x.module==='math');
 assert.equal(snap.grade,'grade8');assert.equal(snap.payload.backup.attempts[0].x,'A');n++;
 assert.ok(!JSON.stringify(snap.payload).includes('Privat syster'));n++;
 assert.equal(snap.payload.attempts[0].x,undefined);n++;
 const m=S.mergeProfile('memory',{}, {records:{'k1':{t0:{at:1762820000000,ok:true}}}});
 assert.equal(m.k1.t0.ok,true);assert.equal(m.records,undefined);n++;
 const copy=JSON.parse(local.getItem('matteos.v5'));
 const cloudBackup={attempts:[{s:'f8-fractions',x:'C',t:1762821000000,first:false,ok:false}],
 lessons:{},tables:{facts:{},sessions:[]},name:'Elev'};
 const recovered=harness(local,{remote:[{grade:'grade8',module:'math',payload:{backup:cloudBackup}}]});
 await recovered.S.init();
 await recovered.S.flush();
 const out=await recovered.S.recover();
 assert.ok(out.parts.includes('math'));n++;
 const newer=JSON.parse(local.getItem('matteos.v5'));
 assert.deepEqual(newer.profiles.grade9,copy.profiles.grade9);n++;
 assert.equal(newer.profiles.grade8.attempts.some(x=>x.x==='C'),true);n++;
 assert.ok([...local.map.keys()].some(k=>k.startsWith('matteos.study.pre-restore.')));n++;
 const offline=harness(store(),{online:false});
 await offline.S.init();
 offline.S.capture({grade:'grade8',module:'learning',question_id:'written',answer:'Offline'});
 await offline.S.flush();
 assert.equal(offline.sent.events.length,0);n++;
 assert.equal(JSON.parse(offline.local.getItem('matteos.study.outbox.v1')).events.length,1);n++;
 console.log('STUDY CLOUD QA PASS '+n+'/'+n+' (role-bound capture, exact private response, offline queue, snapshot, isolate sibling, recovery and rollback checkpoint)');
}
test().catch(e=>{console.error(e);process.exit(1)});
