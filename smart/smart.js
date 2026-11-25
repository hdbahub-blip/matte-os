/* Plugga smart · story player. Tap right = next, left = back, swipe, arrow keys, Esc closes.
   Only stores which stories were seen (ids) in matteos.play.v1. */
(function () {
  'use strict';
  const root = document.getElementById('smart');
  const ST = (window.MOSmart && window.MOSmart.STORIES) || [];
  const KEY = 'matteos.play.v1';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  try { const m = localStorage.getItem('matteos.appearance.v1'); if (m === 'dark' || m === 'light') document.documentElement.dataset.mode = m; } catch (_) {}
  function seen() { try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); return Array.isArray(s.seen) ? s.seen : []; } catch (_) { return []; } }
  function markSeen(id) {
    try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); const list = Array.isArray(s.seen) ? s.seen : [];
      if (!list.includes(id)) { list.push(id); s.seen = list.slice(-40); localStorage.setItem(KEY, JSON.stringify(s)); } } catch (_) {}
  }
  const TONES = ['math', 'sv', 'en', 'play'];
  let si = -1, ci = 0, timer = null, lastFocus = null;

  function home() {
    stopTimer(); si = -1;
    const s = seen();
    root.innerHTML = '<main class="sm-home" id="main"><div class="sm-top"><a class="sm-back" href="../">‹ Matte OS</a></div>'
      + '<header class="sm-hero"><p class="sm-kicker">Plugga smart</p><h1>Hjärnhacks som <span>funkar</span>.</h1>'
      + '<p>Korta tips. En minut var. Testa direkt.</p></header>'
      + '<div class="sm-grid">' + ST.map((x, i) => '<button type="button" class="sm-tile" data-s="' + i + '" style="--a:var(--g-' + TONES[i % 4] + '-a,' + x.a + ');--b:var(--g-' + TONES[i % 4] + '-b,' + x.b + ');--i:' + i + '">'
        + (s.includes(x.id) ? '' : '<span class="sm-new">NY</span>')
        + '<span class="sm-ic" aria-hidden="true">' + esc(x.icon) + '</span><span><strong>' + esc(x.title) + '</strong><small>' + x.cards.length + ' kort · ' + esc(x.cards[0].big) + '</small></span></button>').join('')
      + '</div><p class="sm-note">Tipsen bygger på forskning om hur minnet fungerar: testa dig själv, sprid ut, blanda, förklara och sov. Inget sparas utom vilka tips du har sett.</p></main>';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  function player() {
    const x = ST[si], c = x.cards[ci];
    const bars = x.cards.map((_, i) => '<i class="' + (i < ci ? 'done' : i === ci ? 'now' : '') + '"><b></b></i>').join('');
    root.innerHTML = '<section class="sm-player" role="dialog" aria-modal="true" aria-label="' + esc(x.title) + '" style="--a:var(--g-' + TONES[si % 4] + '-a,' + x.a + ');--b:var(--g-' + TONES[si % 4] + '-b,' + x.b + ')">'
      + '<div class="sm-bars" aria-hidden="true">' + bars + '</div>'
      + '<div class="sm-head"><span class="sm-ic" aria-hidden="true">' + esc(x.icon) + '</span><strong>' + esc(x.title) + '</strong><small>· Plugga smart</small>'
      + '<button type="button" class="sm-x" data-a="close" aria-label="Stäng">×</button></div>'
      + '<button type="button" class="sm-tap prev" data-a="prev" tabindex="-1" aria-hidden="true"></button><button type="button" class="sm-tap next" data-a="next" tabindex="-1" aria-hidden="true"></button><div class="sm-stage">'
      + '<article class="sm-card" aria-live="polite"><h1 class="sm-big">' + esc(c.big) + '</h1><p class="sm-small">' + esc(c.small) + '</p>'
      + (c.cta ? '<a class="sm-cta" href="' + esc(c.cta.href) + '">' + esc(c.cta.label) + ' →</a>' : '')
      + (c.timer ? timerHTML() : '') + '</article></div>'
      + '<div class="sm-nav"><button type="button" data-a="prev" aria-label="Föregående" ' + (si === 0 && ci === 0 ? 'disabled' : '') + '>‹</button>'
      + '<span>' + (ci + 1) + ' / ' + x.cards.length + '</span><button type="button" data-a="next" aria-label="Nästa">›</button></div></section>';
    if (location.hash !== '#' + x.id) history.replaceState(null, '', '#' + x.id);
    if (ci === x.cards.length - 1) markSeen(x.id);
    const f = root.querySelector('.sm-nav [data-a="next"]'); if (f) f.focus({ preventScroll: true });
  }

  function timerHTML() {
    if (timer) return clockHTML();
    return '<div class="sm-timer" role="group" aria-label="Välj fokustid">' + [10, 15, 25].map((m, i) => '<button type="button" class="' + (i === 0 ? 'sm-go' : '') + '" data-a="timer" data-m="' + m + '">' + m + ' min</button>').join('') + '</div>';
  }
  function clockHTML() {
    const left = Math.max(0, timer.end - Date.now()), c = 2 * Math.PI * 52, f = left / timer.total;
    const mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60;
    return '<div class="sm-clock"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="t" cx="60" cy="60" r="52" fill="none" stroke-width="10"/>'
      + '<circle class="f" cx="60" cy="60" r="52" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - f)).toFixed(1) + '"/></svg>'
      + '<div><output aria-live="off">' + mm + ':' + String(ss).padStart(2, '0') + '</output><small>' + (left ? 'Fokus. Mobilen bort.' : 'Klart! Ta 5 min paus.') + '</small>'
      + '<button type="button" class="sm-cta" style="min-height:44px;margin-top:10px" data-a="stoptimer">' + (left ? 'Avbryt' : 'Ny timer') + '</button></div></div>';
  }
  function stopTimer() { if (timer) { clearInterval(timer.id); timer = null; } }
  function tick() {
    const el = root.querySelector('.sm-clock'); if (!timer) return;
    if (el) el.outerHTML = clockHTML();
    if (Date.now() >= timer.end) { clearInterval(timer.id); timer.id = null; try { navigator.vibrate && navigator.vibrate([120, 80, 120]); } catch (_) {} }
  }

  function open(i, card) { lastFocus = document.activeElement; si = i; ci = card || 0; player(); }
  function next() {
    const x = ST[si];
    if (ci < x.cards.length - 1) { ci++; player(); return; }
    if (si < ST.length - 1) { si++; ci = 0; player(); return; }
    home();
  }
  function prev() {
    if (ci > 0) { ci--; player(); return; }
    if (si > 0) { si--; ci = ST[si].cards.length - 1; player(); }
  }
  function close() {
    const from = si; home();
    const t = root.querySelector('[data-s="' + from + '"]'); if (t) t.focus();
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-a],[data-s]'); if (!t) return;
    if (t.dataset.s != null) { open(Number(t.dataset.s)); return; }
    const a = t.dataset.a;
    if (a === 'next') next(); else if (a === 'prev') prev(); else if (a === 'close') close();
    else if (a === 'timer') { const m = Number(t.dataset.m) || 10; stopTimer(); timer = { total: m * 60000, end: Date.now() + m * 60000 }; timer.id = setInterval(tick, 1000); player(); }
    else if (a === 'stoptimer') { stopTimer(); player(); }
  });
  document.addEventListener('keydown', e => {
    if (si < 0) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  let sx = null, sy = null;
  root.addEventListener('touchstart', e => { if (si < 0) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  root.addEventListener('touchend', e => {
    if (si < 0 || sx == null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (dy > 90 && Math.abs(dx) < 60) close();
    else if (Math.abs(dx) > 60 && Math.abs(dy) < 60) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  function route() {
    const id = location.hash.replace(/^#/, ''), i = ST.findIndex(x => x.id === id);
    if (i >= 0) open(i); else home();
  }
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (!ST[si] || ST[si].id !== id) route(); });
  route();
  window.MOSmartPlayer = { open, next, prev, close };
})();
