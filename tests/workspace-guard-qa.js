'use strict';
// Independent deterministic security acceptance: two accounts of same grade + legacy storage.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const code=fs.readFileSync('study/cloud.js','utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const map=new Map();
const local={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
let checks=0;
const ok=(condition,msg)=>{assert(condition,msg);checks++};
function client(user){
 let session={user:{id:user}},sent=[];
 const profile={user_id:user,role:'learner',grade:'grade8'};
 const db={
  auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
   async getSession(){return {data:{session}}},async signOut(){session=null;return {error:null}}},
  from(table){
   return {select(){return this},eq(){return this},
    async maybeSingle(){return {data:table==='study_profiles'?profile:null,error:null}},
    async upsert(data){sent.push({table,data});return {error:null}}};
  }
 };
 const root={console,crypto:crypto.webcrypto,TextEncoder,Uint8Array,JSON,Date,Map,Set,
  location:{pathname:'/matte-os/',origin:'https://example.test'},
  localStorage:local,navigator:{onLine:true},supabase:{createClient(){return db}},
  setTimeout(){return 1},clearTimeout(){},dispatchEvent(){},addEventListener(){},CustomEvent:function(){}};
 root.globalThis=root;
 vm.runInNewContext(code,root,{filename:'study/cloud.js',timeout:1000});
 return {S:root.MO_STUDY,sent};
}
(async()=>{
 const legacy=JSON.stringify({v:5,profiles:{grade8:{attempts:[{s:'old-a',ok:true}]},grade9:{}}});
 local.setItem('matteos.v5',legacy);
 const a=client(A);await a.S.init();
 ok(local.getItem('matteos.v5')===null,'unknown legacy content quarantined rather than inherited');
 ok([...map.keys()].some(k=>k.startsWith('matteos.study.legacy-unclaimed.v1.')),'reversible legacy checkpoint exists');
 ok(local.getItem('matteos.study.workspace-owner.v1')===A,'A owns empty workspace');
 ok(a.S.capture({grade:'grade9',module:'math',question_id:'illegal',answer:'x'})===false,'wrong grade denied');
 ok(a.S.capture({grade:'grade8',module:'math',question_id:'a:1',answer:'A answer'})===true,'A event accepted');
 await a.S.flush();
 ok(a.sent.some(x=>x.table==='study_events'&&x.data[0].learner_id===A),'only A uploaded under A');
 await a.S.signOut();
 ok(local.getItem('matteos.study.workspace-owner.v1')===null,'no owner after sign-out');
 ok(local.getItem('matteos.v5')===null,'no inherited study data after sign-out');
 const b=client(B);await b.S.init();
 ok(local.getItem('matteos.study.workspace-owner.v1')===B,'B starts independent workspace');
 ok(local.getItem('matteos.v5')===null,'B never receives A legacy state');
 ok(b.S.capture({grade:'grade8',module:'math',question_id:'b:1',answer:'B answer'})===true,'B event accepted');
 await b.S.flush();
 ok(b.sent.some(x=>x.table==='study_events'&&x.data[0].learner_id===B),'B event owner bound');
 ok(!b.sent.some(x=>JSON.stringify(x).includes('A answer')),'B did not upload A answer');
 local.setItem('matteos.study.workspace-owner.v1',A);
 ok(b.S.capture({grade:'grade8',module:'math',question_id:'b:2',answer:'fail'})===false,'owner mismatch denies capture');
 ok(b.S.canWriteLocal()===false,'owner mismatch blocks local module writes as well as cloud');
 console.log('WORKSPACE GUARD QA '+checks+'/'+checks+' PASS');
})().catch(e=>{console.error(e);process.exit(1)});
