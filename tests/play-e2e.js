'use strict';
// Play layer + "Plugga smart" stories: celebrations, today ring, story bubbles, stuck helper, story player, timer.
const assert = require('assert'), { chromium } = require('playwright');
const base = (process.argv[2] || 'http://127.0.0.1:8765/').replace(/\/?$/, '/');
const exe = process.env.MATTE_BROWSER_EXE;
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
function lum(hex) { const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; }
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
(async () => {
  const browser = await chromium.launch({ headless: true, ...(exe ? { executablePath: exe } : {}) });
  // Content: every story readable with white text on its main colour; short copy.
  { const ctx = await browser.newContext(), p = await ctx.newPage();
    await p.goto(base + 'smart/', { waitUntil: 'domcontentloaded' });
    const st = await p.evaluate(() => window.MOSmart.STORIES);
    ok(st.length >= 8, 'at least eight study-technique stories');
    for (const s of st) {
      ok(contrast(s.a, '#FFFFFF') >= 4.5, s.id + ' white text AA on ' + s.a);
      ok(s.cards.length >= 3 && s.cards.length <= 6, s.id + ' 3–6 cards');
      for (const c of s.cards) { ok(c.big.split(/\s+/).length <= 7, s.id + ' headline short: ' + c.big); ok(c.small.length <= 90, s.id + ' body short'); }
    }
    ok(new Set(st.map(s => s.id)).size === st.length, 'unique ids');
    await ctx.close(); }

  for (const width of [320, 390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 } }), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(base, { waitUntil: 'domcontentloaded' });
    await p.click('.pc-grade9'); await p.waitForSelector('.pl-strip');
    const ring = await p.locator('.pl-today').boundingBox();
    ok(ring && ring.x >= 0, width + ' today ring visible at start of strip');
    ok(await p.locator('.pl-bubble').count() >= 8, width + ' story bubbles');
    ok((await p.locator('.pl-bubble').first().getAttribute('href')) === 'smart/#fastnat', width + ' first bubble = Fastnat?');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), width + ' home no horizontal scroll');
    const tileH = await p.locator('.ux-tile').first().evaluate(e => e.getBoundingClientRect().height); ok(tileH >= 44, width + ' tile target');
    // Celebrations: practice answers count, test answers do not.
    await p.evaluate(() => { for (let i = 0; i < 3; i++) dispatchEvent(new CustomEvent('mo:answer', { detail: { ok: true, mode: 'practice' } })); });
    await p.waitForSelector('.pl-toast'); ok(/3 i rad/.test(await p.locator('.pl-toast').innerText()), width + ' combo toast at 3');
    ok(await p.locator('.pl-burst').count() >= 1, width + ' burst shown');
    ok((await p.locator('.pl-today').getAttribute('aria-label')) === 'Idag: 3 av 10 frågor', width + ' ring updated live');
    await p.evaluate(() => dispatchEvent(new CustomEvent('mo:answer', { detail: { ok: true, mode: 'test' } })));
    ok(await p.evaluate(() => JSON.parse(localStorage.getItem('matteos.play.v1')).n) === 3, width + ' exam answers stay calm (not counted)');
    const stored = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('matteos.play.v1'))).sort().join(','));
    ok(stored === 'day,n,seen', width + ' only counts stored: ' + stored);
    // Real exercise: stuck helper next to the hint, opens and closes with Escape, no answer shown.
    await p.click('.ux-math'); await p.waitForSelector('[data-a="hint"],[data-a="showsol"]', { timeout: 15000 });
    await p.waitForSelector('[data-pl="stuck"]'); await p.click('[data-pl="stuck"]');
    await p.waitForSelector('.pl-sheet[role="dialog"]'); ok(await p.locator('.pl-steps li').count() === 4, width + ' stuck loop 4 steps');
    ok(await p.evaluate(() => document.activeElement.classList.contains('pl-close')), width + ' focus moved into sheet');
    await p.keyboard.press('Escape'); ok(await p.locator('.pl-sheet').count() === 0, width + ' Escape closes');
    // A real correct answer fires the event.
    const firedP = p.evaluate(() => new Promise(r => { addEventListener('mo:answer', e => r(e.detail), { once: true }); setTimeout(() => r(null), 5000); }));
    if (await p.locator('#app input:not([type=hidden])').count()) await p.fill('#app input:not([type=hidden])', '1');
    else if (await p.locator('#app [data-a="pick"]').count()) await p.locator('#app [data-a="pick"]').first().click();
    else throw new Error('unknown exercise type: ' + await p.evaluate(() => location.hash + ' ' + [...document.querySelectorAll('#app [data-a],#app input,#app select')].map(e => e.tagName + ':' + (e.dataset.a || e.type)).join(' ')));
    await p.click('#app button:has-text("Kontrollera")');
    const fired = await firedP;
    ok(fired && typeof fired.ok === 'boolean', width + ' app emits mo:answer on check');
    ok(errs.length === 0, width + ' no page errors ' + errs.join('|'));
    await ctx.close();

    // Story player.
    const c2 = await browser.newContext({ viewport: { width, height: 844 } }), q = await c2.newPage(), e2 = [];
    q.on('pageerror', e => e2.push(e.message));
    await q.goto(base + 'smart/', { waitUntil: 'domcontentloaded' });
    ok(await q.locator('.sm-tile').count() >= 8, width + ' grid of stories');
    ok(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), width + ' smart no horizontal scroll');
    const small = await q.locator('.sm-tile, .sm-back').evaluateAll(a => a.filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).length);
    ok(small === 0, width + ' 44px targets');
    await q.click('.sm-tile >> nth=0'); await q.waitForSelector('.sm-player');
    ok((await q.locator('.sm-nav span').innerText()) === '1 / 6', width + ' starts at card 1');
    await q.keyboard.press('ArrowRight'); ok((await q.locator('.sm-nav span').innerText()) === '2 / 6', width + ' arrow advances');
    await q.click('.sm-tap.next'); ok((await q.locator('.sm-nav span').innerText()) === '3 / 6', width + ' tap right advances');
    await q.click('.sm-tap.prev'); ok((await q.locator('.sm-nav span').innerText()) === '2 / 6', width + ' tap left goes back');
    for (let i = 0; i < 4; i++) await q.keyboard.press('ArrowRight');
    ok(await q.locator('.sm-cta').count() === 1, width + ' last card has a do-it-now action');
    ok(await q.evaluate(() => JSON.parse(localStorage.getItem('matteos.play.v1')).seen.includes('fastnat')), width + ' seen stored');
    await q.keyboard.press('ArrowRight'); ok((await q.locator('.sm-head strong').innerText()) === 'Testa dig', width + ' continues to next story');
    await q.keyboard.press('Escape'); await q.waitForSelector('.sm-grid'); ok(true, width + ' Escape closes player');
    ok(await q.locator('.sm-tile >> nth=0').locator('.sm-new').count() === 0, width + ' seen story loses NY badge');
    await q.goto(base + 'smart/#fokus'); await q.waitForSelector('.sm-player');
    for (let i = 0; i < 3; i++) await q.keyboard.press('ArrowRight');
    await q.click('[data-a="timer"][data-m="10"]'); await q.waitForSelector('.sm-clock output');
    ok(/^(10:00|9:5\d)$/.test(await q.locator('.sm-clock output').innerText()), width + ' focus timer runs');
    await q.click('[data-a="stoptimer"]'); ok(await q.locator('.sm-timer button').count() === 3, width + ' timer can be cancelled');
    ok(e2.length === 0, width + ' smart no errors ' + e2.join('|'));
    await c2.close();
  }
  // Reduced motion: no particles or toasts; night mode on the story page.
  { const ctx = await browser.newContext({ reducedMotion: 'reduce', colorScheme: 'dark', viewport: { width: 390, height: 844 } }), p = await ctx.newPage();
    await p.goto(base); await p.click('.pc-grade8'); await p.waitForSelector('.pl-strip');
    await p.evaluate(() => { for (let i = 0; i < 3; i++) dispatchEvent(new CustomEvent('mo:answer', { detail: { ok: true, mode: 'practice' } })); });
    ok(await p.locator('.pl-burst,.pl-toast').count() === 0, 'reduced motion: no particles/toast');
    await p.goto(base + 'smart/'); const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(bg === 'rgb(17, 13, 34)', 'dark scheme on story page: ' + bg);
    await ctx.close(); }
  // Offline-safe hostile storage.
  { const ctx = await browser.newContext(), p = await ctx.newPage();
    await p.addInitScript(() => { try { localStorage.setItem('matteos.play.v1', '{"n":"<img>","seen":[1,{"x":2}],"day":5}'); } catch (_) {} });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(base); await p.click('.pc-grade9'); await p.waitForSelector('.pl-today');
    ok((await p.locator('.pl-today').getAttribute('aria-label')) === 'Idag: 0 av 10 frågor', 'hostile storage sanitised');
    await p.goto(base + 'smart/'); await p.waitForSelector('.sm-tile'); ok(errs.length === 0, 'no errors with hostile storage');
    await ctx.close(); }
  await browser.close(); console.log('PLAY E2E PASS ' + n + '/' + n);
})().catch(e => { console.error(e); process.exit(1); });
