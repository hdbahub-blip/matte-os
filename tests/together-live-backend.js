/* Isolated Together Live SQL acceptance. Run against throwaway PostgreSQL only. */
'use strict';
const assert=require('node:assert/strict');
const {Pool}=require('pg');
const db=new Pool({host:process.env.PGHOST||'127.0.0.1',port:+(process.env.PGPORT||5432),
  user:process.env.PGUSER||'postgres',password:process.env.PGPASSWORD||'postgres',
  database:process.env.PGDATABASE||'togethertest'});
const people=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
const deck=[{key:'v1:1',topic:'sv',prompt:'Var går bussen?',options:['Hållplats A','Hållplats B','C'],correct:1,why:'Det står i texten.'},
  {key:'v1:2',topic:'sv',prompt:'När går den?',options:['07.42','08.42'],correct:0,why:'Läs klockslaget.'}];
const rpc=async(user,func,args=[],role='authenticated')=>{
 const c=await db.connect();
 try{
  await c.query('begin');
  await c.query('set local role '+role);
  if(user)await c.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
  const vals=args.map(a=>a===null?null:typeof a==='object'?JSON.stringify(a):a);
  const types={together_live_create:['text','jsonb','text'],together_live_join:['text','text'],
    together_live_state:['uuid'],together_live_start:['uuid'],together_live_answer:['uuid','integer','integer'],
    together_live_next:['uuid','integer'],together_live_leave:['uuid']};
  const placeholders=vals.map((_,i)=>'$'+(i+1)+'::'+types[func][i]);
  const out=await c.query('select public.'+func+'('+placeholders.join(',')+') as result',vals);
  await c.query('commit');
  const data=out.rows[0].result;
  if(data && typeof data==='object' && typeof data.error==='string')throw Error(data.error);
  return data;
 }catch(e){await c.query('rollback').catch(()=>{});throw e;}finally{c.release();}
};
const fail=async(call,msg)=>{await assert.rejects(call,undefined,msg);};
(async()=>{
 try{
  await db.query('insert into auth.users(id) select unnest($1::uuid[]) on conflict do nothing',[people]);
  await db.query('insert into public.study_profiles(user_id) select unnest($1::uuid[]) on conflict do nothing',[people]);
  const tables=await db.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='together_live' and c.relkind='r' and not c.relrowsecurity");
  assert.equal(tables.rows.length,0,'RLS on ALL private tables');
  const t=await db.connect();try{
   await t.query('begin');await t.query('set local role authenticated');
   await assert.rejects(t.query('select * from together_live.rooms'),'No raw table SELECT');
   await t.query('rollback');
  }finally{t.release();}
  await fail(rpc(null,'together_live_state',['00000000-0000-4000-8000-000000000000'],'anon'),'No anon RPC');
  await fail(rpc(people[0],'together_live_create',['sv:buss:v1',[{prompt:'x',options:['a'],correct:0}],'Host']),'Reject malformed deck');
  const created=await rpc(people[0],'together_live_create',['sv:buss:v1',deck,'Host']);
  assert.match(created.invite,/^[0-9a-f]{32}$/);
  assert.match(created.room_id,/^[0-9a-f-]{36}$/i);
  const room=created.room_id;
  const dbroom=await db.query('select join_hash,content_hash from together_live.rooms where id=$1',[room]);
  assert.equal(dbroom.rows[0].join_hash.length,64);
  assert.notEqual(dbroom.rows[0].join_hash,created.invite,'invite only stored hashed');
  assert.equal(dbroom.rows[0].content_hash.length,64);
  await fail(rpc(people[1],'together_live_join',['0'.repeat(32),'Guest']),'Incorrect code refused');
  const joined=await rpc(people[1],'together_live_join',[created.invite.toUpperCase(),'Joker Two']);
  assert.equal(joined.room_id,room);
  assert.equal((await rpc(people[1],'together_live_join',[created.invite,'Other'])) .room_id,room,'Idempotent join');
  await fail(rpc(people[2],'together_live_state',[room]),'Outsider state must fail');
  assert.equal(await rpc(people[1],'together_live_start',[room]),false,'Only host starts');
  assert.equal(await rpc(people[0],'together_live_start',[room]),true);
  const initial=await rpc(people[1],'together_live_state',[room]);
  assert.equal(initial.phase,'answering');assert.equal(initial.members.length,2);
  assert.equal(Object.prototype.hasOwnProperty.call(initial,'content_hash'),false,'No secret-answer deck hash exposed');
  assert.equal(initial.question.prompt,deck[0].prompt);
  assert.equal('correct' in initial.question,false,'Correct index hidden before all answers');
  assert.equal('why' in initial.question,false,'Hint/explanation hidden before all answers');
  assert.deepEqual(initial.answers,[]);
  assert.equal(await rpc(people[2],'together_live_answer',[room,0,1]),false,'Outsider cannot answer');
  assert.equal(await rpc(people[0],'together_live_answer',[room,0,1]),true);
  const mid=await rpc(people[1],'together_live_state',[room]);
  assert.equal(mid.answer_count,1);assert.equal(mid.phase,'answering');
  assert.equal(mid.my_answered,false,'Other participant may see own status, never whom else answered');
  assert.equal((await rpc(people[0],'together_live_state',[room])).my_answered,true,
    'Own answered state survives rejoin without revealing any other choice');
  assert.deepEqual(mid.answers,[],'Private submissions not disclosed');
  assert.ok(mid.members.every(m=>m.score===0),'No correctness leaks through live scoreboard');
  assert.equal(await rpc(people[0],'together_live_answer',[room,0,1]),true,'Idempotent retry is safe');
  assert.equal(await rpc(people[0],'together_live_answer',[room,0,2]),false,'Changed choice forbidden');
  assert.equal(await rpc(people[1],'together_live_answer',[room,0,0]),true);
  const revealed=await rpc(people[0],'together_live_state',[room]);
  assert.equal(revealed.phase,'reveal');assert.equal(revealed.question.correct,1);
  assert.equal(revealed.answers.length,2);
  assert.equal(revealed.members.find(m=>m.id===people[0]).score,1);
  assert.equal(revealed.members.find(m=>m.id===people[1]).score,0);
  assert.equal(await rpc(people[1],'together_live_next',[room,0]),false,'Only owner can advance');
  assert.equal(await rpc(people[0],'together_live_next',[room,0]),true);
  assert.equal(await rpc(people[0],'together_live_next',[room,0]),false,'No double-advance');
  const second=await rpc(people[1],'together_live_state',[room]);
  assert.equal(second.round,1);assert.equal(second.phase,'answering');
  assert.equal('correct' in second.question,false);
  assert.equal(second.members.find(m=>m.id===people[0]).score,1);
  await fail(rpc(people[2],'together_live_join',[created.invite,'Late Guest']),'No late joins');
  assert.equal(await rpc(people[0],'together_live_answer',[room,0,0]),false,'Stale round denied');
  assert.equal(await rpc(people[0],'together_live_answer',[room,1,0]),true);
  assert.equal(await rpc(people[1],'together_live_answer',[room,1,1]),true);
  assert.equal((await rpc(people[0],'together_live_state',[room])).phase,'reveal');
  assert.equal(await rpc(people[0],'together_live_next',[room,1]),true);
  assert.equal((await rpc(people[0],'together_live_state',[room])).phase,'done');
  assert.equal(await rpc(people[1],'together_live_leave',[room]),true);
  await fail(rpc(people[1],'together_live_state',[room]),'Revoked participant cannot read state');
  assert.equal(await rpc(people[0],'together_live_leave',[room]),true);
  await fail(rpc(people[0],'together_live_state',[room]),'Host close cascades all room data');
  assert.equal((await db.query('select count(*)::int n from together_live.answers where room_id=$1',[room])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from together_live.members where room_id=$1',[room])).rows[0].n,0);
  const expired=await rpc(people[2],'together_live_create',['sv:buss:v1',deck,'Expired']);
  await db.query("update together_live.rooms set expires_at=now()-interval '1 minute' where id=$1",[expired.room_id]);
  await fail(rpc(people[2],'together_live_state',[expired.room_id]),'Expired room denied');
  const purged=(await db.query('select together_live.prune_expired() as n')).rows[0].n;
  assert.ok(purged>=1,'Expired rooms are physically purged by private cleanup function');
  assert.equal((await db.query('select count(*)::int n from together_live.rooms where id=$1',[expired.room_id])).rows[0].n,0);
  const c2=await db.connect();try{
    await c2.query('begin');await c2.query('set local role authenticated');
    await assert.rejects(c2.query('select together_live.prune_expired()'),'Only system may run cleanup');
    await c2.query('rollback');
  }finally{c2.release();}
  const throttleBefore=(await db.query("select attempts from together_live.throttle where user_id=$1 and action='join'",[people[1]])).rows[0].attempts;
  assert.equal(throttleBefore,3,'Failed plus successful joins counted');
  for(let n=throttleBefore;n<15;n++){
    await assert.rejects(rpc(people[1],'together_live_join',['f'.repeat(32),'No Access']),/INVALID_INVITE/);
  }
  assert.equal((await db.query("select attempts from together_live.throttle where user_id=$1 and action='join'",[people[1]])).rows[0].attempts,15,
    'Rejected invites MUST increment durable throttle row');
  await assert.rejects(rpc(people[1],'together_live_join',['f'.repeat(32),'No Access']),/RATE_LIMIT/,
    '16th join attempt denied by actual database limiter');
  console.log('Together Live Postgres: RLS/private schema, auth, 2 devices, invites, hidden answers/scores/hash, no replay, expiry, delete, durable brute-force limiter PASS');
 }finally{await db.end();}
})().catch(e=>{console.error(e);process.exit(1)});
