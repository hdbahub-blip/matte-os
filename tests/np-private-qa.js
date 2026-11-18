'use strict';
// Statisk säkerhet och innehåll för NP-modulen: ingen skoltext i öppna filer, ingen nätverksanvändning, innehållskvalitet.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),cp=require('node:child_process');
global.window=global;
let n=0;const ok=(c,m)=>{n++;assert(c,m);};
const read=p=>fs.readFileSync(p,'utf8');
// 1. Läckageskydd: inga 6-ordsföljder ur skoltexten/romanen i någon spårad fil (jämförs som hashar).
const hashes=new Set(JSON.parse(read('tests/np-leak-hashes.json')));
const words=t=>t.toLowerCase().match(/[a-zåäöéèü0-9]+(?:[-'’][a-zåäöéèü0-9]+)*/g)||[];
const files=cp.execSync('git ls-files -co --exclude-standard',{encoding:'utf8'}).split('\n').filter(f=>f&&!/\.(png|jpe?g|ico|webp|woff2?|webmanifest)$/i.test(f)&&f!=='tests/np-leak-hashes.json'&&!f.startsWith('node_modules/')&&fs.existsSync(f));
let scanned=0;
for(const f of files){let t;try{t=read(f);}catch(e){continue;}scanned++;const w=words(t);for(let i=0;i+5<w.length;i++){const h=crypto.createHash('sha256').update(w.slice(i,i+6).join(' ')).digest('hex').slice(0,16);if(hashes.has(h))assert.fail('Skoltext/romantext hittad i spårad fil '+f+' nära ord '+i+': ('+w.slice(i,i+6).join(' ').slice(0,0)+'…)');}}
ok(scanned>100&&hashes.size>500,'leak guard active over '+scanned+' files / '+hashes.size+' hashes');
// 2. Öppna filer: ingen nätverksanvändning från NP-sidan, ingen inline-skoltext, giltig syntax.
const app=read('lara/np-app.js'),core=read('lara/np-core.js'),content=read('lara/np-content.js'),html=read('lara/np-muntligt.html'),cloud=read('lara/np-cloud.js'),sw=read('lara/sw.js'),entry=read('lara/app.js');
for(const [name,src] of [['np-app',app],['np-core',core],['np-content',content],['html',html]]){ok(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|\.from\('study_/.test(src),name+': no network use');}
for(const f of ['lara/np-app.js','lara/np-core.js','lara/np-content.js','lara/np-cloud.js'])new vm.Script(read(f),{filename:f});
ok(html.includes('np-core.js')&&html.includes('np-content.js')&&html.includes('np-app.js')&&html.indexOf('np-core.js')<html.indexOf('np-app.js'),'scripts in order');
ok(/localStorage/.test(app)&&app.includes('esc('),'local storage + output escaping');
ok(!/innerHTML\s*=\s*[^;]*\bnotes\[/.test(app),'notes never injected raw');
ok(entry.includes('np-muntligt.html')&&!entry.includes('np-muntligt.html?v=1.1.0'),'entry linked from Svenska');
for(const f of ['np.css','np-core.js','np-content.js','np-app.js','np-cloud.js','np-muntligt.html'])ok(sw.includes('./'+f+'?v=2.0.0'),'offline cache lists '+f);
ok(/matteos-private-np-2/.test(app)&&/matteos-private-np-1/.test(cloud)&&/matteos-private-np-2/.test(cloud),'cloud accepts v1 and v2 snapshots');
ok(!/study_snapshots[\s\S]{0,40}delete\(/.test(cloud),'cloud helper never deletes rows');
// 3. Innehållskvalitet
const C=require('../lara/np-content.js');
ok(C.roles.length===3&&C.quiz.length===6&&C.quiz.every(q=>C.roles.some(r=>r.id===q.a)),'roles + quiz consistent');
ok(C.quiz.filter(q=>q.a==='present').length===2&&C.quiz.filter(q=>q.a==='lead').length===2,'quiz balanced');
ok(C.leadSims.length===5&&C.leadSims.every(s=>s.options.length===3&&s.options.filter(o=>o.good).length===1&&s.options.every(o=>o.why.length>30)),'sims: exactly one good option with reasons');
const pos=new Set(C.leadSims.map(s=>s.options.findIndex(o=>o.good)));ok(pos.size>=3,'correct option position varies');
ok(C.joinTexts.length===3&&C.joinTexts.every(t=>{const w=words(t.text).length;return w>=60&&w<=160&&t.ideas.length===3&&['recap','link','q','build'].every(k=>t.strong[k]&&t.strong[k].length>20);}),'three original unseen texts with worked examples');
ok(new Set(C.joinTexts.map(t=>t.genre)).size===3,'different genres');
const K=require('../lara/np-core.js');
ok(C.joinTexts.every(t=>K.questionKind(t.strong.q).open&&K.questionKind(t.strong.q).ok),'worked-example questions are open questions');
ok(C.model.answers.length===3&&['weak','mid','strong'].every(t=>C.model.answers.some(a=>a.tag===t)),'model: weak/mid/strong');
ok(K.analyse(C.model.answers.find(a=>a.tag==='weak').t).count===0&&K.analyse(C.model.answers.find(a=>a.tag==='mid').t).count===3&&K.analyse(C.model.answers.find(a=>a.tag==='strong').t).count===4,'model answers match the ingredient detector');
ok(C.objections.length>=10&&C.objections.every(o=>o.length>10),'objection cards');
ok(C.typeOfQuestion.length===5&&C.typeOfQuestion.every(t=>C.helpByType[t]&&C.helpByType[t].stems.length&&C.helpByType[t].asks.length),'help ladder per question type');
ok(/inte provet|Det här är din privata övning/.test(C.frame)&&/Skolverket/.test(C.frame),'frame: official source named, not claimed to be the exam');
const all=JSON.stringify(C);ok(!/Texas|André|Amy|Instagram|Lasse|Osman/.test(all+app+core),'public content does not name the school text');
console.log('NP STATIC QA PASS: '+n+' checks');
