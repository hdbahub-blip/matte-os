/* Matte OS Cup – (1) tävlingsintegritet: ingen korrekthet/facit före rundans slut, varken via cup_answer eller cup_state;
   (2) missbruk: ogiltiga indata, felaktiga uppgifter och samtidiga anrop räknas trots fel/rollback; IP-hantering och gallring.
   Kör: node tests/cup-integrity-abuse.js (PG*-variabler som övriga backendtester). */
'use strict';
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.PGHOST || '/tmp/pgdata', port: +(process.env.PGPORT || 5544), user: process.env.PGUSER || 'postgres', database: process.env.PGDATABASE || 'cuptest', max: 30 });
let pass = 0, fail = 0; const bad = []; const ok = (c, m) => { if (c) pass++; else { fail++; bad.push('✗ ' + m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function call(fn, args, headers) {
  const k = Object.keys(args); const c = await pool.connect();
  try { await c.query('begin'); await c.query('set local role anon'); if (headers) await c.query(`select set_config('request.headers', $1, true)`, [JSON.stringify(headers)]);
    const r = await c.query(`select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(',')}) r`, k.map(x => Array.isArray(args[x]) ? '{' + args[x].join(',') + '}' : args[x])); await c.query('commit'); return r.rows[0].r;
  } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); }
}
const rpc = async (fn, args, h) => { const v = await call(fn, args, h); if (v && typeof v.error === 'string') throw new Error(v.error); return v; };
const settle = ps => Promise.all(ps.map(p => p.then(v => ({ v }), e => ({ e: e.message }))));
const fails = async (p, re, m) => { try { await p; ok(false, m + ' (inget fel)'); } catch (e) { ok(re.test(e.message), m + ' → ' + e.message); } };
const reset = () => pool.query('delete from cup.rooms; delete from cup.rate');
const IP = ip => ({ 'cf-connecting-ip': ip });
const mkRoom = async (n, tag, h) => { const room = await rpc('cup_create', { p_tables: [7], p_qual_q: 10, p_sec_per_q: 20 }, h); const ps = []; for (let i = 0; i < n; i++) ps.push(await rpc('cup_join', { p_code: room.code, p_nick: 'P' + i, p_device: `dev-${tag}-${String(i).padStart(4, '0')}` }, h && { 'cf-connecting-ip': '172.16.' + tag.length + '.' + i })); return { room, ps }; };

(async () => {
  // ===================== 1. TÄVLINGSINTEGRITET =====================
  await reset();
  const { room, ps } = await mkRoom(3, 'integ');
  await rpc('cup_start', { p_code: room.code, p_host_secret: room.host_secret });
  const rid = (await pool.query(`select d.id from cup.rounds d join cup.rooms r on r.id=d.room_id where r.code=$1`, [room.code])).rows[0].id;
  await pool.query(`update cup.rounds set starts_at = now() - interval '1 second' where id=$1`, [rid]);
  const qs = (await pool.query(`select idx,a,b,ans from cup.questions where round_id=$1 order by idx`, [rid])).rows;
  const st = (p) => rpc('cup_state', { p_code: room.code, p_player: p.player_id, p_secret: p.secret });
  const gap = () => sleep(120);
  const leak = o => { const bad = []; JSON.parse(JSON.stringify(o), function (k, v) { if (v !== null && ['correct', 'review', 'val', 'ok', 'results', 'standings', 'ans'].includes(k)) bad.push(k); return v; }); return bad; };
  // spelare 0 svarar rätt, spelare 1 fel, på samma fråga
  const right = await rpc('cup_answer', { p_code: room.code, p_player: ps[0].player_id, p_secret: ps[0].secret, p_round: rid, p_idx: 0, p_val: qs[0].ans });
  const wrong = await rpc('cup_answer', { p_code: room.code, p_player: ps[1].player_id, p_secret: ps[1].secret, p_round: rid, p_idx: 0, p_val: qs[0].ans + 1 });
  ok(JSON.stringify(Object.keys(right).sort()) === JSON.stringify(Object.keys(wrong).sort()), 'cup_answer: samma svarsform för rätt och fel (' + Object.keys(right) + ')');
  ok(JSON.stringify(right) === JSON.stringify(wrong), 'cup_answer: rätt och fel svar kan inte särskiljas (' + JSON.stringify(right) + ' vs ' + JSON.stringify(wrong) + ')');
  ok(!('correct' in right) && !('answer' in right) && !('ans' in right), 'cup_answer (rätt svar): varken correct, answer eller ans')
  ok(!('correct' in wrong) && !('answer' in wrong), 'cup_answer (fel svar): varken correct eller answer');
  const dup = await rpc('cup_answer', { p_code: room.code, p_player: ps[1].player_id, p_secret: ps[1].secret, p_round: rid, p_idx: 0, p_val: qs[0].ans });
  ok(dup.duplicate === true && !('correct' in dup) && !('answer' in dup), 'omsändning (duplicate): avslöjar inte tidigare korrekthet eller facit');
  await gap();
  const s0 = await st(ps[0]); await gap(); const s1 = await st(ps[1]);
  const strip = o => JSON.parse(JSON.stringify(o, (k, v) => ['now', 'ms_left', 'starts_in_ms', 'me', 'id', 'players', 'names'].includes(k) ? undefined : v));
  ok(JSON.stringify(strip(s0)) === JSON.stringify(strip(s1)), 'cup_state under aktiv runda: spelare som svarade rätt resp. fel får IDENTISK vy (utöver id)');
  for (const [n, s] of [['rätt', s0], ['fel', s1]]) {
    const t = JSON.stringify(s);
    ok(leak(s).length === 0 && s.results === null, `cup_state (${n}): ingen korrekthet, genomgång eller ställning (${leak(s)})`);
    ok(s.round.question && !('ans' in s.round.question) && !('a' in s.round.question && 'ans' in s.round.question), `cup_state (${n}): nästa fråga utan facit`);
    ok(s.round.question.idx === 1 && s.round.answered === 1, `cup_state (${n}): endast antal besvarade (${s.round.answered}) och nästa fråga`);
  }
  await gap(); const sh = await rpc('cup_state', { p_code: room.code, p_host_secret: room.host_secret }); ok(leak(sh).length === 0 && sh.results === null, 'cup_state (värd) under aktiv runda: inga poäng/facit (' + leak(sh) + ')');
  // sista frågan besvarad: spelaren är klar men rundan fortfarande aktiv → ändå ingen korrekthet
  for (let i = 1; i < 10; i++) await rpc('cup_answer', { p_code: room.code, p_player: ps[0].player_id, p_secret: ps[0].secret, p_round: rid, p_idx: i, p_val: qs[i].ans });
  await gap(); const done0 = await st(ps[0]);
  ok(done0.round.status === 'active' && done0.round.finished === 1 && !done0.round.question && leak(done0).length === 0 && done0.results === null, 'klar spelare medan andra spelar: inga facit/poäng');
  const lateErr = await Promise.resolve(rpc('cup_answer', { p_code: room.code, p_player: ps[2].player_id, p_secret: ps[2].secret, p_round: rid, p_idx: 4, p_val: 1 })).catch(e => e.message); ok(!lateErr.includes(String(qs[4].ans)) && /OUT_OF_ORDER/.test(lateErr), 'felmeddelanden innehåller inget facit (' + lateErr + ')');
  // efter rundans slut: genomgång finns
  await pool.query(`update cup.rounds set deadline = now() where id=$1`, [rid]); await gap();
  const fin = await st(ps[1]);
  ok(fin.round.status === 'done' && Array.isArray(fin.results.review) && fin.results.review[0].ans === qs[0].ans && fin.results.review[0].ok === false, 'efter rundans slut: genomgång med rätt/fel och facit visas');

  // ===================== 2. MISSBRUK =====================
  // 2a ogiltiga indata räknas trots fel (räknare rullas inte tillbaka)
  await reset(); const r1 = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, IP('198.51.100.1'));
  const A = IP('203.0.113.10'); let bn = 0, rl = null;
  for (let i = 0; i < 140; i++) { try { await rpc('cup_join', { p_code: r1.code, p_nick: '<bad>', p_device: 'dev-badnick-' + i }, A); } catch (e) { if (/BAD_NICK/.test(e.message)) bn++; else { rl = e.message; break; } } }
  ok(bn === 120 && /RATE/.test(rl || ''), `ogiltiga smeknamn: 120 fel räknas, sedan RATE (${bn}; ${rl})`);
  const rowFail = (await pool.query(`select n from cup.rate where bucket like 'fail:%' order by n desc limit 1`)).rows[0];
  ok(rowFail && rowFail.n >= 120, 'felräknaren ligger kvar i databasen trots att anropen avslutades med fel (n=' + (rowFail && rowFail.n) + ')');
  await fails(rpc('cup_join', { p_code: r1.code, p_nick: 'Giltig', p_device: 'dev-valid-0001' }, A), /RATE/, 'spärrad klient nekas även giltigt anrop under fönstret');
  const okOther = await rpc('cup_join', { p_code: r1.code, p_nick: 'Giltig', p_device: 'dev-valid-0002' }, IP('203.0.113.11')); ok(!!okOther.player_id, 'annan klient opåverkad');
  // 2b felaktiga uppgifter (state med fel hemlighet, fel värdhemlighet)
  await reset(); const r2 = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, IP('198.51.100.2')); const pj = await rpc('cup_join', { p_code: r2.code, p_nick: 'Riktig', p_device: 'dev-cred-00001' }, IP('198.51.100.3'));
  const B = IP('203.0.113.20'); let bp = 0, bl = null;
  for (let i = 0; i < 140; i++) { try { await rpc('cup_state', { p_code: r2.code, p_player: pj.player_id, p_secret: 'fel' + i }, B); } catch (e) { if (/BAD_PLAYER/.test(e.message)) bp++; else { bl = e.message; break; } } }
  ok(bp === 120 && /RATE/.test(bl || ''), `fel hemlighet: 120 försök räknas, sedan RATE (${bp}; ${bl})`);
  let hb = 0; const C = IP('203.0.113.21'); for (let i = 0; i < 130; i++) { try { await rpc('cup_next', { p_code: r2.code, p_host_secret: 'x' + i }, C); } catch (e) { if (/NOT_HOST/.test(e.message)) hb++; } }
  ok(hb === 120, 'fel värdhemlighet: stoppas efter 120 försök (' + hb + ')');
  await sleep(130); const good = await rpc('cup_state', { p_code: r2.code, p_player: pj.player_id, p_secret: pj.secret }, IP('203.0.113.22')); ok(good.me === pj.player_id, 'riktig spelare (annan IP) opåverkad av angriparens spärr');
  // 2c samtidiga anrop
  await reset();
  const cc = await settle(Array.from({ length: 40 }, () => call('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, IP('203.0.113.30'))));
  const created = cc.filter(x => x.v && x.v.code).length; ok(created === 6, `40 samtidiga skapa-anrop från en klient: exakt 6 lyckas (${created})`);
  ok((await pool.query(`select count(*)::int n from cup.rooms`)).rows[0].n === 6, 'exakt 6 rum finns i databasen');
  await reset(); const r3 = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 });
  const jj = await settle(Array.from({ length: 60 }, (_, i) => call('cup_join', { p_code: r3.code, p_nick: i % 2 ? 'Samma' : 'Namn' + i, p_device: 'dev-par-' + String(i).padStart(4, '0') }, IP('10.9.0.' + (i + 1)))));
  const seated = (await pool.query(`select count(*)::int n, count(distinct nick_key)::int d from cup.players`)).rows[0];
  ok(seated.n === 24 && seated.d === 24, `60 samtidiga anslutningar: exakt 24 platser, alla namn unika (${seated.n}/${seated.d})`);
  await reset(); const { room: r4, ps: p4 } = await mkRoom(2, 'conc'); await rpc('cup_start', { p_code: r4.code, p_host_secret: r4.host_secret });
  const rid4 = (await pool.query(`select d.id from cup.rounds d join cup.rooms r on r.id=d.room_id where r.code=$1`, [r4.code])).rows[0].id; await pool.query(`update cup.rounds set starts_at = now() - interval '1 second' where id=$1`, [rid4]);
  const q40 = (await pool.query(`select ans from cup.questions where round_id=$1 and idx=0`, [rid4])).rows[0].ans;
  await settle(Array.from({ length: 25 }, (_, i) => call('cup_answer', { p_code: r4.code, p_player: p4[0].player_id, p_secret: p4[0].secret, p_round: rid4, p_idx: 0, p_val: i % 2 ? q40 : q40 + 1 })));
  ok((await pool.query(`select count(*)::int n from cup.answers where round_id=$1 and player_id=$2 and idx=0`, [rid4, p4[0].player_id])).rows[0].n === 1, '25 samtidiga svar på samma fråga ger exakt en lagrad rad');
  await pool.query(`update cup.rounds set deadline = now() where id=$1`, [rid4]); await rpc('cup_state', { p_code: r4.code, p_host_secret: r4.host_secret });
  await settle(Array.from({ length: 12 }, () => call('cup_next', { p_code: r4.code, p_host_secret: r4.host_secret })));
  ok((await pool.query(`select count(*)::int n from cup.rounds d join cup.rooms r on r.id=d.room_id where r.code=$1`, [r4.code])).rows[0].n === 2, '12 samtidiga "nästa" ger exakt en ny runda');

  // ===================== 3. IP-HANTERING, INTEGRITET, GALLRING =====================
  await reset();
  const key = async h => { const c = await pool.connect(); try { await c.query('begin'); await c.query('set local role postgres'); await c.query(`select set_config('request.headers',$1,true)`, [JSON.stringify(h)]); const r = await c.query('select cup.client_key() k'); await c.query('rollback'); return r.rows[0].k; } finally { c.release(); } };
  const set = (k, v) => pool.query(`update cup.settings set val=$2 where key=$1`, [k, v]);
  const ipA = '203.0.113.99', real = '198.51.100.77';
  ok(await key(IP(ipA)) === await key({ 'cf-connecting-ip': ipA, 'x-forwarded-for': '1.2.3.4' }), 'cf-connecting-ip har företräde framför x-forwarded-for');
  ok(await key({ 'x-forwarded-for': `6.6.6.6, ${real}` }) === await key({ 'x-forwarded-for': real }), 'standard (sista värdet): förfalskat första x-forwarded-for-värde ändrar inte nyckeln');
  ok(await key({ 'x-forwarded-for': `6.6.6.6, ${real}` }) !== await key({ 'x-forwarded-for': `7.7.7.7, 6.6.6.6` }), 'standard: olika verkliga klienter ger olika nycklar');
  await set('xff_from_right', '2'); ok(await key({ 'x-forwarded-for': `6.6.6.6, ${real}, 10.0.0.1` }) === await key({ 'x-forwarded-for': real }), 'xff_from_right=2: näst sista värdet (en extra proxy-hop)');
  await set('xff_from_right', '0'); const spoofA = await key({ 'x-forwarded-for': `6.6.6.6, ${real}` }), spoofB = await key({ 'x-forwarded-for': `7.7.7.7, ${real}` });
  ok(spoofA !== spoofB, 'KONTROLL: "första värdet" (Supabase-dokumentationens exempel) kan förfalskas – samma verkliga klient får olika nycklar');
  await set('xff_from_right', '1'); await set('ip_mode', 'off'); ok(await key(IP(ipA)) === null, 'ip_mode=off: ingen per-klient-begränsning (nödläge om headers visar sig fel)'); await set('ip_mode', 'auto');
  const kk = await key(IP(ipA)); ok(/^[0-9a-f]{16}$/.test(kk) && kk !== require('crypto').createHash('sha256').update(ipA).digest('hex').slice(0, 16), 'IP lagras som saltad hash (matchar inte osaltad sha256)');
  await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, IP(ipA));
  const rows = (await pool.query(`select bucket, until_at from cup.rate`)).rows; ok(rows.length > 0 && rows.every(r => !r.bucket.includes(ipA) && !r.bucket.includes('203.0.113')), 'ingen rå IP i räknartabellen');
  ok(rows.every(r => (r.until_at - Date.now()) <= 1300 * 1000), 'IP-hash-rader har livstid ≤ ~20 min (längsta fönster 600 s × 2)');
  // gallring utan att någon skapar rum: slumpad rensning i varje anrop
  await pool.query(`update cup.rate set until_at = now() - interval '1 minute'`); const gone = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }); await pool.query(`update cup.rooms set expires_at = now() - interval '1 minute' where code = $1`, [gone.code]);
  const dummy = { p_code: 'AAAAA', p_player: '00000000-0000-0000-0000-000000000000', p_secret: 'x' };
  for (let i = 0; i < 500; i++) { try { await rpc('cup_state', dummy); } catch (e) { /* NO_ROOM */ } }
  const left = (await pool.query(`select (select count(*) from cup.rate where until_at < now())::int r, (select count(*) from cup.rooms where expires_at < now())::int rm`)).rows[0];
  ok(left.r === 0 && left.rm === 0, `utgångna IP-hashar och rum gallras av vanliga anrop (kvar: ${left.r} räknare, ${left.rm} rum)`);
  const cfg = (await pool.query(`select count(*)::int n from information_schema.role_table_grants where table_schema='cup' and table_name='settings' and grantee in ('anon','authenticated','PUBLIC')`)).rows[0].n; ok(cfg === 0, 'cup.settings (salt) är otillgänglig för anon');

  console.log(`cup-integrity-abuse: ${pass} PASS, ${fail} FAIL`); if (fail) { console.log(bad.join('\n')); process.exit(1); }
  await pool.end();
})().catch(e => { console.error('KRASCH', e); process.exit(2); });
