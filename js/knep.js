/* Matte OS · Minnesknep 1.0
 * Short memory anchors for the most common mix-ups. Each one says WHY it works, WHEN it does not,
 * a typical mistake, two new tasks whose answers stay hidden until the learner has tried,
 * and a recall question for a later day (retrieval practice).
 * Stores only first results and dates per profile in localStorage 'matteos.knep.v1'. No free text.
 */
(function (root, factory) { const o = factory(root); if (typeof module === 'object' && module.exports) module.exports = o; root.MOKnep = o; })(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const STORE = 'matteos.knep.v1', DAY = 86400000;
  const PROFILES = ['grade8', 'grade9'];

  /* Authoring convention: in every choice question the correct option is FIRST; display order is shuffled
     deterministically so it is the same on every device. Numeric answers are computed from `calc`. */
  const KNEP = [
    {
      id: 'runt-inuti', topic: 'Geometri', skills: ['f8-perimeter', 'f8-area', 'f8-area-more'],
      title: 'Omkrets eller area?',
      anchor: 'RUNT kanten = omkrets (cm). INUTI ytan = area (cm²).',
      why: ['Omkrets: du går längs kanten och lägger ihop sträckor. Svaret är en längd, till exempel cm.',
        'Area: du räknar rutor som täcker ytan. Svaret är rutor, till exempel cm².',
        'Rektangeln 4 × 3 cm: runt = 4 + 3 + 4 + 3 = 14 cm, inuti = 4 rutor · 3 rader = 12 cm².'],
      works: 'För alla figurer: omkrets är alltid en längd, area är alltid en yta.',
      fails: 'Snabbformeln 2 · (längd + bredd) gäller bara rektanglar. En triangel med sidorna 3, 4 och 5 cm har omkretsen 3 + 4 + 5 = 12 cm – lägg ihop de sidor som faktiskt finns.',
      trap: { wrong: 'Rektangel 7 × 2 cm: ”omkretsen är 7 · 2 = 14 cm”.', fix: 'Gånger räknar rutor, alltså area. Runt kanten lägger man ihop: 7 + 2 + 7 + 2 = 18 cm.' },
      tasks: [
        { q: 'En rektangel är 5 cm lång och 3 cm bred. Hur lång är omkretsen?', calc: '5+3+5+3', unit: 'cm', explain: 'Runt kanten: 5 + 3 + 5 + 3 = 16 cm.' },
        { q: 'Samma rektangel, 5 cm × 3 cm. Hur stor är arean?', calc: '5*3', unit: 'cm²', explain: 'Inuti: 5 rutor per rad och 3 rader = 15 rutor = 15 cm².' }
      ],
      recall: { q: 'Ett staket ska gå runt en hage som är 6 m × 4 m. Vad behöver du räkna ut?', options: ['Omkretsen – staketet följer kanten', 'Arean – staketet täcker ytan', 'Båda behövs lika mycket'], explain: 'Staketet går runt kanten: 6 + 4 + 6 + 4 = 20 m.' }
    },
    {
      id: 'lilla-siffran', topic: 'Tal', skills: ['f8-powers-ten', 'f8-powers', 's9-powers', 's9-scientific'],
      title: 'Den lilla siffran i 10² och (0,1)²',
      anchor: 'Den lilla siffran säger hur många gånger talet står i en multiplikation.',
      why: ['10² = 10 · 10 = 100: tio tior.',
        '(0,1)² = 0,1 · 0,1: en tiondel av en tiondel. Det är en hundradel = 0,01.',
        'Tänk ett rutnät med 10 × 10 rutor. En tiondel av en tiondel är 1 ruta av 100.'],
      works: 'För alla potenser med positiv heltalsexponent, till exempel 2³ = 2 · 2 · 2.',
      fails: 'Den lilla siffran betyder inte ”gånger 2”: 10² är inte 20 och (0,1)² är inte 0,2. Negativa exponenter, som 10⁻², betyder något annat: där delar man i stället.',
      trap: { wrong: '(0,1)² = 0,2', fix: '0,2 vore 0,1 + 0,1. Kvadrat betyder 0,1 · 0,1 = 0,01 – mindre än 0,1, eftersom du tar en del av en del.' },
      tasks: [
        { q: 'Beräkna 10³.', calc: '10**3', explain: '10 · 10 · 10 = 1 000: tio hundratal.' },
        { q: 'Beräkna (0,1)³.', calc: '0.1**3', explain: 'En tiondel av en tiondel av en tiondel = en tusendel = 0,001.' }
      ],
      recall: { q: 'Vilket tal är störst?', options: ['0,1', '(0,1)²', 'De är lika stora'], explain: '(0,1)² = 0,01. En del av en del blir mindre än delen.' }
    },
    {
      id: 'minus-potens', topic: 'Tal', skills: ['f8-negative'],
      title: '(−3)² eller −3²?',
      anchor: 'Exponenten gäller bara det som står precis framför den. Parentes = hela talet.',
      why: ['(−3)² = (−3) · (−3) = 9. Minus gånger minus blir plus.',
        '−3² betyder −(3 · 3) = −9. Minuset står utanför.',
        'Parentesen avgör vad som multipliceras med sig självt.'],
      works: 'Överallt där potenser skrivs, även med bokstäver: (−x)² är inte samma som −x².',
      fails: 'Samma sak gäller gånger: 2 · 3² = 2 · 9 = 18, inte 6² = 36. Exponenten tar inte med sig talet framför.',
      trap: { wrong: '−3² = 9', fix: 'Utan parentes gäller tvåan bara 3:an: −(3 · 3) = −9.' },
      tasks: [
        { q: 'Beräkna (−2)².', calc: '(-2)**2', explain: '(−2) · (−2) = 4.' },
        { q: 'Beräkna −2².', calc: '-(2**2)', explain: 'Bara 2:an kvadreras: −(2 · 2) = −4.' }
      ],
      recall: { q: 'Du ska kontrollera om x = −4 löser x² = 16. Hur skriver du?', options: ['(−4)² = 16', '−4² = −16', '−4 · 2 = −8'], explain: 'Sätt in hela −4 med parentes: (−4) · (−4) = 16. Det stämmer.' }
    },
    {
      id: 'nio-knep', topic: 'Multiplikation', skills: [],
      title: 'Nio gånger ett tal',
      anchor: '9 · tal = 10 · tal − tal.',
      why: ['9 · 7 betyder nio sjuor.',
        '10 · 7 = 70 är tio sjuor – en sjua för mycket.',
        'Ta bort en sjua: 70 − 7 = 63.'],
      works: 'För alla tal gånger 9. Samma idé fungerar för 99: 99 · 4 = 400 − 4 = 396.',
      fails: 'Dra bort talet, inte 9 eller 10. Och knepet gäller nior – för 8 · 7 måste du dra bort två sjuor: 70 − 14 = 56.',
      trap: { wrong: '9 · 7 = 70 − 9 = 61', fix: 'Du har tio sjuor och vill ha nio sjuor. Ta bort en sjua, inte en nia.' },
      tasks: [
        { q: 'Beräkna 9 · 8 med knepet.', calc: '9*8', explain: '10 · 8 = 80. Ta bort en åtta: 80 − 8 = 72.' },
        { q: 'Beräkna 9 · 12.', calc: '9*12', explain: '10 · 12 = 120. Ta bort en tolva: 120 − 12 = 108.' }
      ],
      recall: { q: 'Vilken uträkning ger 9 · 6?', options: ['60 − 6', '60 − 9', '54 + 9'], explain: '10 · 6 = 60. Ta bort en sexa: 54.' }
    },
    {
      id: 'minus-parentes', topic: 'Algebra', skills: ['f8-parentheses-add', 'f8-equations-more'],
      title: 'Minus framför en parentes',
      anchor: 'Minus framför parentes: vänd tecknet på ALLT inuti när parentesen tas bort.',
      why: ['10 − (4 − 1) betyder: ta bort hela (4 − 1) = 3 från 10. Svaret är 7.',
        'Utan parentes: 10 − 4 + 1 = 7. Minus 1 inuti blev plus 1.',
        'Du drog bort 4 men skulle bara ha dragit bort 3 – därför lägger du tillbaka 1.'],
      works: 'När det står minus direkt framför parentesen. Står det plus ändras ingenting: 10 + (4 − 1) = 10 + 4 − 1.',
      fails: 'Det räcker inte att vända det första tecknet – alla termer inuti byter tecken. Och plus inuti blir minus: 15 − (6 + 2) = 15 − 6 − 2 = 7.',
      trap: { wrong: '10 − (4 − 1) = 10 − 4 − 1 = 5', fix: 'Bara första tecknet vändes. Kontrollera: 4 − 1 = 3 och 10 − 3 = 7, inte 5.' },
      tasks: [
        { q: 'Beräkna 12 − (5 − 2) genom att först ta bort parentesen.', calc: '12-(5-2)', explain: '12 − 5 + 2 = 9. Kontroll: 12 − 3 = 9.' },
        { q: 'Förenkla 8 − (x + 3) och beräkna värdet när x = 1.', calc: '8-(1+3)', explain: '8 − x − 3 = 5 − x. Med x = 1 blir det 4. Kontroll: 8 − (1 + 3) = 8 − 4 = 4.' }
      ],
      recall: { q: 'Hur skrivs 20 − (6 − 4) utan parentes?', options: ['20 − 6 + 4', '20 − 6 − 4', '20 + 6 − 4'], explain: 'Båda tecknen inuti vänds: −6 och +4. Kontroll: 20 − 2 = 18.' }
    },
    {
      id: 'riktningar', topic: 'Enheter', skills: ['f8-units', 'f8-volume-units', 'f8-large-area'],
      title: 'cm, cm² eller cm³?',
      anchor: 'Räkna riktningar: längd 1 (cm), area 2 (cm²), volym 3 (cm³). Byt enhet lika många gånger.',
      why: ['1 dm = 10 cm: en riktning, gånger 10.',
        '1 dm² är en ruta som är 10 cm åt två håll: 10 · 10 = 100 cm².',
        '1 dm³ är en kub som är 10 cm åt tre håll: 10 · 10 · 10 = 1 000 cm³, och det är 1 liter.'],
      works: 'För alla byten mellan areaenheter och mellan volymenheter.',
      fails: 'Liter, deciliter och centiliter är volym men har bara steg om 10 mellan sig. Och 1 m² är inte 100 cm² – metern blir 100 cm åt båda hållen.',
      trap: { wrong: '1 m² = 100 cm²', fix: '1 m = 100 cm åt två håll: 100 · 100 = 10 000 cm².' },
      tasks: [
        { q: 'Hur många cm² är 3 m²?', calc: '3*100*100', unit: 'cm²', explain: '1 m² = 100 · 100 = 10 000 cm². Tre sådana är 30 000 cm².' },
        { q: 'Hur många cm³ är 2 dm³?', calc: '2*10*10*10', unit: 'cm³', explain: '1 dm³ = 10 · 10 · 10 = 1 000 cm³. Två sådana är 2 000 cm³.' }
      ],
      recall: { q: 'Du ska ange hur mycket vatten en pool rymmer. Vilken enhet passar?', options: ['m³', 'm²', 'm'], explain: 'Vattnet fyller ett utrymme åt tre håll, alltså kubik.' }
    },
    {
      id: 'skala-riktningar', topic: 'Geometri', skills: ['s9-area-scale', 's9-volume-scale', 's9-similarity'],
      title: 'Förstoring: längd, area, volym',
      anchor: 'Längd × k → area × k² → volym × k³. Räkna hur många riktningar som växer.',
      why: ['Sidorna blir dubbelt så långa: längden blir × 2.',
        'Arean växer åt två håll: 2 · 2 = 4 gånger.',
        'Volymen växer åt tre håll: 2 · 2 · 2 = 8 gånger.'],
      works: 'För likformiga figurer och kroppar, där alla mått förstoras lika mycket.',
      fails: 'Om bara en sida ändras – en rektangel blir dubbelt så lång men lika bred – blir arean bara 2 gånger så stor, inte 4. k² kräver att alla mått förstoras.',
      trap: { wrong: 'Sidorna × 3 → arean × 3', fix: 'Arean växer åt två håll: 3 · 3 = 9 gånger.' },
      tasks: [
        { q: 'En kvadrat förstoras så att sidorna blir 4 gånger så långa. Hur många gånger större blir arean?', calc: '4*4', explain: 'Två riktningar: 4 · 4 = 16.' },
        { q: 'En kub förstoras så att kanterna blir 3 gånger så långa. Hur många gånger större blir volymen?', calc: '3**3', explain: 'Tre riktningar: 3 · 3 · 3 = 27.' }
      ],
      recall: { q: 'En rektangel blir dubbelt så lång men lika bred. Arean blir…', options: ['dubbelt så stor', 'fyra gånger så stor', 'oförändrad'], explain: 'Bara en riktning växer, så arean blir × 2. Knepet med k² gäller bara när alla mått förstoras.' }
    },
    {
      id: 'procent-bygg', topic: 'Procent', skills: ['s9-percent-part', 's9-percent-problem', 's9-percent-share'],
      title: 'Procent: bygg från 10 % eller 1 %',
      anchor: 'Hitta 10 % (dela med 10) eller 1 % (dela med 100). Bygg sedan det du behöver.',
      why: ['10 % av 150 = 150 / 10 = 15.',
        '20 % är två gånger 10 %: 30.',
        '5 % är hälften av 10 %: 7,5.'],
      works: 'För alla procentsatser. 1 % fungerar alltid; 10 % går snabbast när procenten är jämna tiotal.',
      fails: 'Dela inte med procentsatsen: 20 % av 150 är inte 150 / 20. För 7 % går det inte att bygga från 10 % direkt – gå via 1 %.',
      trap: { wrong: '20 % av 150 = 150 / 20 = 7,5', fix: '20 % betyder 20 hundradelar. Ta 10 % två gånger: 15 + 15 = 30.' },
      tasks: [
        { q: 'Beräkna 30 % av 80.', calc: '0.3*80', explain: '10 % = 8, så 30 % = 3 · 8 = 24.' },
        { q: 'Beräkna 7 % av 200.', calc: '0.07*200', explain: '1 % = 2, så 7 % = 7 · 2 = 14.' }
      ],
      recall: { q: 'Vilken uträkning ger 15 % av 60?', options: ['6 + 3', '60 / 15', '60 − 15'], explain: '10 % = 6 och 5 % = 3. Tillsammans 9.' }
    },
    {
      id: 'procent-pa-procent', topic: 'Procent', skills: ['s9-repeated-change', 's9-change-factor'],
      title: 'Procent i flera steg',
      anchor: 'Räkna från det nya värdet varje gång. Två höjningar med 10 % är inte 20 %.',
      why: ['200 kr höjs med 10 %: 220 kr.',
        'Nästa 10 % räknas på 220 kr: 22 kr. Priset blir 242 kr.',
        'Med förändringsfaktor: 200 · 1,1 · 1,1 = 242.'],
      works: 'För ränta, prisökningar och minskningar i flera steg.',
      fails: 'Om båda procentsatserna räknas på samma startvärde – till exempel 10 % och 5 % rabatt som båda räknas på originalpriset 200 kr – lägger man ihop dem: 20 + 10 = 30 kr. Läs vad procenten räknas på.',
      trap: { wrong: 'Sänks med 10 % två gånger → 20 % billigare', fix: 'Andra sänkningen tas av ett lägre pris: 200 → 180 → 162, alltså 19 % billigare totalt.' },
      tasks: [
        { q: '300 kr sänks med 10 % två gånger i rad. Vad blir priset?', calc: '300*0.9*0.9', unit: 'kr', explain: '300 · 0,9 = 270 och 270 · 0,9 = 243 kr.' },
        { q: '1 000 kr växer med 5 % per år i två år. Hur mycket blir det?', calc: '1000*1.05*1.05', unit: 'kr', explain: '1 000 · 1,05 · 1,05 = 1 102,5 kr.' }
      ],
      recall: { q: 'Ett pris höjs med 50 % och sänks sedan med 50 %. Jämfört med början blir priset…', options: ['lägre', 'samma', 'högre'], explain: '100 → 150 → 75. Sänkningen räknas på det högre priset.' }
    },
    {
      id: 'rot-tva-svar', topic: 'Tal', skills: ['s9-sqrt', 's9-sqrt-more', 's9-quadratic'],
      title: '√ eller x²?',
      anchor: '√ ger ett svar och det är aldrig negativt. x² = tal ger två svar: plus och minus.',
      why: ['√49 frågar: vilket icke-negativt tal gånger sig självt blir 49? Svar: 7.',
        'x² = 49 frågar: vilka tal gånger sig självt blir 49? Både 7 och −7.',
        'Kontrollera: (−7) · (−7) = 49.'],
      works: 'För alla positiva tal: x² = a har lösningarna √a och −√a.',
      fails: 'x² = 0 har bara lösningen 0. x² = −4 saknar lösning bland de tal ni räknar med, eftersom inget tal gånger sig självt blir negativt.',
      trap: { wrong: 'x² = 36 ger bara x = 6', fix: '(−6)² = 36 också. Det finns två lösningar.' },
      tasks: [
        { q: 'Beräkna √81.', calc: 'Math.sqrt(81)', explain: '9 · 9 = 81, och √ ger det icke-negativa svaret: 9.' },
        { q: 'x² = 81. Ange den negativa lösningen.', calc: '-9', explain: '(−9) · (−9) = 81.' }
      ],
      recall: { q: 'Hur många lösningar har x² = 25?', options: ['två', 'en', 'ingen'], explain: '5 och −5.' }
    }
  ];

  /* ---------- deterministic option order ---------- */
  function hash(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function order(n, seed) { let a = hash(seed); const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const idx = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx; }
  function displayOrder(k) { return order(k.recall.options.length, 'knep:' + k.id + ':recall'); }

  /* ---------- answers ---------- */
  function value(task) { return Function('"use strict";return (' + task.calc + ');')(); }
  function parseNum(s) { const t = String(s ?? '').trim().replace(/\s| /g, '').replace(/[−–]/g, '-').replace(',', '.').replace(/(cm³|cm²|cm|kr|m³|m²)$/i, ''); if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN; return Number(t); }
  function checkTask(task, input) { const v = parseNum(input); return Number.isFinite(v) && Math.abs(v - value(task)) < 1e-9; }
  const fmt = n => { const r = Math.round(n * 1e6) / 1e6; const [i, d] = String(Math.abs(r)).split('.'); return (r < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? ',' + d : ''); };

  /* ---------- storage: first result per task, recall history ---------- */
  function empty() { return { v: 1, profiles: { grade8: {}, grade9: {} } }; }
  function validAt(x) { return Number.isFinite(x) && x > 1600000000000 && x < Date.now() + DAY; }
  function sanitize(raw) { const out = empty(); if (!raw || raw.v !== 1 || !raw.profiles) return out;
    for (const p of PROFILES) for (const k of KNEP) { const r = raw.profiles[p]?.[k.id]; if (!r) continue; const rec = {};
      for (const t of ['t0', 't1']) if (r[t] && validAt(r[t].at)) rec[t] = { at: Math.floor(r[t].at), ok: r[t].ok === true };
      if (r.recall && validAt(r.recall.at)) rec.recall = { at: Math.floor(r.recall.at), ok: r.recall.ok === true, n: Math.max(1, Math.min(99, Math.floor(Number(r.recall.n) || 1))) };
      if (Object.keys(rec).length) out.profiles[p][k.id] = rec; }
    return out; }
  function storage() { try { return root.localStorage; } catch { return null; } }
  let store = (() => { try { return sanitize(JSON.parse(storage()?.getItem(STORE) || 'null')); } catch { return empty(); } })();
  function save() { try { storage().setItem(STORE, JSON.stringify(store)); root.MO_STUDY?.markDirty('memory'); } catch { /* private mode: keep in memory */ } }
  function pid() { const p = root.MOEngine?.state?.()?.active; return PROFILES.includes(p) ? p : 'grade9'; }
  function rec(id, p = pid()) { return store.profiles[p][id] || (store.profiles[p][id] = {}); }
  /* Status from evidence: tried a new task alone, then remembered it on a later day. */
  function status(k, p = pid(), now = Date.now()) { const r = store.profiles[p][k.id] || {};
    const tried = ['t0', 't1'].filter(t => r[t]); const okNew = tried.filter(t => r[t].ok).length;
    const firstAt = Math.min(...tried.map(t => r[t].at), Infinity);
    if (r.recall?.ok && r.recall.at - firstAt >= DAY) return { level: 3, label: 'Mindes efter ' + Math.max(1, Math.floor((r.recall.at - firstAt) / DAY)) + ' dag' + (Math.floor((r.recall.at - firstAt) / DAY) > 1 ? 'ar' : '') };
    if (tried.length === 2 && okNew === 2 && now - firstAt >= DAY) return { level: 2, label: 'Dags att minnas', due: true };
    if (tried.length === 2 && okNew === 2) return { level: 2, label: 'Klarade nya uppgifter själv' };
    if (okNew < tried.length) return { level: 1, label: 'Öva igen', due: now - firstAt >= DAY };
    if (tried.length) return { level: 1, label: '1 av 2 uppgifter klar' };
    return { level: 0, label: 'Inte provat' }; }
  function forSkill(sid) { return KNEP.find(k => k.skills.includes(sid)) || null; }
  function dueCount(p = pid()) { return KNEP.filter(k => status(k, p).due).length; }

  /* ---------- rendering ---------- */
  const e = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ui = { inputs: {}, results: {}, recallPick: {}, recallDone: {}, mode: 'list', open: '' };
  function taskHTML(k, i) { const t = k.tasks[i], key = k.id + ':' + i, res = ui.results[key];
    return `<div class="knep-task"><label for="kn-${key}">${e(t.q)}</label><div class="knep-row"><input id="kn-${key}" data-kin="${key}" inputmode="decimal" autocomplete="off" value="${e(ui.inputs[key] || '')}" ${res ? 'readonly' : ''} aria-describedby="kf-${key}">${t.unit ? `<span class="knep-unit">${e(t.unit)}</span>` : ''}${res ? '' : `<button type="button" class="btn sm" data-kn="check" data-key="${key}">Kontrollera</button>`}</div>
      <div id="kf-${key}" role="status">${res ? `<p class="knep-fb ${res.ok ? 'ok' : 'no'}"><b>${res.ok ? 'Rätt – och utan att se facit först.' : 'Inte riktigt. Rätt svar: ' + e(fmt(value(t))) + (t.unit ? ' ' + e(t.unit) : '') + '.'}</b> ${e(t.explain)}</p>` : ''}</div></div>`; }
  function body(k, { compact = false } = {}) {
    return `<p class="knep-anchor">${e(k.anchor)}</p>
      <details class="knep-more"><summary>Varför fungerar det?</summary><ol>${k.why.map(w => `<li>${e(w)}</li>`).join('')}</ol></details>
      <details class="knep-more"><summary>När fungerar det inte?</summary><p><b>Fungerar:</b> ${e(k.works)}</p><p><b>Fungerar inte:</b> ${e(k.fails)}</p><p class="knep-trap"><b>Vanligt fel:</b> ${e(k.trap.wrong)} <span>${e(k.trap.fix)}</span></p></details>
      <div class="knep-try"><p class="knep-tryhead">Prova på en ny uppgift – facit visas först när du har svarat${compact ? '' : ''}.</p>${k.tasks.map((_, i) => taskHTML(k, i)).join('')}</div>`; }
  function card(sid) { const k = forSkill(sid); if (!k) return '';
    return `<section class="knep" aria-labelledby="knep-h-${k.id}"><p class="eyebrow">MINNESKNEP</p><h2 id="knep-h-${k.id}">${e(k.title)}</h2>${body(k, { compact: true })}<a class="knep-link" href="#/knep">Alla minnesknep →</a></section>`; }
  function recallHTML(k) { const d = displayOrder(k), pick = ui.recallPick[k.id], done = ui.recallDone[k.id];
    return `<div class="knep-recall"><p class="eyebrow">MINNS DU?</p><h3>${e(k.recall.q)}</h3><p class="mut small">Svara innan du tittar på knepet – att hämta fram det ur minnet är själva träningen.</p>
      <div class="knep-opts" role="group" aria-label="Svarsalternativ">${d.map((ai, di) => `<button type="button" class="knep-opt ${pick === di ? 'on' : ''} ${done ? (ai === 0 ? 'right' : pick === di ? 'wrong' : '') : ''}" data-kn="rpick" data-id="${k.id}" data-i="${di}" aria-pressed="${pick === di}" ${done ? 'disabled' : ''}>${e(k.recall.options[ai])}</button>`).join('')}</div>
      ${done ? `<p class="knep-fb ${d[pick] === 0 ? 'ok' : 'no'}" role="status"><b>${d[pick] === 0 ? 'Rätt ihågkommet!' : 'Inte den – titta på knepet igen.'}</b> ${e(k.recall.explain)}</p><p class="knep-anchor">${e(k.anchor)}</p>` : `<button type="button" class="btn sm" data-kn="rcheck" data-id="${k.id}" ${pick === undefined ? 'disabled' : ''}>Kontrollera</button>`}</div>`; }
  function page() { const p = pid(); const groups = [...new Set(KNEP.map(k => k.topic))]; const due = KNEP.filter(k => status(k, p).due || ui.recallDone[k.id]);
    return `<p class="eyebrow">Förstå · minnesknep</p><h1>Minnesknep</h1><p class="mut">Korta knep för det som är lätt att blanda ihop. Varje knep visar varför det fungerar och när det <b>inte</b> gör det. Prova alltid en ny uppgift innan du tittar på facit.</p>
      ${due.length ? `<section class="card knep-due"><h2>Dags att minnas (${due.filter(k => !ui.recallDone[k.id]).length})</h2><p class="mut small">Du klarade de här för minst en dag sedan. Svara utan att titta på knepet först.</p>${due.map(recallHTML).join('')}</section>` : ''}
      ${groups.map(g => `<h2 class="knep-group">${e(g)}</h2>${KNEP.filter(k => k.topic === g).map(k => { const s = status(k, p); return `<details class="knep knep-item" ${ui.open === k.id ? 'open' : ''} data-kid="${k.id}"><summary><span class="knep-title">${e(k.title)}</span><span class="knep-status lvl${s.level}">${e(s.label)}</span></summary>${body(k)}</details>`; }).join('')}`).join('')}
      <p class="mut small">Status: ”Klarade nya uppgifter själv” betyder rätt på första försöket. ”Mindes efter … dagar” kräver att du svarar rätt på minns-frågan minst en dag senare. Bara första försöket sparas, aldrig det du skriver.</p>
      <details class="fold"><summary>Utskrivbar översikt (affisch, valfritt)</summary><div class="in"><p class="mut small">Affischen är en repetition att skriva ut. Lär dig hellre knepen här först – med varför och när de inte fungerar.</p><a class="btn ghost block" href="affischer/?visa=formler&ak=${p === 'grade8' ? '8' : '9'}">Visa affischen</a></div></details>`; }

  /* ---------- events ---------- */
  function redraw() { if (typeof root.MO_RENDER === 'function') root.MO_RENDER(); }
  function find(id) { return KNEP.find(k => k.id === id); }
  function handle(act, el) {
    if (act === 'check') { const key = el.dataset.key; const [id, i] = key.split(':'); const k = find(id); if (!k) return; const input = root.document?.getElementById('kn-' + key)?.value ?? ui.inputs[key] ?? '';
      if (!String(input).trim()) { root.document?.getElementById('kn-' + key)?.focus(); return; }
      ui.inputs[key] = input; const ok = checkTask(k.tasks[+i], input); ui.results[key] = { ok };
      const r = rec(id); const slot = 't' + i; if (!r[slot]) { r[slot] = { at: Date.now(), ok }; save(); }
      ui.open = id; redraw(); root.requestAnimationFrame?.(() => root.document?.getElementById('kf-' + key)?.scrollIntoView?.({ block: 'nearest' })); return; }
    if (act === 'rpick') { if (ui.recallDone[el.dataset.id]) return; ui.recallPick[el.dataset.id] = Number(el.dataset.i); redraw(); return; }
    if (act === 'rcheck') { const id = el.dataset.id, k = find(id); const pick = ui.recallPick[id]; if (!k || pick === undefined) return; ui.recallDone[id] = true;
      const ok = displayOrder(k)[pick] === 0; const r = rec(id); r.recall = { at: Date.now(), ok, n: (r.recall?.n || 0) + 1 }; save(); redraw(); return; }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('click', ev => { const b = ev.target.closest('[data-kn]'); if (!b || b.disabled) return; ev.preventDefault(); handle(b.dataset.kn, b); });
    document.addEventListener('input', ev => { const k = ev.target?.dataset?.kin; if (k) ui.inputs[k] = ev.target.value; });
    document.addEventListener('keydown', ev => { const k = ev.target?.dataset?.kin; if (k && ev.key === 'Enter') { ev.preventDefault(); const b = document.querySelector(`[data-kn="check"][data-key="${k}"]`); if (b) handle('check', b); } });
    document.addEventListener('toggle', ev => { const d = ev.target; if (d?.dataset?.kid && d.open) ui.open = d.dataset.kid; }, true);
  }
  function exportData() { return JSON.parse(JSON.stringify(store)); }
  function importData(obj) { if (!obj || obj.v !== 1) return false; store = sanitize(obj); save(); return true; }
  return { KNEP, STORE, card, page, forSkill, status, dueCount, exportData, importData,
    _test: { value, parseNum, checkTask, displayOrder, sanitize, empty, fmt, setStore: s => { store = sanitize(s); }, getStore: () => JSON.parse(JSON.stringify(store)), resetUi: () => { ui.inputs = {}; ui.results = {}; ui.recallPick = {}; ui.recallDone = {}; } } };
});
