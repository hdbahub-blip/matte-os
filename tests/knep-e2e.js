'use strict';
// Minnesknep in a real browser: iPhone SE and iPhone 13 emulation (Chromium), keyboard, offline, storage isolation.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { chromium, devices } = require('playwright');
const BASE = (process.argv[2] || 'http://127.0.0.1:8765/').replace(/\/?$/, '/');
const OUT = process.argv[3] || 'test-screenshots'; fs.mkdirSync(OUT, { recursive: true });
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
async function noOverflow(page, label) { const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(w[0] <= w[1] + 1, label + ': horizontal overflow ' + w); }
async function notCovered(page, sel, label) {
  const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded();
  const r = await l.evaluate(e => { const b = e.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2; const hit = document.elementFromPoint(x, y); return { h: b.height, w: b.width, ok: !!hit && (hit === e || e.contains(hit)) }; });
  ok(r.ok, label + ': not covered by the bottom menu'); ok(r.h >= 44, label + ': touch target ≥ 44 px (' + r.h + ')');
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const [name, device] of [['iphone-se', devices['iPhone SE']], ['iphone-13', devices['iPhone 13']]]) {
      const ctx = await browser.newContext({ ...device, serviceWorkers: 'block' }); const page = await ctx.newPage(); page.setDefaultTimeout(10000);
      const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.locator('[data-p="grade8"]').click(); await page.waitForSelector('h1');
      const before = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k => k !== 'matteos.knep.v1').map(k => [k, localStorage.getItem(k)]))));
      // 1. Lesson card: perimeter/area, answers hidden before the learner has tried.
      await page.goto(BASE + '#/l/f8-perimeter/0'); await page.waitForSelector('.knep');
      ok(await page.locator('.knep').count() === 1, name + ': one memory card in the lesson');
      const cardText = await page.locator('.knep').innerText();
      ok(/RUNT kanten = omkrets/.test(cardText) && /INUTI ytan = area/.test(cardText), name + ': anchor visible');
      ok(!/16 cm|15 cm²|Rätt svar/.test(cardText.replace(/Hur lång är omkretsen\?|Hur stor är arean\?/g, '')), name + ': transfer answers hidden before an attempt');
      ok(await page.locator('.knep details[open]').count() === 0, name + ': why/limits start collapsed (calm first view)');
      await noOverflow(page, name + ' lesson card');
      await notCovered(page, '.knep [data-kn="check"]', name + ' check button');
      // Empty answer does nothing and stores nothing.
      await page.locator('.knep [data-kn="check"]').first().click();
      ok(await page.locator('.knep-fb').count() === 0, name + ': empty answer is not graded');
      // Keyboard: type and press Enter.
      const first = page.locator('.knep input[data-kin]').first(); await first.fill('16 cm'); await first.press('Enter');
      await page.waitForSelector('.knep-fb.ok');
      ok(/Rätt – och utan att se facit först/.test(await page.locator('.knep-fb.ok').innerText()), name + ': Enter submits and grades correct answer');
      // Wrong answer on the area task, shows correct answer with explanation.
      const second = page.locator('.knep input[data-kin]').nth(1); await second.fill('16'); await page.locator('.knep [data-kn="check"]').first().click();
      await page.waitForSelector('.knep-fb.no');
      ok(/Rätt svar: 15 cm²/.test(await page.locator('.knep-fb.no').innerText()), name + ': wrong answer shows correct answer and reasoning');
      let st = await page.evaluate(() => JSON.parse(localStorage.getItem('matteos.knep.v1')));
      ok(st.v === 1 && st.profiles.grade8['runt-inuti'].t0.ok === true && st.profiles.grade8['runt-inuti'].t1.ok === false && !JSON.stringify(st).includes('16 cm'), name + ': only first results stored, never typed text');
      await page.screenshot({ path: `${OUT}/knep-${name}-lesson.png`, fullPage: true });
      // 2. Powers lesson: 10² vs (0,1)², with later transfer to 10³ and (0,1)³.
      await page.goto(BASE + '#/l/f8-powers-ten/0'); await page.waitForSelector('.knep');
      const pt = await page.locator('.paper-flow').innerText();
      ok(/en tiondel av en tiondel/i.test(pt) && !/två decimaler|två nollor/.test(pt), name + ': powers explained without shortcut');
      ok(/Beräkna 10³/.test(await page.locator('.knep').innerText()) && /\(0,1\)³/.test(await page.locator('.knep').innerText()), name + ': transfer to 10³ and (0,1)³');
      await page.locator('.knep input[data-kin]').nth(1).fill('0,001'); await page.locator('.knep input[data-kin]').nth(1).press('Enter');
      await page.waitForSelector('.knep-fb.ok'); ok(true, name + ': (0,1)³ = 0,001 accepted with Swedish comma');
      // 3. Lesson without a fitting anchor shows none (not copied mechanically).
      await page.goto(BASE + '#/l/f8-equations/0'); await page.waitForSelector('.paper-flow');
      ok(await page.locator('.knep').count() === 0, name + ': no forced anchor where none fits');
      // 4. Förstå tab: Minnesknep is the entry; poster is a quiet optional link.
      await page.goto(BASE + '#/formler'); await page.waitForSelector('.knep-entry');
      ok(await page.locator('details.fold:has-text("formelaffisch")').count() === 0 && await page.locator('.knep-poster-link a[href*="affischer/?visa=formler&ak=8"]').count() === 1, name + ': poster demoted to optional link, grade-aware');
      await page.locator('.knep-entry').click(); await page.waitForSelector('.knep-item');
      ok(await page.locator('.knep-item').count() === 10, name + ': all anchors listed');
      ok(/Öva igen/.test(await page.locator('.knep-item[data-kid="runt-inuti"] .knep-status').innerText()), name + ': status reflects own attempt');
      ok(/Inte provat/.test(await page.locator('.knep-item[data-kid="nio-knep"] .knep-status').innerText()), name + ': untouched anchor not credited');
      await page.locator('.knep-item[data-kid="nio-knep"] > summary').click();
      ok(!/72|108/.test(await page.locator('.knep-item[data-kid="nio-knep"]').innerText()), name + ': 9 · 8 answer not shown before the attempt');
      await page.locator('.knep-item[data-kid="nio-knep"] input').first().fill('72'); await page.locator('.knep-item[data-kid="nio-knep"] [data-kn="check"]').first().click();
      await page.waitForSelector('.knep-item[data-kid="nio-knep"][open] .knep-fb.ok'); ok(true, name + ': item stays open after re-render and grades');
      ok(/1 av 2/.test(await page.locator('.knep-item[data-kid="nio-knep"] .knep-status').innerText()), name + ': one solved task is not called mastered');
      await noOverflow(page, name + ' Minnesknep page');
      await notCovered(page, '.knep-item[data-kid="nio-knep"] [data-kn="check"]', name + ' page check');
      await page.screenshot({ path: `${OUT}/knep-${name}-page.png`, fullPage: true });
      // 5. Delayed retrieval: make the first attempt two days old → recall question shown BEFORE the anchor.
      await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('matteos.knep.v1')); const r = s.profiles.grade8['runt-inuti']; const old = Date.now() - 2 * 86400000; r.t0.at = old; r.t1 = { at: old, ok: true }; localStorage.setItem('matteos.knep.v1', JSON.stringify(s)); });
      await page.reload(); await page.goto(BASE + '#/'); await page.waitForSelector('h1');
      ok(await page.locator('.knep-home').count() === 1 && /1 att minnas/.test(await page.locator('.knep-home').innerText()), name + ': home shows a calm due reminder');
      await page.goto(BASE + '#/knep'); await page.waitForSelector('.knep-due');
      const due = await page.locator('.knep-due').innerText();
      ok(/staket/.test(due) && !/RUNT kanten/.test(due), name + ': recall question asked before the anchor is shown');
      const opts = page.locator('.knep-due .knep-opt'); let right = -1;
      for (let i = 0; i < 3; i++) if (/Omkretsen/.test(await opts.nth(i).innerText())) right = i;
      await opts.nth(right).click(); await page.locator('.knep-due [data-kn="rcheck"]').click();
      await page.waitForSelector('.knep-due .knep-fb.ok');
      ok(/RUNT kanten/.test(await page.locator('.knep-due').innerText()), name + ': anchor shown after recall');
      st = await page.evaluate(() => JSON.parse(localStorage.getItem('matteos.knep.v1')));
      ok(st.profiles.grade8['runt-inuti'].recall.ok === true, name + ': recall stored');
      await page.goto(BASE + '#/formler'); await page.goto(BASE + '#/knep'); await page.waitForSelector('.knep-item');
      ok(/Mindes efter 2 dagar/.test(await page.locator('.knep-item[data-kid="runt-inuti"] .knep-status').innerText()), name + ': remembered-later status');
      // 6. Profile isolation and untouched student data.
      await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('matteos.v5')); s.active = 'grade9'; localStorage.setItem('matteos.v5', JSON.stringify(s)); });
      const after = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k => k !== 'matteos.knep.v1').map(k => [k, localStorage.getItem(k)]))));
      ok(JSON.parse(after)['matteos.v5'] !== undefined, name + ': math store still present');
      ok(errs.length === 0, name + ': no JavaScript errors ' + errs.join('|'));
      void before; await ctx.close();
    }
    // 7. Offline with the real service worker: Minnesknep loads from cache.
    const ctx = await browser.newContext({ ...devices['iPhone 13'] }); const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => navigator.serviceWorker.ready); await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => caches.keys().then(k => k.some(x => x.includes('5.5.6'))));
    await page.locator('[data-p="grade9"]').click();
    await ctx.setOffline(true);
    await page.goto(BASE + '#/knep'); await page.reload(); await page.waitForSelector('.knep-item');
    ok(await page.locator('.knep-item').count() === 10, 'offline: Minnesknep available from the cache');
    await page.goto(BASE + '#/l/s9-sqrt/0'); await page.waitForSelector('.knep');
    ok(/aldrig negativt/.test(await page.locator('.knep').innerText()), 'offline: grade-9 lesson card (√ vs x²)');
    await ctx.close();
    console.log('MINNESKNEP E2E ' + n + '/' + n + ' PASS (iPhone SE + iPhone 13, keyboard, delayed recall, offline)');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
