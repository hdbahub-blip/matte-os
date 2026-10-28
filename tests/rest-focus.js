/* Regression: urgent restprov, profile isolation and school-safe notation. Run: node tests/rest-focus.js */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../js/engine.js');
const S9 = require('../js/content9.js');
const oldNow = global.__MO_NOW;
const oldStorage = global.localStorage;
const entries = {};
global.localStorage = {
  getItem: k => entries[k] ?? null,
  setItem: (k,v) => { entries[k] = String(v); },
  removeItem: k => { delete entries[k]; }
};
global.__MO_NOW = '2026-10-21T18:00:00+01:00';
let count = 0;
function ok(condition, label) { assert.ok(condition, label); count++; }
try {
  E._reset();
  E.state().active = 'grade9';
  ok(E.recommend('grade9').chapter === 's9-geo', 'autumn curriculum baseline');
  E.prof('grade9').rests['rest-s9-tal'] = { date: '2026-10-22', done: false };
  E.prof('grade9').attempts.push({s:'s9-powers',x:'p0',ok:true,h:0,m:'train',t:91234});
  E.save();
  ok(E.recommend('grade9').chapter === 's9-tal', 'urgent restprov takes priority');
  ok(E.recommend('grade9').reason.includes('1 dagar'), 'one-day urgency');
  ok(E.recommend('grade8').chapter !== 's9-tal', 'grade 8 not overridden');
  E._reset();
  ok(E.prof('grade9').attempts.some(a=>a.t===91234), 'prior learning preserved');
  ok(E.prof('grade9').rests['rest-s9-tal'].date === '2026-10-22', 'deadline preserved');
  ok(!E.prof('grade8').attempts.some(a=>a.t===91234), 'profile separation');
  const sqrt = S9.find(s=>s.id==='s9-sqrt').f;
  ok(sqrt.main.includes('\\sqrt{81}'), 'square root main formula');
  ok(sqrt.forms.some(row=>row[1].includes('\\pm 7')), 'x²=49 has both solutions');
  ok(!sqrt.forms.some(row=>row[1].includes('x = \\sqrt{x^2}')), 'avoid invalid reverse square root rule');
  const prefix = S9.find(s=>s.id==='s9-prefix').f;
  ok(prefix.sym.some(row=>row[0].includes('centi')), 'centi is documented');
  const app = fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
  ok(app.includes('Starta fem frågor') && app.includes('urgentRest ?'), 'urgent home has single-step action');
  ok(app.includes('<details class="fold"><summary>Välj vad du behöver förstå'), 'choices can stay collapsed');
  console.log('Rest-focus QA: '+count+'/'+count+' PASS');
} finally {
  global.__MO_NOW = oldNow;
  global.localStorage = oldStorage;
  E._reset();
}
