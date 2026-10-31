/* Matte OS Cup – webbläsar-E2E: 1 värd + 10 spelare i 11 separata browser contexts (iPhone SE/13, Pixel 5) mot riktig Postgres via REST-shim.
   Kör: node tests/cup-e2e.js http://127.0.0.1:8765/ http://127.0.0.1:8787 [skärmbildsmapp]
   OBS: webbläsaremulering är inte bevis för fysisk Safari/Chrome på riktiga telefoner. */
'use strict';
const { chromium, devices } = require('playwright');
const APP = process.argv[2] || 'http://127.0.0.1:8765/', SRV = process.argv[3] || 'http://127.0.0.1:8787', SHOTS = process.argv[4] || null;
const fs = require('fs'); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0; const bad = [];
const ok = (c, m) => { if (c) pass++; else { fail++; bad.push('✗ ' + m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const url = (hash) => `${APP}?cupserver=${encodeURIComponent(SRV)}#/cup${hash || ''}`;
const sh = p => p.locator('#cup').evaluate(e => e.shadowRoot ? e.shadowRoot.textContent.replace(/\s+/g, ' ') : '');
const has = async (p, sel) => (await p.locator(sel).count()) > 0;
async function overflow(p, where) { const r = await p.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth })); ok(r.s <= r.c + 1, `${where}: horisontell overflow ${r.s}>${r.c}`); }
async function shot(p, name) { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}.png` }); }

const NAMES = ['Sara', 'Sara', 'Omar', 'Lina', 'Ali', 'Nora', 'Eva', 'Yusuf', 'Mia', 'Hugo'];
const QUAL = [10, 9, 8, 7, 7, 7, 5, 4, 3, 2];
const TB = { Lina: 3, Ali: 2, Nora: 1, 'Sara 2': 3, Omar: 2 };
function target(nick, stage, game) {
  const qi = NAMES.map((n, i) => i === 1 ? 'Sara 2' : n).indexOf(nick);
  if (/^kval/.test(stage)) return QUAL[qi];
  if (/^utslag/.test(stage)) return TB[nick] ?? 0;
  if (/^semi/.test(stage)) return { Sara: 5, Lina: 3, 'Sara 2': 4, Omar: 4 }[nick] ?? 0;
  if (/^final/.test(stage)) return nick === 'Sara' ? (game === 1 ? 2 : 5) : (game === 1 ? 5 : 2);
  return 0;
}
// Atomisk ögonblicksbild av frågevyn (ett enda DOM-läsanrop, så en omritning mitt i läsningen kan inte ge blandade värden).
const snap = p => p.locator('#cup').evaluate(e => {
  const r = e.shadowRoot; if (!r) return null;
  const ai = r.getElementById('ai'), eb = r.querySelector('.eyebrow'), eq = r.querySelector('.eq');
  return { text: r.textContent.replace(/\s+/g, ' '), q: ai && eb && eq ? { eyebrow: eb.textContent, eq: eq.textContent, val: ai.value } : null };
}).catch(() => null);
async function drive(p, nick, state) {
  let last = '', lastAt = 0;
  while (!state.done) {
    const s = await snap(p); const t = s ? s.text : '';
    if (/Svar skickat/.test(t)) state.fb = (state.fb || 0) + 1;
    if ((/Svar skickat/.test(t) || (s && s.q)) && /Rätt!|Inte riktigt|Rätt svar/.test(t)) state.leak = (state.leak || 0) + 1;
    if (/vinner!/.test(t) || /Spelet är slut/.test(t)) { state.done = true; break; }
    const Q = s && s.q; const eb = Q && Q.eyebrow.toLowerCase(), m = eb && /fråga (\d+) av/.exec(eb), q = Q && /(\d+)\s*×\s*(\d+)/.exec(Q.eq);
    if (m && q) {
      const key = Q.eyebrow + Q.eq;
      // Samma fråga kvar efter 2,5 s = svaret tappades (nätavbrott eller omritning) → försök igen (servern är idempotent).
      if (key === last && Date.now() - lastAt <= 2500) { await sleep(120); continue; }
      if (key === last) state.retries = (state.retries || 0) + 1;
      last = key; lastAt = Date.now();
      const stage = eb.split('·')[0].trim(); const g = /spel (\d)/.exec(eb);
      const n = +m[1], right = n <= target(nick, stage, g ? +g[1] : 1);
      const v = right ? q[1] * q[2] : q[1] * q[2] + 1;
      if (!state.seen.includes(`${stage}|${n}|${q[1]}x${q[2]}`)) state.seen.push(`${stage}|${n}|${q[1]}x${q[2]}`);
      await p.fill('#cup >> css=#ai', String(v)).catch(() => {}); await p.click('#cup >> css=#ab').catch(() => {});
      await sleep(200);
    } else await sleep(150);
  }
}
(async () => {
  const t0 = Date.now(); const b = await chromium.launch(); const errors = []; const ctxs = [];
  const mk = async (dev, tag) => {
    const c = await b.newContext({ ...dev, serviceWorkers: 'block' }); ctxs.push(c);
    const p = await c.newPage(); p.on('pageerror', e => errors.push(tag + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(tag + ' console: ' + m.text()); });
    return { p, c };
  };
  // ---- värd ----
  const H = await mk(devices['iPhone 13'], 'värd'); const hp = H.p;
  await hp.goto(url(), { waitUntil: 'networkidle' }); await hp.click('[data-p=grade9]'); await hp.waitForSelector('#cup');
  ok((await sh(hp)).includes('Spela tillsammans'), 'värd ser Matte OS Cup-menyn'); await overflow(hp, 'värd meny'); await shot(hp, 'host-01-meny');
  // studieläge (lokalt, ingen server)
  await hp.click('#cup >> css=[data-v=study]'); ok((await sh(hp)).includes('7:ans tabell'), 'studieläge visar 7:ans tabell');
  const rows0 = await hp.locator('#cup >> css=.rows .row').count(); ok(rows0 === 10, 'studieläge: 10 rader för vald tabell');
  await hp.click('#cup >> css=[data-act=stab][data-v="8"]'); ok((await hp.locator('#cup >> css=.rows .row').count()) === 20, 'studieläge: två tabeller = 20 rader');
  await hp.click('#cup >> css=[data-act=cover]'); ok((await hp.locator('#cup >> css=.ans.covered').count()) === 20, 'studieläge: svar täckta');
  ok(!(await hp.locator('#cup >> css=.ans.covered b').first().isVisible()), 'täckt svar syns inte');
  await hp.locator('#cup >> css=.ans.covered').first().click(); ok(await hp.locator('#cup >> css=.ans b').first().isVisible(), 'klick visar svaret'); await shot(hp, 'host-02-studie'); await overflow(hp, 'studie');
  const ls0 = await hp.evaluate(() => localStorage.getItem('matteos.v5'));
  await hp.click('#cup >> css=[data-act=minitest]'); for (let i = 0; i < 5; i++) { const eq = await hp.locator('#cup >> css=.eq').innerText(); const m = /(\d+)\s*×\s*(\d+)/.exec(eq); await hp.fill('#cup >> css=#mtin', String(m[1] * m[2])); await hp.click('#cup >> css=button[type=submit]'); await hp.click('#cup >> css=[data-act=mtnext]'); }
  ok((await sh(hp)).includes('5 av 5 rätt'), 'minitest: 5 av 5 rätt');
  ok((await hp.evaluate(() => localStorage.getItem('matteos.v5'))) === ls0, 'studie/minitest ändrar inte matteos.v5');
  await hp.click('#cup >> css=[data-act=go][data-v=study]'); await hp.click('#cup >> css=[data-act=go][data-v=menu]');
  // skapa spel
  await hp.click('#cup >> css=[data-v=host]'); await hp.click('#cup >> css=.cup-customize summary'); await hp.click('#cup >> css=[data-act=cs][data-v="15"]'); await shot(hp, 'host-03-setup'); await overflow(hp, 'värd setup');
  await hp.click('#cup >> css=[data-act=create]'); await hp.waitForSelector('#cup >> css=.bigcode');
  const code = (await hp.locator('#cup >> css=.bigcode').innerText()).trim(); ok(/^[A-HJ-NP-Z2-9]{5}$/.test(code), 'värd ser spelkod ' + code);
  ok(await has(hp, '#cup >> css=#qr svg'), 'QR-kod visas för värden'); ok((await hp.locator('#cup >> css=#jl').innerText()).includes('#/cup/join/' + code), 'länk innehåller koden');
  await shot(hp, 'host-04-lobby'); await overflow(hp, 'värd lobby');
  // ---- 10 spelare ----
  const DEV = [devices['iPhone SE'], devices['iPhone 13'], devices['Pixel 5']];
  const P = [];
  for (let i = 0; i < 10; i++) {
    const x = await mk(DEV[i % 3], 'spelare' + i); x.dev = ['iPhone SE', 'iPhone 13', 'Pixel 5'][i % 3];
    await x.p.goto(url('/join/' + code), { waitUntil: 'networkidle' }); await x.p.click('[data-p=' + (i % 2 ? 'grade8' : 'grade9') + ']'); await x.p.waitForSelector('#cup >> css=#jn');
    ok((await x.p.locator('#cup >> css=#jc').inputValue()) === code, `spelare ${i}: koden förifylld från länk`);
    if (i === 0) { await overflow(x.p, 'join-formulär'); await shot(x.p, 'player-01-join'); }
    await x.p.fill('#cup >> css=#jn', NAMES[i]); await x.p.click('#cup >> css=button[type=submit]'); await x.p.waitForSelector('#cup >> css=.plist');
    P.push(x);
  }
  const nicks = []; for (const x of P) { const t = await x.p.locator('#cup >> css=.plist li.me .pn').innerText(); nicks.push(t.replace(' (du)', '')); x.nick = nicks[nicks.length - 1]; }
  ok(nicks[1] === 'Sara 2', 'dubblettnamn hanteras i UI: ' + nicks[1]);
  for (const x of P) await x.p.click('#cup >> css=[data-act=ready]');
  await hp.waitForFunction(() => document.querySelector('#cup').shadowRoot.querySelectorAll('.plist li').length === 10, null, { timeout: 8000 });
  await hp.waitForFunction(() => [...document.querySelector('#cup').shadowRoot.querySelectorAll('.plist .rd')].filter(e => /Redo/.test(e.textContent)).length === 10, null, { timeout: 20000 }).catch(() => {});
  const readyCount = await hp.locator('#cup >> css=.plist .rd', { hasText: 'Redo' }).count(); ok(readyCount === 10, `värd ser 10 spelare redo (${readyCount})`);
  await shot(hp, 'host-05-lobby10'); await shot(P[0].p, 'player-02-lobby'); await overflow(P[0].p, 'spelare lobby SE');
  // återanslutning i lobbyn: ladda om spelare 3
  await P[3].p.reload({ waitUntil: 'networkidle' }); await P[3].p.waitForSelector('#cup >> css=.plist'); ok((await P[3].p.locator('#cup >> css=.plist li.me .pn').innerText()).startsWith('Lina'), 'spelare 3 återansluter efter omladdning i lobbyn');
  // ---- start ----
  const states = P.map(() => ({ done: false, seen: [] }));
  await hp.click('#cup >> css=[data-act=start]');
  await P[0].p.waitForSelector('#cup >> css=#cd'); ok(true, 'nedräkning visas'); await shot(P[0].p, 'player-03-nedrakning');
  const drivers = P.map((x, i) => drive(x.p, x.nick, states[i]));
  // midrunda: ladda om spelare 5, och offline för spelare 6
  // The drivers answer as soon as #ai appears, so the field is only visible at the start of each 15 s question.
  // If player 5 already answered question 1, the next window opens ~15 s later; wait past two question periods.
  await P[5].p.waitForSelector('#cup >> css=#ai', { timeout: 40000 }); await shot(P[5].p, 'player-04-fraga'); await overflow(P[5].p, 'fråga SE/13');
  ok(!(await sh(P[5].p)).includes('Lina'), 'under pågående runda syns inga andra spelare/poäng');
  await P[6].c.setOffline(true); await sleep(2500); ok((await P[6].p.locator('#cup >> css=#banner').innerText()).includes('Ingen kontakt'), 'nätbortfall visar tydlig banner'); await P[6].c.setOffline(false);
  // värd väntar på resultat
  async function hostNext(label) {
    await hp.waitForSelector('#cup >> css=[data-act=next]', { timeout: 60000 });
    const t = await sh(hp); await sleep(400);
    await hp.click('#cup >> css=[data-act=next]'); return t;
  }
  let scoredText = await (async () => {
    await hp.waitForSelector('#cup >> css=[data-act=next]', { timeout: 60000 }).catch(async e => {
      console.log('HÄNGER i kvalet. värdvy: ' + (await sh(hp)).slice(0, 300));
      for (let i = 0; i < P.length; i++) console.log(P[i].nick + ' [' + P[i].dev + '] skickade ' + states[i].seen.length + ' svar; vy: ' + (await sh(P[i].p)).slice(0, 120));
      throw e;
    });
    return sh(hp);
  })();
  ok(/Kval klar/.test(scoredText), 'värd ser Kval klar');
  for (const x of P) await x.p.waitForSelector('#cup >> css=ol.rank li', { timeout: 15000 });
  ok(states.every(x => !x.leak) && states.every(x => x.fb > 0), `under pågående runda visar ingen spelares skärm rätt/fel eller facit (neutral bekräftelse hos alla; läckor: ${states.map(x => x.leak || 0).join(',')})`);
  const rankRows = await P[0].p.locator('#cup >> css=ol.rank li').count(); ok(rankRows === 10, `alla ser topplista med 10 resultat (${rankRows})`);
  const mine = []; for (const x of P) mine.push((await x.p.locator('#cup >> css=h1').first().innerText()));
  ok(mine.every((m, i) => m === `${QUAL[i]} av 10 rätt`), 'varje spelare ser sitt eget korrekta resultat: ' + mine.join(' | '));
  const sigs = states.map(s => s.seen.filter(x => x.startsWith('kval')).map(x => x.split('|').slice(2).join('')).join(','));
  ok(new Set(sigs).size === 1 && sigs[0].split(',').length === 10, 'alla 10 spelare fick samma 10 frågor i samma ordning'); await shot(P[0].p, 'player-05-resultat'); await shot(hp, 'host-06-resultat'); await overflow(P[0].p, 'resultat'); 
  await P[4].p.click('#cup >> css=details.review summary'); ok((await P[4].p.locator('#cup >> css=.rv').count()) === 10, 'genomgång av egna svar visas efter rundan');
  // värdens telefon laddas om / skärmen har varit låst mitt i turneringen: värdsessionen ligger kvar och spelet fortsätter
  await hp.reload({ waitUntil: 'networkidle' }); await hp.waitForSelector('#cup >> css=[data-act=next]', { timeout: 15000 });
  ok(/Kval klar/.test(await sh(hp)), 'värd efter omladdning: samma spel, Kval klar, "nästa" finns kvar');
  // fortsätt: utslag, semi, final
  let guard = 0, sawTb = false, sawSemi = false, sawFinal = 0;
  await hp.click('#cup >> css=[data-act=next]'); await hp.waitForSelector('#cup >> css=[data-act=next]', { state: 'detached', timeout: 15000 });
  while (guard++ < 20) {
    await hp.waitForSelector('#cup >> css=[data-act=next], .podium', { timeout: 90000 }).catch(async e => { console.log('HÄNGER. värdvy: ' + (await sh(hp)).slice(0, 400)); for (const x of P) console.log(x.nick + ': ' + (await sh(x.p)).slice(0, 150)); throw e; });
    const t = await sh(hp);
    if (/vinner!/.test(t)) break;
    if (/Utslagsrunda klar/.test(t)) sawTb = true; if (/Semifinal klar/.test(t)) { sawSemi = true; if (!ctxs.shotSemi) { ctxs.shotSemi = 1; await shot(hp, 'host-07-semi'); } }
    if (/Final – spel \d av 3 klar/.test(t)) sawFinal++;
    await sleep(500); await hp.click('#cup >> css=[data-act=next]'); await hp.waitForSelector('#cup >> css=[data-act=next]', { state: 'detached', timeout: 15000 }).catch(() => {});
  }
  await Promise.all(drivers);
  const pt = await sh(hp);
  ok(sawTb, 'utslagsrunda spelades'); ok(sawSemi, 'semifinal spelades'); ok(sawFinal >= 3, `bäst av tre: ${sawFinal + 1} finalspel spelade`);
  ok(/Sara vinner!/.test(pt), 'Sara vinner (2 av 3 games)'); ok(/1:a.*Sara.*2:a.*Sara 2/.test(pt), 'prispall: 1:a Sara, 2:a Sara 2');
  ok(/Delad 3:e.*(Omar.*Lina|Lina.*Omar)/.test(pt), 'prispall: delad tredjeplats Omar och Lina');
  for (const x of P) ok((await sh(x.p)).includes('Sara vinner!'), `${x.nick} (${x.dev}) ser vinnaren`);
  await shot(hp, 'host-08-prispall'); await shot(P[3].p, 'player-06-prispall'); await overflow(P[3].p, 'prispall');
  // städning: klar
  await hp.click('#cup >> css=[data-act=done]'); ok((await sh(hp)).includes('Spela tillsammans'), 'värd tillbaka till menyn efter spelet');
  ok(errors.length === 0, 'inga JS-fel i någon av 11 sessioner: ' + errors.slice(0, 3).join(' || '));
  await b.close();
  console.log(`cup-e2e: ${pass} PASS, ${fail} FAIL, sessioner: 1 värd + 10 spelare (iPhone SE ×4, iPhone 13 ×3, Pixel 5 ×3, Chromium-emulering), ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (fail) { console.log(bad.join('\n')); process.exit(1); }
})().catch(e => { console.error('KRASCH', e); process.exit(2); });
