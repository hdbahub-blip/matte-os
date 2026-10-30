/* Matte OS Cup – testar rollback-skriptet: tar bort exakt Cup, lämnar andra appars objekt bit-för-bit oförändrade, och
   migrationen går att köra igen efteråt (rundtur). Kör: node tests/cup-rollback.js */
'use strict';
const { Pool } = require('pg'); const { execFileSync } = require('child_process'); const path = require('path');
const cfg = { host: process.env.PGHOST || '/tmp/pgdata', port: +(process.env.PGPORT || 5544), user: process.env.PGUSER || 'postgres' };
let pass = 0, fail = 0; const bad = []; const ok = (c, m) => { if (c) pass++; else { fail++; bad.push('✗ ' + m); } };
const psql = f => execFileSync('psql', ['-q', '-v', 'ON_ERROR_STOP=1', '-h', cfg.host, '-p', String(cfg.port), '-U', cfg.user, '-d', 'cuptest_rb', '-f', path.join(__dirname, '..', f)], { stdio: ['ignore', 'pipe', 'pipe'] });
(async () => {
  const adm = new Pool({ ...cfg, database: 'postgres', max: 1 }); await adm.query('drop database if exists cuptest_rb'); await adm.query('create database cuptest_rb'); await adm.end();
  const db = new Pool({ ...cfg, database: 'cuptest_rb', max: 2 });
  await db.query(`do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;`);
  await db.query(`create function public.other_app_open() returns int language sql as 'select 1';
    create function public.cup_lookalike_other_app() returns int language sql as 'select 3';
    create function public.other_app_closed() returns int language sql as 'select 2';
    revoke all on function public.other_app_closed() from public; grant execute on function public.other_app_closed() to authenticated;
    create table public.other_app_tbl(id int primary key, v text); insert into public.other_app_tbl values (1,'data');
    create schema other_schema; create table other_schema.t(x int); insert into other_schema.t values (7);`);
  const snap = async () => JSON.stringify([(await db.query(`select p.proname, coalesce(p.proacl::text,'NULL') acl, md5(p.prosrc) src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by 1`)).rows,
    (await db.query(`select * from public.other_app_tbl`)).rows, (await db.query(`select * from other_schema.t`)).rows, (await db.query(`select coalesce(relacl::text,'NULL') a from pg_class where relname='other_app_tbl'`)).rows]);
  const before = await snap();
  psql('cup/supabase/0001_matte_os_cup.sql');
  const cupObjs = async () => (await db.query(`select (select count(*) from pg_namespace where nspname='cup')::int s, (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('cup_create','cup_join','cup_ready','cup_leave','cup_kick','cup_cancel','cup_start','cup_end_round','cup_answer','cup_next','cup_state'))::int f`)).rows[0];
  let c = await cupObjs(); ok(c.s === 1 && c.f === 11, `efter migration: schema cup + 11 RPC finns (${JSON.stringify(c)})`);
  await db.query(`set role anon`); const r = (await db.query(`select public.cup_create(array[2],10,20) r`)).rows[0].r; await db.query('reset role'); ok(!!r.code, 'migrationen fungerar (rum skapat före rollback)');
  psql('cup/supabase/rollback_0001.sql');
  c = await cupObjs(); ok(c.s === 0 && c.f === 0, `efter rollback: schema cup och alla 11 RPC borta (${JSON.stringify(c)})`);
  const after = await snap(); ok(after === before, 'efter rollback är andra appars funktioner (inkl. cup_lookalike_other_app), tabeller, data, scheman och ACL bit-för-bit som före migrationen');
  ok((await db.query(`select 1 from pg_proc where proname='cup_lookalike_other_app'`)).rowCount === 1, 'funktion med liknande namn (cup_lookalike_*) raderades inte');
  psql('cup/supabase/rollback_0001.sql'); ok(true, 'rollback kan köras igen (idempotent)');
  psql('cup/supabase/0001_matte_os_cup.sql'); c = await cupObjs(); ok(c.s === 1 && c.f === 11, 'migrationen kan köras igen efter rollback (rundtur)');
  await db.query(`set role anon`); const r2 = (await db.query(`select public.cup_create(array[2],10,20) r`)).rows[0].r; await db.query('reset role'); ok(!!r2.code, 'spelmotorn fungerar efter återinstallation');
  await db.end(); const a2 = new Pool({ ...cfg, database: 'postgres', max: 1 }); await a2.query('drop database if exists cuptest_rb'); await a2.end();
  console.log(`cup-rollback: ${pass} PASS, ${fail} FAIL`); if (fail) { console.log(bad.join('\n')); process.exit(1); }
})().catch(e => { console.error('KRASCH', e.message); process.exit(2); });
