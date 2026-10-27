/* Matte OS v5 — automatisk matematik- och innehålls-QA.  Kör: node tests/qa.js
   Kontrollerar varje moment och varje uppgift: struktur, facit mot oberoende beräkning,
   avrundning, att rätt svar godkänns, att ekvivalenta svar godkänns, att felaktiga svar underkänns,
   att varje missuppfattnings-fälla ger sitt specifika meddelande, och att varje diagram renderas. */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '../js/math.js'));
const V = require(path.join(__dirname, '../js/visuals.js'));
const S9 = require(path.join(__dirname, '../js/content9.js'));
const S8 = require(path.join(__dirname, '../js/content8.js'));
const ALL = [...S9, ...S8];

let fails = [], checks = 0, exercises = 0;
const fail = (where, msg) => fails.push(`${where}: ${msg}`);
const ok = (cond, where, msg) => { checks++; if (!cond) fail(where, msg); };
const round = (v, d) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
const sv = v => M.fmt(v).replace(/ /g, ''); // Swedish formatted number, no thin spaces

const ids = new Set();
for (const s of ALL) {
  const W = s.id;
  ok(!ids.has(s.id), W, 'duplicate skill id'); ids.add(s.id);
  for (const k of ['ch', 'w', 'title', 'sub', 'idea', 'anchor', 'cue', 'cvis', 'f', 'h1', 'ex', 'g', 'p', 'kw']) ok(s[k] != null, W, 'missing ' + k);
  ok(Array.isArray(s.p) && s.p.length >= 4, W, 'needs ≥ 4 practice items');
  // formula card
  const f = s.f || {};
  for (const k of ['name', 'main', 'when', 'sym', 'ex', 'trap']) ok(f[k] != null, W, 'formula missing ' + k);
  ok((f.forms && f.forms.length) || (f.rules && f.rules.length), W, 'formula needs forms (rearranged) or decision rules');
  ok(!/undefined/.test(M.tex(f.main)), W, 'formula renders');
  // worked example
  const e = s.ex || {};
  for (const k of ['q', 'given', 'find', 'rule', 'steps', 'ans']) ok(e[k] != null, W, 'example missing ' + k);
  ok(e.steps && e.steps.length >= 2, W, 'example needs ≥ 2 steps');
  // visuals
  const vis = [s.cvis, e.vis, s.g && s.g.vis, ...s.p.map(p => p.vis)].filter(Boolean);
  for (const v of vis) { const out = V.render(v); ok(out.startsWith('<svg') && out.length > 200, W, 'visual failed: ' + JSON.stringify(v)); ok(!/NaN|undefined/.test(out), W, 'visual has NaN/undefined: ' + v.t); }
  // levels coverage (progression)
  const lv = new Set(s.p.map(p => p.lv));
  ok(lv.has('A'), W, 'needs level A (copy pattern)');
  ok(lv.has('F') , W, 'needs level F (test style)');

  const items = [['g', s.g], ...s.p.map((p, i) => ['p' + i, p])];
  for (const [key, x] of items) {
    exercises++;
    const w = `${W}/${key}`;
    const type = x.type || 'num';
    ok(['num', 'choice', 'expr', 'sci', 'roots'].includes(type), w, 'bad type');
    ok(x.q && x.q.length > 5, w, 'missing question');
    ok(Array.isArray(x.sol) && x.sol.length >= 1, w, 'missing worked solution');
    if (type !== 'choice') {
      ok(Array.isArray(x.given) && x.given.length, w, 'missing given ("Vad vet du?")');
      ok(x.find && x.find.length, w, 'missing find ("Vad söker du?")');
      ok(x.start && x.start.length, w, 'missing start hint');
    }
    if (key === 'g' && type !== 'choice') {
      ok(Array.isArray(x.opts) && x.opts.length === 3 && x.oc != null, w, 'guided needs 3 rule options');
    }
    if (type === 'num') {
      ok(typeof x.a === 'number', w, 'answer must be a number');
      ok(typeof x.calc === 'string', w, 'missing calc (independent computation)');
      if (x.radical) { // exakt svar k√n i enklaste form
        const [rk, rn] = x.radical; ok(rn > 1 && M.largestSq(rn) === 1 && rk >= 1, w, 'radical must be k√n with n square-free');
        ok(Math.abs(x.a - rk * Math.sqrt(rn)) < 1e-9, w, 'radical value does not match a');
        let cv; try { cv = Function('"use strict";return (' + x.calc + ')')(); } catch (err) { fail(w, 'calc error'); continue; }
        ok(Math.abs(cv - x.a) < 1e-9, w, `calc ${cv} ≠ answer ${x.a}`);
        const canonR = `${rk === 1 ? '' : rk}√${rn}`;
        ok(M.check(x, canonR).ok, w, `radical canonical "${canonR}" rejected`);
        ok(M.check(x, canonR + (x.u ? ' ' + x.u : '')).ok, w, 'radical with unit rejected');
        ok(M.check(x, `${rk === 1 ? '' : rk + '*'}√(${rn})`).ok, w, 'radical alt notation rejected');
        const unsimp = M.check(x, `√${rk * rk * rn}`); ok(!unsimp.ok && /förenklas/.test(unsimp.msg || ''), w, 'unsimplified root not flagged');
        const dcm = M.check(x, M.fmt(x.a, 2)); ok(!dcm.ok && dcm.msg, w, 'decimal approximation not flagged');
        for (const wv of [x.a + 1, x.a * 2 + 3]) ok(!M.check(x, sv(wv)).ok, w, 'wrong radical answer accepted');
      } else {
      let c; try { c = Function('"use strict";return (' + x.calc + ')')(); } catch (err) { fail(w, 'calc error ' + err.message); continue; }
      if (x.dec != null) ok(round(c, x.dec) === x.a, w, `rounded calc ${round(c, x.dec)} ≠ answer ${x.a}`);
      else { const tol = x.tol != null ? x.tol : 1e-9; ok(Math.abs(c - x.a) <= Math.max(tol, 1e-9 * Math.abs(c)), w, `calc ${c} ≠ answer ${x.a} (tol ${tol})`); }
      if (x.dec != null) ok(/avrunda|heltal|ungefär|decimal/i.test(x.q), w, 'rounded answer but question does not state rounding');
      // canonical answer (Swedish comma) passes
      const canon = x.mustFraction ? `${x.mustFraction[0]}/${x.mustFraction[1]}` : sv(x.a);
      const r1 = M.check(x, canon); ok(r1.ok, w, `canonical "${canon}" rejected: ${r1.msg}`);
      // dot decimal + unit variant passes
      if (!x.mustFraction) {
        const r2 = M.check(x, String(x.a) + (x.u ? ' ' + x.u : '')); ok(r2.ok, w, `"${x.a} ${x.u || ''}" rejected: ${r2.msg}`);
        // fraction-equivalent for simple fractional answers
        for (const d of [2, 3, 4, 5, 8, 10, 12, 20]) { const n = x.a * d; if (Math.abs(n - Math.round(n)) < 1e-9 && !Number.isInteger(x.a) && Math.abs(n) < 1000) { const r3 = M.check(x, `${Math.round(n)}/${d}`); ok(r3.ok, w, `equivalent fraction ${Math.round(n)}/${d} rejected`); break; } }
      }
      // plausible wrong answers fail
      for (const wv of [x.a + 1, x.a * 2 + 3, x.a === 0 ? 7 : x.a * 1.37]) { const r = M.check(x, sv(wv)); ok(!r.ok, w, `wrong answer ${wv} accepted`); }
      // wrong unit flagged (when unit present and is a measurable unit)
      if (x.u && ['cm', 'm', 'cm²', 'm²', 'cm³', 'dm³', 'km', 'mm'].includes(x.u)) {
        const other = x.u === 'cm' ? 'm' : x.u === 'm' ? 'cm' : x.u === 'cm²' ? 'cm³' : x.u === 'cm³' ? 'cm²' : 'cm';
        const r = M.check(x, sv(x.a) + ' ' + other); ok(!r.ok && /enhet/.test(r.msg || ''), w, `wrong unit "${other}" not flagged`);
      }
      }
    }
    if (type === 'roots') { // andragradsekvationer: mängden lösningar
      ok(Array.isArray(x.a) && x.a.length <= 2, w, 'roots answer must be an array of ≤ 2 numbers');
      ok(typeof x.calc === 'string', w, 'missing calc');
      let cv; try { cv = Function('"use strict";return (' + x.calc + ')')(); } catch (err) { fail(w, 'calc error ' + err.message); continue; }
      const norm = arr => arr.map(v => (x.dec != null ? round(v, x.dec) : v)).sort((a, b) => a - b);
      const A = norm(x.a), Cc = norm(cv);
      ok(A.length === Cc.length && A.every((v, i) => Math.abs(v - Cc[i]) < 1e-9), w, `calc ${JSON.stringify(Cc)} ≠ answer ${JSON.stringify(A)}`);
      if (x.a.length === 0) {
        ok(M.check(x, 'ingen').ok, w, '"ingen" rejected'); ok(M.check(x, 'ingen lösning').ok, w, '"ingen lösning" rejected');
        ok(!M.check(x, '4').ok && !M.check(x, '4 och -4').ok, w, 'numbers accepted when no solution');
      } else {
        const s2 = x.a.map(v => sv(v)).join(' och '); ok(M.check(x, s2).ok, w, `canonical "${s2}" rejected`);
        ok(M.check(x, 'x = ' + x.a.map(v => sv(v)).join(' eller x = ')).ok, w, 'x = … eller x = … rejected');
        ok(M.check(x, x.a.map(v => String(v).replace('.', ',')).join('; ')).ok, w, 'semicolon list rejected');
        if (x.a.length === 2) {
          const hi = Math.max(...x.a); ok(M.check(x, '±' + sv(hi)).ok, w, '± form rejected');
          const one = M.check(x, sv(hi)); ok(!one.ok && /två/.test(one.msg || ''), w, 'single root not flagged as incomplete');
          ok(!M.check(x, sv(hi) + ' och ' + sv(hi + 1)).ok, w, 'wrong second root accepted');
        }
        ok(!M.check(x, 'ingen').ok, w, '"ingen" accepted although solutions exist');
      }
      for (const t of x.traps || []) { const r = M.check(x, String(t[0])); ok(!r.ok && r.msg === t[1], w, `trap "${t[0]}" does not give its message (got: ${r.msg})`); }
      continue;
    }
    if (type === 'choice') {
      ok(Array.isArray(x.opts) && x.opts.includes(x.a), w, 'choice answer not among options');
      ok(new Set(x.opts).size === x.opts.length, w, 'duplicate options');
      ok(M.check(x, x.a).ok, w, 'choice answer rejected');
      for (const o of x.opts) if (o !== x.a) ok(!M.check(x, o).ok, w, 'wrong option accepted: ' + o);
    }
    if (type === 'expr') {
      let parsed = true; try { M.parse(x.a, ['x', 'a', 'b', 'y']); } catch (err) { parsed = false; }
      ok(parsed, w, 'expression answer does not parse');
      ok(M.check(x, x.a).ok, w, 'expression answer rejected');
      ok(!M.check(x, x.a + '+1').ok, w, 'expression +1 accepted');
      ok(x.form || /förenkla|faktorisera|multiplicera|skriv/i.test(x.q), w, 'expression task should state the expected form');
    }
    if (type === 'sci') {
      const [m, n] = x.a; ok(Math.abs(m) >= 1 && Math.abs(m) < 10 && Number.isInteger(n), w, 'invalid scientific answer');
      ok(M.check(x, { m: sv(m), e: String(n) }).ok, w, 'scientific canonical rejected');
      ok(!M.check(x, { m: sv(m * 10), e: String(n - 1) }).ok, w, 'non-normalised scientific accepted');
    }
    // traps: must be wrong and must return their own message
    for (const t of x.traps || []) {
      const input = type === 'num' ? sv(t[0]) : String(t[0]);
      const r = M.check(x, input);
      ok(!r.ok, w, `trap ${t[0]} is accepted as correct`);
      ok(r.msg === t[1], w, `trap ${t[0]} does not give its message (got: ${r.msg})`);
    }
  }
}
// visual types used vs available
const used = new Set(); for (const s of ALL) for (const v of [s.cvis, s.ex.vis, s.g.vis, ...s.p.map(p => p.vis)].filter(Boolean)) used.add(v.t);
const unknown = [...used].filter(t => !V.types.includes(t)); ok(unknown.length === 0, 'visuals', 'unknown types ' + unknown);

// Regression: the v4 "42 · 71 m" bug class — given/find are explicit data now; ensure no given contains a bare " m" unit inferred from words
for (const s of ALL) for (const x of [s.g, ...s.p]) for (const gv of x.given || []) ok(!/\b\d+\s*·\s*\d+\s*m$/.test(gv), s.id, 'suspicious given: ' + gv);

console.log(`Moment: ${ALL.length} (åk 9: ${S9.length}, åk 8: ${S8.length})`);
console.log(`Uppgifter (guidad + övning): ${exercises}  · genomgångna exempel: ${ALL.length}`);
console.log(`Kontroller: ${checks}`);

// ---- Täckningsmatris mot originalplanerna ----
{
  const COV = require(path.join(__dirname, 'coverage.js'));
  const byId = new Map(ALL.map(x => [x.id, x]));
  const count = { COMPLETE: 0, PARTIAL: 0, MISSING: 0 };
  for (const [g, w, item, sk, st] of COV) {
    const W = `täckning ${g}/v${w} "${item}"`;
    count[st]++;
    ok(st !== 'MISSING', W, 'MISSING kvar');
    ok(st === 'PARTIAL' || sk.length > 0, W, 'COMPLETE utan moment');
    for (const id of sk) {
      if (id.startsWith('ENGINE:')) continue;
      const k = byId.get(id);
      ok(!!k, W, 'okänt moment-id ' + id);
      if (k && w) ok(k.w.includes(w) || ALL.some(x => x.id === id && Math.abs(Math.min(...x.w) - w) <= 4), W, `vecka ${w} ej nära ${id} (${k.w})`);
      if (k) ok(k.id.startsWith(g === 9 ? 's9-' : 'f8-'), W, 'fel årskurs för ' + id);
    }
  }
  const used = new Set(COV.flatMap(r => r[3]));
  for (const x of ALL) ok(used.has(x.id), x.id, 'moment saknas i täckningsmatrisen (föräldralöst)');
  console.log(`Täckning mot originalplan: ${COV.length} punkter · COMPLETE ${count.COMPLETE} · PARTIAL ${count.PARTIAL} · MISSING ${count.MISSING}`);
}
// ---- Förmågor (Begrepp B, Metod M, Problemlösning P, Resonemang R, Kommunikation K) ----
{
  const tot = { B: 0, M: 0, P: 0, R: 0, K: 0 };
  for (const x of ALL) for (const e of [x.g, ...x.p]) for (const a of (e.ab || [])) tot[a]++;
  const tagged = ALL.filter(x => [x.g, ...x.p].some(e => (e.ab || []).length)).length;
  const withRK = ALL.filter(x => [x.g, ...x.p].some(e => (e.ab || []).some(a => a === 'R' || a === 'K'))).length;
  console.log(`Förmågetaggar (explicita): B ${tot.B} · M ${tot.M} · P ${tot.P} · R ${tot.R} · K ${tot.K} · moment med taggar ${tagged}/${ALL.length} · moment med R/K ${withRK}/${ALL.length}`);
  ok(tot.R >= 30 && tot.K >= 15 && tot.P >= 20, 'förmågor', 'för få R/K/P-uppgifter');
}
console.log(`Diagramtyper som används: ${used.size}`);
if (fails.length) { console.log(`\nFEL (${fails.length}):`); fails.forEach(f => console.log(' ✗ ' + f)); process.exit(1); }
console.log('\nALLA KONTROLLER GODKÄNDA ✓');
