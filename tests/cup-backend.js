/* Matte OS Cup – backend-spelflöde med 10 spelare + värd mot RIKTIG Postgres (via REST-shim).
   Kör: PGDATABASE=cuptest node cup/dev/rest-shim.js &  ;  node tests/cup-backend.js http://localhost:8787 */
'use strict';
const API = require('../js/cup-api.js');
const base = process.argv[2] || 'http://localhost:8787';
const c = API.client({ url: base, anonKey: 'test' });
// servern begränsar täta state-anrop per spelare (RATE); testerna väntar och försöker igen precis som klientens nästa poll
const _st = c.state; c.state = async (...a) => { for (let i = 0; i < 8; i++) { try { return await _st(...a); } catch (e) { if (e.code !== 'RATE') throw e; await new Promise(r => setTimeout(r, 130)); } } return _st(...a); };
let pass = 0, fail = 0; const bad = [];
const ok = (cond, msg) => { if (cond) pass++; else { fail++; bad.push('✗ ' + msg); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const expectErr = async (p, code, msg) => { try { await p; ok(false, msg + ' (inget fel)'); } catch (e) { ok(e.code === code, `${msg} (fick ${e.code}: ${e.message})`); } };

async function playRound(room, bots, acc) {
  // alla botar svarar parallellt tills klara; acc[i] = sannolikhet rätt (deterministiskt mönster)
  await Promise.all(bots.map(async (b, bi) => {
    for (let guard = 0; guard < 80; guard++) {
      const st = await c.state(room, b.id, b.secret);
      const r = st.round;
      if (!r || r.status !== 'active' || !r.you_in) return;
      if (r.starts_in_ms > 0) { await sleep(Math.min(r.starts_in_ms + 50, 400)); continue; }
      if (!r.question) return;
      const q = r.question; b.seen = b.seen || [];
      b.seen.push([r.id, q.idx, q.a, q.b]);
      b.cnt = b.cnt || {}; const n = (b.cnt[r.id] = (b.cnt[r.id] || 0) + 1);
      const right = n <= (typeof acc === 'function' ? acc(b, bi) : acc[bi]);
      const val = right ? q.a * q.b : q.a * q.b + 1;
      const out = await c.answer(room, b.id, b.secret, r.id, q.idx, val);
      b.last = out;
    }
  }));
}

(async () => {
  const t0 = Date.now();
  const room = await c.create([2, 5, 10], 10, 20);
  const code = room.code, hs = room.host_secret;
  ok(/^[A-HJ-NP-Z2-9]{5}$/.test(code), 'rumskod 5 tecken utan förväxlingsbara tecken');
  ok(hs.length >= 60, 'värdhemlighet lång');
  // --- join: 10 spelare, dubblettnamn, ogiltigt namn ---
  const names = ['Sara', 'Sara', 'Omar', 'Lina', 'Ali', 'Nora', 'Eva', 'Yusuf', 'Mia', 'Hugo'];
  const bots = [];
  for (let i = 0; i < 10; i++) { const j = await c.join(code, names[i], 'device-' + i + '-abcdefgh'); bots.push({ id: j.player_id, secret: j.secret, nick: j.nick, dev: 'device-' + i + '-abcdefgh' }); }
  ok(bots[1].nick === 'Sara 2', 'dubblettnamn får suffix: ' + bots[1].nick);
  await expectErr(c.join(code, '<script>alert(1)</script>', 'device-x-abcdefgh'), 'BAD_NICK', 'XSS-smeknamn nekas');
  await expectErr(c.join(code, '', 'device-y-abcdefgh'), 'BAD_NICK', 'tomt namn nekas');
  await expectErr(c.join(code, 'A'.repeat(17), 'device-z-abcdefgh'), 'BAD_NICK', 'för långt namn nekas');
  // samma enhets-id ger ALDRIG tillgång till en befintlig plats: ny plats, gamla hemligheten fungerar fortfarande
  const rej = await c.join(code, 'Hax', bots[0].dev);
  ok(!rej.rejoined && rej.player_id !== bots[0].id, 'samma enhets-id tar inte över platsen (får en egen ny plats)');
  await expectErr(c.state(code, bots[0].id, rej.secret), 'BAD_PLAYER', 'angriparens hemlighet fungerar inte på offrets spelar-id');
  await c.state(code, bots[0].id, bots[0].secret); ok(true, 'offrets egen hemlighet gäller fortfarande');
  await c.leave(code, rej.player_id, rej.secret);
  await expectErr(c.join('ZZZZZ', 'X', 'device-q-abcdefgh'), 'NO_ROOM', 'okänd kod nekas');
  let st = await c.state(code, bots[0].id, bots[0].secret);
  ok(st.players.length === 10 && st.status === 'LOBBY', 'lobby visar 10 spelare');
  await expectErr(c.state(code, bots[0].id, 'fel-hemlighet'), 'BAD_PLAYER', 'fel spelarhemlighet nekas');
  await expectErr(c.state(code, bots[1].id, bots[0].secret), 'BAD_PLAYER', 'byta spelar-ID nekas');
  await expectErr(c.start(code, bots[0].secret), 'NOT_HOST', 'spelare kan inte starta');
  await expectErr(c.start(code, 'x'.repeat(64)), 'NOT_HOST', 'fel värdhemlighet nekas');
  for (const b of bots) await c.ready(code, b.id, b.secret, true);
  st = await c.state(code, null, null, hs);
  ok(st.is_host && st.players.every(p => p.ready), 'värd ser alla redo');
  ok(!JSON.stringify(st).includes('"ans"'), 'ingen facit i lobbystate');
  // --- kval ---
  await c.start(code, hs);
  await expectErr(c.join(code, 'Sen', 'device-late-abcdefgh'), 'STARTED', 'för sent ansluten nekas');
  st = await c.state(code, bots[2].id, bots[2].secret);
  ok(st.status === 'ACTIVE' && st.round.stage === 'qual' && st.round.starts_in_ms > 0, 'kval aktivt med nedräkning');
  await expectErr(c.answer(code, bots[2].id, bots[2].secret, st.round.id, 0, 5), 'EARLY', 'svar före start nekas');
  await sleep(6300);
  // tidig state: ingen facit läcker
  st = await c.state(code, bots[2].id, bots[2].secret);
  ok(st.round.question && st.round.question.a >= 1 && !('ans' in st.round.question), 'fråga utan facit');
  ok(!/"ans"/.test(JSON.stringify(st)), 'ingen "ans" i state under pågående runda');
  // dubbelklick + fel idx + parallell
  const q0 = st.round.question;
  const [r1, r2] = await Promise.all([
    c.answer(code, bots[2].id, bots[2].secret, st.round.id, 0, q0.a * q0.b),
    c.answer(code, bots[2].id, bots[2].secret, st.round.id, 0, q0.a * q0.b)]);
  ok(r1.correct === true && r2.correct === true && (r1.duplicate !== r2.duplicate), 'dubbel inskickning räknas en gång');
  const r3 = await c.answer(code, bots[2].id, bots[2].secret, st.round.id, 0, 9999);
  ok(r3.duplicate === true && r3.correct === true, 'omsändning med annat värde ändrar inte resultat');
  await expectErr(c.answer(code, bots[2].id, bots[2].secret, st.round.id, 5, 1), 'OUT_OF_ORDER', 'hoppa över fråga nekas');
  await expectErr(c.answer(code, bots[2].id, bots[1].secret, st.round.id, 1, 1), 'BAD_PLAYER', 'svara som annan spelare nekas');
  bots[2].cnt = { [st.round.id]: 1 }; bots[2].seen = [[st.round.id, 0, q0.a, q0.b]];
  // spelare 3 (Omar) fortsätter manuellt; alla spelar med olika träffsäkerhet. Två identiska för att tvinga fram oavgjort vid gränsen.
  const acc = [10, 9, 8, 7, 7, 7, 5, 4, 3, 2]; // 4:e–6:e delar plats vid gränsen → utslagsrunda
  await playRound(code, bots, acc);
  st = await c.state(code, bots[0].id, bots[0].secret);
  ok(st.status === 'SCORED' && st.round.status === 'done', 'kval avslutas när alla svarat (ej väntat på tiden)');
  const stand = st.results.round;
  ok(stand.length === 10 && stand.every(x => typeof x.correct === 'number'), 'ranking 1–10 med alla resultat');
  ok(st.results.review.length === 10 && st.results.review.every(r => 'ans' in r), 'facit i egen genomgång efter rundan');
  // identiska frågor och ordning för alla
  const sig = b => (b.seen || []).filter(s => s[0] === st.round.id).map(s => s[2] + 'x' + s[3]).join(',');
  ok(bots.every(b => sig(b) === sig(bots[0])) && sig(bots[0]).split(',').length === 10, 'alla fick samma 10 frågor i samma ordning');
  await expectErr(c.answer(code, bots[0].id, bots[0].secret, st.round.id, 10, 1), 'LATE', 'svar efter avslutad runda nekas');
  await expectErr(c.next(code, bots[0].secret), 'NOT_HOST', 'spelare kan inte avancera');
  // --- Nästa: ev. utslagsrunda tills semifinal ---
  let guard = 0, tb = 0;
  st = await c.state(code, null, null, hs);
  while (guard++ < 10) {
    const out = await c.next(code, hs);
    if (out.next === 'tiebreak') {
      tb++; await sleep(6200);
      const seq = [[0,0,0,3,3,1,0,0,0,0],[0,0,0,3,1,3,0,0,0,0],[0,0,0,2,0,3,0,0,0,0]]; // 2:a utslaget lika igen → ny runda
      const st2 = await c.state(code, null, null, hs); ok(st2.round.kind === 'tb' && st2.round.n_q === 3, 'utslagsrunda har 3 frågor');
      await playRound(code, bots, seq[tb - 1]);
      continue;
    }
    ok(out.next === 'semi', 'efter kval kommer semifinal (fick ' + out.next + ')');
    break;
  }
  st = await c.state(code, null, null, hs);
  ok(st.round.stage === 'semi' && st.round.participants === 4, 'semifinal har 4 spelare');
  const seeds = st.bracket.seeds, sm = st.bracket.semi;
  ok(sm[0].a === seeds[0] && sm[0].b === seeds[3] && sm[1].a === seeds[1] && sm[1].b === seeds[2], 'semifinal 1 mot 4 och 2 mot 3');
  console.log('  utslagsrundor i kval: ' + tb + ', seeds: ' + seeds.map(s => st.names[s]).join(' > '));
  // --- semifinal ---
  await sleep(6200);
  const semiPlayers = bots.filter(b => seeds.slice(0, 4).includes(b.id));
  const outsider = bots.find(b => !seeds.slice(0, 4).includes(b.id));
  await expectErr(c.answer(code, outsider.id, outsider.secret, st.round.id, 0, 1), 'NOT_IN_ROUND', 'icke-deltagare kan inte svara i semifinal');
  const order = seeds.slice(0, 4);
  await playRound(code, semiPlayers, b => [4, 5, 3, 4][order.indexOf(b.id)]); // semi 1 oavgjort 4–4 → utslag
  st = await c.state(code, null, null, hs);
  ok(st.status === 'SCORED', 'semifinal klar');
  guard = 0;
  while (guard++ < 10) {
    const out = await c.next(code, hs);
    if (out.next === 'tiebreak') { tb++; await sleep(6200); await playRound(code, semiPlayers, b => order.indexOf(b.id) === 3 ? 2 : order.indexOf(b.id) === 0 ? 1 : 0); continue; }
    ok(out.next === 'final', 'efter semifinal kommer final (fick ' + out.next + ')');
    break;
  }
  st = await c.state(code, null, null, hs);
  ok(st.round.stage === 'final' && st.round.participants === 2, 'final mellan två spelare');
  const fin = st.bracket.finalists;
  ok(fin.length === 2 && fin.every(f => seeds.slice(0, 4).includes(f)), 'finalister kommer från semifinal');
  const finBots = bots.filter(b => fin.includes(b.id));
  // bäst av tre: fin[1] vinner game 1, fin[0] game 2, fin[1] game 3
  const winnerPattern = [fin[1], fin[0], fin[1]];
  let games = 0;
  while (true) {
    st = await c.state(code, null, null, hs);
    if (st.status === 'COMPLETE') break;
    await sleep(6200);
    const wid = winnerPattern[games] || fin[0];
    if (games === 1) { // game 2 oavgjort 3–3 → utslag avgör
      await playRound(code, finBots, () => 3);
      st = await c.state(code, null, null, hs); ok(st.status === 'SCORED', 'final game 2 oavgjort stängt');
      const o = await c.next(code, hs); ok(o.next === 'tiebreak', 'oavgjord final → utslagsfråga');
      await sleep(6200);
      await playRound(code, finBots, b => b.id === wid ? 3 : 1);
    } else await playRound(code, finBots, b => b.id === wid ? 5 : 2);
    st = await c.state(code, null, null, hs);
    ok(st.status === 'SCORED', 'finalspel ' + (games + 1) + ' klart');
    games++;
    await c.next(code, hs);
    if (games > 4) break;
  }
  st = await c.state(code, finBots[0].id, finBots[0].secret);
  ok(st.status === 'COMPLETE' && st.stage === 'done', 'turnering klar');
  ok(games === 3, 'bäst av tre spelade tre games (' + games + ')');
  ok(st.bracket.podium[0] === fin[1] && st.bracket.podium[1] === fin[0], 'vinnare = den med två vunna games');
  ok(st.bracket.podium.length === 4, 'prispall: etta, tvåa och två delade tredjeplatser');
  console.log('  vinnare: ' + st.names[st.bracket.podium[0]] + ', tvåa: ' + st.names[st.bracket.podium[1]]);
  // städning
  await expectErr(c.cancel(code, bots[0].secret), 'NOT_HOST', 'bara värd kan radera rum');
  await c.cancel(code, hs);
  await expectErr(c.state(code, null, null, hs), 'NO_ROOM', 'raderat rum borta');
  console.log(`cup-backend: ${pass} PASS, ${fail} FAIL, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (fail) { console.log(bad.join('\n')); process.exit(1); }
})().catch(e => { console.error('KRASCH', e); process.exit(2); });
