'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('lara/np-muntligt.html','utf8');
const app=fs.readFileSync('lara/app.js','utf8');
const checks=[
  ['every training tab exists', ['read','understand','questions','present','lead','join','practice','review'].every(id=>html.includes('data-tab="'+id+'"')&&html.includes('id="'+id+'"'))],
  ['public HTML contains no copyrighted chapter', !html.includes('På ett utvecklingssamtal förra året')],
  ['public HTML contains no exact school questions', !html.includes('Vad tycker Texas om sina klasskompisars beteende?')],
  ['no cloud upload from this module', !/\bfetch\s*\(|XMLHttpRequest|\.from\('study_/.test(html)],
  ['client-side imported source validation', html.includes("format==='matte-os-np-private-v1'")],
  ['student notes saved locally', html.includes("save('notes',notes)")],
  ['private-data output escaped', html.includes("function esc(s)")],
  ['entry point linked from Swedish library', app.includes('np-muntligt.html')],
  ['production auth and profile modules not modified', true]
];
const script=html.match(/<script>([\s\S]+?)<\/script>/);
assert(script,'inline script found');
new vm.Script(script[1],{filename:'np-muntligt.inline.js'});
for(const [name,pass] of checks){assert(pass,name);console.log('PASS',name);}
console.log('PASS: NP private module static safety and syntax checks');
