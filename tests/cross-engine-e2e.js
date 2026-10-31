'use strict';
/* Cross-engine release smoke: WebKit (Safari engine) and Firefox.
   These are real browser engines running in CI, NOT physical iOS/Android devices.
   Use synthetic profiles only. No live Supabase calls or production writes. */
const assert = require('node:assert/strict');
const { webkit, firefox, devices } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const configs = [
  ['webkit-iphone', webkit, { ...devices['iPhone 13'], serviceWorkers: 'block' }],
  ['firefox-desktop', firefox, { viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' }]
];
(async () => {
  let n = 0;
  for (const [name, engine, opts] of configs) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const [grade, sid] of [['grade8', 'f8-area'], ['grade9', 's9-powers']]) {
        const context = await browser.newContext(opts);
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        try {
          await page.goto(BASE, { waitUntil: 'domcontentloaded' });
          await page.locator('[data-p="' + grade + '"]').click();
          await page.locator('.calm-choices').waitFor();
          assert.equal(await page.locator('.calm-choice').count(), 3, name + ' home choices'); n++;

          await page.locator('.calm-choice[href="#/formler"]').click();
          await page.locator('h1:has-text("Förstå matte")').waitFor();
          assert.match(await page.locator('h1').first().innerText(), /Förstå matte/); n++;

          await page.goto(BASE + '#/l/' + sid + '/0', { waitUntil: 'domcontentloaded' });
          await page.locator('.paper-flow').waitFor();
          assert.equal(await page.locator('.paper-step:visible').count(), 3, name + ' ' + sid + ' lesson'); n++;
          assert.equal(await page.locator('.paper-answer:visible').count(), 1, name + ' answer'); n++;

          await page.goto(BASE + '#/l/' + sid + '/2', { waitUntil: 'domcontentloaded' });
          await page.locator('.paper-known').waitFor();
          assert.equal(await page.locator('#ans').count(), 1, name + ' guided input'); n++;

          await page.goto(BASE + '#/tabell/table/7', { waitUntil: 'domcontentloaded' });
          await page.locator('#arena .reference').waitFor();
          assert.equal(await page.locator('#arena .eqrow').count(), 10, name + ' 7 times table'); n++;

          // Reference-table self-testing: hide every answer, reveal a single product,
          // rehide it, switch tables, and restore all without affecting exercise progress.
          await page.locator('#arena [data-act="toggleStudyAnswers"]').click();
          assert.equal(await page.locator('#arena .answer-placeholder').count(), 10, name + ' hidden answers in 7 times table'); n++;
          assert.equal(await page.locator('#arena .answer').filter({hasText:'= 49'}).count(), 0, name + ' leaked hidden 7×7'); n++;
          await page.locator('#arena [data-act="toggleStudyRow"][data-value="7"]').click();
          assert.equal(await page.locator('#arena .answer-placeholder').count(), 9, name + ' individual reveal concealed others'); n++;
          assert.equal(await page.locator('#arena .answer').filter({hasText:'= 49'}).count(), 1, name + ' reveal 7×7'); n++;
          await page.locator('#arena [data-act="toggleStudyRow"][data-value="7"]').click();
          assert.equal(await page.locator('#arena .answer-placeholder').count(), 10, name + ' individual re-hide'); n++;
          await page.locator('#arena [data-to="home"]').first().click();
          await page.locator('#arena .tabtile[href="#/tabell/table/8"]').click();
          await page.locator('#arena .reference').waitFor();
          assert.equal(await page.locator('#arena .answer-placeholder').count(), 10, name + ' hide mode retained across tables'); n++;
          await page.locator('#arena [data-act="toggleStudyAnswers"]').click();
          assert.equal(await page.locator('#arena .answer-placeholder').count(), 0, name + ' show all products'); n++;

          await page.goto(BASE + '#/tabell/practice/7', { waitUntil: 'domcontentloaded' });
          await page.locator('#arena .equation').waitFor();
          const eq = await page.locator('#arena .equation').innerText();
          const nums = eq.match(/\d+/g).map(Number);
          await page.locator('#arena #answer').fill(String(nums[0] * nums[1]));
          await page.locator('#arena #answerform button').click();
          await page.locator('#arena .feedback').waitFor();
          assert.match(await page.locator('#arena .feedback').innerText(), /Rätt!/); n++;

          await page.goto(BASE + '#/cup', { waitUntil: 'domcontentloaded' });
          await page.locator('#cup >> css=[data-v=host]').click();
          await page.locator('#cup >> css=[data-act=create]').waitFor();
          assert.equal(await page.locator('#cup >> css=[data-act=create]').count(), 1, name + ' Cup host entry'); n++;

          const widths = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
          assert(widths[0] <= widths[1] + 2, name + ' horizontal overflow: ' + widths); n++;
          assert.deepEqual(errors, [], name + ' ' + grade + ' uncaught errors'); n++;

          // Timed same-device duel: each player has an oral window and facit reveals automatically.
          await page.goto(BASE + '#/tabell/duel/setup', { waitUntil: 'domcontentloaded' });
          await page.locator('#arena #duelform').waitFor();
          await page.locator('#arena [data-act="duelSubset"]').click();
          await page.locator('#arena [data-act="duelTable"][data-value="6"]').click();
          await page.locator('#arena [data-act="duelTable"][data-value="9"]').click();
          assert.equal(await page.locator('#arena [data-act="duelTable"][aria-pressed=true]').count(), 2, name + ' multiple table selection'); n++;
          await page.locator('#arena #player1').fill('Alex');
          await page.locator('#arena #player2').fill('Sam');
          await page.locator('#arena #duelform button[type=submit]').click();
          await page.locator('#arena [data-act="buzz"][data-value="1"]').click();
          assert.equal(await page.locator('#arena [data-act="awardDuel"]').count(), 0, name + ' premature scoring'); n++;
          assert.equal(await page.locator('#arena [data-act="revealDuel"]').count(), 0, name + ' manual reveal should not be required'); n++;
          await page.locator('#arena .judge h2').filter({hasText:'Sam svarar först!'}).waitFor();
          assert.equal(await page.locator('#arena #duel-clock').count(), 1, name + ' first visible countdown'); n++;
          await page.locator('#arena .judge h2').filter({hasText:'Alex får svara nu!'}).waitFor({timeout:12000});
          assert.equal(await page.locator('#arena #duel-clock').count(), 1, name + ' second visible countdown'); n++;
          await page.locator('#arena .judge h2').filter({hasText:'Facit ·'}).waitFor({timeout:10000});
          const problem = await page.locator('#arena .duel-question').innerText();
          const numsDuel = problem.match(/\d+/g).map(Number);
          assert([7,8].includes(numsDuel[0]),name + ' selected multiplication tables'); n++;
          assert((await page.locator('#arena .judge h2').innerText()).includes('= ' + numsDuel[0] * numsDuel[1]),name + ' mathematically correct auto-revealed answer'); n++;
          await page.locator('#arena [data-act="awardDuel"][data-value="0"]').click();
          assert.equal(await page.locator('#arena .playerbox .playerscore').first().innerText(),'1',name + ' award to non-buzzer'); n++;
          await page.locator('#arena [data-act="undoDuel"]').click();
          assert.equal(await page.locator('#arena .playerbox .playerscore').first().innerText(),'0',name + ' undo point'); n++;
          await page.locator('#arena [data-act="awardDuel"][data-value="1"]').click();
          await page.locator('#arena [data-act="buzz"]').first().waitFor({timeout:7000});
          assert.match(await page.locator('#arena .duel-topline').innerText(),/Fråga 2 av 10/,name + ' automatic next question'); n++;
          assert.equal(await page.locator('#arena .playerbox .playerscore').last().innerText(),'1',name + ' awarded to buzzer'); n++;
          await page.locator('#arena [data-act="buzz"][data-value="0"]').click();
          await page.locator('#arena .judge h2').filter({hasText:'Facit ·'}).waitFor({timeout:15000});
          await page.locator('#arena [data-act="awardDuel"][data-value="none"]').click();
          await page.locator('#arena [data-act="buzz"]').first().waitFor({timeout:7000});
          assert.equal(await page.locator('#arena .playerbox .playerscore').first().innerText(),'0',name + ' no-point altered score'); n++;
          assert.equal(await page.locator('#arena .playerbox .playerscore').last().innerText(),'1',name + ' no-point altered other score'); n++;

          // Separate exam engine: verify no early solutions, then complete an empty synthetic diagnosis.
          const progressBeforeExam = await page.evaluate(() => localStorage.getItem('matteos.v5'));
          await page.goto(BASE + 'prov/?g=' + grade, { waitUntil: 'domcontentloaded' });
          assert.match(await page.title(), /Matte Prov/); n++;
          await page.locator('[data-start="diagnos"]').first().click();
          await page.locator('.question-sheet').waitFor();
          assert.equal(await page.locator('.question-sheet .solution, .question-sheet .result-detail, .result-head').count(), 0, name + ' exam leaks a solution before submission'); n++;
          const total = Number((await page.locator('.qcount').innerText()).split('/')[1]);
          assert(total > 0 && total < 50, name + ' invalid diagnosis length'); n++;
          for (let i = 0; i < total; i++) await page.locator('[data-next]').click();
          await page.locator('[data-submit]').click();
          await page.locator('.result-head').waitFor();
          assert.equal(await page.locator('.review-list').count(), 1, name + ' no post-submit review'); n++;
          assert.equal(await page.evaluate(() => localStorage.getItem('matteos.v5')), progressBeforeExam, name + ' exam modified learning progress'); n++;
        } finally {
          await context.close();
        }
      }
      console.log(name + ': cross-engine navigation, teaching, practice, Cup UI and Prov PASS');
    } finally {
      await browser.close();
    }
  }
  console.log('CROSS-ENGINE ACCEPTANCE ' + n + '/' + n + ' PASS');
})().catch(e => { console.error(e); process.exitCode = 1; });
