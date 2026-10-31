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
