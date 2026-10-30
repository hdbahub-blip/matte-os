/* Matte OS Cup – säkerhets- och faktatester mot riktig Postgres. Kör: node tests/cup-security.js (kräver PGHOST/PGPORT/PGDATABASE eller standard dev-miljö) */
'use strict';
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.PGHOST || '/tmp/pgdata', port: +(process.env.PGPORT || 5544), user: 'postgres', database: process.env.PGDATABASE || 'cuptest', max: 10 });
let pass = 0, fail = 0; const bad = [];
const ok = (c, m) => { if (c) pass++; else { fail++; bad.push('✗ ' + m); } };
async function asAnon(sql, vals) {
  const c = await pool.connect();
  try { await c.query('begin'); await c.query('set local role anon'); const r = await c.query(sql, vals); await c.query('commit'); return { rows: r.rows }; }
  catch (e) { await c.query('rollback').catch(() => {}); return { err: e }; } finally { c.release(); }
}
const rpc = async (fn, args) => { const keys = Object.keys(args); const r = await asAnon(`select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(',')}) r`, keys.map(k => Array.isArray(args[k]) ? '{' + args[k].join(',') + '}' : args[k])); if (r.err) { r.err.msg = r.err.message; throw r.err; } const v = r.rows[0].r; if (v && typeof v.error === 'string') throw new Error(v.error); return v; };
const fails = async (p, re, m) => { try { await p; ok(false, m + ' (inget fel)'); } catch (e) { ok(re.test(e.message), m + ' → ' + e.message); } };

(async () => {
  // 1) anon har ingen direktåtkomst till spelets tabeller
  for (const t of ['rooms', 'players', 'rounds', 'round_players', 'questions', 'answers']) {
    const r = await asAnon(`select * from cup.${t} limit 1`);
    ok(r.err && /permission denied/.test(r.err.message), `anon nekas SELECT på cup.${t}`);
    const w = await asAnon(`delete from cup.${t}`);
    ok(w.err && /permission denied/.test(w.err.message), `anon nekas DELETE på cup.${t}`);
  }
  const ins = await asAnon(`insert into cup.answers(round_id,player_id,idx,val,correct) values (gen_random_uuid(),gen_random_uuid(),0,1,true)`);
  ok(ins.err && /permission denied/.test(ins.err.message), 'anon kan inte skriva falska poäng direkt');
  const inter = await asAnon(`select cup.hash('x')`);
  ok(inter.err && /permission denied/.test(inter.err.message), 'anon kan inte anropa interna cup.*-funktioner');
  const pubTabs = await pool.query(`select count(*)::int n from information_schema.tables where table_schema='public'`);
  ok(pubTabs.rows[0].n === 0, 'inga tabeller i public (inget exponerat via REST)');
  const rls = await pool.query(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='cup' and c.relkind='r' and not c.relrowsecurity`);
  ok(rls.rows.length === 0, 'RLS påslaget på alla cup-tabeller');
  const defs = await pool.query(`select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like 'cup\\_%' and not (prosecdef and proconfig @> array['search_path=""'])`);
  ok(defs.rows.length === 0, 'alla publika cup-RPC är SECURITY DEFINER med tomt search_path ' + JSON.stringify(defs.rows));
  const pubExec = await pool.query(`select has_function_privilege('public', p.oid, 'execute') x from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like 'cup\\_%' limit 1`);
  ok(pubExec.rows[0].x === false, 'PUBLIC har inte execute (bara anon/authenticated)');
  // 2) hemligheter lagras inte i klartext
  const room = await rpc('cup_create', { p_tables: [7], p_qual_q: 10, p_sec_per_q: 20 });
  const raw = await pool.query(`select host_hash from cup.rooms where code=$1`, [room.code]);
  ok(raw.rows[0].host_hash !== room.host_secret && raw.rows[0].host_hash.length === 64, 'värdhemlighet lagras som hash');
  const a = await rpc('cup_join', { p_code: room.code, p_nick: 'A', p_device: 'dev-aaaaaaaa' });
  const b = await rpc('cup_join', { p_code: room.code, p_nick: 'B', p_device: 'dev-bbbbbbbb' });
  const rawp = await pool.query(`select secret_hash from cup.players where id=$1`, [a.player_id]);
  ok(rawp.rows[0].secret_hash !== a.secret && rawp.rows[0].secret_hash.length === 64, 'spelarhemlighet lagras som hash');
  // 3) korsrumsåtkomst
  const room2 = await rpc('cup_create', { p_tables: [3], p_qual_q: 10, p_sec_per_q: 20 });
  await fails(rpc('cup_state', { p_code: room2.code, p_player: a.player_id, p_secret: a.secret, p_host_secret: null }), /BAD_PLAYER/, 'spelare från rum 1 läser inte rum 2');
  await fails(rpc('cup_start', { p_code: room2.code, p_host_secret: room.host_secret }), /NOT_HOST/, 'värdhemlighet från rum 1 startar inte rum 2');
  await fails(rpc('cup_kick', { p_code: room.code, p_host_secret: a.secret, p_player: b.player_id }), /NOT_HOST/, 'spelare kan inte kicka med spelarhemlighet');
  // 4) SQL-injektion i alla textparametrar
  await fails(rpc('cup_join', { p_code: "X'; drop table cup.rooms;--", p_nick: 'x', p_device: 'dev-cccccccc' }), /NO_ROOM/, 'SQL-injektion i rumskod görs ofarlig');
  await fails(rpc('cup_join', { p_code: room.code, p_nick: "x'); drop table cup.rooms;--", p_device: 'dev-dddddddd' }), /BAD_NICK/, 'SQL-injektion i smeknamn nekas');
  for (const bad of ['<img src=x onerror=alert(1)>', 'a"b', "a'b", 'a&b', '‮rtl', 'a/b', 'a;b', 'a`b']) await fails(rpc('cup_join', { p_code: room.code, p_nick: bad, p_device: 'dev-eeeeeeee' }), /BAD_NICK/, 'smeknamn nekas: ' + JSON.stringify(bad));
  const ws = await rpc('cup_join', { p_code: room.code, p_nick: 'a\n\t b', p_device: 'dev-wsxxxxxx' });
  ok(ws.nick === 'a b', 'blanksteg normaliseras till ett mellanslag');
  const okNick = await rpc('cup_join', { p_code: room.code, p_nick: 'Åsa-Öberg.1', p_device: 'dev-ffffffff' });
  ok(okNick.nick === 'Åsa-Öberg.1', 'svenska tecken tillåts i smeknamn');
  ok((await pool.query('select count(*)::int n from cup.rooms')).rows[0].n >= 2, 'tabellerna finns kvar efter injektionsförsök');
  // 5) host/spelare-kontroller: för stora tal, negativa
  await rpc('cup_start', { p_code: room.code, p_host_secret: room.host_secret });
  const rd = (await pool.query(`select id from cup.rounds where room_id=(select id from cup.rooms where code=$1)`, [room.code])).rows[0].id;
  await pool.query(`update cup.rounds set starts_at=now()-interval '1 second' where id=$1`, [rd]);
  await fails(rpc('cup_answer', { p_code: room.code, p_player: a.player_id, p_secret: a.secret, p_round: rd, p_idx: 0, p_val: -5 }), /BAD_VALUE/, 'negativt svar nekas');
  await fails(rpc('cup_answer', { p_code: room.code, p_player: a.player_id, p_secret: a.secret, p_round: rd, p_idx: 0, p_val: 99999 }), /BAD_VALUE/, 'orimligt stort svar nekas');
  // replay: skicka samma korrekta svar två gånger → en rad
  const q0 = (await pool.query(`select ans from cup.questions where round_id=$1 and idx=0`, [rd])).rows[0].ans;
  await rpc('cup_answer', { p_code: room.code, p_player: a.player_id, p_secret: a.secret, p_round: rd, p_idx: 0, p_val: q0 });
  await rpc('cup_answer', { p_code: room.code, p_player: a.player_id, p_secret: a.secret, p_round: rd, p_idx: 0, p_val: q0 });
  ok((await pool.query(`select count(*)::int n from cup.answers where round_id=$1 and player_id=$2`, [rd, a.player_id])).rows[0].n === 1, 'replay ger exakt en svarsrad');
  // svar efter deadline
  await pool.query(`update cup.answers set at=now()-interval '3 seconds' where round_id=$1`, [rd]);
  await pool.query(`update cup.rounds set deadline=now()-interval '1 second' where id=$1`, [rd]);
  await fails(rpc('cup_answer', { p_code: room.code, p_player: b.player_id, p_secret: b.secret, p_round: rd, p_idx: 0, p_val: q0 }), /LATE/, 'svar efter deadline nekas');
  const sc = (await pool.query(`select * from cup.round_scores($1)`, [rd])).rows;
  ok(sc.find(x => x.player_id === a.player_id).correct === 1 && sc.find(x => x.player_id === b.player_id).correct === 0, 'poäng räknas bara för giltiga svar');
  // kicked kan inte läsa
  const room3 = await rpc('cup_create', { p_tables: [4], p_qual_q: 10, p_sec_per_q: 20 });
  const k = await rpc('cup_join', { p_code: room3.code, p_nick: 'K', p_device: 'dev-kkkkkkkk' });
  await rpc('cup_join', { p_code: room3.code, p_nick: 'L', p_device: 'dev-llllllll' });
  await rpc('cup_start', { p_code: room3.code, p_host_secret: room3.host_secret });
  await rpc('cup_kick', { p_code: room3.code, p_host_secret: room3.host_secret, p_player: k.player_id });
  await fails(rpc('cup_state', { p_code: room3.code, p_player: k.player_id, p_secret: k.secret, p_host_secret: null }), /KICKED/, 'borttagen spelare får ingen åtkomst');
  await fails(rpc('cup_join', { p_code: room3.code, p_nick: 'K', p_device: 'dev-kkkkkkkk' }), /KICKED/, 'borttagen spelare kan inte gå med igen från samma enhet');
  // 6) spelkapacitet
  const room4 = await rpc('cup_create', { p_tables: null, p_qual_q: 10, p_sec_per_q: 20 });
  for (let i = 0; i < 24; i++) await rpc('cup_join', { p_code: room4.code, p_nick: 'P' + i, p_device: 'dev-cap-' + String(i).padStart(4, '0') });
  await fails(rpc('cup_join', { p_code: room4.code, p_nick: 'Extra', p_device: 'dev-cap-9999' }), /FULL/, 'max 24 spelare');
  // 7) startvillkor
  const room5 = await rpc('cup_create', { p_tables: null, p_qual_q: 10, p_sec_per_q: 20 });
  await rpc('cup_join', { p_code: room5.code, p_nick: 'Ensam', p_device: 'dev-solo-0000' });
  await fails(rpc('cup_start', { p_code: room5.code, p_host_secret: room5.host_secret }), /TOO_FEW/, 'start kräver minst två spelare');
  // 8) alla 100 multiplikationsfakta: tabell t ger exakt t×1..t×10, facit = a*b
  const seen = new Set(); let wrongAns = 0, dup = 0;
  for (let t = 1; t <= 10; t++) {
    const r = await rpc('cup_create', { p_tables: [t], p_qual_q: 10, p_sec_per_q: 20 });
    await rpc('cup_join', { p_code: r.code, p_nick: 'a', p_device: 'dev-fact-a' + t + 'xxxx' });
    await rpc('cup_join', { p_code: r.code, p_nick: 'b', p_device: 'dev-fact-b' + t + 'xxxx' });
    await rpc('cup_start', { p_code: r.code, p_host_secret: r.host_secret });
    const qs = (await pool.query(`select q.a,q.b,q.ans from cup.questions q join cup.rounds d on d.id=q.round_id join cup.rooms o on o.id=d.room_id where o.code=$1 order by q.idx`, [r.code])).rows;
    const bs = new Set(qs.map(x => x.b));
    ok(qs.length === 10 && bs.size === 10 && qs.every(x => x.a === t), `tabell ${t}: exakt ${t}×1–${t}×10, alla unika`);
    for (const x of qs) { if (x.ans !== x.a * x.b) wrongAns++; seen.add(x.a + 'x' + x.b); }
    await pool.query('delete from cup.rooms where code=$1', [r.code]);
  }
  ok(seen.size === 100 && wrongAns === 0, `alla 100 fakta genererade (${seen.size}) med korrekt facit (fel: ${wrongAns})`);
  // blandad: 20-30 frågor utan dubletter av oordnade par så länge möjligt (≤55)
  const rm = await rpc('cup_create', { p_tables: null, p_qual_q: 30, p_sec_per_q: 20 });
  await rpc('cup_join', { p_code: rm.code, p_nick: 'a', p_device: 'dev-mix-aaaaa' }); await rpc('cup_join', { p_code: rm.code, p_nick: 'b', p_device: 'dev-mix-bbbbb' });
  await rpc('cup_start', { p_code: rm.code, p_host_secret: rm.host_secret });
  const mq = (await pool.query(`select q.a,q.b,q.ans from cup.questions q join cup.rounds d on d.id=q.round_id join cup.rooms o on o.id=d.room_id where o.code=$1`, [rm.code])).rows;
  const keys = mq.map(x => Math.min(x.a, x.b) + 'x' + Math.max(x.a, x.b));
  ok(mq.length === 30 && new Set(keys).size === 30 && mq.every(x => x.a >= 1 && x.a <= 10 && x.b >= 1 && x.b <= 10 && x.ans === x.a * x.b), 'blandad runda: 30 unika frågor, giltiga, rätt facit');
  // 9) utgångna rum städas
  await pool.query(`update cup.rooms set expires_at = now() - interval '1 minute' where code=$1`, [rm.code]);
  await fails(rpc('cup_state', { p_code: rm.code, p_host_secret: rm.host_secret }), /GONE/, 'utgånget rum nekas');
  await rpc('cup_create', { p_tables: [1], p_qual_q: 10, p_sec_per_q: 20 });
  ok((await pool.query(`select count(*)::int n from cup.rooms where code=$1`, [rm.code])).rows[0].n === 0, 'utgångna rum raderas vid nästa skapande');
  console.log(`cup-security: ${pass} PASS, ${fail} FAIL`);
  if (fail) { console.log(bad.join('\n')); process.exit(1); }
  await pool.end();
})().catch(e => { console.error('KRASCH', e); process.exit(2); });
