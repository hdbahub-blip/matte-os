'use strict';
/* Same-origin upgrade acceptance: 5.5.0 -> 5.5.4 with SYNTHETIC progress created in a fresh browser profile.
   One origin serves the baseline build, then the candidate build is swapped in behind the same URL,
   exactly like a GitHub Pages deploy. Verifies persistence, service-worker cache switch, backup
   export/reset/import and offline recovery. Never touches real student data.
   Usage: node tests/upgrade-e2e.js <baseline-dir> [candidate-dir] */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict');
const { chromium, devices } = require('playwright');
const BASELINE = path.resolve(process.argv[2] || ''), CANDIDATE = path.resolve(process.argv[3] || '.');
assert(fs.existsSync(path.join(BASELINE, 'sw.js')), 'Baseline build missing: ' + BASELINE);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
let root = BASELINE;
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, path.normalize(p));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  // No Last-Modified/ETag: every revalidation returns the build currently deployed.
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
});
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const B = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ ...devices['iPhone SE'], acceptDownloads: true });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const sid = 's9-angles';

    // 1. Baseline 5.5.0 with synthetic progress.
    await page.goto(B, { waitUntil: 'networkidle' });
    await page.locator('[data-a="pickprofile"][data-p="grade9"]').click();
    ok(await page.evaluate(() => MO_CORE.version) === '5.5.0', 'Baseline is not 5.5.0');
    await page.goto(B + '#/l/' + sid + '/2'); await page.waitForSelector('.paper-known, .q');
    await page.goto(B + '#/tabell/practice/7'); await page.waitForSelector('#arena .equation');
    const [a, b] = (await page.locator('#arena .equation').innerText()).match(/\d+/g).map(Number);
    await page.locator('#arena #answer').fill(String(a * b)); await page.locator('#arena #answerform button').click();
    await page.waitForSelector('#arena .feedback');
    await page.evaluate(() => {
      localStorage.setItem('matteos.cup.v1', JSON.stringify({ synthetic: true }));
      localStorage.setItem('matte-prov-v1', JSON.stringify({ synthetic: true }));
    });
    ok(await page.evaluate(async () => !!(await navigator.serviceWorker.ready).active), 'Baseline service worker not active');
    const before = await page.evaluate(() => ({ v5: localStorage.getItem('matteos.v5'), cup: localStorage.getItem('matteos.cup.v1'), prov: localStorage.getItem('matte-prov-v1') }));
    const B5 = JSON.parse(before.v5);
    ok(JSON.stringify(B5.profiles.grade9.lessons || {}).includes(sid), 'Synthetic lesson progress not stored by 5.5.0');
    ok(Object.keys((B5.profiles.grade9.tables || {}).facts || {}).length >= 1, 'Synthetic table progress not stored by 5.5.0');

    // 2. Deploy 5.5.4 behind the same origin and reload as a returning student would.
    root = CANDIDATE;
    await page.goto(B, { waitUntil: 'networkidle' }); await page.reload({ waitUntil: 'networkidle' });
    ok(await page.evaluate(() => MO_CORE.version) === '5.5.4', 'Candidate 5.5.4 not served after deploy');
    const after = await page.evaluate(() => ({ v5: localStorage.getItem('matteos.v5'), cup: localStorage.getItem('matteos.cup.v1'), prov: localStorage.getItem('matte-prov-v1') }));
    const A5 = JSON.parse(after.v5);
    ok(A5.active === B5.active, 'Active profile lost');
    ok(JSON.stringify(A5.profiles.grade9.lessons) === JSON.stringify(B5.profiles.grade9.lessons), 'Lesson progress changed by upgrade');
    ok(JSON.stringify(A5.profiles.grade9.tables) === JSON.stringify(B5.profiles.grade9.tables), 'Table progress changed by upgrade');
    ok(after.cup === before.cup && after.prov === before.prov, 'Cup or Prov storage changed by upgrade');
    ok(/Fortsätt · steg 2 av 3/.test(await page.locator('.hero .btn').innerText()), 'Home does not resume the saved lesson step');
    let keys = [];
    for (let i = 0; i < 30; i++) { keys = await page.evaluate(() => caches.keys()); if (keys.some(k => k.includes('5.5.4')) && !keys.some(k => k.includes('5.5.0'))) break; await page.waitForTimeout(500); }
    ok(keys.some(k => k.includes('5.5.4')) && !keys.some(k => k.includes('5.5.0')), 'Service-worker cache not switched to 5.5.4: ' + keys);
    await page.reload({ waitUntil: 'networkidle' });
    ok(await page.evaluate(() => localStorage.getItem('matteos.v5')) === after.v5, 'Progress changed by a second reload');

    // 3. Backup: export, reset, import restores the same progress.
    await page.goto(B + '#/installningar'); await page.waitForSelector('[data-a="export"]');
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-a="export"]').click()]);
    const backup = path.join(os.tmpdir(), 'matte-upgrade-backup-' + process.pid + '.json');
    await download.saveAs(backup);
    ok(JSON.parse(fs.readFileSync(backup, 'utf8')).app === 'matte-os', 'Exported backup is not a Matte OS file');
    await page.locator('[data-a="reset"]').click(); await page.locator('[data-a="reset"]').click();
    await page.waitForTimeout(300);
    ok(!JSON.stringify(JSON.parse(await page.evaluate(() => localStorage.getItem('matteos.v5'))).profiles.grade9.lessons || {}).includes(sid), 'Reset did not clear synthetic progress');
    await page.goto(B + '#/installningar'); await page.waitForSelector('#importfile', { state: 'attached' });
    await page.setInputFiles('#importfile', backup); await page.waitForTimeout(500);
    const R5 = JSON.parse(await page.evaluate(() => localStorage.getItem('matteos.v5')));
    ok(JSON.stringify(R5.profiles.grade9.lessons) === JSON.stringify(A5.profiles.grade9.lessons), 'Import did not restore lesson progress');
    ok(JSON.stringify(R5.profiles.grade9.tables) === JSON.stringify(A5.profiles.grade9.tables), 'Import did not restore table progress');
    fs.unlinkSync(backup);

    // 4. Offline recovery from the 5.5.4 cache.
    await context.setOffline(true);
    for (const route of ['#/', '#/formler', '#/trana', '#/installningar', '#/l/' + sid + '/0']) {
      await page.goto(B + route); await page.waitForTimeout(300);
      ok((await page.locator('#main').innerText()).trim().length > 40, 'Offline route empty: ' + route);
    }
    ok((await page.locator('.paper-answer').count()) === 1, 'Offline lesson lost the worked answer');
    await page.goto(B + '#/tabell/table/7'); await page.waitForSelector('#arena .reference');
    ok(/7 × 9[\s\S]*= 63/.test(await page.locator('#arena .reference').innerText()), 'Offline Tabellarenan missing correct facts');
    await context.setOffline(false);
    ok(errors.length === 0, 'Page errors: ' + errors.join(' | '));
    await context.close();
    console.log('UPGRADE 5.5.0 -> 5.5.4 same-origin acceptance ' + n + '/' + n + ' PASS');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; server.close(); });
