'use strict';
// Verify all explicit pedagogical overrides refer to real curriculum skills and do not misroute concepts.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('js/app.js','utf8');
const match=/const HINT_BY_SID = \{([\s\S]*?)\n  \};/.exec(app);
assert(match,'Explicit HINT_BY_SID list missing or incorrectly formatted');
const hints=vm.runInNewContext('({' + match[1] + '})',{}, {timeout:1000});
const skills=new Set();
for (const path of ['js/content8.js','js/content9.js'])
  for(const m of fs.readFileSync(path,'utf8').matchAll(/\bid:\s*'((?:f8|s9)-[^']+)'/g)) skills.add(m[1]);
assert.equal(skills.size,63,'Expected all 63 original curriculum items');
let n=0;
for (const [sid,hint] of Object.entries(hints)) {
  assert(skills.has(sid),'Unknown skill in hint override: '+sid);n++;
  assert(typeof hint==='string'&&hint.length>26&&hint.length<240,'Unclear or overly long hint for '+sid);n++;
  assert(!/\d+\s*[×=]\s*\d+/.test(hint),'Hint is a worked answer: '+sid);n++;
}
assert(!/kanten|runt|omkrets/.test(hints['f8-circle-area']),'Area hint still teaches perimeter');n++;
assert(!/nollor|decimalplatser/.test(hints['f8-powers']+' '+hints['s9-powers']),'Powers hint still uses shortcut');n++;
assert(/tre/.test(hints['s9-volume-scale']),'Volume scale does not mention all three dimensions');n++;
assert(/både/i.test(hints['s9-area-scale']),'Area scale does not mention two dimensions');n++;
assert(/utsida/.test(hints['f8-surface-area']),'Surface area lacks faces/outsides');n++;
assert(/procentenheter/.test(hints['s9-percentage-points']),'Percentage points is mislabeled');n++;
// Every curriculum item, including those routed by fallback patterns, must get a safe first hint.
const fn=/(const HINT_BY_SID = \{[\s\S]*?\n  \};\s*function gentleHint[\s\S]*?\n  \})/.exec(app);
assert(fn,'gentleHint function missing');
const gentle=vm.runInNewContext(fn[1]+';gentleHint',{}, {timeout:1000});
for (const sid of skills) {
  const h=gentle(sid);
  assert(typeof h==='string'&&h.length>26&&h.length<240,'Unclear first hint for '+sid);n++;
  assert(!/\d+\s*[×=]\s*\d+/.test(h),'First hint is a worked answer: '+sid);n++;
  assert(!/nollor|decimalplatser/.test(h),'First hint uses the zero/decimal-place shortcut: '+sid);n++;
}
for (const sid of ['f8-fractions-multiply','f8-fractions-divide'])
  assert(!/lika stora delar|gemensam nämnare|skriva om dem/.test(gentle(sid)),'Fraction '+sid+' hint wrongly requires equal denominators'),n++;
assert(!/hela mängden\?/.test(gentle('s9-percent-whole'))&&/okänt/.test(gentle('s9-percent-whole')),'Percent whole hint treats the unknown whole as given');n++;
assert(!/tiondel/.test(gentle('s9-percent-part')+gentle('s9-percent-problem')),'Percent hint only works for multiples of ten');n++;
// Every curriculum moment gets a subject-specific first hint; the generic fallback is only for future skills.
const generic=gentle('zz-unknown-skill');
for (const sid of skills) assert.notEqual(gentle(sid),generic,'Curriculum moment falls back to the generic hint: '+sid),n++;
console.log('HINT MAPPING '+n+'/'+n+' PASS');
