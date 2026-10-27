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
    ok(['num', 'choice', 'expr', 'sci'].includes(type), w, 'bad type');
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
console.log(`Diagramtyper som används: ${used.size}`);
if (fails.length) { console.log(`\nFEL (${fails.length}):`); fails.forEach(f => console.log(' ✗ ' + f)); process.exit(1); }
console.log('\nALLA KONTROLLER GODKÄNDA ✓');
