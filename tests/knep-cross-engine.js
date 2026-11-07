'use strict';
// Minnesknep smoke in WebKit (iPhone 13 width/UA/touch, tall viewport – see sprak-cross-engine.js for why) and Firefox.
const { webkit, firefox, devices } = require('playwright');
const assert = require('node:assert/strict');
const BASE = (process.argv[2] || 'http://127.0.0.1:8765/').replace(/\/?$/, '/');
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
async function run(name, engine, opts) {
  const browser = await engine.launch(); const errors = [];
  try {
    const ctx = await browser.newContext({ ...opts, serviceWorkers: 'block' }), page = await ctx.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await page.locator('[data-p="grade9"]').click(); await page.waitForSelector('h1');
    await page.goto(BASE + '#/l/s9-area-scale/0'); await page.waitForSelector('.knep');
    ok(!/16|27/.test(await page.locator('.knep .knep-try').innerText().then(t => t.replace(/[0-9]+ gånger så långa/g, ''))), name + ': answers hidden before attempt');
    const inp = page.locator('.knep input[data-kin]').first(); await inp.fill('16'); await inp.press('Enter');
    await page.waitForSelector('.knep-fb.ok'); ok(true, name + ': Enter grades the transfer task');
    await page.goto(BASE + '#/knep'); await page.waitForSelector('.knep-item');
    ok(await page.locator('.knep-item').count() === 10, name + ': Minnesknep page');
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); ok(w[0] <= w[1] + 1, name + ': no horizontal overflow ' + w);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('matteos.knep.v1')));
    ok(st.profiles.grade9['skala-riktningar'].t0.ok === true, name + ': first result stored');
    ok(errors.length === 0, name + ': no JavaScript errors ' + errors.join('|'));
    await ctx.close();
  } finally { await browser.close(); }
}
(async () => {
  await run('WebKit iPhone', webkit, { ...devices['iPhone 13'], viewport: { width: 390, height: 3200 } });
  await run('Firefox', firefox, { viewport: { width: 1024, height: 800 } });
  console.log('Minnesknep cross-engine PASS: ' + n + ' checks (WebKit iPhone width/UA/touch + Firefox)');
})().catch(e => { console.error(e); process.exit(1); });
