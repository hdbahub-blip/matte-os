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
assert(/både/.test(hints['s9-area-scale']),'Area scale does not mention two dimensions');n++;
assert(/utsida/.test(hints['f8-surface-area']),'Surface area lacks faces/outsides');n++;
assert(/procentenheter/.test(hints['s9-percentage-points']),'Percentage points is mislabeled');n++;
console.log('HINT MAPPING '+n+'/'+n+' PASS');
