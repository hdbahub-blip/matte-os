/* Matte OS v5 — skolplan (operativ ryggrad), profiler och restprov.
   Inga personuppgifter här: namn sparas bara lokalt på enheten. */
(function (root) {
  'use strict';
  const CORE = {
    version: '5.5.2',
    build: '2026-10-31',
    year: 2026,
    profiles: {
      grade9: {
        id: 'grade9', label: 'Åk 9', short: 'Å9', theme: 'burgundy',
        chapters: [
          { id: 's9-tal', name: 'Tal', full: 'Kapitel 1 · Tal', examWeek: 39 },
          { id: 's9-geo', name: 'Geometri', full: 'Kapitel 2 · Geometri', examWeek: 46 },
          { id: 's9-procent', name: 'Procent', full: 'Kapitel 4 · Procent', examWeek: 50 }
        ],
        rests: [{ id: 'rest-s9-tal', title: 'Restprov · Tal', chapter: 's9-tal', originalWeek: 39 }],
        plan: [
          { w: 34, r: '17–23 aug', a: 'Tal', d: 'Stora tal, namn på stora/små tal, prefix, potensform, räkna med potensform' },
          { w: 35, r: '24–30 aug', a: 'Tal', d: 'Tiopotenser, grundpotensform, små tal och prefix, räkna med grundpotensform' },
          { w: 36, r: '31 aug–6 sep', a: 'Tal', d: 'Tal i kvadrat och kvadratrot' },
          { w: 37, r: '7–13 sep', a: 'Tal', d: 'Talmängder, diagnos, mer om stora och små tal' },
          { w: 38, r: '14–20 sep', a: 'Tal', d: 'Mer om kvadratrötter, division med kvadratrötter, andragradsekvationer, mer om talmängder, repetition inför provet' },
          { w: 39, r: '21–27 sep', a: 'Prov · Tal', d: 'Kapitelprov Tal', exam: 's9-tal' },
          { w: 40, r: '28 sep–4 okt', a: 'Geometri', d: 'Vinklar, Pythagoras sats' },
          { w: 41, r: '5–11 okt', a: 'Geometri', d: 'Skala (längd, area, volym), likformighet' },
          { w: 42, r: '12–18 okt', a: 'Geometri', d: 'Likformighet, symmetri, diagnos' },
          { w: 43, r: '19–25 okt', a: 'Geometri', d: 'Mer om vinklar, mer om Pythagoras sats, rymddiagonal' },
          { w: 44, r: '26 okt–1 nov', a: 'Höstlov', d: 'Lov – bra läge för repetition och restprov', off: true },
          { w: 45, r: '2–8 nov', a: 'Geometri', d: 'Mer om skala och likformighet, repetition inför provet' },
          { w: 46, r: '9–15 nov', a: 'Prov · Geometri', d: 'Kapitelprov Geometri', exam: 's9-geo' },
          { w: 47, r: '16–22 nov', a: 'Procent', d: 'Andelen, delen, det hela och förändringsfaktor' },
          { w: 48, r: '23–29 nov', a: 'Procent', d: 'Upprepad förändring, procentenheter, diagnos' },
          { w: 49, r: '30 nov–6 dec', a: 'Procent', d: 'Problemlösning med procent, repetition' },
          { w: 50, r: '7–13 dec', a: 'Prov · Procent', d: 'Kapitelprov Procent', exam: 's9-procent' },
          { w: 51, r: '14–20 dec', a: 'Repetition', d: 'Repetition och komplettering' }
        ]
      },
      grade8: {
        id: 'grade8', label: 'Åk 8', short: 'Å8', theme: 'navy',
        chapters: [
          { id: 'f8-tal', name: 'Tal', full: 'Kapitel 1 · Tal', examWeek: 40 },
          { id: 'f8-geo', name: 'Geometri', full: 'Kapitel 2 · Geometri', examWeek: 46 },
          { id: 'f8-alg', name: 'Algebra', full: 'Kapitel 3 · Algebra', examWeek: 50 }
        ],
        rests: [{ id: 'rest-f8-tal', title: 'Restprov · Tal', chapter: 'f8-tal', originalWeek: 40 }],
        plan: [
          { w: 34, r: '17–23 aug', a: 'Tal', d: 'Bråk och decimalform, addition/subtraktion av bråk, multiplikation av bråk' },
          { w: 35, r: '24–30 aug', a: 'Tal', d: 'Multiplikation och division med bråk, division med bråk, multiplikation av decimaltal' },
          { w: 36, r: '31 aug–6 sep', a: 'Tal', d: 'Multiplikation/division i decimalform, tal i potensform (tiopotenser, prefix)' },
          { w: 37, r: '7–13 sep', a: 'Tal', d: 'Negativa tal, räkneordning' },
          { w: 38, r: '14–20 sep', a: 'Tal', d: 'Diagnos, mer om bråk, multiplikation med bråk och decimaltal, räkneordning' },
          { w: 39, r: '21–27 sep', a: 'Tal', d: 'Primtal och faktorisering, förkorta bråk, mer om division med bråk, mer om negativa tal, repetition' },
          { w: 40, r: '28 sep–4 okt', a: 'Prov · Tal', d: 'Kapitelprov Tal. Start geometri: längd och enheter', exam: 'f8-tal' },
          { w: 41, r: '5–11 okt', a: 'Geometri', d: 'Cirkelns omkrets, area och areaenheter, area av stora områden, cirkelns area, cirkelbåge och cirkelsektor' },
          { w: 42, r: '12–18 okt', a: 'Geometri', d: 'Volymenheter, cylinder, pyramid, kon och klot' },
          { w: 43, r: '19–25 okt', a: 'Geometri', d: 'Mer om omkrets, diagnos' },
          { w: 44, r: '26 okt–1 nov', a: 'Höstlov', d: 'Lov – bra läge för repetition och restprov', off: true },
          { w: 45, r: '2–8 nov', a: 'Geometri', d: 'Mer om area (trapets, sammansatta figurer), befolkningstäthet, mer om klotets volym och begränsningsyta, repetition' },
          { w: 46, r: '9–15 nov', a: 'Prov · Geometri', d: 'Kapitelprov Geometri', exam: 'f8-geo' },
          { w: 47, r: '16–22 nov', a: 'Algebra', d: 'Uttryck med variabler, ekvationer, x i båda leden, addition/subtraktion med parenteser' },
          { w: 48, r: '23–29 nov', a: 'Algebra', d: 'Multiplikation med parenteser, problemlösning' },
          { w: 49, r: '30 nov–6 dec', a: 'Algebra', d: 'Diagnos, mer om uttryck, ekvationslösning och parenteser, formler, problemlösning' },
          { w: 50, r: '7–13 dec', a: 'Prov · Algebra', d: 'Konjugatregeln, faktorisering och kapitelprov', exam: 'f8-alg' },
          { w: 51, r: '14–20 dec', a: 'Repetition', d: 'Repetition och komplettering' }
        ]
      }
    }
  };
  root.MO_CORE = CORE;
  if (typeof module !== 'undefined' && module.exports) module.exports = CORE;
})(typeof window !== 'undefined' ? window : globalThis);
