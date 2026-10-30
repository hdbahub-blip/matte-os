'use strict';
// Regression guard for book-based Tal lesson navigation, low-friction guided work and cache consistency.
const fs = require('fs');
const assert = require('assert');
const read = p => fs.readFileSync(p, 'utf8');
const app = read('js/app.js');
const content = read('js/content9.js');
const index = read('index.html');
const sw = read('sw.js');
const core = read('js/core.js');
const provIndex = read('prov/index.html');
const provSw = read('prov/sw.js');
const bookLinks = ['s9-scientific','s9-sci-calc','s9-prefix','s9-sqrt','s9-number-sets'];
for (const id of bookLinks) {
  assert(content.includes("id: '" + id + "'"), 'Missing teaching skill ' + id);
  assert(app.includes('href="#/l/' + id + '/0"'), 'Missing book link ' + id);
}
const chapter = app.slice(app.indexOf('function viewChapter('), app.indexOf('/* ================= FORMLER'));
const rest = app.slice(app.indexOf('function viewRest('), app.indexOf('/* ================= INSTÄLLNINGAR'));
assert(!chapter.includes('bookGuide'), 'Book guide leaked into generic chapter route');
assert(rest.includes('${bookGuide}<details'), 'Book guide not rendered on rest page');
assert(rest.includes("join('')}</div></details>"), 'Missing closing tags in rest page');
assert(app.includes('const restFocus ='), 'No upcoming restprov priority');
assert(app.includes('Andra sätt att öva'), 'Secondary home features are not collapsed');
assert(app.includes('Alla moment i kapitlet'), 'Hidden advanced topic list missing');
assert(app.includes('const showCalc = ready;'), 'Guided calculation is blocked by extra controls');
assert(app.includes('const ready = true;'), 'Given/find requires avoidable clicks');
assert(!content.includes(String.raw`main: 'x^2 = a \\Rightarrow x = \\sqrt{a}'`), 'Principal-root error returned');
assert(content.includes('det icke-negativa tal'), 'Principal square root must allow zero');
assert(content.includes(String.raw`x = \\sqrt{a} \\text{ eller } x = -\\sqrt{a}`), 'Quadratic solutions are incomplete');
for (const [path, src] of [['index',index],['root-worker',sw],['core',core]]) {
  assert(src.includes('5.5.0'), path + ': stale core version');
}
for (const [path, src] of [['prov',provIndex],['prov-worker',provSw]]) {
  assert(src.includes('5.4.5'), path + ': unexpectedly changed independent prov shared asset version');
}
assert(provIndex.includes('1.2.4') && provSw.includes('1.2.4'), 'Prov worker/build version mismatch');
console.log('Book-first and PWA version consistency: PASS');
