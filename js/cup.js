/* Matte OS Cup – spela multiplikationstabellerna tillsammans, varsin mobil.
   Egen Shadow DOM. Lokal data i nyckeln matteos.cup.v1 (rör inte matteos.v5). */
(function (root) {
  'use strict';
  const LS = 'matteos.cup.v1';
  const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } },
    set(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { /* privat läge */ } }
  };
  function rnd() { const a = new Uint8Array(16); (root.crypto || {}).getRandomValues ? root.crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.floor(Math.random() * 256)); return Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); }
  function device() { const s = store.get(); if (!s.device) { s.device = 'd' + rnd(); store.set(s); } return s.device; }
  function cfg() {
    const c = root.MO_CUP_CONFIG || {}; let url = c.url, key = c.anonKey;
    try { const q = new URLSearchParams(location.search).get('cupserver'); if (q && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { url = q; key = key || 'dev'; } } catch (e) { /* */ }
    return url ? { url, anonKey: key } : null;
  }
  const PATTERN = {
    1: 'Ettan ändrar ingenting: 1 × n = n.', 2: 'Tvåan är dubbelt: 2 × 7 = 7 + 7.', 3: 'Trean är dubbelt plus ett till: 3 × 6 = 6 + 6 + 6.',
    4: 'Fyran är dubbelt två gånger: 4 × 7 = 14 + 14.', 5: 'Femman slutar alltid på 0 eller 5, och är hälften av tian.',
    6: 'Sexan är femman plus en till: 6 × 7 = 35 + 7.', 7: 'Sjuan: lär dig 7 × 7 = 49 och 7 × 8 = 56, resten kommer från grannarna.',
    8: 'Åttan är fyrans dubbelt: 8 × 6 = 2 × 24.', 9: 'Nian: siffrorna i svaret blir tillsammans 9 (9 × 7 = 63, 6 + 3 = 9). Eller 10 × n minus n.',
    10: 'Tian: sätt en nolla efter talet.'
  };
  let host = null, shadow = null, S = null, timers = [];

  function fresh() {
    return { view: 'menu', api: null, sess: null, st: null, recvAt: 0, banner: '', err: '', busy: false, local: null, pollT: null, tickT: null,
      study: { tables: [7], cover: false, test: null }, setup: { tables: [1,2,3,4,5,6,7,8,9,10], qual: 10, sec: 20 }, joinCode: '', nick: '', lastSig: '' };
  }
  const page = () => (root.MOEngine && root.MOEngine.state && root.MOEngine.state().active) || 'grade9';

  // ---------- API/sessions ----------
  function api() { if (S.api) return S.api; const c = cfg(); if (!c) return null; S.api = root.MOCupApi.client(c); return S.api; }
  function saveSess() { const s = store.get(); s.session = S.sess; store.set(s); }
  function clearSess(msg) { S.sess = null; S.st = null; S.local = null; const s = store.get(); delete s.session; store.set(s); stopPoll(); S.view = 'menu'; S.err = msg || ''; draw(); }
  function errText(e) { return e && e.message ? e.message : 'Något gick fel.'; }

  async function create() {
    const a = api(); if (!a) return; S.busy = true; S.err = ''; draw();
    try {
      const r = await a.create(S.setup.tables, S.setup.qual, S.setup.sec);
      S.sess = { code: r.code, hostSecret: r.host_secret, role: 'host' }; saveSess(); S.view = 'game'; startPoll();
    } catch (e) { S.err = errText(e); }
    S.busy = false; draw();
  }
  async function join(code, nick, asHost) {
    const a = api(); if (!a) return; S.busy = true; S.err = ''; draw();
    try {
      const r = await a.join(code, nick, device());
      S.sess = Object.assign(S.sess || {}, { code: String(code).toUpperCase().trim(), playerId: r.player_id, secret: r.secret, nick: r.nick, role: asHost ? 'host' : 'player' });
      saveSess(); S.view = 'game'; startPoll();
    } catch (e) { S.err = errText(e); }
    S.busy = false; draw();
  }
  async function act(fn) {
    const a = api(); if (!a || !S.sess) return; S.busy = true; draw();
    try { await fn(a, S.sess); S.err = ''; await pollOnce(); } catch (e) { S.err = errText(e); if (['BAD_PLAYER', 'KICKED', 'GONE', 'NO_ROOM'].includes(e.code)) { clearSess(errText(e)); return; } }
    S.busy = false; draw();
  }

  // ---------- polling ----------
  function startPoll() { stopPoll(); S.lastSig = ''; pollOnce().then(() => { scheduleTick(); }); }
  function stopPoll() { if (!S) return; clearTimeout(S.pollT); clearInterval(S.tickT); S.pollT = S.tickT = null; }
  // En enda poll åt gången, och svar som kommer i fel ordning kastas (annars kan en gammal vy ritas över en ny
  // och radera det som eleven just skrivit). seq ökar för varje utskickad förfrågan.
  async function pollOnce() {
    const a = api(); if (!a || !S.sess) return;
    if (S.inflight) return S.inflight;
    clearTimeout(S.pollT);
    const mySeq = S.pollSeq = (S.pollSeq || 0) + 1;
    const run = (async () => {
      try {
        const st = await a.state(S.sess.code, S.sess.playerId, S.sess.secret, S.sess.hostSecret);
        if (!S.sess || mySeq < (S.appliedSeq || 0)) return;
        S.appliedSeq = mySeq; if (S.banner) { S.banner = ''; setBanner(); } S.st = st; S.recvAt = performance.now();
        const sig = sigOf(st); if (sig !== S.lastSig) { S.lastSig = sig; if (!S.local) draw(); }
      } catch (e) {
        if (['BAD_PLAYER', 'KICKED', 'GONE', 'NO_ROOM'].includes(e.code)) { clearSess(errText(e)); return; }
        if (e.code === 'RATE') { /* för tät polling: tyst, nästa försök om en sekund */ } else { S.banner = e.code === 'NET' ? 'Ingen kontakt med spelservern – försöker igen…' : errText(e); setBanner(); }
      }
    })();
    S.inflight = run;
    try { await run; } finally { S.inflight = null; }
    if (S.sess) { clearTimeout(S.pollT); S.pollT = setTimeout(pollOnce, 1000); }
  }
  function sigOf(st) {
    const r = st.round;
    const inQ = r && r.status === 'active' && r.you_in;
    if (inQ) return ['q', st.status, r.id, r.question ? r.question.idx : 'x', r.answered, r.starts_in_ms > 0 ? 'cd' : 'go'].join('|');
    const c = JSON.parse(JSON.stringify(st)); delete c.now; if (c.round) { delete c.round.ms_left; delete c.round.starts_in_ms; }
    (c.players || []).forEach(p => delete p.online);
    return JSON.stringify(c);
  }
  function setBanner() { const b = shadow && shadow.getElementById('banner'); if (b) { b.textContent = S.banner; b.hidden = !S.banner; } }
  function scheduleTick() {
    clearInterval(S.tickT);
    S.tickT = setInterval(() => {
      const st = S.st; if (!st || !st.round) return;
      const el = performance.now() - S.recvAt, r = st.round;
      const bar = shadow.getElementById('tbar'), txt = shadow.getElementById('tleft'), cd = shadow.getElementById('cd');
      if (r.status === 'active') {
        const startsIn = Math.max(0, r.starts_in_ms - el), left = Math.max(0, r.ms_left - el);
        if (cd) cd.textContent = Math.ceil(startsIn / 1000);
        if (txt) txt.textContent = Math.ceil(left / 1000) + ' s kvar i rundan';
        if (bar) bar.style.width = Math.max(0, Math.min(100, 100 * left / Math.max(1, r.ms_left + r.starts_in_ms))) + '%';
        if (startsIn === 0 && r.starts_in_ms > 0 && !S._kicked) { S._kicked = true; pollOnce(); }
        if (startsIn > 0) S._kicked = false;
        if (left === 0 && !S._lk) { S._lk = true; pollOnce(); } if (left > 0) S._lk = false;
      }
    }, 250);
  }

  // ---------- rendering ----------
  function shell(inner) {
    shadow.innerHTML = '<link rel="stylesheet" href="css/cup.css?v=5.5.0"><div class="cup" data-grade="' + page() + '"><div id="banner" class="banner" role="status" ' + (S.banner ? '' : 'hidden') + '>' + esc(S.banner) + '</div><div class="wrap">' + inner + '</div></div>';
  }
  const chips = (sel, act) => Array.from({ length: 10 }, (_, i) => i + 1).map(t => '<button type="button" class="chip' + (sel.includes(t) ? ' on' : '') + '" data-act="' + act + '" data-v="' + t + '" aria-pressed="' + sel.includes(t) + '">' + t + '</button>').join('');
  const errBox = () => S.err ? '<p class="err" role="alert">' + esc(S.err) + '</p>' : '';
  const back = (to, label) => '<button class="link" data-act="go" data-v="' + to + '">← ' + (label || 'Tillbaka') + '</button>';

  function menu() {
    const on = !!cfg();
    shell(`<span class="eyebrow">Matte OS Cup</span><h1>Spela tillsammans</h1>
      <p class="lead">Studera tabellerna först. Sedan spelar ni samma frågor på varsin mobil, med kval, semifinal och final.</p>
      ${errBox()}
      <button class="tile" data-act="go" data-v="study"><b>1 · Studera tabellerna</b><span>Läs, täck svaren och öva mönster. Räknas inte i tävlingen.</span></button>
      <button class="tile" data-act="go" data-v="host" ${on ? '' : 'disabled'}><b>2 · Skapa spel</b><span>Du är värd och får en kod att dela.</span></button>
      <button class="tile" data-act="go" data-v="join" ${on ? '' : 'disabled'}><b>3 · Gå med i spel</b><span>Skriv koden från värden och välj ett smeknamn.</span></button>
      ${on ? '' : '<p class="note" id="offnote">Onlinespelet är inte påslaget ännu. Studieläget fungerar utan nät. Be värden slå på spelservern.</p>'}
      <p class="small">Inga konton och inga riktiga namn. Använd ett smeknamn. Spelet raderas automatiskt efter några timmar.</p>`);
  }

  // --- studieläge ---
  function study() {
    const sel = S.study.tables.length ? S.study.tables : [7];
    const blocks = sel.map(t => `<section class="card"><h2>${t}:ans tabell</h2><p class="pattern">${esc(PATTERN[t])}</p><div class="rows">${Array.from({ length: 10 }, (_, i) => i + 1).map(k => `<div class="row"><span>${t} × ${k}</span><span class="ans ${S.study.cover ? 'covered' : ''}" ${S.study.cover ? 'role="button" tabindex="0" data-act="reveal" aria-label="Visa svaret på ' + t + ' gånger ' + k + '"' : ''}>${S.study.cover ? '<i>?</i><b>' + t * k + '</b>' : '= <b>' + t * k + '</b>'}</span></div>`).join('')}</div></section>`).join('');
    shell(`${back('menu', 'Matte OS Cup')}<span class="eyebrow">Studieläge</span><h1>Studera först</h1>
      <p class="lead">Välj en eller flera tabeller.</p><div class="chips" role="group" aria-label="Välj tabeller">${chips(sel, 'stab')}</div>
      <div class="actions"><button class="btn ghost" data-act="cover">${S.study.cover ? 'Visa alla svar' : 'Täck svaren'}</button><button class="btn" data-act="minitest">Frivilligt minitest · 5 frågor</button></div>
      ${S.study.cover ? '<p class="note">Tryck på ett frågetecken för att se svaret. Försök säga svaret först.</p>' : ''}
      ${blocks}<p class="small">Övning och minitest påverkar varken tävlingspoäng eller dina sparade framsteg.</p>`);
  }
  function minitest() {
    const t = S.study.test; const sel = S.study.tables.length ? S.study.tables : [7];
    if (!t || t.done) {
      const qs = []; const pool = []; sel.forEach(a => { for (let b = 1; b <= 10; b++) pool.push([a, b]); });
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      S.study.test = { qs: pool.slice(0, 5), i: 0, ok: 0, fb: null, done: false };
    }
    const T = S.study.test;
    if (T.i >= T.qs.length) {
      shell(`${back('study', 'Studieläge')}<span class="eyebrow">Minitest klart</span><h1>${T.ok} av ${T.qs.length} rätt</h1><p class="lead">${T.ok >= 4 ? 'Snyggt. Du är redo.' : 'Bra start. Läs tabellen en gång till och försök igen.'}</p><div class="actions"><button class="btn" data-act="minitest" data-v="again">Gör ett nytt</button><button class="btn ghost" data-act="go" data-v="study">Tillbaka till studieläget</button></div>`);
      T.done = true; return;
    }
    const [a, b] = T.qs[T.i];
    shell(`${back('study', 'Studieläge')}<span class="eyebrow">Minitest · ${T.i + 1} av ${T.qs.length} · räknas inte</span><div class="qcard"><div class="eq">${a} × ${b} = ?</div>${T.fb ? `<p class="fb ${T.fb.ok ? 'ok' : 'no'}">${T.fb.ok ? 'Rätt!' : 'Bra försök.'} ${a} × ${b} = ${a * b}</p><button class="btn" data-act="mtnext">Nästa →</button>` : `<form data-form="mt"><input id="mtin" class="num" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="3" aria-label="Svar på ${a} gånger ${b}"><button class="btn" type="submit">Svara</button></form>`}</div>`);
    const i = shadow.getElementById('mtin'); if (i) i.focus();
  }

  // --- värd/gå med ---
  function hostSetup() {
    shell(`${back('menu', 'Matte OS Cup')}<span class="eyebrow">Du är värd</span><h1>Skapa spel</h1>${errBox()}
      <h2 class="h2">Vilka tabeller ska ingå?</h2><div class="chips" role="group" aria-label="Tabeller i tävlingen">${chips(S.setup.tables, 'ctab')}</div>
      <div class="actions small"><button class="btn ghost sm" data-act="ctall">Alla 1–10</button><button class="btn ghost sm" data-act="ct69">6–9</button><button class="btn ghost sm" data-act="ct25">2, 5, 10</button></div>
      <h2 class="h2">Frågor i kvalet</h2><div class="chips">${[10, 15, 20].map(n => `<button class="chip wide${S.setup.qual === n ? ' on' : ''}" data-act="cq" data-v="${n}">${n}</button>`).join('')}</div>
      <h2 class="h2">Tid per fråga</h2><div class="chips">${[[15, '15 s'], [20, '20 s'], [30, '30 s (lugnt)']].map(([n, l]) => `<button class="chip wide${S.setup.sec === n ? ' on' : ''}" data-act="cs" data-v="${n}">${l}</button>`).join('')}</div>
      <button class="btn block" data-act="create" ${S.busy || !S.setup.tables.length ? 'disabled' : ''}>${S.busy ? 'Skapar…' : 'Skapa spel'}</button>`);
  }
  function joinForm() {
    shell(`${back('menu', 'Matte OS Cup')}<span class="eyebrow">Gå med</span><h1>Skriv koden</h1>${errBox()}
      <form data-form="join"><label for="jc">Spelkod (5 tecken)</label><input id="jc" class="code" autocapitalize="characters" autocomplete="off" maxlength="5" value="${esc(S.joinCode)}">
      <label for="jn">Smeknamn (inte ditt riktiga namn)</label><input id="jn" class="text" maxlength="16" autocomplete="off" value="${esc(S.nick)}">
      <button class="btn block" type="submit" ${S.busy ? 'disabled' : ''}>${S.busy ? 'Går med…' : 'Gå med'}</button></form>`);
  }

  // --- spelvy (styrs av serverstate) ---
  const nameOf = id => esc((S.st.names || {})[id] || '?');
  function gameView() {
    const st = S.st;
    if (!st) { shell('<p class="lead">Ansluter…</p>'); return; }
    if (st.status === 'LOBBY') return lobby();
    if (st.status === 'COMPLETE') return podium();
    const r = st.round;
    if (r && r.status === 'active') return r.you_in ? playing() : watching();
    return scored();
  }
  function joinLink() { try { return location.origin + location.pathname + '#/cup/join/' + S.sess.code; } catch (e) { return ''; } }
  function lobby() {
    const st = S.st, me = st.me, isHost = st.is_host;
    const list = st.players.map(p => `<li class="${p.me ? 'me' : ''}"><span class="dot ${p.online ? 'on' : ''}" aria-hidden="true"></span><span class="pn">${esc(p.nick)}${p.me ? ' (du)' : ''}</span><span class="rd">${p.ready ? 'Redo' : '…'}</span>${isHost ? `<button class="x" data-act="kick" data-v="${esc(p.id)}" aria-label="Ta bort ${esc(p.nick)}">✕</button>` : ''}</li>`).join('');
    const mine = st.players.find(p => p.me);
    const hostNeedsNick = isHost && !me;
    shell(`<span class="eyebrow">${isHost ? 'Värd' : 'Lobby'}</span><h1>${isHost ? 'Spelkod' : 'Väntar på start'}</h1>
      ${isHost ? `<div class="bigcode" aria-label="Spelkod ${esc(st.code)}">${esc(st.code)}</div><p class="small">Gå till <b>${esc(location.host)}${esc(location.pathname)}</b> → Tabellarenan → Matte OS Cup → Gå med. Eller öppna länken:</p><p class="link-box" id="jl">${esc(joinLink())}</p><div id="qr" class="qr" aria-label="QR-kod till spelet"></div>` : `<p class="lead">Kod <b>${esc(st.code)}</b>. Värden startar när alla är redo.</p>`}
      ${errBox()}
      <h2 class="h2">${st.players.length} ${st.players.length === 1 ? 'spelare' : 'spelare'} i lobbyn</h2><ul class="plist">${list || '<li>Ingen än</li>'}</ul>
      ${mine ? `<button class="btn block ${mine.ready ? 'ghost' : ''}" data-act="ready" data-v="${mine.ready ? '0' : '1'}">${mine.ready ? 'Ångra – jag är inte redo' : 'Jag är redo'}</button>` : ''}
      ${hostNeedsNick ? `<form data-form="hostjoin"><label for="hn">Vill du spela själv? Välj smeknamn</label><input id="hn" class="text" maxlength="16" autocomplete="off"><button class="btn block ghost" type="submit">Spela själv</button></form>` : ''}
      ${isHost ? `<button class="btn block" data-act="start" ${st.players.length < 2 ? 'disabled' : ''}>Starta kvalet</button><p class="small">Kval: ${st.qual_q} frågor, ${st.sec_per_q} s per fråga. Tabeller: ${st.tables.join(', ')}. De fyra bästa går vidare till semifinal (1 mot 4, 2 mot 3), därefter final bäst av tre.</p><button class="link danger" data-act="cancel">Avsluta spelet</button>` : `<button class="link" data-act="leave">Lämna spelet</button>`}`);
    if (isHost) drawQr();
  }
  function stageName(r) { return r.kind === 'tb' ? 'Utslagsrunda' : ({ qual: 'Kval', semi: 'Semifinal', final: 'Final – spel ' + r.game + ' av 3' })[r.stage] || ''; }
  function playing() {
    const st = S.st, r = st.round;
    if (r.starts_in_ms > 0 && !r.question) {
      shell(`<span class="eyebrow">${stageName(r)}</span><h1>Gör dig redo</h1><div class="cdbox" aria-live="polite"><div id="cd" class="cdnum">${Math.ceil(r.starts_in_ms / 1000)}</div></div><p class="lead">${r.n_q} frågor. Skriv bara talet.</p>`);
      return;
    }
    if (S.local) { return feedback(); }
    if (!r.question) {
      shell(`<span class="eyebrow">${stageName(r)}</span><h1>Klart!</h1><p class="lead">Du har svarat på alla frågor. Väntar på de andra: <b>${r.finished}</b> av <b>${r.participants}</b> klara.</p><div class="bar"><i id="tbar"></i></div><p class="small" id="tleft"></p>${hostBar()}`);
      return;
    }
    const q = r.question;
    const keep = shadow.querySelector('form[data-form=ans]'); const keepVal = keep && keep.dataset.r === String(r.id) && keep.dataset.i === String(q.idx) ? (shadow.getElementById('ai') || {}).value || '' : '';
    shell(`<span class="eyebrow">${stageName(r)} · fråga ${q.idx + 1} av ${r.n_q}</span><div class="bar"><i id="tbar"></i></div><p class="small right" id="tleft"></p>
      <div class="qcard"><div class="eq" aria-live="polite">${q.a} × ${q.b} = ?</div>
      <form data-form="ans" data-r="${r.id}" data-i="${q.idx}"><input id="ai" class="num" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="3" aria-label="Svar på ${q.a} gånger ${q.b}"><button class="btn block" type="submit" id="ab" ${S.busy ? 'disabled' : ''}>Svara</button></form></div>
      <p class="small">Du ser inte hur de andra ligger till förrän rundan är slut.</p>${hostBar()}`);
    const i = shadow.getElementById('ai'); if (i) { if (keepVal) i.value = keepVal; i.focus({ preventScroll: true }); }
  }
  function hostBar() { return S.st.is_host ? '<button class="link" data-act="endround">Avsluta rundan nu (värd)</button>' : ''; }
  function feedback() {
    const l = S.local; const q = l.q;
    shell(`<span class="eyebrow">${stageName(S.st.round)}</span><div class="qcard"><div class="eq">${q.a} × ${q.b}</div><p class="fb ok" role="status">Svar skickat ✓</p><p class="small">Facit och vad som var rätt visas när hela rundan är slut, så att ingen kan skicka svar vidare.</p></div>`);
  }
  function watching() {
    const st = S.st, r = st.round;
    shell(`<span class="eyebrow">${stageName(r)}</span><h1>${st.is_host && !st.me ? 'Spelet pågår' : 'Du tittar på'}</h1><p class="lead">${r.finished} av ${r.participants} spelare är klara.</p><div class="bar"><i id="tbar"></i></div><p class="small" id="tleft"></p>${hostBar()}`);
  }
  function rankList(rows, withMax) {
    return '<ol class="rank">' + rows.map(x => `<li class="${S.st.me && x.id === S.st.me ? 'me' : ''}"><span class="rk">${x.rank}</span><span class="pn">${esc(x.nick)}${S.st.me && x.id === S.st.me ? ' (du)' : ''}</span><span class="sc">${x.correct}${withMax ? ' / ' + withMax : ''}</span></li>`).join('') + '</ol>';
  }
  function scored() {
    const st = S.st, r = st.round, res = st.results || { round: [] }, b = st.bracket || {};
    let extra = '';
    if (r.stage === 'qual' && r.kind === 'main' && b.standings) extra = '<p class="note">De fyra bästa går vidare till semifinal. Vid lika poäng på gränsen avgör en kort utslagsrunda.</p>';
    if (r.stage === 'semi' && b.semi) extra = '<h2 class="h2">Semifinaler</h2>' + b.semi.map(m => `<p class="match">${nameOf(m.a)} mot ${nameOf(m.b)}${m.w ? ' → <b>' + nameOf(m.w) + '</b> vidare' : ''}</p>`).join('');
    if (r.stage === 'final' && b.finalists) { const w = b.wins || {}; extra = `<h2 class="h2">Final – bäst av tre</h2><p class="match">${nameOf(b.finalists[0])} <b>${w[b.finalists[0]] || 0}</b> – <b>${w[b.finalists[1]] || 0}</b> ${nameOf(b.finalists[1])}</p>`; }
    if (b.forced) extra += '<p class="small">Lika efter flera utslagsrundor: placeringen avgjordes på anslutningsordning.</p>';
    const review = res.review ? `<details class="review"><summary>Dina svar</summary>${res.review.map(x => `<div class="rv"><span>${x.a} × ${x.b} = ${x.ans}</span><span class="${x.ok ? 'ok' : 'no'}">${x.val == null ? 'inget svar' : x.ok ? 'Rätt' : 'Du svarade ' + x.val}</span></div>`).join('')}</details>` : '';
    const mineRow = (res.round || []).find(x => x.id === st.me);
    shell(`<span class="eyebrow">${stageName(r)} klar</span><h1>${mineRow ? mineRow.correct + ' av ' + r.n_q + ' rätt' : 'Resultat'}</h1>${errBox()}
      ${rankList(res.round || [], r.n_q)}${extra}${review}
      ${st.is_host ? `<button class="btn block" data-act="next" ${S.busy ? 'disabled' : ''}>Nästa steg →</button>` : '<p class="note" aria-live="polite">Väntar på att värden går vidare…</p>'}`);
  }
  function podium() {
    const st = S.st, b = st.bracket, p = b.podium || [];
    shell(`<span class="eyebrow">Matte OS Cup</span><h1>${p[0] ? nameOf(p[0]) + ' vinner!' : 'Spelet är slut'}</h1>
      <ol class="podium"><li><b>1:a</b> ${nameOf(p[0])}</li><li><b>2:a</b> ${nameOf(p[1])}</li>${p.slice(2).length ? '<li><b>Delad 3:e</b> ' + p.slice(2).map(nameOf).join(' och ') + '</li>' : ''}</ol>
      <p class="lead">Alla har gjort sitt bästa. Bra spelat!</p>
      ${b.standings ? '<h2 class="h2">Kvalresultat</h2>' + rankList(b.standings, st.qual_q) : ''}
      <button class="btn block" data-act="done">Klar</button>`);
  }

  // ---------- QR ----------
  function drawQr() {
    const el = shadow.getElementById('qr'); if (!el || !root.MOQr) return;
    try { el.innerHTML = root.MOQr.svg(joinLink()); } catch (e) { el.textContent = ''; }
  }

  // ---------- draw / events ----------
  function draw() {
    if (!shadow) return;
    switch (S.view) {
      case 'menu': return menu();
      case 'study': return study();
      case 'minitest': return minitest();
      case 'host': return hostSetup();
      case 'join': return joinForm();
      case 'game': return gameView();
      default: return menu();
    }
  }
  function go(v) { S.err = ''; S.view = v; if (v === 'menu' && S.sess) { S.view = 'game'; } draw(); window.scrollTo(0, 0); }
  function onClick(e) {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const v = b.dataset.v;
    switch (b.dataset.act) {
      case 'go': if (v === 'study') S.study.test = null; go(v); break;
      case 'stab': { const t = +v, a = S.study.tables; const i = a.indexOf(t); if (i >= 0) { if (a.length > 1) a.splice(i, 1); } else a.push(t); a.sort((x, y) => x - y); draw(); break; }
      case 'cover': S.study.cover = !S.study.cover; draw(); break;
      case 'reveal': { b.classList.remove('covered'); const i = b.querySelector('i'); if (i) i.remove(); break; }
      case 'minitest': if (v === 'again') S.study.test = null; S.view = 'minitest'; draw(); break;
      case 'mtnext': S.study.test.i++; S.study.test.fb = null; draw(); break;
      case 'ctab': { const t = +v, a = S.setup.tables, i = a.indexOf(t); if (i >= 0) a.splice(i, 1); else a.push(t); a.sort((x, y) => x - y); draw(); break; }
      case 'ctall': S.setup.tables = [1,2,3,4,5,6,7,8,9,10]; draw(); break;
      case 'ct69': S.setup.tables = [6, 7, 8, 9]; draw(); break;
      case 'ct25': S.setup.tables = [2, 5, 10]; draw(); break;
      case 'cq': S.setup.qual = +v; draw(); break;
      case 'cs': S.setup.sec = +v; draw(); break;
      case 'create': create(); break;
      case 'ready': act((a, s) => a.ready(s.code, s.playerId, s.secret, v === '1')); break;
      case 'kick': act((a, s) => a.kick(s.code, s.hostSecret, v)); break;
      case 'start': act((a, s) => a.start(s.code, s.hostSecret)); break;
      case 'next': act((a, s) => a.next(s.code, s.hostSecret)); break;
      case 'endround': act((a, s) => a.endRound(s.code, s.hostSecret)); break;
      case 'cancel': if (root.confirm && !root.confirm('Avsluta spelet för alla?')) return; act(async (a, s) => { await a.cancel(s.code, s.hostSecret); clearSess(); }); break;
      case 'leave': act(async (a, s) => { await a.leave(s.code, s.playerId, s.secret); clearSess(); }); break;
      case 'done': clearSess(); break;
    }
  }
  async function submitAnswer(val, form) {
    const st = S.st, r = st && st.round; if (!r || !r.question || S.busy) return;
    const q = r.question;
    // Svaret gäller den fråga som visas på skärmen. Har servern hunnit gå vidare: ladda om i stället för att svara fel fråga.
    if (form && (form.dataset.r !== String(r.id) || form.dataset.i !== String(q.idx))) { S.lastSig = ''; await pollOnce(); draw(); return; }
    S.busy = true; const ab = shadow.getElementById('ab'); if (ab) ab.disabled = true;
    try {
      await api().answer(S.sess.code, S.sess.playerId, S.sess.secret, r.id, q.idx, val);
      S.local = { q };
      S.busy = false; draw();
      setTimeout(async () => { S.local = null; await pollOnce(); S.lastSig = sigOf(S.st); draw(); }, 450);
    } catch (e) {
      S.busy = false; S.err = errText(e); if (e.code === 'LATE') { await pollOnce(); } draw();
    }
  }
  function onSubmit(e) {
    const f = e.target; const t = f.dataset.form; if (!t) return; e.preventDefault();
    if (t === 'ans') { const v = shadow.getElementById('ai').value.trim(); if (/^\d{1,4}$/.test(v)) submitAnswer(+v, f); return; }
    if (t === 'mt') { const T = S.study.test, v = shadow.getElementById('mtin').value.trim(); if (!/^\d{1,3}$/.test(v)) return; const [a, b] = T.qs[T.i]; const ok = +v === a * b; if (ok) T.ok++; T.fb = { ok }; draw(); return; }
    if (t === 'join') { S.joinCode = shadow.getElementById('jc').value.toUpperCase().trim(); S.nick = shadow.getElementById('jn').value.trim(); join(S.joinCode, S.nick, false); return; }
    if (t === 'hostjoin') { const n = shadow.getElementById('hn').value.trim(); join(S.sess.code, n, true); }
  }
  function mount(opts) {
    host = document.getElementById('cup'); if (!host) return;
    if (!S) S = fresh();
    stopPoll();
    shadow = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    shadow.addEventListener('click', onClick); shadow.addEventListener('submit', onSubmit);
    const saved = store.get().session;
    if (saved && saved.code) { S.sess = saved; S.view = 'game'; draw(); startPoll(); return; }
    if (opts && opts.join) { S.joinCode = String(opts.join).toUpperCase().slice(0, 5); S.view = 'join'; }
    draw();
  }
  function unmount() { stopPoll(); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S && S.sess) pollOnce(); });
  root.MOCup = { mount, unmount, qa: { esc, cfg, sigOf, PATTERN } };
})(typeof window !== 'undefined' ? window : globalThis);
