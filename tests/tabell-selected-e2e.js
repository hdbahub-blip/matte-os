'use strict';
/* Self-selected multiplication tables: mobile, independently checked. */
const {chromium,webkit,firefox,devices}=require('playwright');
const assert=require('node:assert/strict');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/$/,'');
const engine=process.argv[3]||'chromium';
if(!['chromium','webkit','firefox'].includes(engine))throw Error('Unknown browser '+engine);
(async()=>{
 const browser=await ({chromium,webkit,firefox})[engine].launch({headless:true});
 let checks=0;
 try{
  // Firefox Playwright does not support isMobile; test equal viewport width without it.
  const device=engine==='firefox'?{viewport:{width:390,height:844},deviceScaleFactor:2}:devices['iPhone 13'];
  const context=await browser.newContext({...device,serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  if(await page.locator('[data-p="grade8"]').count())await page.locator('[data-p="grade8"]').click();
  await page.goto(base+'/#/tabell/selftest',{waitUntil:'domcontentloaded'});
  const arena=page.locator('#arena');
  await arena.locator('[data-act="selectedTable"][data-value="3"]').waitFor();
  assert.equal(await arena.locator('[data-act="selectedStart"]').isDisabled(),true);checks++;
  for(const t of [3,6,9])await arena.locator('[data-act="selectedTable"][data-value="'+t+'"]').click();
  assert.equal(await arena.locator('[data-act="selectedCount"][data-value="20"]').isDisabled(),false);checks++;
  await arena.locator('[data-act="selectedCount"][data-value="20"]').click();
  assert.equal(await arena.locator('[data-act="selectedStart"]').isDisabled(),false);checks++;
  await arena.locator('[data-act="selectedStart"]').click();
  await arena.locator('#answer').waitFor();
  const counts={3:0,6:0,9:0},seen=new Set();
  for(let i=0;i<20;i++){
   const question=(await arena.locator('.equation').innerText()).replace(/\s+/g,' ').trim();
   const m=question.match(/^(\d+)\s*×\s*(\d+)\s*=\s*\?$/);
   assert(m,'Unexpected question '+question);checks++;
   const a=Number(m[1]),b=Number(m[2]);
   assert(Object.hasOwn(counts,a),'Unselected table appeared: '+a);checks++;
   counts[a]++;seen.add(a+'x'+b);
   assert.equal(await arena.locator('.feedback').count(),0,'No early correction');checks++;
   await arena.locator('#answer').fill(String(a*b));
   await arena.locator('#answerform button').click();
  }
  assert.equal(seen.size,20,'No repeated equation');checks++;
  assert(Object.values(counts).every(n=>n>=6&&n<=7),'Balanced coverage '+JSON.stringify(counts));checks++;
  assert.match(await arena.locator('.stat').innerText(),/20\/20/);checks++;
  assert.match(await arena.locator('.selected-breakdown').innerText(),/3:ans tabell[\s\S]*6:ans tabell[\s\S]*9:ans tabell/);checks++;
  const saved=await page.evaluate(()=>window.MOEngine.prof('grade8').tables.sessions.slice(-1)[0]);
  assert.deepEqual(saved.selectedTables,[3,6,9]);checks++;
  assert.equal(saved.correctFirst,20);checks++;
  const overflow=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
  assert(overflow[0]<=overflow[1]+2,'Mobile overflow '+overflow);checks++;
  assert.deepEqual(errors,[],'Browser JS errors');checks++;
  await arena.locator('[data-to="selftest"]').click();

  await arena.locator('[data-act="selectedCount"][data-value="all"]').click();
  assert.match(await arena.locator('[data-act="selectedStart"]').innerText(),/30 frågor/);checks++;
  await arena.locator('[data-act="selectedStart"]').click();
  const seenFull=new Set(),perTable=new Map([[3,new Set()],[6,new Set()],[9,new Set()]]);
  for(let i=0;i<30;i++){
   const question=(await arena.locator('.equation').innerText()).replace(/\s+/g,' ').trim();
   const m=question.match(/^(\d+)\s*×\s*(\d+)\s*=\s*\?$/);
   assert(m,'Full-coverage question missing '+i+': '+question);checks++;
   const a=Number(m[1]),b=Number(m[2]);
   assert(perTable.has(a),'Unselected table '+a);checks++;
   perTable.get(a).add(b);seenFull.add(a+'x'+b);
   assert.equal(await arena.locator('.feedback').count(),0,'No early feedback in full mode');checks++;
   await arena.locator('#answer').fill(String(a*b));
   await arena.locator('#answerform button').click();
  }
  assert.equal(seenFull.size,30,'Unique questions for 3 selected tables');checks++;
  assert([...perTable.values()].every(vals=>vals.size===10),'Exactly ten factors for each selected table');checks++;
  assert.match(await arena.locator('.stat').innerText(),/30\/30/);checks++;
  const fullSaved=await page.evaluate(()=>window.MOEngine.prof('grade8').tables.sessions.slice(-1)[0]);
  assert.equal(fullSaved.selectionMode,'all');checks++;
  assert.equal(fullSaved.total,30);checks++;
  await arena.locator('[data-act="selectedAgain"]').click();
  assert.match(await arena.locator('.question-head').innerText(),/1 \/ 30/);checks++;
  await page.goto(base+'/#/tabell/selftest');
  await arena.locator('[data-act="selectedAll"]').click();
  assert.match(await arena.locator('[data-act="selectedStart"]').innerText(),/100 frågor/);checks++;
  await arena.locator('[data-act="selectedClear"]').click();

  assert.equal(await arena.locator('[data-act="selectedStart"]').isDisabled(),true);checks++;
  await arena.locator('[data-act="selectedTable"][data-value="7"]').click();
  assert.equal(await arena.locator('[data-act="selectedCount"][data-value="20"]').isDisabled(),true);checks++;
  await arena.locator('[data-act="selectedStart"]').click();
  assert.match(await arena.locator('.question-head').innerText(),/1 \/ 10/);checks++;
  await context.close();
  console.log('Selected tables '+engine+': '+checks+'/'+checks+' PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});