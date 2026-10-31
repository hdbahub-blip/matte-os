/* Matte OS v5 — lokal lagring, progressionsmodell, rekommendationsmotor och sök.
   Elevens matteframsteg stannar på enheten (localStorage). Cup-läget använder separat spelserver för kortlivade speluppgifter. */
(function (root) {
  'use strict';
  const CORE = root.MO_CORE || (typeof require !== 'undefined' ? require('./core.js') : null);
  const S9 = root.MO_CONTENT9 || (typeof require !== 'undefined' ? require('./content9.js') : []);
  const S8 = root.MO_CONTENT8 || (typeof require !== 'undefined' ? require('./content8.js') : []);

  /* ---------- Innehållsindex ---------- */
  const SKILLS = {};
  const byProfile = { grade9: S9, grade8: S8 };
  for (const [pid, list] of Object.entries(byProfile)) list.forEach((s, i) => {
    s.profile = pid; s.order = i;
    // normalisera guidad uppgift: regelval ligger i ro/rc
    if (s.g && s.g.type !== 'choice' && s.g.opts) { s.g.ro = s.g.opts; s.g.rc = s.g.oc; delete s.g.opts; }
    s.g.key = 'g'; s.p.forEach((p, j) => { p.key = 'p' + j; });
    SKILLS[s.id] = s;
  });
  const skillsOf = pid => byProfile[pid] || [];
  const chapterSkills = (pid, chId) => skillsOf(pid).filter(s => s.ch === chId);
  const item = (sid, key) => { const s = SKILLS[sid]; if (!s) return null; return key === 'g' ? s.g : s.p[+String(key).slice(1)]; };

  /* De tre "Gör själv"-uppgifterna: A → variation → baklänges/igenkänning. Resten (D/F) sparas till träning och prov. */
  function soloSet(s) {
    const pick = [], used = new Set();
    const take = pred => { const i = s.p.findIndex((p, j) => !used.has(j) && pred(p)); if (i >= 0) { used.add(i); pick.push(s.p[i]); } };
    take(p => p.lv === 'A'); take(p => p.lv === 'B'); take(p => p.lv === 'C');
    while (pick.length < 3) take(p => p.lv !== 'F'), pick.length < 3 && take(() => true);
    return pick.slice(0, 3);
  }

  /* ---------- Lagring ---------- */
  const KEY = 'matteos.v5';
  const blankTables = () => ({ v: 1, facts: {}, sessions: [] });
  const blankProfile = () => ({ name: '', attempts: [], lessons: {}, rests: {}, tests: [], tables: blankTables() });
  const defaultState = () => ({ v: 5, active: null, profiles: { grade9: blankProfile(), grade8: blankProfile() }, settings: {}, created: new Date().toISOString() });
  let mem = null;
  function safeGet() { try { return root.localStorage ? root.localStorage.getItem(KEY) : null; } catch (e) { return null; } }
  function safeSet(v) { try { root.localStorage && root.localStorage.setItem(KEY, v); return true; } catch (e) { return false; } }
  function sanitize(st) {
    const d = defaultState();
    if (!st || typeof st !== 'object') return d;
    const out = { ...d, ...st, profiles: { ...d.profiles } };
    for (const pid of ['grade9', 'grade8']) {
      const p = (st.profiles && st.profiles[pid]) || {};
      out.profiles[pid] = {
        name: typeof p.name === 'string' ? p.name.slice(0, 30) : '',
        attempts: Array.isArray(p.attempts) ? p.attempts.filter(a => a && SKILLS[a.s]).slice(-3000) : [],
        lessons: p.lessons && typeof p.lessons === 'object' ? p.lessons : {},
        rests: p.rests && typeof p.rests === 'object' ? p.rests : {},
        tests: Array.isArray(p.tests) ? p.tests.slice(-50) : [],
        tables: p.tables && typeof p.tables === 'object'
          ? { v: 1, facts: p.tables.facts && typeof p.tables.facts === 'object' ? p.tables.facts : {}, sessions: Array.isArray(p.tables.sessions) ? p.tables.sessions.slice(-120) : [] }
          : blankTables()
      };
    }
    if (!['grade9', 'grade8', null].includes(out.active)) out.active = null;
    out.v = 5;
    return out;
  }
  function load() {
    if (mem) return mem;
    let st = null; const raw = safeGet();
    if (raw) { try { st = JSON.parse(raw); } catch (e) { st = null; } }
    mem = sanitize(st);
    return mem;
  }
  function save() { if (mem) safeSet(JSON.stringify(mem)); }
  const state = () => load();
  const prof = pid => load().profiles[pid || load().active || 'grade9'];

  /* Migrering från v4 (IndexedDB 'matte-os-db' / 'kv' / 'state'): försök i ett tyst steg. */
  function migrateV4() {
    return new Promise(resolve => {
      try {
        if (!root.indexedDB || load().migratedV4) return resolve(false);
        const req = root.indexedDB.open('matte-os-db');
        req.onerror = () => resolve(false);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('kv')) { db.close(); load().migratedV4 = true; save(); return resolve(false); }
          const tx = db.transaction('kv', 'readonly'); const g = tx.objectStore('kv').get('state');
          g.onsuccess = () => {
            const old = g.result; let n = 0;
            if (old && old.profiles) for (const pid of ['grade9', 'grade8']) {
              const op = old.profiles[pid]; if (!op || !Array.isArray(op.attempts)) continue;
              for (const a of op.attempts) if (SKILLS[a.skillId]) { prof(pid).attempts.push({ s: a.skillId, x: 'v4', ok: !!a.correct, h: a.hintsUsed || 0, m: 'v4', t: Date.parse(a.ts) || Date.now() }); n++; }
            }
            if (old && old.activeProfile && !load().active && ['grade9', 'grade8'].includes(old.activeProfile)) load().active = old.activeProfile;
            load().migratedV4 = true; save(); db.close(); resolve(n);
          };
          g.onerror = () => { db.close(); resolve(false); };
        };
        req.onupgradeneeded = () => { /* fanns inte – avbryt utan att skapa */ try { req.transaction.abort(); } catch (e) { } resolve(false); };
      } catch (e) { resolve(false); }
    });
  }

  /* ---------- Försök och nivåer ---------- */
  function record(pid, a) { // a: {s, x, ok, first, h, w, sol, m, mc}
    const p = prof(pid); p.attempts.push({ ...a, t: Date.now() }); if (p.attempts.length > 3000) p.attempts = p.attempts.slice(-2500); save();
  }
  const LEVELS = [
    { k: 0, label: 'Ej påbörjad', short: 'Ny' },
    { k: 1, label: 'Behöver stöd', short: 'Stöd' },
    { k: 2, label: 'Klarar med stöd', short: 'Med stöd' },
    { k: 3, label: 'Klarar själv', short: 'Själv' },
    { k: 4, label: 'Säker', short: 'Säker' }
  ];
  const independent = a => a.first && !a.h && !a.sol;
  function level(pid, sid) {
    const A = prof(pid).attempts.filter(a => a.s === sid);
    if (!A.length) return 0;
    const ind = A.filter(a => a.m !== 'guided' && a.m !== 'v4' && independent(a));
    const solo = A.filter(a => a.m !== 'guided' && a.m !== 'v4');
    const last3 = solo.slice(-3);
    const mixed = ind.some(a => a.m === 'train' || a.m === 'test');
    if (ind.length >= 4 && last3.length === 3 && last3.every(independent) && mixed) return 4;
    const recent = solo.slice(-4);
    if (ind.length >= 2 && recent.filter(independent).length / recent.length >= 0.5) return 3;
    if (A.some(a => a.ok || a.first)) return 2;
    return 1;
  }
  const levelInfo = k => LEVELS[k];
  function chapterStats(pid, chId) {
    const sk = chapterSkills(pid, chId); const lv = sk.map(s => level(pid, s.id));
    return { total: sk.length, solo: lv.filter(l => l >= 3).length, started: lv.filter(l => l > 0).length, levels: lv, readiness: sk.length ? Math.round(100 * lv.reduce((p, l) => p + l, 0) / (4 * sk.length)) : 0 };
  }
  function lessonState(pid, sid) { return prof(pid).lessons[sid] || { step: 0, done: false }; }
  function setLesson(pid, sid, patch) { const p = prof(pid); p.lessons[sid] = { ...lessonState(pid, sid), ...patch, t: Date.now() }; save(); }

  /* ---------- Kalender ---------- */
  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { week: Math.ceil(((t - y0) / 86400000 + 1) / 7), year: t.getUTCFullYear() };
  }
  function now() { const o = root.__MO_NOW; return o ? new Date(o) : new Date(); }
  function schoolWeek() {
    const { week, year } = isoWeek(now());
    // Planen gäller HT-26 (v. 34–51 år 2026). Efter terminen: repetitionsläge.
    if (year < CORE.year || (year === CORE.year && week < 34)) return { week, phase: 'before' };
    if (year > CORE.year || week > 51) return { week, phase: 'after' };
    return { week, phase: 'term' };
  }
  const daysUntil = iso => { if (!iso) return null; const d = new Date(iso + 'T12:00:00'); return Math.round((d - now()) / 86400000); };

  /* ---------- Rekommendation: "Vad ska jag göra nu?" ---------- */
  function upcomingExam(pid) {
    const P = CORE.profiles[pid]; const { week, phase } = schoolWeek();
    if (phase !== 'term') return null;
    const e = P.plan.find(p => p.exam && p.w >= week);
    if (!e) return null;
    return { week: e.w, chapter: e.exam, ch: P.chapters.find(c => c.id === e.exam), inWeeks: e.w - week };
  }
  function restInfo(pid) {
    const P = CORE.profiles[pid]; const pr = prof(pid);
    return P.rests.map(r => {
      const date = (pr.rests[r.id] && pr.rests[r.id].date) || null;
      const st = chapterStats(pid, r.chapter);
      return { ...r, date, days: daysUntil(date), readiness: st.readiness, done: !!(pr.rests[r.id] && pr.rests[r.id].done) };
    }).filter(r => !r.done);
  }
  function recommend(pid) {
    const P = CORE.profiles[pid]; const { week, phase } = schoolWeek();
    const plan = P.plan.find(p => p.w === week);
    const exam = upcomingExam(pid);
    const rests = restInfo(pid);
    const urgentRest = rests.filter(r => r.days != null && r.days >= 0 && r.days <= 14).sort((a, b) => a.days - b.days)[0];
    let focus, reason;
    if (urgentRest && (!exam || exam.inWeeks * 7 > urgentRest.days)) { focus = urgentRest.chapter; reason = `${urgentRest.title} om ${urgentRest.days} dagar`; }
    else if (exam && exam.inWeeks <= 3) { focus = exam.chapter; reason = exam.inWeeks === 0 ? `Prov i ${exam.ch.name} den här veckan` : `Prov i ${exam.ch.name} vecka ${exam.week}`; }
    else {
      // kapitlet som undervisas nu (eller senast)
      const taught = skillsOf(pid).filter(s => s.w.some(w => w <= week));
      const cur = skillsOf(pid).find(s => s.w.includes(week)) || taught[taught.length - 1] || skillsOf(pid)[0];
      focus = cur.ch; reason = phase === 'term' ? `Det ni gör i skolan nu` : 'Repetition';
    }
    const sk = chapterSkills(pid, focus);
    // pågående lektion först
    const inProgress = sk.find(s => { const l = lessonState(pid, s.id); return l.step > 0 && !l.done && level(pid, s.id) < 3; });
    if (inProgress) return { kind: 'continue', skill: inProgress, chapter: focus, reason, step: lessonState(pid, inProgress.id).step, exam, plan };
    const order = phase === 'term' ? sk.filter(s => s.w[0] <= week + 1) : sk;
    const next = (order.length ? order : sk).find(s => level(pid, s.id) < 3);
    if (next) return { kind: 'lesson', skill: next, chapter: focus, reason, exam, plan };
    return { kind: 'mixed', chapter: focus, reason: reason + ' · allt grundläggande klart – blandträna', exam, plan };
  }

  /* ---------- Träningsurval ---------- */
  function shuffle(a, seed) { const r = a.slice(); let s = seed || Date.now(); for (let i = r.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
  function lastSeen(pid, sid, key) { const A = prof(pid).attempts; for (let i = A.length - 1; i >= 0; i--) if (A[i].s === sid && A[i].x === key) return A[i].t; return 0; }
  function trainingSet(pid, opts) {
    const n = (opts && opts.n) || 5;
    let pool = opts && opts.skill ? [SKILLS[opts.skill]] : chapterSkills(pid, opts.chapter);
    const { week, phase } = schoolWeek();
    if (!(opts && opts.skill) && phase === 'term') { const taught = pool.filter(s => s.w[0] <= week); if (taught.length >= 2) pool = taught; }
    // svagast först, men blanda moment (interleaving)
    const ranked = pool.map(s => ({ s, l: level(pid, s.id), t: Math.max(0, ...s.p.map(p => lastSeen(pid, s.id, p.key))) }))
      .sort((a, b) => a.l - b.l || a.t - b.t).slice(0, Math.max(3, Math.min(n, pool.length)));
    const picks = [];
    for (let round = 0; picks.length < n && round < 10; round++) {
      for (const { s } of ranked) {
        if (picks.length >= n) break;
        const items = [...s.p].sort((a, b) => lastSeen(pid, s.id, a.key) - lastSeen(pid, s.id, b.key) || (b.lv > a.lv ? 1 : -1));
        const it = items.find(x => !picks.some(p => p.s === s.id && p.key === x.key));
        if (it) picks.push({ s: s.id, key: it.key });
      }
    }
    return shuffle(picks, Date.now() % 9973).slice(0, n);
  }
  function testSet(pid, chId, n) {
    const sk = chapterSkills(pid, chId);
    const picks = sk.map(s => { const pref = s.p.filter(p => p.lv === 'F' || p.lv === 'D'); const c = pref.length ? pref : s.p; return { s: s.id, key: c[Math.floor(Math.random() * c.length)].key }; });
    return shuffle(picks, Date.now() % 7919).slice(0, n || Math.min(8, picks.length));
  }

  /* ---------- Sök (elevens egna ord → rätt moment) ---------- */
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9²³ ]/g, ' ');
  const SYN = { triangel: ['pythagoras', 'vinkel'], sida: ['pythagoras', 'katet', 'hypotenusa'], snett: ['pythagoras'], diagonal: ['pythagoras', 'rymddiagonal'], rabatt: ['procent', 'forandringsfaktor'], rea: ['procent', 'rabatt'], ranta: ['upprepad', 'forandringsfaktor'], hojning: ['forandringsfaktor', 'okning'], minus: ['negativa', 'parentes'], boll: ['klot'], burk: ['cylinder'], strut: ['kon'], karta: ['skala'], ritning: ['skala'], modell: ['skala', 'volymskala'], liter: ['volym', 'enheter'], kvadratmeter: ['area', 'enheter'], hjul: ['omkrets', 'cirkel'], pizza: ['cirkel', 'area', 'sektor'], okant: ['ekvation'], tal: [], rakna: [], hur: [], man: [], raknar: [], med: [], och: [], i: [], en: [], ett: [], pa: [], av: [] };
  function search(pid, q) {
    const words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const res = [];
    for (const s of skillsOf(pid)) {
      const hay = fold([s.title, s.sub, s.kw, s.f.name, (s.cue || []).join(' '), s.f.when].join(' '));
      let score = 0, hits = 0;
      for (const w of words) {
        const alts = [w, ...(SYN[w] || [])]; if (SYN[w] && SYN[w].length === 0 && words.length > 1) continue;
        let best = 0;
        for (const a of alts) {
          if (fold(s.title).includes(a)) best = Math.max(best, a === w ? 6 : 3);
          else if (new RegExp('(^|\\s)' + a).test(hay)) best = Math.max(best, a === w ? 4 : 2);
          else if (a.length >= 4 && hay.includes(a.slice(0, Math.max(4, a.length - 2)))) best = Math.max(best, 1);
        }
        if (best) hits++; score += best;
      }
      if (score > 0) res.push({ s, score: score + hits * 2 });
    }
    return res.sort((a, b) => b.score - a.score).slice(0, 8).map(r => r.s);
  }

  /* ---------- Backup ---------- */
  function exportData() { return JSON.stringify({ app: 'matte-os', v: 5, exported: new Date().toISOString(), state: load() }, null, 1); }
  function importData(text) {
    let obj; try { obj = JSON.parse(text); } catch (e) { return { ok: false, msg: 'Filen kunde inte läsas. Välj en fil som heter matte-os-…json.' }; }
    const st = obj && obj.app === 'matte-os' ? obj.state : (obj && obj.profiles ? obj : null);
    if (!st) return { ok: false, msg: 'Det här ser inte ut som en Matte OS-säkerhetskopia.' };
    // v4-format (attempts med skillId) stöds också
    for (const pid of ['grade9', 'grade8']) {
      const p = st.profiles && st.profiles[pid];
      if (p && Array.isArray(p.attempts)) p.attempts = p.attempts.map(a => a.skillId ? { s: a.skillId, x: 'v4', ok: !!a.correct, h: a.hintsUsed || 0, m: 'v4', t: Date.parse(a.ts) || Date.now() } : a);
    }
    mem = sanitize(st); save();
    const n = mem.profiles.grade9.attempts.length + mem.profiles.grade8.attempts.length;
    return { ok: true, msg: `Återställt. ${n} sparade svar lästes in.` };
  }
  function resetProfile(pid) { load().profiles[pid] = { ...blankProfile(), name: prof(pid).name }; save(); }

  const API = { CORE, SKILLS, skillsOf, chapterSkills, item, soloSet, state, prof, save, load, sanitize, migrateV4, record, level, levelInfo, LEVELS, chapterStats, lessonState, setLesson, isoWeek, schoolWeek, upcomingExam, restInfo, recommend, trainingSet, testSet, search, exportData, importData, resetProfile, daysUntil, now, independent, _reset: () => { mem = null; } };
  root.MOEngine = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
