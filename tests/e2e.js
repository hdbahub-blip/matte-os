/* Matte OS v5 — mobil end-to-end QA (Playwright/Chromium med iPhone-profiler).
   Kör: node tests/e2e.js http://localhost:8765/ [skärmbildsmapp] */
const { chromium, devices } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8765/';
const SHOTS = process.argv[3] || null;
const fs = require('fs');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0; const log = [];
const ok = (c, m) => { if (c) { pass++; } else { fail++; log.push('✗ ' + m); } };

async function ctxFor(b, dev, opts = {}) {
  const c = await b.newContext({ ...dev, serviceWorkers: opts.sw ? 'allow' : 'block' });
  await c.addInitScript(() => { window.__MO_NOW = '2026-10-27T08:00:00'; });
  return c;
}
async function noOverflow(p, where) {
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(r.sw <= r.cw + 1, `${where}: horisontell overflow ${r.sw} > ${r.cw}`);
}
async function shot(p, name) { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}.png` }); }
async function answerCurrent(p, { wrong } = {}) {
  // läser aktuell uppgift ur appens tillstånd och svarar med kanoniskt (svenskt) svar
  await p.waitForFunction(() => window.__MO_UI.ex && !window.__MO_UI.ex.done && document.querySelector('form[data-form=answer] button[type=submit]'));
  const info = await p.evaluate(() => { const ex = window.__MO_UI.ex; const x = window.MOEngine.item(ex.sid, ex.key); return { type: x.type || 'num', a: x.a, mf: x.mustFraction || null, dec: x.dec, rad: x.radical || null }; });
  if (info.type === 'choice') { await p.click(`.opt[data-v="${info.a.replace(/"/g, '\\"')}"]`); }
  else if (info.type === 'sci') { await p.fill('#ansm', String(info.a[0]).replace('.', ',')); await p.fill('#anse', String(info.a[1])); }
  else if (info.type === 'expr') { await p.fill('#ans', info.a); }
  else if (info.type === 'roots') { await p.fill('#ans', wrong ? '12345' : (info.a.length ? info.a.map(r => String(r).replace('.', ',')).join(' och ') : 'ingen')); }
  else if (info.rad) { await p.fill('#ans', wrong ? '12345' : (info.rad[1] === 1 ? String(info.rad[0]) : (info.rad[0] === 1 ? '' : info.rad[0]) + '√' + info.rad[1])); }
  else { const v = info.mf ? `${info.mf[0]}/${info.mf[1]}` : wrong ? String(info.a + 1) : (info.dec != null ? info.a.toFixed(info.dec) : String(+info.a.toFixed(9))).replace('.', ','); await p.fill('#ans', v); }
  await p.click('form[data-form=answer] button[type=submit]');
  await p.waitForTimeout(60);
}

(async () => {
  const b = await chromium.launch();
  const errors = [];
  for (const [devName, dev] of [['iPhone 13', devices['iPhone 13']], ['iPhone SE', devices['iPhone SE']], ['Desktop', { viewport: { width: 1280, height: 860 } }]]) {
    const c = await ctxFor(b, dev); const p = await c.newPage();
    p.on('pageerror', e => errors.push(devName + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(devName + ' console: ' + m.text()); });
    const tag = devName.replace(/\s/g, '');
    console.log('== ' + devName);
    p.setDefaultTimeout(6000);
    await p.goto(BASE, { waitUntil: 'networkidle' });
    ok(await p.isVisible('text=Välj årskurs'), `${devName}: första start visar val av årskurs`);
    await shot(p, `${tag}-00-onboarding`);
    await p.click('[data-p=grade9]');
    // ---------- HEM ----------
    await p.waitForSelector('.hero');
    await noOverflow(p, `${devName} hem`);
    const cta = await p.locator('.hero .btn').boundingBox(); const nav = await p.locator('.nav').boundingBox(); const vh = p.viewportSize().height;
    ok(cta && cta.y + cta.height <= Math.min(nav.y, vh), `${devName}: huvudknappen syns ovanför menyn utan scroll (${cta && Math.round(cta.y + cta.height)} / ${Math.round(nav.y)})`);
    const brandX = (await p.locator('.brand').boundingBox()).x, searchX = (await p.locator('[data-a=search]').first().boundingBox()).x;
    ok(brandX < searchX, `${devName}: MATTE OS till vänster, sök till höger`);
    const hh = (await p.locator('.top-in').boundingBox()).height; ok(hh <= 60, `${devName}: header radbryts inte (${hh}px)`);
    ok((await p.locator('.hero .btn').count()) === 1, `${devName}: exakt en dominant handling`);
    await shot(p, `${tag}-01-home`);
    // ---------- FORMEL: ≤ 2 tryck ----------
    await p.click('.nav [data-h="#/formler"]');
    await p.click('[data-a=ftoggle][data-sid=s9-pythagoras]');
    const body = await p.locator('#f-s9-pythagoras .fbody').innerText();
    for (const k of ['NÄR?', 'BETYDER', 'ANVÄND ÅT OLIKA HÅLL', 'EXEMPEL', 'VANLIG FÄLLA']) ok(body.toUpperCase().includes(k), `${devName}: formelkort Pythagoras har ${k}`);
    ok(await p.locator('#f-s9-pythagoras .fm').innerText().then(t => /a\s*2\s*\+\s*b\s*2\s*=\s*c\s*2/.test(t.replace(/\s+/g, ' '))), `${devName}: huvudformeln syns i hopfällt kort`);
    await noOverflow(p, `${devName} formler`);
    await shot(p, `${tag}-02-formler`);
    // alla formelkort i alla kapitel öppnade – inget får spilla över
    for (const ch of ['s9-tal', 's9-geo', 's9-procent']) {
      await p.click(`[data-a=fch][data-ch=${ch}]`);
      const ids = await p.$$eval('[data-a=ftoggle]', bs => bs.map(b => b.dataset.sid));
      for (const id of ids) await p.click(`[data-a=ftoggle][data-sid=${id}]`);
      await noOverflow(p, `${devName} formler ${ch} (alla öppna)`);
    }
    // ---------- SÖK ----------
    await p.click('[data-a=search]');
    await p.fill('#sq', 'triangel sida');
    ok(await p.locator('#sres .tap').first().innerText().then(t => t.includes('Pythagoras')), `${devName}: sök "triangel sida" → Pythagoras först`);
    await shot(p, `${tag}-03-search`);
    await p.click('[data-a=closesheet]');
    // ---------- LEKTION: Vinklar (P0-buggen 42 · 71 m) ----------
    await p.click('.nav [data-h="#/"]');
    await p.click('.hero .btn'); await p.waitForSelector('.fbar');
    ok(await p.locator('.nav').count() === 0, `${devName}: ingen bottenmeny i fokusläge`);
    ok(await p.isVisible('text=Kom ihåg'), `${devName}: Fatta visar minnesregel`);
    await noOverflow(p, `${devName} lektion fatta`); await shot(p, `${tag}-10-fatta`);
    await p.click('text=Se ett exempel'); await p.waitForSelector('[data-a=reveal]');
    for (let g = 0; g < 8 && await p.locator('[data-a=reveal]').count(); g++) { await p.click('[data-a=reveal]'); await p.waitForTimeout(30); }
    if (!(await p.isVisible('text=Din tur – med stöd'))) console.log('DEBUG reveal', await p.evaluate(() => JSON.stringify({ h: location.hash, r: window.__MO_UI.lesson && window.__MO_UI.lesson.reveal, sheet: document.getElementById('sheet').innerHTML.length })));
    ok(await p.isVisible('text=Din tur – med stöd'), `${devName}: exempel visas steg för steg till slut`);
    await shot(p, `${tag}-11-exempel`);
    await p.click('text=Din tur – med stöd'); await p.waitForSelector('[data-a=gsr]');
    await p.click('[data-a=gsr][data-k=given]'); await p.click('[data-a=gsr][data-k=find]');
    const gtxt = await p.locator('.gsr').first().innerText();
    ok(gtxt.includes('42° och 71°') && !/71\s*m\b/.test(gtxt), `${devName}: "Vad vet du" = 42° och 71° (inte "42 · 71 m"): ${gtxt.replace(/\n/g, ' ')}`);
    ok((await p.locator('.gsr').nth(1).innerText()).includes('den tredje vinkeln'), `${devName}: "Vad söker du" = den tredje vinkeln`);
    const svgTxt = await p.locator('.vis svg').first().innerHTML();
    ok(svgTxt.includes('42°') && svgTxt.includes('71°') && svgTxt.includes('?'), `${devName}: triangelfiguren visar 42°, 71° och ?`);
    await p.click('[data-a=rule][data-i="1"]'); ok(await p.isVisible('text=Inte den'), `${devName}: fel regelval ger återkoppling`);
    await p.click('[data-a=rule][data-i="0"]');
    await p.fill('#ans', '113'); await p.click('form[data-form=answer] button[type=submit]');
    ok(await p.isVisible('text=summan av de två du vet'), `${devName}: missuppfattning 113 ger specifik feedback`);
    await p.click('[data-a=hint]'); ok(await p.isVisible('text=Vad vet du?'), `${devName}: ledtråd 1 visas ensam`);
    ok(await p.locator('.hint').count() === 1, `${devName}: bara en ledtråd i taget`);
    await p.fill('#ans', '67'); await p.click('form[data-form=answer] button[type=submit]');
    ok(await p.isVisible('.box.good'), `${devName}: 67 godkänns`);
    await shot(p, `${tag}-12-guidad`);
    await p.click('text=Gör själv'); await p.waitForFunction(() => location.hash.endsWith('/3')); await p.waitForFunction(() => location.hash.endsWith('/3'));
    for (let i = 0; i < 3; i++) { await answerCurrent(p); ok(await p.isVisible('.box.good'), `${devName}: gör själv ${i + 1} godkänns`); if (i === 0) await shot(p, `${tag}-13-gorsjalv`); await p.click('[data-a=solonext]'); }
    await p.waitForSelector('text=Moment klart').catch(() => { });
    ok(await p.isVisible('text=Moment klart'), `${devName}: klart-skärm`);
    await shot(p, `${tag}-14-klart`);
    // ---------- Pythagoras: c² -fel ----------
    await p.goto(BASE + '#/l/s9-pythagoras/2'); await p.waitForTimeout(150);
    await p.click('[data-a=gsr][data-k=given]'); await p.click('[data-a=gsr][data-k=find]'); await p.click('[data-a=rule][data-i="0"]');
    await p.fill('#ans', '169'); await p.click('form[data-form=answer] button[type=submit]');
    ok(await p.isVisible('text=Du har hittat'), `${devName}: Pythagoras 169 → "du har hittat c²"`);
    await p.fill('#ans', '13 cm'); await p.click('form[data-form=answer] button[type=submit]'); ok(await p.isVisible('.box.good'), `${devName}: "13 cm" godkänns`);
    // ---------- tangentbord: liten höjd ----------
    if (devName !== 'Desktop') {
      await p.goto(BASE + '#/l/s9-area-scale/3'); await p.waitForTimeout(150);
      await p.setViewportSize({ width: dev.viewport.width, height: 360 }); // ungefär synlig yta med tangentbord
      await p.focus('#ans'); await p.waitForTimeout(700);
      const btn = await p.locator('form[data-form=answer] button[type=submit]').boundingBox();
      ok(btn && btn.y >= 0 && btn.y + btn.height <= 360, `${devName}: Kontrollera syns med tangentbordet uppe (${btn && Math.round(btn.y)})`);
      await shot(p, `${tag}-15-tangentbord`);
      await p.setViewportSize(dev.viewport);
    }
    // ---------- TRÄNING ----------
    await p.goto(BASE + '#/trana'); await p.waitForTimeout(100);
    await shot(p, `${tag}-20-trana`);
    await p.click('.hero .btn'); await p.waitForSelector('.fbar');
    for (let i = 0; i < 5; i++) { ok(await p.locator('.nav').count() === 0, `${devName}: träning i fokusläge`); await answerCurrent(p); await p.click('[data-a=runnext]'); }
    ok(await p.isVisible('text=Passet klart'), `${devName}: träningsresultat`);
    // ---------- PROVLÄGE ----------
    await p.goto(BASE + '#/k/s9-geo'); await p.click('[data-a=startTest]');
    ok(await p.locator('[data-a=hint]').count() === 0, `${devName}: provläge utan ledtrådar`);
    ok(await p.locator('[data-a=formula]').count() === 0, `${devName}: provläge utan formelknapp`);
    const n = await p.evaluate(() => window.__MO_UI.run.items.length);
    for (let i = 0; i < n; i++) { await answerCurrent(p, { wrong: i % 2 === 0 }); }
    ok(await p.isVisible('text=Provläge klart'), `${devName}: provanalys visas`);
    ok(await p.locator('.analysis .mark').count() >= 3, `${devName}: analys per moment`);
    await shot(p, `${tag}-21-provanalys`);
    // ---------- RESTPROV + INSTÄLLNINGAR ----------
    await p.goto(BASE + '#/rest/rest-s9-tal'); await p.fill('#restdate', '2026-11-05'); await p.dispatchEvent('#restdate', 'change');
    await p.goto(BASE + '#/'); await p.waitForTimeout(100);
    ok(await p.isVisible('text=om 9 dagar'), `${devName}: restprovsdatum syns på hem`);
    await p.goto(BASE + '#/installningar'); await p.fill('#pname', 'Testnamn'); await p.click('[data-a=savename]');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 4000 }).catch(() => null), p.click('[data-a=export]')]);
    ok(!!dl, `${devName}: säkerhetskopia laddas ner`);
    if (dl) {
      const path = await dl.path(); const txt = fs.readFileSync(path, 'utf8');
      ok(txt.includes('Testnamn') && txt.includes('"app": "matte-os"'), `${devName}: säkerhetskopian innehåller data`);
      await p.click('[data-a=reset]'); await p.click('[data-a=reset]');
      const n0 = await p.evaluate(() => window.MOEngine.prof().attempts.length); ok(n0 === 0, `${devName}: nollställning`);
      await p.goto(BASE + '#/installningar');
      await p.setInputFiles('#importfile', path); await p.waitForTimeout(200);
      const n1 = await p.evaluate(() => window.MOEngine.prof().attempts.length); ok(n1 > 5, `${devName}: återställning från fil (${n1} svar)`);
    }
    await noOverflow(p, `${devName} inställningar`);
    // ---------- felhantering ----------
    await p.goto(BASE + '#/l/s9-percent-part/3'); await p.waitForTimeout(100);
    await p.click('form[data-form=answer] button[type=submit]'); ok(await p.isVisible('text=Skriv ett svar först'), `${devName}: tomt svar hanteras`);
    await p.fill('#ans', '1,2,3abc'); await p.click('form[data-form=answer] button[type=submit]'); ok(await p.isVisible('.box.warn'), `${devName}: oläsbart svar hanteras`);
    await p.goto(BASE + '#/finns-inte'); ok(await p.isVisible('.hero'), `${devName}: okänd adress → hem`);
    await p.reload(); ok(await p.isVisible('.hero'), `${devName}: omladdning behåller profil`);
    // ---------- ÅK 8 ----------
    await p.evaluate(() => { window.MOEngine.state().active = 'grade8'; window.MOEngine.save(); });
    await p.goto(BASE + '#/'); await p.reload(); await p.waitForTimeout(150);
    ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'navy', `${devName}: åk 8 har marinblått tema`);
    await shot(p, `${tag}-30-home8`);
    await p.click('.hero .btn'); await p.waitForSelector('text=Se ett exempel'); await p.click('text=Se ett exempel'); await shot(p, `${tag}-31-exempel8`);
    await c.close();
  }

  // ---------- Varje moment: hela lektionen med rätt svar (iPhone 13) ----------
  {
    const c = await ctxFor(b, devices['iPhone 13']); const p = await c.newPage(); p.setDefaultTimeout(6000);
    p.on('pageerror', e => errors.push('alla moment: ' + e.message));
    await p.goto(BASE); await p.click('[data-p=grade9]');
    const all = await p.evaluate(() => Object.values(window.MOEngine.SKILLS).map(s => ({ id: s.id, profile: s.profile, choiceG: s.g.type === 'choice', hasRule: !!s.g.ro })));
    let done = 0;
    for (const s of all) {
      await p.evaluate(pid => { window.MOEngine.state().active = pid; window.MOEngine.save(); }, s.profile);
      await p.goto(BASE + `#/l/${s.id}/0`); await p.reload(); await p.waitForTimeout(60);
      await noOverflow(p, `${s.id} fatta`);
      await p.goto(BASE + `#/l/${s.id}/1`); await p.waitForSelector('[data-a=reveal]'); while (await p.locator('[data-a=reveal]').count()) await p.click('[data-a=reveal]');
      await noOverflow(p, `${s.id} exempel`);
      await p.goto(BASE + `#/l/${s.id}/2`); await p.waitForSelector('[data-a=gsr]');
      await p.click('[data-a=gsr][data-k=given]'); await p.click('[data-a=gsr][data-k=find]');
      if (s.hasRule) { const rc = await p.evaluate(id => window.MOEngine.SKILLS[id].g.rc, s.id); await p.click(`[data-a=rule][data-i="${rc}"]`); }
      await answerCurrent(p); ok(await p.isVisible('.box.good'), `${s.id}: guidad uppgift godkänns i UI`);
      await noOverflow(p, `${s.id} guidad`);
      await p.click('text=Gör själv'); await p.waitForFunction(() => location.hash.endsWith('/3')); await p.waitForFunction(() => location.hash.endsWith('/3'));
      for (let i = 0; i < 3; i++) { await answerCurrent(p); ok(await p.isVisible('.box.good'), `${s.id}: gör själv ${i + 1} godkänns i UI`); await noOverflow(p, `${s.id} själv ${i + 1}`); await p.click('[data-a=solonext]'); }
      await p.waitForSelector('text=Moment klart').catch(() => { });
      ok(await p.isVisible('text=Moment klart'), `${s.id}: klart`); done++;
    }
    console.log(`Alla moment genomgångna i UI: ${done}/${all.length}`);
    await c.close();
  }

  // ---------- Offline (service worker) ----------
  {
    const c = await ctxFor(b, devices['iPhone 13'], { sw: true }); const p = await c.newPage();
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.evaluate(async () => { await navigator.serviceWorker.ready; });
    await p.waitForTimeout(800);
    await c.setOffline(true);
    await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => { });
    await p.waitForTimeout(500);
    ok(await p.isVisible('text=Välj årskurs'), 'offline: appen startar utan nät');
    await p.click('[data-p=grade8]'); ok(await p.isVisible('.hero'), 'offline: hem fungerar');
    await p.goto(BASE + '#/formler').catch(() => { }); ok(await p.isVisible('.fcard'), 'offline: formelsamling fungerar');
    await c.close();
  }
  await b.close();
  ok(errors.length === 0, 'JS-fel: ' + errors.join(' | '));
  console.log(`\nE2E: ${pass} godkända, ${fail} fel`);
  log.forEach(l => console.log(l));
  process.exit(fail ? 1 : 0);
})();
