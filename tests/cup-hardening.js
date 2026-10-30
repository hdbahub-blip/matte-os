/* Matte OS Cup – härdning: scoped grants (rör inte övriga public-funktioner), platsövertagande, rate limiting, spelarsekretess.
   Kör: node tests/cup-hardening.js  (PG*-variabler som övriga backendtester). Skapar en tillfällig databas cuptest_scope. */
'use strict';
const { Pool } = require('pg'); const { execFileSync } = require('child_process'); const path = require('path');
const cfg = { host: process.env.PGHOST || '/tmp/pgdata', port: +(process.env.PGPORT || 5544), user: process.env.PGUSER || 'postgres' };
const pool = new Pool({ ...cfg, database: process.env.PGDATABASE || 'cuptest', max: 10 });
let pass = 0, fail = 0; const bad = []; const ok = (c, m) => { if (c) pass++; else { fail++; bad.push('✗ ' + m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function asAnon(sql, vals, headers) {
  const c = await pool.connect();
  try { await c.query('begin'); await c.query('set local role anon'); if (headers) await c.query(`select set_config('request.headers', $1, true)`, [JSON.stringify(headers)]); const r = await c.query(sql, vals); await c.query('commit'); return { rows: r.rows }; }
  catch (e) { await c.query('rollback').catch(() => {}); return { err: e }; } finally { c.release(); }
}
const rpc = async (fn, args, headers) => { const k = Object.keys(args); const r = await asAnon(`select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(',')}) r`, k.map(x => Array.isArray(args[x]) ? '{' + args[x].join(',') + '}' : args[x]), headers); if (r.err) throw r.err; return r.rows[0].r; };
const fails = async (p, re, m) => { try { const v = await p; ok(false, m + ' (inget fel: ' + JSON.stringify(v).slice(0, 80) + ')'); } catch (e) { ok(re.test(e.message), m + ' → ' + e.message); } };
const reset = () => pool.query('delete from cup.rooms; delete from cup.rate');
const IP = ip => ({ 'cf-connecting-ip': ip });

(async () => {
  // ===== A. scoped grants: övriga public-funktioner orörda =====
  const admin = new Pool({ ...cfg, database: 'postgres', max: 2 });
  await admin.query('drop database if exists cuptest_scope'); await admin.query('create database cuptest_scope'); await admin.end();
  const sp = new Pool({ ...cfg, database: 'cuptest_scope', max: 2 });
  await sp.query(`do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;`);
  await sp.query(`create function public.other_app_open() returns int language sql as 'select 1';
                  create function public.other_app_closed() returns int language sql as 'select 2';
                  revoke all on function public.other_app_closed() from public; grant execute on function public.other_app_closed() to authenticated;
                  create table public.other_app_tbl(id int); grant select on public.other_app_tbl to anon;`);
  const snap = async () => (await sp.query(`select p.proname, coalesce(p.proacl::text,'NULL') acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'other\\_app%' order by 1`)).rows;
  const tbl = async () => (await sp.query(`select coalesce(relacl::text,'NULL') acl from pg_class where relname='other_app_tbl'`)).rows;
  const before = JSON.stringify(await snap()) + JSON.stringify(await tbl());
  execFileSync('psql', ['-q', '-v', 'ON_ERROR_STOP=1', '-h', cfg.host, '-p', String(cfg.port), '-U', cfg.user, '-d', 'cuptest_scope', '-f', path.join(__dirname, '../cup/supabase/0001_matte_os_cup.sql')]);
  const after = JSON.stringify(await snap()) + JSON.stringify(await tbl());
  ok(before === after, 'migrationen ändrar inte ACL på andra appars funktioner/tabeller i public');
  const exec = (await sp.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and has_function_privilege('anon', p.oid, 'execute') order by 1`)).rows.map(r => r.proname);
  const want = ['cup_answer', 'cup_cancel', 'cup_create', 'cup_end_round', 'cup_join', 'cup_kick', 'cup_leave', 'cup_next', 'cup_ready', 'cup_start', 'cup_state', 'other_app_open'].sort();
  ok(JSON.stringify(exec) === JSON.stringify(want), 'anon kan köra exakt de 11 cup_*-RPC (+ andra appens egna): ' + exec.join(','));
  const cupFn = (await sp.query(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='cup' and (has_function_privilege('anon', p.oid,'execute') or has_function_privilege('authenticated', p.oid,'execute') or has_function_privilege('public', p.oid,'execute'))`)).rows[0].n;
  ok(cupFn === 0, 'ingen intern cup.*-funktion är körbar för anon/authenticated/public');
  const tabPriv = (await sp.query(`select count(*)::int n from information_schema.role_table_grants where table_schema='cup' and grantee in ('anon','authenticated','PUBLIC')`)).rows[0].n;
  ok(tabPriv === 0, 'inga tabellrättigheter i schema cup för anon/authenticated/public');
  const sd = (await sp.query(`select proname, prosecdef, proconfig, pg_get_userbyid(proowner) own from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like 'cup\\_%'`)).rows;
  ok(sd.length === 11 && sd.every(f => f.prosecdef && (f.proconfig || []).includes('search_path=""')), 'alla 11 publika RPC: SECURITY DEFINER + search_path tomt (' + sd.length + ')');
  ok(sd.every(f => f.own === 'postgres'), 'RPC ägs av postgres (RLS kringgås avsiktligt endast inuti validerade funktioner)');
  await sp.end();
  const adm2 = new Pool({ ...cfg, database: 'postgres', max: 1 }); await adm2.query('drop database if exists cuptest_scope'); await adm2.end();

  // ===== B. platsövertagande via enhets-id =====
  await reset();
  const room = await rpc('cup_create', { p_tables: [7], p_qual_q: 10, p_sec_per_q: 20 });
  const victim = await rpc('cup_join', { p_code: room.code, p_nick: 'Offer', p_device: 'dev-victim-0001' });
  const evil = await rpc('cup_join', { p_code: room.code, p_nick: 'Offer', p_device: 'dev-victim-0001' });
  ok(evil.player_id !== victim.player_id && evil.nick === 'Offer 2', 'angripare med samma enhets-id får egen ny plats (ej offrets)');
  await sleep(120);
  const vs = await rpc('cup_state', { p_code: room.code, p_player: victim.player_id, p_secret: victim.secret });
  ok(vs.me === victim.player_id, 'offrets hemlighet gäller oförändrad efter angriparens försök');
  await fails(rpc('cup_state', { p_code: room.code, p_player: victim.player_id, p_secret: evil.secret }), /BAD_PLAYER/, 'angriparens hemlighet ger ingen åtkomst till offrets plats');
  await fails(rpc('cup_ready', { p_code: room.code, p_player: victim.player_id, p_secret: null, p_ready: true }), /BAD_PLAYER/, 'null-hemlighet nekas');
  await fails(rpc('cup_ready', { p_code: room.code, p_player: victim.player_id, p_secret: '', p_ready: true }), /BAD_PLAYER/, 'tom hemlighet nekas');
  const third = await rpc('cup_join', { p_code: room.code, p_nick: 'Tre', p_device: 'dev-victim-0001' });
  await fails(rpc('cup_join', { p_code: room.code, p_nick: 'Fyra', p_device: 'dev-victim-0001' }), /FULL/, 'högst 3 platser per enhets-id och rum');
  const sec = (await pool.query(`select secret_hash, device from cup.players where id=$1`, [victim.player_id])).rows[0];
  ok(!JSON.stringify(vs).includes(sec.secret_hash) && !JSON.stringify(vs).includes(sec.device) && !JSON.stringify(vs).includes(victim.secret), 'cup_state läcker varken hemlighet, hash eller enhets-id');
  ok(third.secret.length >= 60, 'spelarhemlighet är lång slumpad token (' + third.secret.length + ' tecken)');

  // ===== C. rate limiting =====
  await reset();
  // C1: skapa rum per klient: 6 per 10 min, andra klienter opåverkade
  const A = IP('203.0.113.7'); let okc = 0, lim = null;
  for (let i = 0; i < 8; i++) { try { await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, A); okc++; } catch (e) { lim = e.message; break; } }
  ok(okc === 6 && /RATE/.test(lim || ''), `skapa rum: 6 tillåtna, sedan RATE (${okc} ok; ${lim})`);
  const other = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, IP('203.0.113.8')); ok(!!other.code, 'annan klient-IP opåverkad av spärren');
  // förfalskad X-Forwarded-For (första värdet fritt valbart) kringgår inte: SISTA värdet gäller
  await fails(rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, { 'x-forwarded-for': '9.9.9.9, 203.0.113.7' }), /RATE/, 'x-forwarded-for: sista (proxy-lagda) värdet används, falskt första värde hjälper inte');
  // C2: globalt tak 30 rum/min oavsett IP
  await reset(); let g = 0, gl = null;
  for (let i = 0; i < 35; i++) { try { await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, IP('198.51.100.' + (i + 1))); g++; } catch (e) { gl = e.message; break; } }
  ok(g === 30 && /BUSY/.test(gl || ''), `globalt tak: 30 rum/min (${g} ok; ${gl})`);
  // C3: join per klient 80/min, räknar även felaktiga koder (annars gratis koduppräkning)
  await reset(); const r2 = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 });
  const J = IP('192.0.2.50'); let jn = 0, jl = null;
  for (let i = 0; i < 90; i++) { try { const o = await rpc('cup_join', { p_code: 'ZZZZ' + (i % 9 + 2), p_nick: 'x', p_device: 'dev-enum-' + String(i).padStart(4, '0') }, J); if (!o.error) throw new Error('oväntat ok'); jn++; } catch (e) { jl = e.message; break; } }
  ok(jn === 80 && /RATE/.test(jl || ''), `koduppräkning stoppas efter 80 försök/min (${jn}; ${jl})`);
  await fails(rpc('cup_join', { p_code: r2.code, p_nick: 'Riktig', p_device: 'dev-real-00001' }, J), /RATE/, 'samma klient spärrad även för riktig kod under fönstret');
  const okJoin = await rpc('cup_join', { p_code: r2.code, p_nick: 'Annan', p_device: 'dev-real-00002' }, IP('192.0.2.51')); ok(!!okJoin.player_id, 'annan klient kan gå med');
  // C4: klassrum bakom EN gemensam IP: 24 spelare ryms (gräns 80/min per IP)
  await reset(); const r3 = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }, IP('192.0.2.60')); let cls = 0;
  for (let i = 0; i < 24; i++) { await rpc('cup_join', { p_code: r3.code, p_nick: 'E' + i, p_device: 'dev-class-' + String(i).padStart(3, '0') }, IP('192.0.2.61')); cls++; }
  ok(cls === 24, 'ett klassrum på samma NAT-IP kan ansluta 24 spelare utan att spärras');
  // C5: per-rum-tak 150 joins/min (från många IP)
  await reset(); const r4 = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }); let rj = 0, rl = null;
  for (let i = 0; i < 160; i++) { try { await rpc('cup_join', { p_code: r4.code, p_nick: 'N' + (i % 5), p_device: 'dev-room-' + String(i).padStart(4, '0') }, IP('10.1.' + Math.floor(i / 50) + '.' + (i % 50))); rj++; } catch (e) { rl = e.message; if (/RATE|FULL/.test(e.message) && rj >= 40) break; } }
  const seats = (await pool.query(`select count(*)::int n from cup.players pl join cup.rooms r on r.id=pl.room_id where r.code=$1`, [r4.code])).rows[0].n;
  ok(seats <= 24, `rum kan aldrig få fler än 24 aktiva platser trots spam (${seats})`);
  // C6: state-polling: max ~10/s per spelare
  await reset(); const r5 = await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 }); const pl = await rpc('cup_join', { p_code: r5.code, p_nick: 'P', p_device: 'dev-poll-00001' });
  await rpc('cup_state', { p_code: r5.code, p_player: pl.player_id, p_secret: pl.secret });
  await fails(rpc('cup_state', { p_code: r5.code, p_player: pl.player_id, p_secret: pl.secret }), /RATE/, 'två state-anrop inom 100 ms: det andra stoppas');
  await sleep(130); const s2 = await rpc('cup_state', { p_code: r5.code, p_player: pl.player_id, p_secret: pl.secret }); ok(!!s2.code, 'efter 130 ms fungerar det igen');
  // värd-polling: 100 per 10 s och rum
  let hp = 0, hl = null; for (let i = 0; i < 120; i++) { try { await rpc('cup_state', { p_code: r5.code, p_host_secret: r5.host_secret }); hp++; } catch (e) { hl = e.message; break; } }
  ok(hp === 100 && /RATE/.test(hl || ''), `värd-state: 100 per 10 s sedan RATE (${hp}; ${hl})`);
  // C7: räknartabellen rensas och växer inte obegränsat
  await pool.query(`update cup.rate set until_at = now() - interval '1 second'`); await rpc('cup_create', { p_tables: [2], p_qual_q: 10, p_sec_per_q: 20 });
  ok((await pool.query(`select count(*)::int n from cup.rate where until_at < now()`)).rows[0].n === 0, 'utgångna räknare rensas vid nästa skapande');

  // ===== D. spelarsekretess under pågående runda =====
  await reset(); const r6 = await rpc('cup_create', { p_tables: [6], p_qual_q: 10, p_sec_per_q: 20 });
  const ps = []; for (let i = 0; i < 4; i++) ps.push(await rpc('cup_join', { p_code: r6.code, p_nick: 'S' + i, p_device: 'dev-priv-' + String(i).padStart(5, '0') }));
  await rpc('cup_start', { p_code: r6.code, p_host_secret: r6.host_secret });
  await pool.query(`update cup.rounds set starts_at = now() - interval '1 second' where room_id=(select id from cup.rooms where code=$1)`, [r6.code]);
  await sleep(150); const live = await rpc('cup_state', { p_code: r6.code, p_player: ps[0].player_id, p_secret: ps[0].secret }); const txt = JSON.stringify(live);
  ok(live.round && live.round.question && !('ans' in live.round.question), 'aktuell fråga innehåller inte facit');
  ok(!live.results, 'inga resultat/poäng syns under pågående runda'); ok(!/"correct"|"review"|"val"/.test(txt), 'inga svar/poäng/genomgång under pågående runda');
  ok(live.players.every(p => Object.keys(p).sort().join() === 'id,me,nick,online,ready'), 'spelarlistan innehåller bara id, namn, redo, online, me');
  ok(!ps.some(p => txt.includes(p.secret)) && !/[0-9a-f]{64}/.test(txt), 'inga hemligheter eller hash i state');
  await fails(rpc('cup_state', { p_code: r6.code }), /BAD_PLAYER/, 'state utan inloggning nekas (ingen spaning på kod)');

  console.log(`cup-hardening: ${pass} PASS, ${fail} FAIL`); if (fail) { console.log(bad.join('\n')); process.exit(1); }
  await pool.end();
})().catch(e => { console.error('KRASCH', e); process.exit(2); });
