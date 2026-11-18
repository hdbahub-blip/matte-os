/* Matte OS · Netflix-style profile chooser. UI-only over existing school/guest identities.
   Never mixes guest storage with school progress or creates cloud accounts. */
(function (root) {
  'use strict';
  const escape = value => String(value == null ? '' : value)
    .replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const jester = '<svg viewBox="0 0 72 72" aria-hidden="true" focusable="false"><path d="M13 49C9 34 13 24 22 27c4 1 8 9 14 18 4-16 12-31 21-26 7 4 2 17-5 30-12-6-26-6-39 0Z" fill="currentColor" opacity=".83"/><circle cx="12" cy="26" r="5" fill="currentColor"/><circle cx="59" cy="17" r="5" fill="currentColor"/><path d="M14 51c14-9 29-8 40 0" stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none"/></svg>';

  function gradeCard(id, active) {
    const core = root.MO_CORE && root.MO_CORE.profiles && root.MO_CORE.profiles[id];
    const engine = root.MOEngine;
    if (!core || !engine) return '';
    const name = (engine.prof(id).name || '').trim() || core.label;
    const is9 = id === 'grade9', selected = active === id;
    const desc = is9 ? 'Tal · Geometri · Procent' : 'Tal · Geometri · Algebra';
    return '<button type="button" class="pc-card pc-grade ' + (is9 ? 'pc-grade9' : 'pc-grade8')
      + (selected ? ' pc-current' : '') + '" data-a="pickprofile" data-p="' + id + '"'
      + (selected ? ' aria-current="true"' : '')
      + ' aria-label="Välj ' + escape(name) + '">'
      + '<span class="pc-spark" aria-hidden="true">' + (is9 ? 'π' : '∠') + '</span>'
      + '<span class="pc-avatar" aria-hidden="true">' + (is9 ? 'Å9' : 'Å8') + '</span>'
      + '<span class="pc-name">' + escape(name) + '</span>'
      + '<span class="pc-sub">' + escape(desc) + '</span>'
      + (selected ? '<span class="pc-picked" aria-label="Nu vald">✓</span>' : '')
      + '</button>';
  }

  function guestCard(g, i) {
    const allowed = ['emerald', 'plum', 'teal', 'champagne'];
    const tone = allowed.includes(g.theme) ? g.theme : 'emerald';
    return '<a class="pc-card pc-guest pc-' + tone
      + '" href="tillsammans/?guest=' + encodeURIComponent(g.id) + '" aria-label="Öppna ' + escape(g.name) + '">'
      + '<span class="pc-spark" aria-hidden="true">' + (i % 2 ? '✧' : '✦') + '</span>'
      + '<span class="pc-avatar pc-jester" aria-hidden="true">' + jester + '</span>'
      + '<span class="pc-name">' + escape(g.name) + '</span>'
      + '<span class="pc-sub">Valfri profil · gäst</span></a>';
  }

  function overviewCard() {
    return '<a class="pc-card pc-parent" href="foralder/" aria-label="Öppna Min översikt för årskurs 8 och 9">'
      + '<span class="pc-spark" aria-hidden="true">❧</span>'
      + '<span class="pc-avatar pc-monogram" aria-hidden="true">M</span>'
      + '<span class="pc-name">Min översikt</span>'
      + '<span class="pc-sub">Åk 8 och 9</span></a>';
  }

  function render(opts) {
    const auth=root.MO_STUDY?.profile?.()||root.MO_STUDY?.offlineProfile?.();
    if(auth?.role==='learner'){
      const grade=auth.grade==='grade8'?'Årskurs 8':'Årskurs 9';
      return '<section class="pc-chooser"><div class="pc-heading"><h2 id="pc-title">Min studieprofil</h2><p>Du är inloggad i '+grade+'. Här visas bara din egen lärmiljö.</p></div><div class="pc-current-profile"><strong>'+grade+'</strong><span>Din privata lärmiljö</span></div><a class="btn" href="study/">Mitt konto och synk</a></section>';
    }
    const active = opts && opts.active;
    const closable = !!(opts && opts.closable);
    const store = root.MOTogether;
    const guests = store ? store.load().guests : [];
    const limit = store ? store.GUEST_LIMIT : 0;
    const cards = gradeCard('grade9', active) + gradeCard('grade8', active)
      + guests.map(guestCard).join('') + overviewCard();
    return '<section class="pc-chooser">'
      + '<div class="pc-heading"><div><span class="pc-kicker">MATTE OS · VÄLJ DIN VÄG</span>'
      + '<h2 id="pc-title">Vem pluggar?</h2><p>Tryck på din profil och kör igång.</p></div>'
      + (closable ? '<button class="pc-close" type="button" data-a="closesheet" aria-label="Stäng profilväljaren">×</button>' : '')
      + '</div><div class="pc-grid" role="group" aria-label="Tillgängliga profiler">'
      + cards + '</div>'
      + '<div class="pc-controls"><button class="pc-manage" type="button" data-a="profilemanage">'
      + '<span aria-hidden="true">✎</span><span><strong>Hantera profiler</strong><small>Byt namn och färger</small></span></button>'
      + '<button class="pc-add" type="button" data-a="profilenew"' + (guests.length >= limit ? ' disabled' : '')
      + '><span aria-hidden="true">＋</span> Ny profil</button></div>'
      + '<a class="pc-dropin" href="tillsammans/?dropin=1"><span class="pc-dropin-spark" aria-hidden="true">✦</span><span><strong>Hoppa in som Joker</strong><small>Utan konto, profil eller sparad historik</small></span><span aria-hidden="true">›</span></a>'
      + '<p class="pc-footnote">Sparade Jokrar är valfria. Engångs-Jokrar lämnar ingen permanent resultatstatistik. Åk 8 och 9 behåller sina egna framsteg.</p>'
      + '</section>';
  }

  function manage() {
    const engine = root.MOEngine;
    const store = root.MOTogether;
    const nameField = id => {
      const label = id === 'grade9' ? 'Åk 9' : 'Åk 8';
      const val = engine ? engine.prof(id).name : '';
      return '<div class="pc-name-field"><label for="pc-name-' + id + '">' + label + ' · namn</label>'
        + '<div><input id="pc-name-' + id + '" type="text" maxlength="30" autocomplete="off"'
        + ' placeholder="' + label + '" value="' + escape(val || '') + '">'
        + '<button type="button" data-a="profilenamesave" data-p="' + id + '">Spara</button></div></div>';
    };
    return '<section class="pc-chooser pc-chooser-manage"><div class="pc-heading">'
      + '<div><span class="pc-kicker">PROFILER · INSTÄLLNINGAR</span><h2 id="pc-title">Hantera profiler</h2>'
      + '<p>Ändra namn utan att ändra sparade svar.</p></div>'
      + '<button class="pc-close" type="button" data-a="closesheet" aria-label="Stäng">×</button></div>'
      + '<div class="pc-manage-fields">' + nameField('grade9') + nameField('grade8') + '</div>'
      + '<a class="pc-manage-link" href="tillsammans/?profiles=1">'
      + '<span aria-hidden="true">✦</span><span><strong>Redigera Jokrar</strong><small>Namn · färg · läge · gästbackup</small></span><span aria-hidden="true">›</span></a>'
      + '<div class="pc-minor-links"><a href="study/">Konto och synk</a><a href="studera/">Gemensamma pass</a>'
      + '<a href="#/installningar" data-a="profile-settings">Skolinställningar</a></div>'
      + '<button class="pc-return" type="button" data-a="profileback">← Till profilvalet</button>'
      + (store && store.status().storageOk ? '' : '<p class="pc-warning" role="alert">Lokal lagring är inte tillgänglig. Ändringar kanske inte sparas.</p>')
      + '</section>';
  }

  root.MOProfileChooser = Object.freeze({ render, manage });
})(typeof window !== 'undefined' ? window : globalThis);
