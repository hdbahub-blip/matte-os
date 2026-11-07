'use strict';
// Minnesknep (issue #21): semantic and arithmetic QA of every memory anchor, its limits and its transfer tasks.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const read = p => fs.readFileSync(p, 'utf8');
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const store = {}; const ctx = { localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } }, Date, Math, JSON, Number, String, Object, Array, Set, Function, console };
ctx.window = ctx; ctx.globalThis = ctx;
vm.runInNewContext(read('js/knep.js'), ctx, { timeout: 2000 });
const K = ctx.MOKnep, X = K._test;
const ids = new Set([...read('js/content8.js').matchAll(/\bid:\s*'((?:f8|s9)-[^']+)'\s*,\s*ch:/g), ...read('js/content9.js').matchAll(/\bid:\s*'((?:f8|s9)-[^']+)'\s*,\s*ch:/g)].map(x => x[1]));
ok(ids.size === 63, '63 curriculum skills');
ok(K.KNEP.length >= 8, 'At least eight memory anchors');
const seen = new Set(), skillOwner = {};
for (const k of K.KNEP) {
  ok(!seen.has(k.id), 'unique id ' + k.id); seen.add(k.id);
  ok(k.anchor.length >= 20 && k.anchor.length <= 140, 'anchor short but complete: ' + k.id);
  ok(k.why.length >= 2 && k.why.length <= 3 && k.why.every(w => w.length < 160), 'two or three short reasons: ' + k.id);
  ok(k.works.length > 20 && k.fails.length > 20, 'states when it works and when it does not: ' + k.id);
  ok(/\d/.test(k.fails), 'limit is shown with a concrete counterexample: ' + k.id);
  ok(k.trap.wrong && k.trap.fix && k.trap.wrong !== k.trap.fix, 'typical mistake with correction: ' + k.id);
  ok(k.tasks.length === 2, 'two new transfer tasks: ' + k.id);
  for (const t of k.tasks) {
    const v = X.value(t); ok(Number.isFinite(v), 'computable answer: ' + t.q);
    ok(X.checkTask(t, X.fmt(v)), 'Swedish formatted answer accepted: ' + t.q + ' → ' + X.fmt(v));
    ok(X.checkTask(t, String(v).replace('.', ',')) || Math.abs(v - Math.round(v * 1e6) / 1e6) > 0, 'comma answer accepted: ' + t.q);
    ok(!X.checkTask(t, X.fmt(v + 1)), 'off-by-one rejected: ' + t.q);
    ok(t.explain.includes(X.fmt(v).replace('−', '−')) || t.explain.includes(X.fmt(Math.abs(v))), 'explanation shows the computed answer: ' + t.q);
    ok(!t.q.includes(X.fmt(v)) || /^[0-9]$/.test(X.fmt(v)), 'question does not reveal its answer: ' + t.q);
    if (t.unit) ok(X.checkTask(t, X.fmt(v) + ' ' + t.unit), 'unit accepted: ' + t.q);
  }
  const visible = [k.anchor, ...k.why, k.works, k.fails, k.trap.wrong, k.trap.fix].join(' ');
  for (const t of k.tasks) { const v = X.fmt(X.value(t)), esc = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hit = Math.abs(X.value(t)) >= 10 ? new RegExp('(^|[^\\d,])' + esc + '(?![\\d,])').test(visible) : new RegExp('(=|→)\\s*' + esc + '(?![\\d,])').test(visible);
    ok(!hit, 'visible text does not reveal transfer answer ' + v + ' in ' + k.id); }
  ok(k.recall.options.length === 3 && new Set(k.recall.options).size === 3, 'recall has three distinct options: ' + k.id);
  const d = X.displayOrder(k); ok(d.length === 3 && new Set(d).size === 3, 'recall order is a permutation');
  for (const s of k.skills) { ok(ids.has(s), 'skill exists: ' + s); ok(!skillOwner[s], 'one anchor per skill: ' + s); skillOwner[s] = k.id; }
  ok(!/nollor|decimalplatser|flytta kommat/i.test(k.anchor + k.why.join(' ')), 'no unexplained shortcut in ' + k.id);
}
// Correct answers are not always first on screen.
ok(K.KNEP.filter(k => X.displayOrder(k)[0] === 0).length < K.KNEP.length, 'correct recall option is not always first');
// Required content from issue #21.
const ri = K.KNEP.find(k => k.id === 'runt-inuti');
ok(/RUNT/.test(ri.anchor) && /INUTI/.test(ri.anchor) && /cm²/.test(ri.anchor), 'runt/inuti with unit contrast');
ok(ri.why.join(' ').includes('4 + 3 + 4 + 3 = 14 cm') && ri.why.join(' ').includes('12 cm²'), '4 × 3 worked example');
ok(ri.tasks.map(X.value).join() === '16,15', 'new 5 × 3 variant: perimeter 16, area 15');
const pw = K.KNEP.find(k => k.id === 'lilla-siffran');
ok(pw.why.join(' ').includes('10 · 10 = 100') && /en tiondel av en tiondel/.test(pw.why.join(' ')) && pw.why.join(' ').includes('0,01'), '10² and (0,1)² explained');
ok(X.value(pw.tasks[0]) === 1000 && Math.abs(X.value(pw.tasks[1]) - 0.001) < 1e-12, 'transfer to 10³ and (0,1)³');
const nine = K.KNEP.find(k => k.id === 'nio-knep');
ok(nine.why.join(' ').includes('70 − 7 = 63') && !nine.tasks[0].q.includes('72'), '9 · 7 example and 9 · 8 without shown answer');
const mp = K.KNEP.find(k => k.id === 'minus-potens');
ok(X.value(mp.tasks[0]) === 4 && X.value(mp.tasks[1]) === -4, '(−2)² vs −2²');
const rot = K.KNEP.find(k => k.id === 'rot-tva-svar');
ok(X.value(rot.tasks[0]) === 9 && X.value(rot.tasks[1]) === -9 && /aldrig negativt/.test(rot.anchor), 'principal root vs equation solutions');
const sk = K.KNEP.find(k => k.id === 'skala-riktningar');
ok(X.value(sk.tasks[0]) === 16 && X.value(sk.tasks[1]) === 27 && /bara en sida/i.test(sk.fails), 'scale factor with limit');
// Number parsing: Swedish input forms.
ok(X.parseNum('1 000') === 1000 && X.parseNum('0,001') === 0.001 && X.parseNum('−4') === -4 && X.parseNum('10 000 cm²') === 10000, 'Swedish number formats');
ok(Number.isNaN(X.parseNum('')) && Number.isNaN(X.parseNum('abc')) && Number.isNaN(X.parseNum('2+2')), 'non-numbers rejected');
// Storage: only first results and dates, sanitised, no free text; per profile.
const now = Date.now();
X.setStore({ v: 1, profiles: { grade9: { 'runt-inuti': { t0: { at: now - 2 * 86400000, ok: true, text: 'hej' }, t1: { at: now - 2 * 86400000, ok: true }, note: 'x' }, bogus: { t0: { at: now, ok: true } } }, evil: {} } });
const st = X.getStore();
ok(JSON.stringify(st).indexOf('hej') < 0 && !st.profiles.evil && !st.profiles.grade9.bogus && !st.profiles.grade9['runt-inuti'].note, 'sanitised store keeps no free text or unknown keys');
ok(K.status(ri, 'grade9').due === true && K.dueCount('grade9') === 1 && K.dueCount('grade8') === 0, 'due after one day, per profile');
st.profiles.grade9['runt-inuti'].recall = { at: now, ok: true, n: 1 }; X.setStore(st);
ok(K.status(ri, 'grade9').level === 3 && /Mindes efter 2 dagar/.test(K.status(ri, 'grade9').label), 'remembered later is a separate, stronger status');
X.setStore({ v: 1, profiles: { grade9: { 'runt-inuti': { t0: { at: now, ok: true }, t1: { at: now, ok: true } } } } });
ok(K.status(ri, 'grade9').level === 2 && !K.status(ri, 'grade9').due, 'same-day success is not called remembered');
X.setStore({ v: 1, profiles: { grade9: { 'runt-inuti': { t0: { at: now - 3 * 86400000, ok: true } } } } });
ok(K.status(ri, 'grade9').level === 1 && !K.status(ri, 'grade9').due, 'one of two tasks is not credited as mastered');
X.setStore({ v: 1, profiles: { grade9: { 'runt-inuti': { t0: { at: now, ok: false } } } } });
ok(K.status(ri, 'grade9').level === 1, 'wrong first try → practise again');
X.setStore({ v: 9 }); ok(Object.keys(X.getStore().profiles.grade9).length === 0, 'unknown version ignored, not crashed');
// Rendering: card for a lesson hides answers until the learner has tried.
X.setStore({ v: 1, profiles: { grade8: {}, grade9: {} } }); X.resetUi();
const card = K.card('f8-perimeter');
ok(card.includes('Omkrets eller area?') && card.includes('Varför fungerar det?') && card.includes('När fungerar det inte?'), 'lesson card has anchor, why and limit');
ok(!/Rätt svar|Rätt –/.test(card) && !card.includes('= 14 cm.') , 'answers of transfer tasks hidden before an attempt');
ok(K.card('f8-equations') === '', 'no card where no anchor fits (not copied mechanically)');
const page = K.page();
ok(K.KNEP.every(k => page.includes(k.title.replace(/&/g, '&amp;'))), 'Minnesknep page lists every anchor');
ok(page.includes('affischer/?visa=formler') && /valfritt/.test(page), 'poster remains reachable as optional');
// Content fixes from the audit.
const c9 = read('js/content9.js'), c8 = read('js/content8.js'), ts = read('js/teach-simple.js'), post = read('affischer/index.html');
ok(!c9.includes("Varje steg i prefixtrappan = 1000"), 'false universal prefix rule removed');
ok(/centi och deci är steg om 10/.test(c9), 'prefix anchor states where steps are 10');
ok(!/1 och 3 nollor|1 följt av 3 nollor|n decimaler/.test(c8 + c9), 'zero-count shortcuts replaced by repeated multiplication');
ok(!/två decimaler totalt|En etta följd av|Fyra nollor/.test(post), 'poster explanations no longer rely on counting shortcuts');
ok(post.includes('../#/knep') && post.includes('id="poster-formler8"') && post.includes('data-poster="tabeller"'), 'poster kept, links to Minnesknep, tables poster intact');
ok(/10 − 4 \+ 1/.test(ts) && !/Förenkla 5 − \(2 \+ 1\)/.test(ts), 'minus-parenthesis example now demonstrates the sign change');
// Wiring and offline.
const app = read('js/app.js'), idx = read('index.html'), sw = read('sw.js');
ok(idx.indexOf('js/knep.js?v=5.5.6') > 0 && idx.indexOf('js/knep.js') < idx.indexOf('js/app.js'), 'knep.js loaded before app.js');
ok(sw.includes("./js/knep.js?v=5.5.6"), 'knep.js cached offline');
ok(app.includes("case 'knep'") && app.includes('KNEP.card(s.id)'), 'route and lesson card wired');
ok(!/matteos\.(v5|larande|sprak|cup)/.test(read('js/knep.js').replace("'matteos.knep.v1'", '')), 'Minnesknep never touches other stores');
console.log('MINNESKNEP QA ' + n + '/' + n + ' PASS (' + K.KNEP.length + ' knep, ' + K.KNEP.length * 2 + ' transfer tasks)');
