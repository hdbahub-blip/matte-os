/* Matte OS Cup – turneringslogik: deterministisk seedning, oavgjorda resultat, placering 1–4 och finalmatcher.
   Jämför den riktiga SQL-motorn mot en oberoende JS-referensmodell över slumpade scenarier (med många oavgjorda), samt
   frånkopplade spelare, låsta skärmar, kick under pågående runda och värd-avslut. Resultat skrivs direkt i cup.answers (superuser)
   med kontrollerade poäng; motorn, rangordningen och alla RPC är de riktiga. Kör: node tests/cup-seeding.js [antal-scenarier] */
'use strict';
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.PGHOST || '/tmp/pgdata', port: +(process.env.PGPORT || 5544), user: 'postgres', database: process.env.PGDATABASE || 'cuptest', max: 6 });
let pass = 0, fail = 0; const bad = []; const ok = (c, m) => { if (c) pass++; else { fail++; if (bad.length < 25) bad.push('✗ ' + m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function rpc(fn, args) { const k = Object.keys(args); const c = await pool.connect(); try { await c.query('begin'); await c.query('set local role anon'); const r = await c.query(`select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(',')}) r`, k.map(x => args[x])); await c.query('commit'); return r.rows[0].r; } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); } }
function prng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ---------- oberoende referensmodell (index = anslutningsordning 0..N-1) ----------
class Model {
  constructor(n) { this.n = n; this.cut = n >= 4 ? 4 : 2; this.stage = 'qual'; this.kind = 'main'; this.tb = 0; this.tiers = null; this.pend = -1; this.wins = [0, 0]; this.game = 1; this.done = false; this.third = []; this.forced = false; }
  group(ids, sc) { const m = new Map(); ids.forEach(i => { const s = sc[i] || 0; if (!m.has(s)) m.set(s, []); m.get(s).push(i); }); return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([, v]) => v.sort((a, b) => a - b)); }
  expected() { // deltagare i nästa runda (som ordnad lista), eller null när klart
    if (this.done) return null;
    if (this.stage === 'qual' && this.kind === 'main' && !this.tiers) return { stage: 'qual', kind: 'main', players: [...Array(this.n).keys()] };
    return this.next;
  }
  start() { this.next = { stage: 'qual', kind: 'main', players: [...Array(this.n).keys()] }; return this.next; }
  feed(sc) { // sc: index -> rätta svar i den runda som just spelats
    const cur = this.next;
    if (cur.stage === 'qual') {
      let tiers;
      if (cur.kind === 'main') { tiers = this.group(cur.players, sc); this.tb = 0; }
      else { const sub = this.group(cur.players, sc); tiers = this.tiers.flatMap((t, j) => j === this.pend ? sub : [t]); this.tb++; }
      let pos = 0, tied = -1; for (let i = 0; i < tiers.length; i++) { if (pos < this.cut && pos + tiers[i].length > this.cut) { tied = i; break; } pos += tiers[i].length; }
      if (tied >= 0 && this.tb < 5) { this.tiers = tiers; this.pend = tied; this.next = { stage: 'qual', kind: 'tb', players: tiers[tied] }; return; }
      if (tied >= 0) { tiers = tiers.flatMap((t, j) => j === tied ? t.map(x => [x]) : [t]); this.forced = true; }
      this.seeds = tiers.flat(); this.tiers = tiers;
      if (this.cut === 4) { const s = this.seeds; this.semi = [{ a: s[0], b: s[3], w: null }, { a: s[1], b: s[2], w: null }]; this.tb = 0; this.next = { stage: 'semi', kind: 'main', players: [s[0], s[3], s[1], s[2]] }; }
      else { this.fin = [this.seeds[0], this.seeds[1]]; this.third = this.seeds.slice(2, 3); this.startFinal(); }
      return;
    }
    if (cur.stage === 'semi') {
      for (const m of this.semi) if (m.w === null) {
        const ca = sc[m.a] || 0, cb = sc[m.b] || 0;
        if (ca > cb) m.w = m.a; else if (cb > ca) m.w = m.b; else if (cur.kind === 'tb' && this.tb >= 4) { m.w = m.a; this.forced = true; }
      }
      if (cur.kind === 'tb') this.tb++;
      const open = this.semi.filter(m => m.w === null);
      if (open.length) { this.next = { stage: 'semi', kind: 'tb', players: open.flatMap(m => [m.a, m.b]) }; return; }
      const pos = x => this.seeds.indexOf(x);
      const w = this.semi.map(m => m.w).sort((x, y) => pos(x) - pos(y));
      const l = this.semi.map(m => m.w === m.a ? m.b : m.a).sort((x, y) => pos(x) - pos(y));
      this.fin = w; this.third = l; this.startFinal(); return;
    }
    if (cur.stage === 'final') {
      const [a, b] = this.fin; const ca = sc[a] || 0, cb = sc[b] || 0;
      if (cur.kind === 'main') this.tb = 0; else this.tb++;
      let win = null;
      if (ca > cb) win = 0; else if (cb > ca) win = 1; else if (cur.kind === 'tb' && this.tb >= 5) { win = 0; this.forced = true; }
      if (win === null) { this.next = { stage: 'final', kind: 'tb', players: [a, b] }; return; }
      this.wins[win]++;
      if (this.wins[win] >= 2) { this.done = true; this.podium = [this.fin[win], this.fin[1 - win], ...this.third]; this.next = null; return; }
      this.game++; this.next = { stage: 'final', kind: 'main', players: [a, b] };
    }
  }
  startFinal() { this.tb = 0; this.next = { stage: 'final', kind: 'main', players: [...this.fin] }; }
}

// ---------- driver mot riktiga motorn ----------
async function ids(code) { return (await pool.query(`select p.id, p.seq from cup.players p join cup.rooms r on r.id=p.room_id where r.code=$1 and not p.kicked order by p.seq`, [code])).rows.map(r => r.id); }
async function curRound(code) { return (await pool.query(`select d.* from cup.rounds d join cup.rooms r on r.id=d.room_id where r.code=$1 order by d.no desc limit 1`, [code])).rows[0]; }
async function fill(rid, pid, correct, nq) {
  await pool.query(`insert into cup.answers(round_id, player_id, idx, val, correct, at) select $1, $2, q.idx, case when q.idx < $3 then q.ans else q.ans + 1 end, q.idx < $3, now() from cup.questions q where q.round_id=$1 and q.idx < $4 order by q.idx`, [rid, pid, correct, nq]);
}
async function closeRound(code, host) { await pool.query(`update cup.rounds set deadline = now() where id = $1 and status='active'`, [(await curRound(code)).id]); }
async function lobby(n, tables, tag) {
  const room = await rpc('cup_create', { p_tables: tables || null, p_qual_q: 10, p_sec_per_q: 20 }); const ps = [];
  for (let i = 0; i < n; i++) ps.push(await rpc('cup_join', { p_code: room.code, p_nick: 'S' + i, p_device: `dev-${tag}-${String(i).padStart(4, '0')}` }));
  await rpc('cup_start', { p_code: room.code, p_host_secret: room.host_secret });
  await pool.query(`update cup.rounds set starts_at = now() - interval '1 second' where room_id=(select id from cup.rooms where code=$1)`, [room.code]);
  return { room, ps };
}
async function scenario(seed, n, bias) {
  const rnd = prng(seed); await pool.query('delete from cup.rate');
  const { room } = await lobby(n, [7], 's' + seed); const pid = await ids(room.code); const M = new Model(n); M.start(); const log = [];
  for (let step = 0; step < 80; step++) {
    const rd = await curRound(room.code); const parts = (await pool.query(`select rp.player_id, p.seq from cup.round_players rp join cup.players p on p.id=rp.player_id where rp.round_id=$1 order by p.seq`, [rd.id])).rows;
    const got = parts.map(x => pid.indexOf(x.player_id));
    const exp = M.next; const sortedExp = [...exp.players].sort((a, b) => a - b);
    const exact = rd.stage === exp.stage && rd.kind === exp.kind && JSON.stringify(got) === JSON.stringify(sortedExp);
    ok(exact, `scenario ${seed}/N${n}: steg ${step} förväntat ${exp.stage}/${exp.kind} [${sortedExp}] fick ${rd.stage}/${rd.kind} [${got}]`);
    if (!exact) return;
    // semifinal: gruppindelning (match 1 = seed1 v seed4, match 2 = seed2 v seed3)
    if (rd.stage === 'semi' && rd.kind === 'main') {
      const g = (await pool.query(`select player_id, grp from cup.round_players where round_id=$1`, [rd.id])).rows; const gm = Object.fromEntries(g.map(x => [pid.indexOf(x.player_id), x.grp]));
      const s = M.seeds; ok(gm[s[0]] === gm[s[3]] && gm[s[1]] === gm[s[2]] && gm[s[0]] !== gm[s[1]], `scenario ${seed}: semifinalpar 1v4 och 2v3 (${JSON.stringify(gm)})`);
    }
    await pool.query(`update cup.rounds set starts_at = now() - interval '1 second' where id=$1`, [rd.id]);
    const sc = {};
    for (const i of exp.players) { const hi = rd.n_q; const v = bias === 'ties' ? Math.min(hi, Math.floor(rnd() * 3) + (rd.stage === 'qual' && rd.kind === 'main' ? hi - 2 : 0)) : bias === 'zero' ? 0 : Math.floor(rnd() * (hi + 1)); sc[i] = v; await fill(rd.id, pid[i], v, rd.n_q); }
    log.push(JSON.stringify(sc));
    await rpc('cup_state', { p_code: room.code, p_host_secret: room.host_secret }); // tick stänger rundan när alla svarat
    const st = (await pool.query(`select status from cup.rooms where code=$1`, [room.code])).rows[0].status; ok(st === 'SCORED', `scenario ${seed}: rundan stängs när alla svarat (${st})`);
    await rpc('cup_next', { p_code: room.code, p_host_secret: room.host_secret }); M.feed(sc);
    const rm = (await pool.query(`select status, meta from cup.rooms where code=$1`, [room.code])).rows[0];
    if (M.done) {
      ok(rm.status === 'COMPLETE', `scenario ${seed}: spelet klart`); const pod = rm.meta.podium.map(x => pid.indexOf(x));
      ok(JSON.stringify(pod) === JSON.stringify(M.podium), `scenario ${seed}/N${n}: pallen [${pod}] = modellen [${M.podium}]`);
      ok(pod.length === Math.min(n, 4) && new Set(pod).size === pod.length, `scenario ${seed}: plats 1–${Math.min(n, 4)} unika (${pod.length} st)`);
      ok(!!rm.meta.forced === M.forced, `scenario ${seed}: forced-flagga ${rm.meta.forced} = ${M.forced}`);
      return { forced: M.forced, rounds: step + 1 };
    }
  }
  ok(false, `scenario ${seed}: fastnade (över 80 steg)`);
}

(async () => {
  const COUNT = +process.argv[2] || 120; const t0 = Date.now(); let forcedN = 0, tbHeavy = 0;
  for (let s = 1; s <= COUNT; s++) {
    const n = 2 + (s % 11); const bias = s % 3 === 0 ? 'ties' : s % 7 === 0 ? 'zero' : 'rand';
    const r = await scenario(s * 7919, n, bias); if (r && r.forced) forcedN++; if (r && r.rounds > 8) tbHeavy++;
    if (s % 25 === 0) await pool.query('delete from cup.rooms');
  }
  console.log(`  ${COUNT} slumpade turneringar (N=2..12), ${forcedN} med forcerat avgörande (alla utslagsrundor oavgjorda), ${tbHeavy} med många utslagsrundor`);

  // ---- helhetscase: alla noll → deterministisk vinnare per seed, ingen fastnar ----
  // ---- frånkopplade / låsta / kickade ----
  await pool.query('delete from cup.rooms; delete from cup.rate');
  { // (a) spöke i kvalet: avslutas av tid, ingen blockering
    const { room, ps } = await lobby(5, [3], 'ghost'); const pid = await ids(room.code); const rd = await curRound(room.code);
    for (let i = 1; i < 5; i++) await fill(rd.id, pid[i], 10 - i, rd.n_q);
    await rpc('cup_state', { p_code: room.code, p_host_secret: room.host_secret });
    ok((await pool.query(`select status from cup.rooms where code=$1`, [room.code])).rows[0].status === 'ACTIVE', 'spöke (ingen anslutning): rundan väntar på tiden, inte för alltid');
    await rpc('cup_end_round', { p_code: room.code, p_host_secret: room.host_secret });
    ok((await pool.query(`select status from cup.rooms where code=$1`, [room.code])).rows[0].status === 'SCORED', 'värden kan avsluta rundan direkt trots frånvarande spelare');
    const nx = await rpc('cup_next', { p_code: room.code, p_host_secret: room.host_secret }); ok(nx.next === 'semi', 'turneringen går vidare med spöke sist (semi)');
    const sm = await curRound(room.code); const parts = (await pool.query(`select player_id from cup.round_players where round_id=$1`, [sm.id])).rows.map(x => pid.indexOf(x.player_id)).sort();
    ok(JSON.stringify(parts) === '[1,2,3,4]', 'semifinalisterna är de fyra som spelade, spöket (index 0) är ute (' + parts + ')');
  }
  { // (b) skärmlås: svar efter deadline nekas men nästa runda fungerar med samma hemlighet
    const { room, ps } = await lobby(2, [4], 'lock'); const rd = await curRound(room.code);
    await pool.query(`update cup.rounds set deadline = now() - interval '1 second', starts_at = now() - interval '30 seconds' where id=$1`, [rd.id]);
    await sleep(50); await rpc('cup_state', { p_code: room.code, p_host_secret: room.host_secret });
    let late = null; try { await rpc('cup_answer', { p_code: room.code, p_player: ps[0].player_id, p_secret: ps[0].secret, p_round: rd.id, p_idx: 0, p_val: 28 }); } catch (e) { late = e.message; }
    ok(/LATE/.test(late || ''), 'svar efter att skärmen varit låst över deadline nekas (LATE)');
    await rpc('cup_next', { p_code: room.code, p_host_secret: room.host_secret }); // 2 spelare, 0-0 → utslag
    const nr = await curRound(room.code); ok(nr.id !== rd.id, 'ny runda skapad trots att ingen hann svara (oavgjort → utslagsrunda)');
    await pool.query(`update cup.rounds set starts_at = now() - interval '1 second' where id=$1`, [nr.id]); await sleep(120);
    const st = await rpc('cup_state', { p_code: room.code, p_player: ps[0].player_id, p_secret: ps[0].secret });
    ok(st.round && st.round.question && st.round.question.idx === 0, 'samma spelarhemlighet fungerar i nästa runda efter låst skärm/återanslutning');
  }
  { // (c) kick under pågående runda: rundan stängs när övriga är klara
    const { room, ps } = await lobby(4, [5], 'kick'); const pid = await ids(room.code); const rd = await curRound(room.code);
    await rpc('cup_kick', { p_code: room.code, p_host_secret: room.host_secret, p_player: ps[3].player_id });
    for (let i = 0; i < 3; i++) await fill(rd.id, pid[i], 5 + i, rd.n_q);
    await rpc('cup_state', { p_code: room.code, p_host_secret: room.host_secret });
    ok((await pool.query(`select status from cup.rooms where code=$1`, [room.code])).rows[0].status === 'SCORED', 'kickad spelare blockerar inte rundan');
    const nx = await rpc('cup_next', { p_code: room.code, p_host_secret: room.host_secret }); ok(nx.next === 'final', '3 kvarvarande spelare → final-spår (cut 2) fungerar efter kick: ' + nx.next);
  }
  { // (d) alla offline i en final: noll-noll upprepas, tvingat avgörande, spelet slutar ändå
    const { room } = await lobby(2, [6], 'fin0'); let guard = 0;
    while (guard++ < 60) {
      const st = (await pool.query(`select status from cup.rooms where code=$1`, [room.code])).rows[0].status; if (st === 'COMPLETE') break;
      await pool.query(`update cup.rounds set starts_at = now() - interval '1 second', deadline = now() where room_id=(select id from cup.rooms where code=$1) and status='active'`, [room.code]);
      await rpc('cup_state', { p_code: room.code, p_host_secret: room.host_secret }); await rpc('cup_next', { p_code: room.code, p_host_secret: room.host_secret });
    }
    const mt = (await pool.query(`select status, meta from cup.rooms where code=$1`, [room.code])).rows[0];
    ok(mt.status === 'COMPLETE' && mt.meta.forced === true && mt.meta.podium.length === 2, `ingen svarar i hela turneringen: spelet tar ändå slut med tydligt forcerat avgörande efter ${guard} steg`);
  }
  { // (e) värd avbryter
    const { room, ps } = await lobby(3, [8], 'cancel'); await rpc('cup_cancel', { p_code: room.code, p_host_secret: room.host_secret });
    let e1 = null; try { await rpc('cup_state', { p_code: room.code, p_player: ps[0].player_id, p_secret: ps[0].secret }); } catch (e) { e1 = e.message; }
    ok(/NO_ROOM|GONE/.test(e1 || ''), 'avbrutet spel: spelare får tydligt NO_ROOM/GONE, och klienten rensar sessionen (' + e1 + ')');
  }
  { // (f) värden kan inte starta nästa steg medan rundan pågår, och upprepade next-klick skapar inte dubbla rundor
    const { room } = await lobby(3, [9], 'dbl'); let e2 = null; try { await rpc('cup_next', { p_code: room.code, p_host_secret: room.host_secret }); } catch (e) { e2 = e.message; }
    ok(/BAD_STATE/.test(e2 || ''), 'next under pågående runda nekas'); 
    await pool.query(`update cup.rounds set deadline = now() where room_id=(select id from cup.rooms where code=$1)`, [room.code]); await rpc('cup_state', { p_code: room.code, p_host_secret: room.host_secret });
    await rpc('cup_next', { p_code: room.code, p_host_secret: room.host_secret }); let e3 = null; try { await rpc('cup_next', { p_code: room.code, p_host_secret: room.host_secret }); } catch (e) { e3 = e.message; }
    ok(/BAD_STATE/.test(e3 || ''), 'dubbelklick på "nästa" skapar inte en andra runda');
  }
  console.log(`cup-seeding: ${pass} PASS, ${fail} FAIL, ${((Date.now() - t0) / 1000).toFixed(1)} s`); if (fail) { console.log(bad.join('\n')); process.exit(1); }
  await pool.end();
})().catch(e => { console.error('KRASCH', e); process.exit(2); });
