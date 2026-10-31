/* Quickmatch compatibility and security acceptance; disposable CI Postgres only. */
'use strict';
const assert = require('node:assert/strict');
const {Pool} = require('pg');
const client = require('../js/cup-api.js').client({url:process.argv[2]||'http://127.0.0.1:8787',anonKey:'test'});
const pool = new Pool();
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function state(code,id,secret,hostSecret){
  for(let i=0;i<10;i++){
    try{return await client.state(code,id||null,secret||null,hostSecret||null);}
    catch(e){if(e.code!=='RATE')throw e;await sleep(150);}
  }
  throw Error('state rate exceeded');
}
(async()=>{
  let tests=0;
  await assert.rejects(()=>client.createQuick([7],7,3,15),e=>e.code==='BAD_SETTINGS');tests++;
  await assert.rejects(()=>client.createQuick([],5,1,15),e=>e.code==='BAD_SETTINGS');tests++;
  const legacy = await client.create([7],10,15);
  assert.equal((await state(legacy.code,null,null,legacy.host_secret)).mode,'cup');tests++;
  await client.cancel(legacy.code,legacy.host_secret);
  const codeInfo=await client.createQuick([7,8],5,3,15);
  const code=codeInfo.code,hs=codeInfo.host_secret;
  const players=[];
  for(let i=0;i<2;i++){
    const x=await client.join(code,'Quick'+i,'devicequick'+i);
    players.push({id:x.player_id,secret:x.secret,nick:x.nick});
    await client.ready(code,x.player_id,x.secret,true);
  }
  let st=await state(code,null,null,hs);
  assert.equal(st.mode,'quick');assert.equal(st.quick_q,5);assert.equal(st.quick_rounds,3);tests+=3;
  assert.deepEqual(st.tables,[7,8]);tests++;
  await client.start(code,hs);
  await assert.rejects(()=>client.next(code,hs),e=>e.code==='BAD_STATE');tests++;
  await assert.rejects(()=>client.next(code,'not-the-secret'),e=>e.code==='NOT_HOST');tests++;
  const completed=[];
  for(let round=1;round<=3;round++){
    // CI only: skip 6-second countdown without changing public API or production data.
    const roomRow=await pool.query('select id from cup.rooms where code=$1',[code]);
    const roomId=roomRow.rows[0].id;
    await pool.query("update cup.rounds set starts_at=now()-interval '2 seconds' where room_id=$1 and status='active'",[roomId]);
    st=await state(code,null,null,hs);
    assert.equal(st.round.no,round);assert.equal(st.round.n_q,5);tests+=2;
    const questionList=(await pool.query('select a,b from cup.questions where round_id=$1 order by idx',[st.round.id])).rows;
    assert.equal(questionList.length,5);tests++;
    assert(questionList.every(q=>[7,8].includes(q.a)||[7,8].includes(q.b)));tests++;
    // Both receive the identical questions. First participant gets all correct; second gets one.
    for(let pi=0;pi<players.length;pi++){
      const p=players[pi];
      for(let qi=0;qi<questionList.length;qi++){
        await sleep(145);
        const s=await state(code,p.id,p.secret);
        assert.equal(s.round.question.idx,qi);tests++;
        const q=s.round.question;
        const expected=questionList[qi];
        assert.equal(q.a,expected.a);assert.equal(q.b,expected.b);tests+=2;
        await client.answer(code,p.id,p.secret,s.round.id,qi,(pi===0||qi===0)?q.a*q.b:q.a*q.b+1);
      }
    }
    await client.endRound(code,hs);
    st=await state(code,null,null,hs);
    assert.equal(st.status,'SCORED');tests++;
    assert.equal(st.results.round.length,2);tests++;
    const result=await client.next(code,hs);
    completed.push(result.next);
    st=await state(code,null,null,hs);
    if(round<3){assert.equal(st.status,'ACTIVE');assert.equal(st.round.no,round+1);tests+=2;}
    else{
      assert.equal(st.status,'COMPLETE');tests++;
      assert.equal(result.next,'done');tests++;
      const scores=st.bracket.quick_scores;
      assert.deepEqual(scores.map(s=>s.correct),[15,3]);tests++;
      assert.equal(st.bracket.quick_draw,false);tests++;
      assert.equal(scores[0].nick,'Quick0');tests++;
      await assert.rejects(()=>client.next(code,hs),e=>e.code==='BAD_STATE');tests++;
    }
  }
  assert.deepEqual(completed,['quick','quick','done']);tests++;
  console.log('CUP QUICKMATCH REGRESSION '+tests+'/'+tests+' PASS: setup, multi-tables, 3x5, score, anti-replay, auth and legacy coexistence');
})().catch(e=>{console.error('CUP QUICKMATCH FAILED',e);process.exitCode=1}).finally(async()=>{await pool.end()});
