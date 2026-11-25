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
  function apply() {
    const de = document.documentElement, s = subject(root.location);
    if (de.dataset.subject !== s) de.dataset.subject = s;
    // Pages without their own appearance switch follow the app's choice.
    if (/\/(study|studera)\//.test(root.location.pathname) && !de.dataset.mode) {
      try { if (localStorage.getItem(LOOK) === 'dark') de.dataset.mode = 'dark'; } catch (_) {}
    }
  }
  root.MOWayfind = Object.freeze({ subject, apply });
  apply();
  root.addEventListener('hashchange', apply);
  root.addEventListener('popstate', apply);
})(typeof window !== 'undefined' ? window : globalThis);
