/* Matte OS · Play layer runtime.
   - Celebrates correct answers (burst + combo toast + tiny haptic). Never in test mode.
   - "Today" ring: counts answered questions on this device today (counts only, no content).
   - Story bubbles on the home screen → smart/ (study technique stories).
   - "Fastnat?" helper next to the hint button: a 4-step loop, never the answer.
   No losses, no guilt streaks, no timers that punish. Respects reduced motion. */
(function (root) {
  'use strict';
  const KEY = 'matteos.play.v1', GOAL = 10;
  const reduce = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || '{}');
      const seen = Array.isArray(s.seen) ? s.seen.filter(x => typeof x === 'string').slice(0, 40) : [];
      const n = s.day === today() && Number.isFinite(s.n) ? Math.max(0, Math.min(999, s.n | 0)) : 0;
      return { day: today(), n, seen };
    } catch (_) { return { day: today(), n: 0, seen: [] }; }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} }

  let combo = 0;
  const COLORS = ['#FFC83D', '#FF5C8A', '#8B5CF6', '#4DA3FF', '#2ED3A5'];
  function burst(x, y) {
    if (reduce()) return;
    const wrap = document.createElement('div'); wrap.className = 'pl-burst'; wrap.setAttribute('aria-hidden', 'true');
    wrap.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18 + Math.random() * .3, d = 60 + Math.random() * 70;
      const p = document.createElement('i');
      p.style.setProperty('--x', Math.cos(a) * d + 'px'); p.style.setProperty('--y', (Math.sin(a) * d - 30) + 'px');
      p.style.setProperty('--r', (Math.random() * 540 - 270) + 'deg'); p.style.setProperty('--c', COLORS[i % COLORS.length]);
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap); setTimeout(() => wrap.remove(), 900);
  }
  function toast(text) {
    if (reduce()) return;
    document.querySelectorAll('.pl-toast').forEach(t => t.remove());
    const t = document.createElement('div'); t.className = 'pl-toast'; t.setAttribute('aria-hidden', 'true'); t.textContent = text;
    document.body.appendChild(t); setTimeout(() => t.remove(), 1700);
  }
  const PRAISE = { 3: '3 i rad 🔥', 5: '5 i rad – on fire 🔥', 8: '8 i rad. Sjukt bra ⚡', 12: '12 i rad. Legend 👑' };
  function onAnswer(e) {
    const d = e.detail || {};
    if (d.mode === 'test') return;            // exams stay calm
    const s = load(); s.n += 1; save(s); updateRing();
    if (!d.ok) { combo = 0; return; }
    combo += 1;
    const el = document.activeElement && document.activeElement !== document.body ? document.activeElement : document.querySelector('[data-a="check"]');
    const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    burst(r.left + r.width / 2, r.top + r.height / 2);
    if (PRAISE[combo]) toast(PRAISE[combo]);
    else if (s.n === GOAL) toast('Dagens mål klart ✓');
    try { if (!reduce() && navigator.vibrate) navigator.vibrate(12); } catch (_) {}
  }

  function ringHTML(n) {
    const c = 2 * Math.PI * 26, f = Math.min(1, n / GOAL);
    return '<div class="pl-today' + (n >= GOAL ? ' pl-full' : '') + '" role="img" aria-label="Idag: ' + n + ' av ' + GOAL + ' frågor">'
      + '<div class="pl-dial"><svg viewBox="0 0 62 62" aria-hidden="true"><defs><linearGradient id="pl-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset=".5" stop-color="#FF5C8A"/><stop offset="1" stop-color="#FFC83D"/></linearGradient></defs>'
      + '<circle class="pl-track" cx="31" cy="31" r="26" fill="none" stroke-width="6"/>'
      + '<circle class="pl-fill" cx="31" cy="31" r="26" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - f)).toFixed(1) + '"/></svg>'
      + '<span class="pl-num">' + (n >= GOAL ? '✓' : n) + '</span></div><span>' + (n >= GOAL ? 'Klart idag' : 'Idag ' + n + '/' + GOAL) + '</span></div>';
  }
  function updateRing() { const r = document.querySelector('.pl-today'); if (r) r.outerHTML = ringHTML(load().n); }
  function stripHTML() {
    const st = root.MOSmart ? root.MOSmart.STORIES : [], s = load();
    return '<div class="pl-strip" role="list" aria-label="Plugga smart – korta tips">' + ringHTML(s.n)
      + st.map(x => '<a role="listitem" class="pl-bubble' + (s.seen.includes(x.id) ? ' pl-seen' : '') + '" href="smart/#' + x.id + '">'
        + '<span class="pl-ring"><span class="pl-face" style="background:linear-gradient(145deg,' + x.a + ',' + x.b + ')" aria-hidden="true">' + x.icon + '</span></span>'
        + '<span>' + x.title + '</span></a>').join('') + '</div>';
  }

  function sheet() {
    if (document.querySelector('.pl-sheet-bg')) return;
    const prev = document.activeElement;
    const bg = document.createElement('div'); bg.className = 'pl-sheet-bg';
    bg.innerHTML = '<section class="pl-sheet" role="dialog" aria-modal="true" aria-labelledby="pl-stuck-h">'
      + '<h2 id="pl-stuck-h">Fastnat? Kör loopen.</h2><p class="pl-sub">Fyra steg. Inget facit – bara ett sätt att tänka.</p>'
      + '<ol class="pl-steps">'
      + '<li><b class="pl-n">1</b><div><strong>Vad frågas?</strong><span>Läs sista meningen igen. Säg frågan med egna ord.</span></div></li>'
      + '<li><b class="pl-n">2</b><div><strong>Vad vet du?</strong><span>Skriv upp tal och enheter. Allt du vet räknas.</span></div></li>'
      + '<li><b class="pl-n">3</b><div><strong>Rita eller testa</strong><span>Gör en skiss, eller prova med enkla tal först.</span></div></li>'
      + '<li><b class="pl-n">4</b><div><strong>Är det rimligt?</strong><span>Jämför med verkligheten. Konstigt svar? Räkna om ett steg.</span></div></li>'
      + '</ol><button type="button" class="pl-close">Okej, jag kör</button><a class="pl-more" href="smart/#fastnat">Fler tips i Plugga smart</a></section>';
    const close = () => { bg.remove(); window.removeEventListener('keydown', esc, true); prev && prev.focus && prev.focus(); };
    const esc = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
    bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('.pl-close')) close(); });
    window.addEventListener('keydown', esc, true);
    document.body.appendChild(bg); bg.querySelector('.pl-close').focus();
  }

  function decorate() {
    const land = document.querySelector('.ux-landing');
    if (land && !land.querySelector('.pl-strip')) {
      const intro = land.querySelector('.ux-tiles');
      if (intro) intro.insertAdjacentHTML('afterend', stripHTML());
    }
    const hint = document.querySelector('[data-a="hint"],[data-a="showsol"]');
    if (hint && !hint.parentElement.querySelector('.pl-stuck')) {
      hint.insertAdjacentHTML('afterend', '<button type="button" class="btn sm ghost pl-stuck" data-pl="stuck">Fastnat?</button>');
    }
  }
  function start() {
    const app = document.getElementById('app'); if (!app) return;
    decorate();
    new MutationObserver(decorate).observe(app, { childList: true, subtree: true });
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-pl="stuck"]')) sheet(); });
    root.addEventListener('mo:answer', onAnswer);
  }
  root.MOPlay = Object.freeze({ load, ringHTML, _burst: burst, _toast: toast, GOAL });
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
