/* Matte OS · wayfinding. One colour per area so you always know where you are:
   Matte = violett, Svenska = blå, Engelska = röd, Spela = grön, Plugga smart = lila.
   Sets <html data-subject>, updates on navigation. Pure UI, stores nothing. */
(function (root) {
  'use strict';
  const LOOK = 'matteos.appearance.v1';
  function subject(loc) {
    const p = loc.pathname, h = decodeURIComponent(loc.hash || ''), q = loc.search || '';
    if (/\/smart\//.test(p)) return 'smart';
    if (/\/tillsammans\//.test(p)) return 'play';
    if (/debatt\.html$/.test(p)) return /lang=en/.test(q) ? 'en' : 'sv';
    if (/np-muntligt\.html$/.test(p)) return 'sv';
    if (/\/lara\//.test(p)) {
      if (/^#\/(studio\/sv|sv|svenska)/.test(h)) return 'sv';
      if (/^#\/(studio\/en|en|engelska)/.test(h)) return 'en';
      if (/^#\/(spel|ordlek|games)/.test(h)) return 'play';
      if (/^#\/verkstad\/sv/.test(h)) return 'sv';
      if (/^#\/verkstad\/en/.test(h)) return 'en';
      return 'home';
    }
    if (/\/(study|foralder|studera)\//.test(p)) return 'account';
    if (/\/(prov|tabell|affischer)\//.test(p)) return 'math';
    if (h === '' || h === '#' || h === '#/') return 'home';
    if (/^#\/installningar/.test(h)) return 'account';
    if (/^#\/(cup)/.test(h)) return 'play';
    return 'math';
  }
  function grade() {
    const de = document.documentElement;
    if (de.dataset.theme === 'navy' || de.dataset.profile === 'grade8' || de.dataset.examGrade === 'grade8') return 'grade8';
    if (de.dataset.theme === 'burgundy' || de.dataset.profile === 'grade9' || de.dataset.examGrade === 'grade9') return 'grade9';
    try { const a = JSON.parse(localStorage.getItem('matteos.v5') || '{}').active; if (a === 'grade8' || a === 'grade9') return a; } catch (_) {}
    return 'grade9';
  }
  const ICONS = {
    home: '<path d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z"/>',
    math: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 8.6h3M9.5 7.1v3M13.2 8.6h2.8M8.1 13.6l2.8 2.8M10.9 13.6l-2.8 2.8M13.2 14.2h2.8M13.2 16.2h2.8"/>',
    sv: '<path d="M12 6.5C10.2 5.2 7.6 4.7 4.5 5v13c3.1-.3 5.7.2 7.5 1.5 1.8-1.3 4.4-1.8 7.5-1.5V5c-3.1-.3-5.7.2-7.5 1.5zM12 6.5v13"/>',
    en: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.3 2.2 3.4 4.9 3.4 8S14.3 17.8 12 20c-2.3-2.2-3.4-4.9-3.4-8S9.7 6.2 12 4z"/>',
    play: '<path d="M7.5 8.5h9a4 4 0 0 1 3.9 4.9l-.8 3.4a2.2 2.2 0 0 1-3.8 1l-1.7-2H9.9l-1.7 2a2.2 2.2 0 0 1-3.8-1l-.8-3.4a4 4 0 0 1 3.9-4.9z"/><path d="M8.5 11.2v2.6M7.2 12.5h2.6M15.6 12h.01M17.2 13.6h.01"/>',
    smart: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>'
  };
  const svg = k => '<svg class="mo-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[k] + '</svg>';
  const LABEL = { Start: 'home', Matte: 'math', Svenska: 'sv', Engelska: 'en', English: 'en', Spela: 'play' };
  function decorate() {
    document.querySelectorAll('nav.nav a, nav.nav button, nav.bottom a, nav.bottom button').forEach(el => {
      if (el.querySelector('.mo-ic')) return;
      const txt = (el.textContent || '').trim(), w = Object.keys(LABEL).find(x => txt.endsWith(x)), k = w && LABEL[w];
      const slot = el.querySelector('.ux-nav-icon,[aria-hidden="true"]');
      if (k && slot) slot.innerHTML = svg(k);
    });
    const tiles = { 'ux-math': 'math', 'ux-swedish': 'sv', 'ux-english': 'en', 'ux-play': 'play' };
    document.querySelectorAll('.ux-tile .ux-tile-mark').forEach(m => {
      if (m.querySelector('.mo-ic')) return;
      const t = Object.keys(tiles).find(c => m.parentElement.classList.contains(c));
      if (t) m.innerHTML = svg(tiles[t]);
    });
  }
  function apply() {
    const de = document.documentElement, s = subject(root.location), g = grade();
    if (de.dataset.palette !== g) de.dataset.palette = g;
    if (de.dataset.subject !== s) de.dataset.subject = s;
    // Pages with their own night palette keep their own label colours.
    if (/(np-muntligt|debatt)\.html$/.test(root.location.pathname)) de.dataset.wfOwn = '1';
    // Pages without their own appearance switch follow the app's choice.
    if (/\/(study|studera)\//.test(root.location.pathname) && !de.dataset.mode) {
      try { if (localStorage.getItem(LOOK) === 'dark') de.dataset.mode = 'dark'; } catch (_) {}
    }
  }
  root.MOWayfind = Object.freeze({ subject, apply, grade, svg });
  apply();
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-profile', 'data-exam-grade'] });
  function watch() { decorate(); new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else if (document.body) watch();
  root.addEventListener('hashchange', apply);
  root.addEventListener('popstate', apply);
})(typeof window !== 'undefined' ? window : globalThis);
