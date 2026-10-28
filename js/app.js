/* Matte OS v5 — gränssnitt. Vanilla JS, inga beroenden, fungerar offline. */
(function () {
  'use strict';
  const E = window.MOEngine, M = window.MOMath, V = window.MOVis, CORE = window.MO_CORE, T = window.MOTables;
  const esc = M.esc, R = M.rich, TX = M.texBlock;
  const app = document.getElementById('app');
  const sheetRoot = document.getElementById('sheet');
  const UI = { fopen: new Set(), fq: '', ex: null, lesson: null, run: null, sheet: null, confirmReset: false };

  /* ---------- ikoner ---------- */
  const svgI = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const I = {
    search: svgI('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    home: svgI('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
    book: svgI('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6"/>'),
    pen: svgI('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
    close: svgI('<path d="M6 6l12 12M18 6 6 18"/>'),
    back: svgI('<path d="M15 5l-7 7 7 7"/>'),
    chev: svgI('<path d="M9 5l7 7-7 7"/>', 'width="18" height="18"'),
    check: svgI('<path d="M5 12.5 10 17l9-10"/>', 'stroke-width="2.6"'),
    f: svgI('<path d="M14 4h-2a3 3 0 0 0-3 3v13"/><path d="M6 11h7"/><path d="M15 14l5 5M20 14l-5 5"/>'),
    cal: svgI('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
    flag: svgI('<path d="M5 21V4h11l-2 4 2 4H5"/>'),
    gear: svgI('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'),
    grid: svgI('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>')
  };

  /* ---------- hjälpare ---------- */
  const pid = () => E.state().active;
  const P = () => CORE.profiles[pid()];
  const go = h => { if (location.hash === h) render(); else location.hash = h; };
  const chName = chId => { for (const p of Object.values(CORE.profiles)) { const c = p.chapters.find(c => c.id === chId); if (c) return c.name; } return ''; };
  const toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };
  const visHTML = spec => { const s = V.render(spec); return s ? `<div class="vis">${s}</div>` : ''; };
  const lvl = (sid) => { const k = E.level(pid(), sid); return `<span class="lvl l${k}">${E.levelInfo(k).label}</span>`; };
  const segBar = levels => `<div class="seg" aria-hidden="true">${levels.map(l => `<i class="l${l}"></i>`).join('')}</div>`;
  const displayName = id => { const n = E.prof(id).name; return n ? n : CORE.profiles[id].label; };
  function applyTheme() { document.documentElement.dataset.theme = pid() ? CORE.profiles[pid()].theme : 'burgundy'; const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f6f1e9'; }

  /* ---------- skal ---------- */
  function shell(content, tab) {
    const p = pid();
    return `<header class="top"><div class="top-in">
      <button class="brand" data-a="nav" data-h="#/" aria-label="Matte OS – start"><span class="brand-m">M</span><span class="brand-t">MATTE OS</span></button>
      <button class="icon-btn" data-a="search" aria-label="Sök">${I.search}</button>
      <button class="chip-btn" data-a="profile" aria-label="Byt profil, nu ${esc(displayName(p))}"><span class="av">${esc(CORE.profiles[p].short)}</span>${E.prof(p).name ? `<span class="n">${esc(E.prof(p).name)}</span>` : ''}</button>
    </div></header>
    <main id="main">${content}</main>
    <nav class="nav" aria-label="Huvudmeny"><div class="nav-in">
      <button data-a="nav" data-h="#/" ${tab === 'home' ? 'aria-current="page"' : ''}>${I.home}<span>Hem</span></button>
      <button data-a="nav" data-h="#/formler" ${tab === 'formler' ? 'aria-current="page"' : ''}>${I.book}<span>Formler</span></button>
      <button data-a="nav" data-h="#/trana" ${tab === 'trana' ? 'aria-current="page"' : ''}>${I.pen}<span>Träna</span></button>
    </div></nav>`;
  }
  function focusShell(content, { title, sub, steps, cur, exit = '#/', formula }) {
    const bar = steps ? `<div class="steps" aria-hidden="true">${Array.from({ length: steps }, (_, i) => `<i class="${i < cur ? 'on' : i === cur ? 'cur' : ''}"></i>`).join('')}</div>` : '';
    return `<header class="fbar"><div class="fbar-in">
      <button class="icon-btn" data-a="exit" data-h="${exit}" aria-label="Avsluta och gå tillbaka">${I.close}</button>
      <div class="ttl"><small>${esc(sub || '')}</small><b>${esc(title || '')}</b>${bar}</div>
      ${formula ? `<button class="icon-btn" data-a="formula" data-sid="${formula}" aria-label="Visa formelkort">${I.f}</button>` : ''}
    </div></header><main id="main" class="focus">${content}</main>`;
  }

  /* ================= HEM ================= */
  function viewHome() {
    const p = pid(), pr = P(), rec = E.recommend(p), sw = E.schoolWeek();
    const plan = pr.plan.find(x => x.w === sw.week);
    const exam = E.upcomingExam(p);
    const rests = E.restInfo(p);
    // Tidsnära restprov först. Aldrig elevnamn eller privat datum i publik kod.
    const restFocus = rests.find(r => r.date && r.days >= 0 && r.days <= 14)
      || (p === 'grade9' && E.now().getFullYear() === 2026 && sw.week >= 43 && sw.week <= 45
        ? rests.find(r => r.chapter === 's9-tal' && !r.date) : null);
    let ctx = sw.phase === 'term' ? `<span>Vecka ${sw.week}${plan ? ' · ' + esc(plan.a) : ''}</span>` : `<span>Vecka ${sw.week} · repetition</span>`;
    if (exam) ctx += `<span class="pill">${I.flag.replace('<svg', '<svg width="14" height="14"')} Prov ${esc(exam.ch.name)} v. ${exam.week}${exam.inWeeks === 0 ? ' · denna vecka' : exam.inWeeks === 1 ? ' · nästa vecka' : ` · om ${exam.inWeeks} veckor`}</span>`;

    let hero;
    if (rec.kind === 'mixed') {
      hero = `<div class="card hero"><div class="hero-body">
        <p class="eyebrow">Nästa steg</p><h2>Blandträning: ${esc(chName(rec.chapter))}</h2>
        <p class="mut">${esc(rec.reason)}. Fem blandade frågor – du väljer metod själv, precis som på provet.</p>
        <button class="btn block" data-a="startTrain" data-ch="${rec.chapter}">Starta 5 frågor</button></div></div>`;
    } else {
      const s = rec.skill, ls = E.lessonState(p, s.id), k = E.level(p, s.id);
      const cont = rec.kind === 'continue';
      const label = cont ? `Fortsätt · del ${Math.min(ls.step + 1, 4)} av 4` : k > 0 ? 'Fortsätt öva' : 'Börja';
      hero = `<div class="card hero">
        <div class="hero-vis">${V.render(s.cvis)}</div>
        <div class="hero-body">
          <p class="eyebrow">Nästa steg · ${esc(chName(s.ch))}</p>
          <h2>${esc(s.title)}</h2>
          <p class="mut small" style="margin-bottom:14px">${esc(rec.reason)} · ca 10 min · ${E.levelInfo(k).label.toLowerCase()}</p>
          <button class="btn block" data-a="nav" data-h="#/l/${s.id}/${cont ? ls.step : 0}">${label}</button>
        </div></div>`;
    }
    if (restFocus) hero = `<div class="card hero"><div class="hero-body">
      <p class="eyebrow">Det viktigaste just nu</p>
      <h2>Förbered ${esc(chName(restFocus.chapter))} inför restprovet</h2>
      <p class="mut">Börja med det som står i matteboken. Träna i lugn takt, ett område i taget.</p>
      <button class="btn block" data-a="nav" data-h="#/rest/${restFocus.id}">Börja här</button>
    </div></div>`;
    const chId = rec.chapter, st = E.chapterStats(p, chId);
    const progress = `<button class="tap" data-a="nav" data-h="#/k/${chId}">
      <div style="flex:1;min-width:0"><div class="row between" style="margin-bottom:8px"><span class="t">${esc(chName(chId))}</span><span class="s">${st.solo} av ${st.total} klarar du själv</span></div>${segBar(st.levels)}</div>
      <span class="chev">${I.chev}</span></button>`;
    const restCards = rests.filter(r => !restFocus || r.id !== restFocus.id).map(r => `<button class="tap" data-a="nav" data-h="#/rest/${r.id}">
      <div><div class="t">${esc(r.title)}</div><div class="s">${r.date ? (r.days < 0 ? 'datum passerat' : r.days === 0 ? 'idag' : `om ${r.days} dagar`) : 'datum saknas'} · beredskap ${r.readiness} %</div></div>
      <span class="chev">${I.chev}</span></button>`).join('');
    const lookup = `<button class="tap" data-a="search"><span style="color:var(--muted)">${I.search.replace('<svg', '<svg width="20" height="20"')}</span><div><div class="t">Slå upp en formel</div><div class="s">t.ex. "cirkel area" eller "triangel sida"</div></div></button>`;
    const planHtml = `<details class="fold"><summary>${I.cal.replace('<svg', '<svg width="20" height="20"')} Veckoplanen</summary><div class="in plan">${pr.plan.map(x => `<div class="${x.w === sw.week ? 'cur' : ''} ${x.exam ? 'exam' : ''}"><span class="w">v.${x.w}</span><span><span class="a">${esc(x.a)}</span><br><span class="d">${esc(x.d)}</span></span></div>`).join('')}</div></details>`;
    const hi = (() => { const h = E.now().getHours(); return h < 10 ? 'God morgon' : h < 17 ? 'Hej' : 'God kväll'; })();
    const nm = E.prof(p).name;
    return shell(`<div class="ctx">${ctx}</div>
      <h1 class="home-h">${esc(nm ? `${hi}, ${nm}.` : 'En sak i taget.')}</h1>
      <p class="mut home-sub" style="margin-bottom:16px">${nm ? 'En sak i taget. ' : ''}Här är det viktigaste att göra nu.</p>
      ${hero}<details class="fold"><summary>Andra sätt att öva</summary><div class="in">${progress}${restCards}${lookup}${boostCard()}${planHtml}</div></details>`, 'home');
  }

function boostCard() {
  const s = T.stats(pid());
  return `<section class="boost-card">
    <div class="boost-top">
      <div class="boost-icon">${I.grid}</div>
      <div class="boost-copy"><p class="eyebrow">NYTT · TABELLARENAN</p><h2>Välj en tabell. Bygg flytet.</h2><p class="mut small">Läs hela 7:an, 8:an eller vilken tabell du vill. Öva, testa blandat eller utmana någon i duell.</p></div>
    </div>
    <div class="boost-meta">
      <div><span>Alla tabeller</span><b>1–10</b><small>Läs · Öva · Bemästra</small></div>
      <div><span>Din träning</span><b>${s.percent}%</b><small>Tabellflyt över tid</small></div>
    </div>
    <a class="btn block boost-btn" href="#/tabell/home">Öppna Tabellarenan →</a>
  </section>`;
}
/* ================= KAPITELKARTA ================= */
  function viewChapter(chId) {
    const p = pid(), st = E.chapterStats(p, chId), sk = E.chapterSkills(p, chId);
    if (!sk.length) return viewHome();
    return shell(`<button class="btn text" data-a="nav" data-h="#/">${I.back.replace('<svg', '<svg width="18" height="18"')} Hem</button>
      <p class="eyebrow">Kapitel</p><h1>${esc(chName(chId))}</h1>
      <p class="mut">${st.solo} av ${st.total} moment klarar du själv. Ordningen följer skolans plan.</p>
      <div class="card">${sk.map(s => `<div class="skrow"><div class="tt"><b>${esc(s.title)}</b><small>v. ${s.w.join(', ')} · ${lvl(s.id)}</small></div>
        <button class="btn sm ghost" data-a="nav" data-h="#/l/${s.id}/0">Lär</button>
        <button class="btn sm soft" data-a="startTrain" data-sid="${s.id}">Träna</button></div>`).join('')}</div>
      <div class="actions"><button class="btn" data-a="startTrain" data-ch="${chId}">Blandträna kapitlet</button><button class="btn ghost" data-a="startTest" data-ch="${chId}">Till provsidan</button></div>`, 'home');
  }

  /* ================= FORMLER ================= */
  function formulaBody(s, opts = {}) {
    const f = s.f;
    const forms = f.forms ? `<div class="fsec"><div class="k">${f.rules ? 'Formen åt olika håll' : 'Använd åt olika håll'}</div><div class="forms">${f.forms.map(([l, x]) => `<div><div class="lbl">${esc(l)}</div><div class="fx">${TX(x)}</div></div>`).join('')}</div></div>` : '';
    const rules = f.rules ? `<div class="fsec"><div class="k">Så tänker du</div><ul class="clean">${f.rules.map(r => `<li>${R(r)}</li>`).join('')}</ul></div>` : '';
    return `<div class="fsec"><div class="k">När?</div><p style="margin:0">${R(f.when)}</p></div>
      ${opts.noVis ? '' : `<div class="fsec">${visHTML(s.cvis)}</div>`}
      <div class="fsec"><div class="k">Betyder</div><dl class="symtab">${f.sym.map(([a, b]) => `<dt>${R(a)}</dt><dd>${R(b)}</dd>`).join('')}</dl></div>
      ${forms}${rules}
      <div class="fsec"><div class="k">Exempel</div><p style="margin:0" class="wrapm">${R(f.ex)}</p></div>
      <div class="fsec"><div class="box warn" style="margin:0"><div class="k">Vanlig fälla</div>${R(f.trap)}</div></div>
      ${opts.noLink ? '' : `<div class="actions"><button class="btn sm soft" data-a="nav" data-h="#/l/${s.id}/0">Hela genomgången</button><button class="btn sm ghost" data-a="startTrain" data-sid="${s.id}">Träna 5</button></div>`}`;
  }
  function formulaCard(s) {
    const open = UI.fopen.has(s.id);
    return `<div class="fcard ${open ? 'open' : ''}" id="f-${s.id}"><button class="fh" data-a="ftoggle" data-sid="${s.id}" aria-expanded="${open}">
      <span class="fn">${esc(s.f.name)}</span><span class="chev">${I.chev}</span><span class="fm">${TX(s.f.main)}</span></button>
      ${open ? `<div class="fbody">${formulaBody(s)}</div>` : ''}</div>`;
  }
  function viewFormler() {
    const p = pid(), pr = P();
    const rec = E.recommend(p);
    if (!UI.fch || !pr.chapters.some(c => c.id === UI.fch)) UI.fch = rec.chapter;
    const chOrder = [pr.chapters.find(c => c.id === rec.chapter), ...pr.chapters.filter(c => c.id !== rec.chapter)];
    const q = UI.fq.trim();
    const list = q ? E.search(p, q) : E.chapterSkills(p, UI.fch);
    return shell(`<p class="eyebrow">Formelsamling · ${esc(pr.label)}</p><h1>Formler och regler</h1>
      <div class="searchbox">${I.search}<input id="fq" type="search" placeholder="Sök: cirkel, procent, x båda sidor…" value="${esc(UI.fq)}" aria-label="Sök i formelsamlingen" autocomplete="off"></div>
      ${q ? `<p class="mut small">${list.length} träffar</p>` : `<div class="seg-ctl" role="group" aria-label="Kapitel">${chOrder.map(c => `<button data-a="fch" data-ch="${c.id}" aria-pressed="${c.id === UI.fch}">${esc(c.name)}${c.id === rec.chapter ? ' ·&nbsp;nu' : ''}</button>`).join('')}</div>`}
      <div id="flist">${list.map(formulaCard).join('') || '<p class="mut">Inga träffar. Prova ett annat ord.</p>'}</div>`, 'formler');
  }

  /* ================= TRÄNA ================= */
  function viewTrana() {
    const p = pid(), pr = P(), rec = E.recommend(p);
    const st = E.chapterStats(p, rec.chapter);
    const weak = E.chapterSkills(p, rec.chapter).map(s => ({ s, k: E.level(p, s.id) })).sort((a, b) => a.k - b.k).slice(0, 3).map(x => x.s.title);
    const rests = E.restInfo(p);
    return shell(`<p class="eyebrow">Träna</p><h1>Rekommenderat nu</h1>
      <div class="card hero"><div class="hero-body">
        <p class="eyebrow mut">${esc(chName(rec.chapter))} · 5 frågor · ca 8 min</p>
        <h2>Blandat från det du behöver mest</h2>
        <p class="mut small">${esc(weak.join(' · '))}</p>
        ${segBar(st.levels)}
        <div style="height:14px"></div>
        <button class="btn block" data-a="startTrain" data-ch="${rec.chapter}">Starta</button>
      </div></div>
      <a class="tap" href="#/tabell/home" style="text-decoration:none;color:inherit">
        <div><div class="t">Multiplikationstabellen 1–10</div><div class="s">Läs hela tabellen, träna en i taget, testa blandat eller spela duell.</div></div>
        <span class="chev">${I.chev}</span>
      </a>
      <button class="tap" data-a="startTest" data-ch="${rec.chapter}"><div><div class="t">Öppna Matte Prov · ${esc(chName(rec.chapter))}</div><div class="s">Inga ledtrådar, ingen metod angiven. Analys efteråt.</div></div><span class="chev">${I.chev}</span></button>
      ${rests.map(r => `<button class="tap" data-a="nav" data-h="#/rest/${r.id}"><div><div class="t">${esc(r.title)}</div><div class="s">${r.date ? 'datum ' + esc(r.date) : 'datum saknas'} · beredskap ${r.readiness} %</div></div><span class="chev">${I.chev}</span></button>`).join('')}
      <details class="fold"><summary>Välj ett annat område</summary><div class="in">
        ${pr.chapters.map(c => `<p class="eyebrow mut" style="margin-top:10px">${esc(c.name)}</p>${E.chapterSkills(p, c.id).map(s => `<div class="skrow"><div class="tt"><b>${esc(s.title)}</b><small>${lvl(s.id)}</small></div><button class="btn sm soft" data-a="startTrain" data-sid="${s.id}">Träna</button></div>`).join('')}
          <div class="actions" style="margin-top:6px"><button class="btn sm ghost" data-a="startTrain" data-ch="${c.id}">Blanda ${esc(c.name.toLowerCase())}</button><button class="btn sm ghost" data-a="startTest" data-ch="${c.id}">Till provsidan</button></div>`).join('')}
      </div></details>`, 'trana');
  }

  /* ================= RESTPROV ================= */
  function viewRest(id) {
    const p = pid(), r = E.restInfo(p).find(x => x.id === id) || P().rests.find(x => x.id === id);
    if (!r) return viewHome();
    const info = E.restInfo(p).find(x => x.id === id) || { ...r, readiness: E.chapterStats(p, r.chapter).readiness };
    const sk = E.chapterSkills(p, r.chapter);
    const bookGuide = p === 'grade9' && r.chapter === 's9-tal' ? `
      <div class="card">
        <p class="eyebrow">Arbeta med din bok</p><h2>Matte Direkt 9 · Tal</h2>
        <p class="mut small">Välj en del, läs exemplet i boken och gör sedan liknande uppgifter i appen.</p>
        <a class="tap" href="#/l/s9-scientific/0"><div><div class="t">1. Stora tal och grundpotensform</div><div class="s">Boken s. 26–29</div></div><span class="chev">${I.chev}</span></a>
        <a class="tap" href="#/l/s9-sci-calc/0"><div><div class="t">2. Räkna med tiopotenser</div><div class="s">Boken s. 30–31</div></div><span class="chev">${I.chev}</span></a>
        <a class="tap" href="#/l/s9-prefix/0"><div><div class="t">3. Små tal och prefix</div><div class="s">Boken s. 32–33</div></div><span class="chev">${I.chev}</span></a>
        <a class="tap" href="#/l/s9-sqrt/0"><div><div class="t">4. Kvadrater och kvadratrötter</div><div class="s">Boken s. 34–35</div></div><span class="chev">${I.chev}</span></a>
        <a class="tap" href="#/l/s9-number-sets/0"><div><div class="t">5. Talmängder</div><div class="s">Boken s. 36</div></div><span class="chev">${I.chev}</span></a>
      </div>` : '';
    return shell(`<button class="btn text" data-a="nav" data-h="#/">${I.back.replace('<svg', '<svg width="18" height="18"')} Hem</button>
      <p class="eyebrow">Restprov</p><h1>${esc(r.title)}</h1>
      <p class="mut">Fokusera på ett område i taget. Lägg in ditt provdatum nedan så visar appen rätt prioritet.</p>
      <div class="card"><div class="field"><label for="restdate">Datum för restprovet</label><input id="restdate" type="date" value="${esc(info.date || '')}" data-a="restdate" data-id="${id}"></div>
        <div class="row between small"><span>Beredskap</span><b>${info.readiness} %</b></div>${segBar(E.chapterStats(p, r.chapter).levels)}</div>
      ${bookGuide}<details class="fold"><summary>Alla moment i kapitlet</summary><div class="in">${sk.map(s => `<div class="skrow"><div class="tt"><b>${esc(s.title)}</b><small>${lvl(s.id)}</small></div><button class="btn sm soft" data-a="startTrain" data-sid="${s.id}">Träna</button></div>`).join('')}</div></details>
      <div class="actions"><button class="btn" data-a="startTrain" data-ch="${r.chapter}">Öva 5 blandade frågor</button><button class="btn ghost" data-a="startTest" data-ch="${r.chapter}">Öppna provsidan</button></div>
      <div class="actions"><button class="btn text" data-a="restdone" data-id="${id}">Restprovet är gjort – dölj det</button></div>`, 'home');
  }

  /* ================= INSTÄLLNINGAR ================= */
  function viewSettings() {
    const p = pid(), pr = E.prof(p);
    return shell(`<button class="btn text" data-a="nav" data-h="#/">${I.back.replace('<svg', '<svg width="18" height="18"')} Hem</button>
      <p class="eyebrow">Inställningar · ${esc(P().label)}</p><h1>Inställningar</h1>
      <div class="card"><div class="field"><label for="pname">Namn (visas bara på den här enheten)</label><input id="pname" maxlength="30" value="${esc(pr.name)}" placeholder="${esc(P().label)}" autocomplete="off"></div>
        <button class="btn sm soft" data-a="savename">Spara namn</button></div>
      <div class="card"><h3>Säkerhetskopia</h3><p class="mut small">Framstegen sparas bara på den här enheten. Spara en kopia ibland – t.ex. i Filer eller som mejl till dig själv.</p>
        <div class="actions"><button class="btn" data-a="export">Spara säkerhetskopia</button><button class="btn ghost" data-a="import">Återställ från fil</button></div>
        <input type="file" id="importfile" accept=".json,application/json" hidden></div>
      <div class="card"><h3>Börja om</h3><p class="mut small">Raderar svar och framsteg för ${esc(P().label)} på den här enheten.</p>
        <button class="btn ${UI.confirmReset ? '' : 'ghost'}" data-a="reset">${UI.confirmReset ? 'Tryck igen för att radera' : 'Nollställ framsteg'}</button></div>
      <p class="mut small center">Matte OS ${CORE.version} · byggd ${CORE.build} · fungerar offline · ingen data lämnar enheten</p>`, 'home');
  }

  /* ================= FÖRSTA START ================= */
  function viewOnboarding() {
    return `<main id="main" style="padding-top:calc(48px + var(--safe-t))"><div class="center"><span class="brand-m" style="width:56px;height:56px;font-size:28px;border-radius:16px;margin:0 auto 14px">M</span>
      <h1>Matte OS</h1><p class="mut">Din matte – en sak i taget. Välj årskurs.</p></div>
      <div style="height:16px"></div>
      ${Object.values(CORE.profiles).map(p => `<button class="tap" data-a="pickprofile" data-p="${p.id}" style="min-height:76px"><span class="chip-btn" style="border:0;padding:0;height:auto" data-theme="${p.theme}"><span class="av" style="width:44px;height:44px;font-size:16px;border-radius:12px;background:${p.theme === 'navy' ? '#1d3557' : '#7a1f35'}">${p.short}</span></span><div><div class="t">${p.label}</div><div class="s">${p.chapters.map(c => c.name).join(' · ')}</div></div><span class="chev">${I.chev}</span></button>`).join('')}
      <p class="mut small center" style="margin-top:18px">Allt sparas bara på den här enheten.</p></main>`;
  }

  /* ================= UPPGIFTSKOMPONENT ================= */
  function newEx(sid, key, mode) { return { sid, key, mode, hints: 0, wrong: 0, done: false, first: null, ok: false, val: '', valE: '', pick: null, msg: null, note: null, status: null, sol: false, mc: null, recorded: false }; }
  function exerciseHTML(ex, { label, hideQ, hideVis } = {}) {
    const s = E.SKILLS[ex.sid], x = E.item(ex.sid, ex.key), test = ex.mode === 'test';
    const type = x.type || 'num';
    const showVis = x.vis && !hideVis;
    let input = '';
    if (type === 'choice') {
      input = `<div class="opts" role="radiogroup">${x.opts.map(o => {
        const state = ex.done && !test ? (o === x.a ? 'ok' : o === ex.pick ? 'no' : '') : '';
        return `<button type="button" class="opt ${state}" role="radio" aria-pressed="${ex.pick === o}" aria-checked="${ex.pick === o}" data-a="pick" data-v="${esc(o)}" ${ex.done ? 'disabled' : ''}><span class="dot"></span><span>${R(o)}</span></button>`;
      }).join('')}</div>`;
    } else if (type === 'sci') {
      input = `<div class="sci"><input id="ansm" inputmode="decimal" aria-label="Talet framför" value="${esc(ex.val)}" ${ex.done ? 'disabled' : ''} placeholder="a"><span>· 10</span><sup><input id="anse" class="e" inputmode="text" aria-label="Exponent" value="${esc(ex.valE)}" ${ex.done ? 'disabled' : ''} placeholder="n"></sup></div>
        ${ex.done ? '' : `<div class="keys"><button type="button" data-a="key" data-k="−" data-t="anse">− (minus)</button></div>`}`;
    } else {
      const unit = x.u || x.ul || '';
      const cls = ex.done && !test ? (ex.ok ? 'ok' : '') : ex.status === 'wrong' ? 'no' : '';
      const textual = type === 'expr' || type === 'roots' || !!x.radical;
      const keyset = type === 'expr' ? ['x', 'x²', '(', ')', '−', '+'] : type === 'roots' ? ['−', '±', ' och ', 'ingen'] : x.radical ? ['√', '−'] : null;
      const ph = type === 'expr' ? 'Skriv uttrycket' : type === 'roots' ? 'T.ex. 4 och −4' : x.radical ? 'T.ex. 3√2' : x.answerHint ? esc(x.answerHint) : 'Ditt svar';
      input = `<div class="ans-field ${cls}"><input id="ans" ${textual ? 'inputmode="text" autocapitalize="off" spellcheck="false"' : 'inputmode="decimal"'} autocomplete="off" aria-label="Ditt svar${unit ? ' i ' + esc(unit) : ''}" placeholder="${ph}" value="${esc(ex.val)}" ${ex.done ? 'disabled' : ''} enterkeyhint="done">${unit ? `<span class="u">${esc(unit)}</span>` : ''}</div>
        ${ex.done ? '' : `<div class="keys">${keyset ? keyset.map(k => `<button type="button" data-a="key" data-k="${k}" data-t="ans">${k.trim()}</button>`).join('') : `<button type="button" data-a="key" data-k="−" data-t="ans">− (minus)</button><button type="button" data-a="key" data-k="/" data-t="ans">/ (bråk)</button>`}</div>`}`;
    }
    // återkoppling
    let fb = '';
    if (!test && ex.status) {
      if (ex.status === 'correct') fb = `<div class="box good reveal"><div class="k">Rätt</div>${ex.hints || ex.wrong ? 'Bra jobbat – du tog dig dit.' : 'Snyggt – helt själv.'}${ex.note ? '<br>' + R(ex.note) : ''}</div>`;
      else if (ex.status === 'wrong') fb = `<div class="box bad reveal"><div class="k">Inte riktigt</div>${ex.msg ? R(ex.msg) : ex.wrong >= 2 ? 'Titta på lösningen och jämför steg för steg.' : 'Kontrollera ett steg i taget. Ta gärna en ledtråd.'}</div>`;
      else if (ex.status === 'invalid' || ex.status === 'empty') fb = `<div class="box warn reveal"><div class="k">Obs</div>${R(ex.msg)}</div>`;
      else if (ex.status === 'shown') fb = `<div class="box neutral reveal"><div class="k">Lösning visad</div>Läs igenom stegen. Du får en liknande uppgift senare.</div>`;
    }
    // ledtrådar
    const hintBlocks = [];
    if (!test) {
      if (ex.hints >= 1) hintBlocks.push(`<div class="hint reveal"><div class="k">1 · Sortera</div><b>Vad vet du?</b> ${x.given ? x.given.map(g => esc(g)).join(' · ') : 'Läs frågan och alternativen.'}<br><b>Vad söker du?</b> ${x.find ? esc(x.find) : 'rätt alternativ'}</div>`);
      if (ex.hints >= 2) hintBlocks.push(`<div class="hint reveal"><div class="k">2 · Känn igen och välj regel</div>${R(x.h1 || s.h1)}<div class="big-f" style="font-size:20px">${TX(s.f.main)}</div></div>`);
      if (ex.hints >= 3 && x.start) hintBlocks.push(`<div class="hint reveal"><div class="k">3 · Starta så här</div>${R(x.start)}</div>`);
      if (ex.sol) hintBlocks.push(`<div class="hint reveal"><div class="k">Lösning</div><div class="solution">${x.sol.map((l, i) => `<div class="sline"><span class="n">${i + 1}</span><div class="res wrapm">${R(l)}</div></div>`).join('')}</div><div style="margin-top:6px"><b>Svar:</b> ${R(answerText(x))}</div></div>`);
    }
    const maxH = x.start ? 3 : 2;
    let help = '';
    if (!test && !ex.done) {
      const hb = ex.hints < maxH ? `<button type="button" class="btn sm ghost" data-a="hint">${ex.hints === 0 ? 'Ledtråd' : 'Nästa ledtråd'} <span class="mut small">${ex.hints + 1}/${maxH}</span></button>` : !ex.sol ? `<button type="button" class="btn sm ghost" data-a="showsol">Visa lösning</button>` : '';
      const solNow = ex.wrong >= 2 && !ex.sol && ex.hints < maxH ? `<button type="button" class="btn sm ghost" data-a="showsol">Visa lösning</button>` : '';
      help = `<div class="helprow">${hb}${solNow}</div>`;
    }
    const checkBtn = ex.done ? '' : `<button type="submit" class="btn block" style="margin-top:12px">${test ? 'Svara' : 'Kontrollera'}</button>`;
    return `<section class="exercise" aria-label="Uppgift">
      ${label ? `<p class="eyebrow mut">${esc(label)}</p>` : ''}
      ${hideQ ? '' : `<p class="q">${R(x.q)}</p>`}
      ${showVis ? visHTML(x.vis) : ''}
      <form data-form="answer" novalidate>${input}${checkBtn}</form>
      <div class="fb" aria-live="polite">${fb}</div>
      <div class="hints">${hintBlocks.join('')}</div>
      ${help}
    </section>`;
  }
  function answerText(x) {
    const t = x.type || 'num';
    if (t === 'choice') return esc(x.a);
    if (t === 'sci') return `$${M.fmt(x.a[0]).replace(',', '{,}')} \\cdot 10^{${x.a[1]}}$`;
    if (t === 'expr') return `$${x.a.replace(/\*/g, '\\cdot ')}$`;
    if (t === 'roots') return x.a.length ? x.a.map(v => `$x = ${M.fmt(v, x.dec).replace(',', '{,}')}$`).join(' och ') : 'ingen reell lösning';
    if (x.radical) return `$${x.radical[0] === 1 ? '' : x.radical[0]}\\sqrt{${x.radical[1]}}$`;
    if (x.mustFraction) return `${x.mustFraction[0]}/${x.mustFraction[1]}`;
    return `${M.fmt(x.a, x.dec)}${x.u ? ' ' + esc(x.u) : x.ul ? ' ' + esc(x.ul) : ''}`;
  }
  function readAnswer(ex) {
    const x = E.item(ex.sid, ex.key), t = x.type || 'num';
    if (t === 'choice') return ex.pick;
    if (t === 'sci') { const m = document.getElementById('ansm'), e = document.getElementById('anse'); ex.val = m ? m.value : ex.val; ex.valE = e ? e.value : ex.valE; return { m: ex.val, e: ex.valE }; }
    const el = document.getElementById('ans'); ex.val = el ? el.value : ex.val; return ex.val;
  }
  function submitAnswer(ex) {
    if (!ex || ex.done) return;
    const x = E.item(ex.sid, ex.key);
    const raw = readAnswer(ex);
    const r = M.check(x, raw);
    if (r.status === 'empty' || r.status === 'invalid') { ex.status = r.status; ex.msg = r.msg; return; }
    if (ex.mode === 'test') {
      ex.done = true; ex.ok = r.ok; ex.first = r.ok; ex.mc = r.ok ? null : r.msg; finishEx(ex); return;
    }
    if (r.ok) {
      ex.status = 'correct'; ex.note = r.note; ex.ok = true; ex.done = true; if (ex.first === null) ex.first = true; finishEx(ex);
    } else {
      ex.status = 'wrong'; ex.msg = r.msg; ex.wrong++; if (ex.first === null) ex.first = false; if (!ex.mc && r.msg) ex.mc = r.msg;
      if (x.type === 'choice') ex.pick = null;
    }
  }
  function finishEx(ex) {
    if (ex.recorded) return; ex.recorded = true;
    E.record(pid(), { s: ex.sid, x: ex.key, ok: !!ex.ok, first: !!ex.first, h: ex.hints, w: ex.wrong, sol: !!ex.sol, m: ex.mode, mc: ex.mc || null });
  }

  /* ================= LEKTION (fokusläge) ================= */
  const STEP_NAMES = ['Fatta', 'Se exempel', 'Prova med stöd', 'Gör själv', 'Klart'];
  function lessonFor(sid, step) {
    if (!UI.lesson || UI.lesson.sid !== sid) UI.lesson = { sid, reveal: 0, given: false, find: false, rule: null, ruleOk: false, soloIdx: 0, solo: E.soloSet(E.SKILLS[sid]), soloRes: [] };
    const L = UI.lesson; L.step = step; return L;
  }
  function viewLesson(sid, step) {
    const s = E.SKILLS[sid]; if (!s || s.profile !== pid()) return viewHome();
    step = Math.max(0, Math.min(4, +step || 0));
    const L = lessonFor(sid, step);
    if (step < 4) E.setLesson(pid(), sid, { step, done: E.lessonState(pid(), sid).done });
    const head = { title: s.title, sub: `${chName(s.ch)} · ${STEP_NAMES[step]}`, steps: 4, cur: step, exit: '#/', formula: sid };
    let c = '';
    if (step === 0) {
      c = `<p class="eyebrow">Del 1 av 4 · Fatta</p><h1>${esc(s.title)}</h1>
        <p class="lead">${R(s.idea)}</p>
        ${visHTML(s.cvis)}
        <div class="box"><div class="k">Kom ihåg</div>${R(s.anchor)}</div>
        <div class="box neutral"><div class="k">Så känner du igen den</div><ul class="clean">${s.cue.map(q => `<li>${R(q)}</li>`).join('')}</ul></div>
        <div class="actions"><button class="btn block" data-a="nav" data-h="#/l/${sid}/1">Se ett exempel</button></div>`;
    } else if (step === 1) {
      const e = s.ex, n = e.steps.length, rv = Math.min(L.reveal, n);
      const lines = e.steps.slice(0, rv).map(([ask, res], i) => `<div class="sline reveal"><span class="n">${i + 1}</span><div><div class="ask">${R(ask)}</div><div class="res wrapm">${R(res)}</div></div></div>`).join('');
      const nextAsk = rv < n ? `<div class="box neutral reveal"><div class="k">Tänk först · steg ${rv + 1}</div>${R(e.steps[rv][0])}</div><button class="btn block soft" data-a="reveal">Visa steg ${rv + 1}</button>` : '';
      const done = rv >= n ? `<div class="box good reveal"><div class="k">Svar</div>${R(e.ans)}</div>
        ${s.f.forms ? `<div class="box neutral reveal"><div class="k">Samma regel – åt andra hållet</div><p class="small" style="margin-bottom:6px">En formel är ett samband, inte en mening som bara läses från vänster. Det som är okänt bestämmer hur du skriver den.</p><div class="forms">${s.f.forms.slice(0, 3).map(([l, x]) => `<div><div class="lbl">${esc(l)}</div><div class="fx">${TX(x)}</div></div>`).join('')}</div></div>` : ''}
        <div class="actions"><button class="btn block" data-a="nav" data-h="#/l/${sid}/2">Din tur – med stöd</button></div>` : '';
      c = `<p class="eyebrow">Del 2 av 4 · Se exempel</p><p class="q">${R(e.q)}</p>${visHTML(e.vis)}
        <div class="gsr"><div><span class="k">Givet</span><span>${e.given.map(esc).join(' · ')}</span></div><div><span class="k">Sök</span><span>${esc(e.find)}</span></div><div><span class="k">Regel</span><span class="big-f" style="font-size:19px;padding:0">${TX(e.rule)}</span></div></div>
        <div class="solution">${lines}</div>${nextAsk}${done}`;
    } else if (step === 2) {
      const g = s.g;
      if (!UI.ex || UI.ex.sid !== sid || UI.ex.key !== 'g') UI.ex = newEx(sid, 'g', 'guided');
      // Visa givet och sökt direkt: två klick färre per uppgift.
      let stage = `<div class="gsr"><div><span class="k">Vet</span><span>${g.given.map(esc).join(' · ')}</span></div><div><span class="k">Söker</span><span>${esc(g.find)}</span></div></div>`;
      const ready = true;
      if (ready && g.ro) {
        stage += `<div class="card" style="margin-top:12px"><h3>Vilken uträkning passar?</h3><div class="opts">${g.ro.map((o, i) => {
          const st = L.rule === i ? (i === g.rc ? 'ok' : 'no') : (L.ruleOk && i === g.rc ? 'ok' : '');
          return `<button class="opt ${st}" data-a="rule" data-i="${i}" ${L.ruleOk ? 'disabled' : ''}><span class="dot"></span><span>${TX(o)}</span></button>`;
        }).join('')}</div>
        ${L.rule != null ? (L.ruleOk ? `<div class="box good reveal" style="margin-top:10px"><div class="k">Precis</div>${R(g.why)}</div>` : `<div class="box bad reveal" style="margin-top:10px"><div class="k">Inte den</div>Titta igen på vad du söker: <b>${esc(g.find)}</b>. Vilken uträkning ger just det? Prova ett annat alternativ.</div>`) : ''}</div>`;
      }
      const showCalc = ready; // Metodval är stöd, aldrig en spärr för att få räkna.
      c = `<p class="eyebrow">Del 3 av 4 · Prova med stöd</p><p class="q">${R(g.q)}</p>${visHTML(g.vis)}${stage}
        ${showCalc ? `<div class="card reveal" style="margin-top:12px"><h3>Räkna</h3>${exerciseHTML(UI.ex, { hideQ: true, hideVis: true })}</div>` : ''}
        ${UI.ex.done ? `<div class="actions"><button class="btn block" data-a="nav" data-h="#/l/${sid}/3">Gör själv</button></div>` : ''}`;
    } else if (step === 3) {
      const i = Math.min(L.soloIdx, L.solo.length - 1), x = L.solo[i];
      if (!UI.ex || UI.ex.sid !== sid || UI.ex.key !== x.key || UI.ex.mode !== 'solo') UI.ex = newEx(sid, x.key, 'solo');
      const dots = `<div class="dots" aria-label="Uppgift ${i + 1} av ${L.solo.length}">${L.solo.map((_, j) => `<i class="${j < i ? 'on' : j === i ? 'cur' : ''}"></i>`).join('')}</div>`;
      const next = UI.ex.done ? `<div class="actions"><button class="btn block" data-a="solonext">${i + 1 < L.solo.length ? 'Nästa uppgift' : 'Klar'}</button></div>` : '';
      c = `<p class="eyebrow">Del 4 av 4 · Gör själv · ${i + 1} av ${L.solo.length}</p>${dots}${exerciseHTML(UI.ex)}${next}`;
    } else {
      const res = L.soloRes, firstOk = res.filter(r => r.first && !r.h).length;
      E.setLesson(pid(), sid, { step: 0, done: true });
      const k = E.level(pid(), sid), rec = E.recommend(pid());
      const nextBtn = rec.kind !== 'mixed' && rec.skill.id !== sid ? `<button class="btn block" data-a="nav" data-h="#/l/${rec.skill.id}/0">Nästa: ${esc(rec.skill.title)}</button>` : `<button class="btn block" data-a="startTrain" data-ch="${s.ch}">Blandträna ${esc(chName(s.ch).toLowerCase())}</button>`;
      c = `<div class="center"><div class="done-mark">${I.check}</div><p class="eyebrow">Moment klart</p><h1>${esc(s.title)}</h1>
        <p class="mut">${res.length ? `${firstOk} av ${res.length} rätt helt själv.` : ''} Nivå nu: <b>${E.levelInfo(k).label}</b></p></div>
        <div class="card"><h3>Ta med dig</h3><p style="margin:0">${R(s.anchor)}</p><div class="big-f">${TX(s.f.main)}</div></div>
        <div class="actions">${nextBtn}<button class="btn ghost block" data-a="startTrain" data-sid="${sid}">Träna 5 till på detta</button><button class="btn text block" data-a="nav" data-h="#/">Till start</button></div>`;
      head.cur = 4;
    }
    return focusShell(c, head);
  }

  /* ================= TRÄNING / PROV (fokusläge) ================= */
  function startRun(kind, opts) {
    const p = pid();
    let items, title;
    if (kind === 'test') { items = E.testSet(p, opts.chapter); title = 'Provläge · ' + chName(opts.chapter); }
    else if (opts.skill) { items = E.trainingSet(p, { skill: opts.skill, n: 5 }); title = 'Träna · ' + E.SKILLS[opts.skill].title; }
    else if (opts.items) { items = opts.items; title = 'Träna det som gick fel'; }
    else { items = E.trainingSet(p, { chapter: opts.chapter, n: 5 }); title = 'Blandträning · ' + chName(opts.chapter); }
    UI.run = { kind, items, idx: 0, res: [], title, chapter: opts.chapter || (opts.skill && E.SKILLS[opts.skill].ch), skill: opts.skill };
    UI.ex = null;
    go(kind === 'test' ? '#/prov' : '#/run');
  }
  function viewRun() {
    const run = UI.run; if (!run || !run.items.length) { go('#/trana'); return ''; }
    const test = run.kind === 'test', n = run.items.length;
    if (run.idx >= n) return viewRunDone();
    const it = run.items[run.idx];
    if (!UI.ex || UI.ex.sid !== it.s || UI.ex.key !== it.key || UI.ex.mode !== (test ? 'test' : 'train')) UI.ex = newEx(it.s, it.key, test ? 'test' : 'train');
    const ex = UI.ex;
    const label = test ? `Fråga ${run.idx + 1} av ${n}` : run.skill ? `Fråga ${run.idx + 1} av ${n}` : `Fråga ${run.idx + 1} av ${n} · blandat – välj metod själv`;
    let c = exerciseHTML(ex, { label });
    if (!test && ex.done) c += `<div class="actions"><button class="btn block" data-a="runnext">${run.idx + 1 < n ? 'Nästa fråga' : 'Se resultat'}</button></div>`;
    if (!test && !ex.done && (ex.wrong >= 1 || ex.hints > 0)) c += `<div class="actions"><button class="btn text" data-a="skip">Hoppa över</button></div>`;
    return focusShell(c, { title: run.title, sub: test ? 'Inga ledtrådar' : 'Träning', steps: n, cur: run.idx, exit: test ? '#/trana' : '#/trana' });
  }
  function viewRunDone() {
    const run = UI.run, test = run.kind === 'test';
    const ok = run.res.filter(r => r.ok).length, n = run.res.length;
    const firstOk = run.res.filter(r => r.first && !r.h).length;
    // analys per moment
    const by = {};
    run.res.forEach(r => { (by[r.s] = by[r.s] || []).push(r); });
    const rows = Object.entries(by).map(([sid, rs]) => {
      const s = E.SKILLS[sid], good = rs.every(r => test ? r.ok : r.first && !r.h);
      const mcs = [...new Set(rs.map(r => r.mc).filter(Boolean))];
      return `<div><span class="mark ${good ? 'ok' : 'no'}">${good ? '✓' : '!'}</span><div><b>${esc(s.title)}</b>${good ? '<div class="mut small">Klarade du själv.</div>' : mcs.length ? mcs.map(m => `<div class="small">${R(m)}</div>`).join('') : `<div class="small mut">${test ? 'Fel svar – repetera metoden.' : 'Behövde stöd.'}</div>`}</div></div>`;
    }).join('');
    const wrong = run.res.filter(r => !(test ? r.ok : r.first && !r.h)).map(r => ({ s: r.s, key: r.key }));
    const save = run.kind === 'test' && !run.saved; if (save) { run.saved = true; E.prof(pid()).tests.push({ ch: run.chapter, n, ok, t: Date.now() }); E.save(); }
    const c = `<div class="center"><div class="done-mark">${I.check}</div><p class="eyebrow">${test ? 'Provläge klart' : 'Passet klart'}</p>
      <h1>${test ? `${ok} av ${n} rätt` : `${firstOk} av ${n} helt själv`}</h1>
      <p class="mut">${test ? 'Här är analysen per moment – det är den som är viktig, inte poängen.' : `${ok} av ${n} rätt till slut.`}</p></div>
      <div class="card analysis"><h3>Analys</h3>${rows}</div>
      <div class="actions">${wrong.length ? `<button class="btn block" data-a="retrywrong">Öva på det som gick fel (${wrong.length})</button>` : `<button class="btn block" data-a="again">Ett pass till</button>`}<button class="btn ghost block" data-a="nav" data-h="#/">Till start</button></div>`;
    UI.runWrong = wrong;
    return focusShell(c, { title: run.title, sub: 'Resultat', exit: '#/' });
  }

  /* ================= ARK (sök, formel, profil) ================= */
  function openSheet(s) { UI.sheet = s; renderSheet(); }
  function closeSheet() { UI.sheet = null; renderSheet(); }
  function renderSheet() {
    const s = UI.sheet;
    if (!s) { sheetRoot.innerHTML = ''; document.body.style.overflow = ''; return; }
    document.body.style.overflow = 'hidden';
    let inner = '';
    if (s.type === 'search') {
      const res = s.q ? E.search(pid(), s.q) : [];
      inner = `<div class="sheet-head"><h2 style="margin:0">Sök</h2><button class="icon-btn" data-a="closesheet" aria-label="Stäng">${I.close}</button></div>
        <div class="searchbox">${I.search}<input id="sq" type="search" placeholder="Skriv med egna ord: triangel sida, rabatt…" value="${esc(s.q || '')}" autocomplete="off" aria-label="Sök"></div>
        <div id="sres">${searchResults(res, s.q)}</div>`;
    } else if (s.type === 'formula') {
      const sk = E.SKILLS[s.sid];
      inner = `<div class="sheet-head"><div><p class="eyebrow">Formelkort</p><h2 style="margin:0">${esc(sk.f.name)}</h2></div><button class="icon-btn" data-a="closesheet" aria-label="Stäng">${I.close}</button></div>
        <div class="big-f">${TX(sk.f.main)}</div>${formulaBody(sk, { noLink: !!s.inLesson })}`;
    } else if (s.type === 'profile') {
      inner = `<div class="sheet-head"><h2 style="margin:0">Vem pluggar?</h2><button class="icon-btn" data-a="closesheet" aria-label="Stäng">${I.close}</button></div>
        ${Object.values(CORE.profiles).map(p => `<button class="tap" data-a="pickprofile" data-p="${p.id}" ${p.id === pid() ? 'aria-current="true" style="border-color:var(--acc)"' : ''}><span class="chip-btn" style="border:0;padding:0;height:auto"><span class="av" style="background:${p.theme === 'navy' ? '#1d3557' : '#7a1f35'}">${p.short}</span></span><div><div class="t">${esc(displayName(p.id))}</div><div class="s">${p.label} · ${p.chapters.map(c => c.name).join(', ')}</div></div>${p.id === pid() ? `<span class="chev" style="color:var(--acc)">${I.check.replace('<svg', '<svg width="20" height="20"')}</span>` : ''}</button>`).join('')}
        <button class="tap" data-a="nav" data-h="#/installningar">${I.gear.replace('<svg', '<svg width="20" height="20"')}<div><div class="t">Inställningar och säkerhetskopia</div><div class="s">Namn, restprovsdatum, spara/återställ</div></div><span class="chev">${I.chev}</span></button>`;
    }
    sheetRoot.innerHTML = `<div class="scrim" data-a="scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${inner}</div></div>`;
    const f = sheetRoot.querySelector('#sq'); if (f) { f.focus(); const v = f.value; f.value = ''; f.value = v; }
  }
  function searchResults(res, q) {
    if (!q) return `<p class="mut small">Du behöver inte kunna det rätta ordet. Prova: <i>triangel sida</i>, <i>x båda sidor</i>, <i>diameter</i>, <i>rabatt</i>.</p>`;
    if (!res.length) return `<p class="mut">Hittade inget för "${esc(q)}". Prova ett annat ord.</p>`;
    return res.map(s => `<button class="tap" data-a="formula" data-sid="${s.id}"><div style="min-width:0"><div class="t">${esc(s.title)}</div><div class="s" style="overflow-x:auto">${TX(s.f.main)}</div></div><span class="chev">${I.chev}</span></button>`).join('');
  }

  /* ================= ROUTER ================= */
  let lastRoute = '';
  function render() {
    applyTheme();
    if (!pid()) { app.innerHTML = viewOnboarding(); return; }
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    let html = '';
    try {
      switch (parts[0]) {
        case undefined: case '': html = viewHome(); break;
        case 'formler': html = viewFormler(); break;
        case 'trana': html = viewTrana(); break;
        case 'tabell': {
          const sub = parts.slice(1).join('/');
          const inside = '<div id="arena" aria-label="Tabellarenan"></div>';
          html = ['practice','mixed','duel/play'].includes(sub)
            ? focusShell(inside,{title:'Tabellarenan',sub:'Träna och spela',exit:'#/tabell/home'})
            : shell(inside,'trana');
          break;
        }
        case 'k': html = viewChapter(parts[1]); break;
        case 'l': html = viewLesson(parts[1], parts[2]); break;
        case 'run': case 'prov': html = viewRun(); break;
        case 'rest': html = viewRest(parts[1]); break;
        case 'installningar': html = viewSettings(); break;
        default: html = viewHome();
      }
    } catch (err) {
      console.error(err);
      html = shell(`<div class="card"><h2>Något gick fel</h2><p class="mut">Sidan kunde inte visas. Dina framsteg är sparade.</p><button class="btn" data-a="nav" data-h="#/">Till start</button></div>`, 'home');
    }
    if (html) app.innerHTML = html;
    if(parts[0]==='tabell'){
      try{
        if(!window.MOTabellArena)throw new Error('Tabellarenan module not loaded');
        window.MOTabellArena.mount();
      }catch(error){
        console.error('Tabellarenan could not mount',error);
        app.innerHTML=shell('<div class="card"><h2>Tabellarenan kunde inte öppnas</h2><p class="mut">Prova att ladda om sidan. Dina sparade framsteg finns kvar.</p><a class="btn" href="#/">Till Matte OS</a></div>','trana');
      }
    }
    markReveals(h !== lastRoute);
    if (h !== lastRoute) { window.scrollTo(0, 0); lastRoute = h; const m = document.getElementById('main'); if (m && !document.activeElement.closest('#app')) { /* behåll fokus */ } }
  }
  function markReveals(newRoute) {
    if (newRoute || !UI.seen) UI.seen = new Set();
    app.querySelectorAll('.reveal').forEach(el => { const k = el.className + '|' + el.textContent.slice(0, 80); if (UI.seen.has(k)) el.classList.add('still'); else UI.seen.add(k); });
  }
  function rerenderKeepScroll() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  /* ================= HÄNDELSER ================= */
  const actions = {
    nav: b => { closeSheet(); go(b.dataset.h); },
    exit: b => { UI.ex = null; go(b.dataset.h || '#/'); },
    search: () => openSheet({ type: 'search', q: '' }),
    profile: () => openSheet({ type: 'profile' }),
    closesheet: () => closeSheet(),
    scrim: (b, e) => { if (e.target === b) closeSheet(); },
    pickprofile: b => { E.state().active = b.dataset.p; E.save(); UI.lesson = null; UI.run = null; UI.ex = null; UI.fch = null; closeSheet(); go('#/'); render(); },
    formula: b => openSheet({ type: 'formula', sid: b.dataset.sid, inLesson: /^#\/(l|run|prov)\//.test(location.hash + '/') }),
    ftoggle: b => { const id = b.dataset.sid; UI.fopen.has(id) ? UI.fopen.delete(id) : UI.fopen.add(id); rerenderKeepScroll(); },
    fch: b => { UI.fch = b.dataset.ch; UI.fopen.clear(); render(); },
    startTrain: b => { closeSheet(); startRun('train', b.dataset.sid ? { skill: b.dataset.sid } : { chapter: b.dataset.ch }); },
    startTest: b => { closeSheet(); window.location.assign('prov/?g=' + encodeURIComponent(pid()) + '&ch=' + encodeURIComponent(b.dataset.ch)); },
    reveal: () => { UI.lesson.reveal++; rerenderKeepScroll(); },
    gsr: b => { UI.lesson[b.dataset.k] = true; rerenderKeepScroll(); },
    rule: b => { const L = UI.lesson, i = +b.dataset.i; L.rule = i; if (i === E.SKILLS[L.sid].g.rc) L.ruleOk = true; rerenderKeepScroll(); },
    pick: b => { if (UI.ex && !UI.ex.done) { UI.ex.pick = b.dataset.v; UI.ex.status = null; rerenderKeepScroll(); } },
    hint: () => { if (UI.ex) { UI.ex.hints++; rerenderKeepScroll(); } },
    showsol: () => { const ex = UI.ex; if (!ex) return; ex.sol = true; ex.hints = Math.max(ex.hints, 1); if (!ex.done) { ex.done = true; ex.status = 'shown'; if (ex.first === null) ex.first = false; finishEx(ex); } rerenderKeepScroll(); },
    key: b => { const t = document.getElementById(b.dataset.t); if (!t) return; let k = b.dataset.k; if (k === 'x²') k = 'x²'; const s = t.selectionStart ?? t.value.length, e = t.selectionEnd ?? t.value.length; t.value = t.value.slice(0, s) + k + t.value.slice(e); t.focus(); const p = s + k.length; try { t.setSelectionRange(p, p); } catch (er) { } if (UI.ex) { if (b.dataset.t === 'anse') UI.ex.valE = t.value; else UI.ex.val = t.value; } },
    solonext: () => { const L = UI.lesson, ex = UI.ex; L.soloRes.push({ first: ex.first, h: ex.hints, ok: ex.ok }); if (L.soloIdx + 1 < L.solo.length) { L.soloIdx++; UI.ex = null; render(); window.scrollTo(0, 0); } else { UI.ex = null; go(`#/l/${L.sid}/4`); } },
    runnext: () => { const run = UI.run, ex = UI.ex; run.res.push({ s: ex.sid, key: ex.key, ok: ex.ok, first: ex.first, h: ex.hints, mc: ex.mc }); run.idx++; UI.ex = null; render(); window.scrollTo(0, 0); },
    skip: () => { const ex = UI.ex; if (!ex) return; ex.done = true; ex.ok = false; if (ex.first === null) ex.first = false; finishEx(ex); actions.runnext(); },
    retrywrong: () => startRun('train', { items: UI.runWrong.slice(0, 6), chapter: UI.run.chapter }),
    again: () => { const r = UI.run; startRun(r.kind === 'test' ? 'test' : 'train', r.skill ? { skill: r.skill } : { chapter: r.chapter }); },
    restdone: b => { const pr = E.prof(pid()); pr.rests[b.dataset.id] = { ...(pr.rests[b.dataset.id] || {}), done: true }; E.save(); toast('Restprovet är markerat som gjort.'); go('#/'); },
    savename: () => { const v = (document.getElementById('pname').value || '').trim().slice(0, 30); E.prof(pid()).name = v; E.save(); toast(v ? 'Namnet är sparat på den här enheten.' : 'Namnet är borttaget.'); render(); },
    export: () => {
      const blob = new Blob([E.exportData()], { type: 'application/json' });
      const d = E.now().toISOString().slice(0, 10), name = `matte-os-backup-${d}.json`;
      const file = typeof File === 'function' ? new File([blob], name, { type: 'application/json' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Matte OS säkerhetskopia' }).catch(() => download(blob, name)); }
      else download(blob, name);
    },
    import: () => document.getElementById('importfile').click(),
    reset: () => { if (!UI.confirmReset) { UI.confirmReset = true; render(); setTimeout(() => { UI.confirmReset = false; }, 6000); return; } UI.confirmReset = false; E.resetProfile(pid()); UI.lesson = null; toast('Framstegen är nollställda.'); go('#/'); }
  };
  function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Säkerhetskopian är sparad.'); }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = actions[b.dataset.a]; if (!a) return;
    if (b.tagName === 'INPUT') return;
    e.preventDefault(); a(b, e);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form="answer"]'); if (!f) return;
    e.preventDefault();
    const ex = UI.ex; if (!ex) return;
    const now = Date.now(); if (ex._t && now - ex._t < 350) return; ex._t = now; // dubbeltryck
    submitAnswer(ex);
    if (ex.mode === 'test' && ex.done) { const run = UI.run; run.res.push({ s: ex.sid, key: ex.key, ok: ex.ok, first: ex.first, h: 0, mc: ex.mc }); run.idx++; UI.ex = null; render(); window.scrollTo(0, 0); return; }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    rerenderKeepScroll();
    const fb = document.querySelector('.fb .box'); if (fb && fb.scrollIntoView) fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'ans' && UI.ex) UI.ex.val = t.value;
    if (t.id === 'ansm' && UI.ex) UI.ex.val = t.value;
    if (t.id === 'anse' && UI.ex) UI.ex.valE = t.value;
    if (t.id === 'fq') { UI.fq = t.value; const q = t.value.trim(); const list = q ? E.search(pid(), q) : E.chapterSkills(pid(), UI.fch); const fl = document.getElementById('flist'); if (fl) fl.innerHTML = list.map(formulaCard).join('') || '<p class="mut">Inga träffar. Prova ett annat ord.</p>'; }
    if (t.id === 'sq' && UI.sheet) { UI.sheet.q = t.value; document.getElementById('sres').innerHTML = searchResults(t.value.trim() ? E.search(pid(), t.value) : [], t.value.trim()); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'restdate') { const pr = E.prof(pid()); pr.rests[t.dataset.id] = { ...(pr.rests[t.dataset.id] || {}), date: t.value || null }; E.save(); toast(t.value ? 'Datumet är sparat.' : 'Datumet är borttaget.'); render(); }
    if (t.id === 'importfile' && t.files && t.files[0]) { const rd = new FileReader(); rd.onload = () => { const r = E.importData(String(rd.result)); toast(r.msg); render(); }; rd.readAsText(t.files[0]); t.value = ''; }
    if (t.id === 'fq') { /* hanteras av input */ }
  });
  // iPhone: när tangentbordet öppnas – håll svarsfält + Kontrollera synliga
  document.addEventListener('focusin', e => {
    const t = e.target; if (!t.matches || !t.matches('#ans, #ansm, #anse')) return;
    setTimeout(() => { const f = t.closest('form'); if (!f || !f.getBoundingClientRect) return; const r = f.getBoundingClientRect(), vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight); if (r.top < 60 || r.bottom > vh - 8) f.scrollIntoView({ block: 'end' }); }, 320);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.sheet) closeSheet(); });
  // formelsök-rutan: håll fokus när listan ritas om
  window.addEventListener('hashchange', () => { if (UI.sheet) closeSheet(); render(); });

  /* ================= START ================= */
  E.load();
  E.migrateV4().then(n => { if (n) { toast(`Tidigare framsteg flyttades över (${n} svar).`); render(); } });
  render();

  // Service worker: ny version tas i bruk direkt, men laddar bara om när eleven inte är mitt i en uppgift.
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      if (reg.waiting) reg.waiting.postMessage('skip');
      reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) w.postMessage('skip'); }); });
      setInterval(() => reg.update().catch(() => { }), 60 * 60 * 1000);
    }).catch(() => { });
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      const busy = /^#\/(l|run|prov)(\/|$)/.test(location.hash + '/') || /^#\/tabell\/(practice|mixed|duel\/play)(\/|$)/.test(location.hash + '/');
      if (busy) { window.__moPendingReload = true; return; }
      reloaded = true; location.reload();
    });
    window.addEventListener('hashchange', () => { if (window.__moPendingReload && !(/^#\/(l|run|prov)(\/|$)/.test(location.hash + '/') || /^#\/tabell\/run(\/|$)/.test(location.hash + '/'))) { window.__moPendingReload = false; location.reload(); } });
  }
  window.__MO_UI = UI; // för automatiska tester
})();
