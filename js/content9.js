/* Matte OS v5 — innehåll åk 9 (Tal · Geometri · Procent).
   Varje uppgift har explicit "given" och "find" (ingen gissande textanalys),
   "calc" = oberoende beräkning som QA-testet kontrollerar mot facit. */
(function (root) {
  'use strict';
  const S = [];

  /* ================= KAPITEL 1 · TAL ================= */
  S.push({
    id: 's9-prefix', ch: 's9-tal', w: [34, 35], title: 'Prefix', sub: 'kilo, mega, milli, mikro …',
    idea: 'Ett prefix är en förkortning för en tiopotens. **k** (kilo) betyder tusen, **m** (milli) betyder en tusendel. Själva mängden ändras inte – bara hur du skriver den.',
    anchor: 'Jämför enheterna: 1 km = 1 000 m, 1 m = 100 cm och 1 m = 1 000 mm. Till mindre enhet blir talet större.',
    cue: ['Du ser k, M, G, m, µ eller n framför en enhet.', 'Frågan ber dig skriva samma sak med ett annat prefix.'],
    cvis: { t: 'prefix', from: 'k', to: '', note: '4,2 km = 4,2 · 1000 m = 4 200 m' },
    f: {
      name: 'Prefix', main: 'k=10^3 \\quad M=10^6 \\quad G=10^9', when: 'När en enhet har ett prefix och du ska byta till en annan storlek.',
      sym: [['k (kilo)', '1 000'], ['h (hekto)', '100'], ['d (deci)', '0,1'], ['c (centi)', '0,01'], ['M (mega)', '1 000 000'], ['G (giga)', '10⁹'], ['m (milli)', '0,001'], ['µ (mikro)', '10⁻⁶'], ['n (nano)', '10⁻⁹']],
      forms: [['Kilometer till meter', '3{,}6 \\cdot 1000 = 3600'], ['Centimeter till meter', '450 / 100 = 4{,}5']],
      ex: '$3{,}6$ km $= 3{,}6 \\cdot 1000 = 3600$ m', trap: 'Byter du till en mindre enhet ska talet bli **större** – inte mindre.'
    },
    h1: 'Det här är ett prefixbyte. Vilket prefix har du – och vilket ska du till?',
    ex: {
      q: 'Skriv 4,2 km i meter.', vis: { t: 'prefix', from: 'k', to: '' },
      given: ['4,2 km'], find: 'samma längd i meter', rule: 'k=1000',
      steps: [['Vad betyder k?', 'kilo $= 1000$'], ['Blir talet större eller mindre när enheten blir mindre?', 'Större – fler meter än kilometer.'], ['Räkna', '$4{,}2 \\cdot 1000 = 4200$']],
      ans: '4 200 m'
    },
    g: {
      q: 'Skriv 0,004 m i millimeter.', vis: { t: 'prefix', from: '', to: 'm' }, given: ['0,004 m'], find: 'samma längd i mm',
      opts: ['0{,}004 \\cdot 1000', '0{,}004 / 1000', '0{,}004 \\cdot 100'], oc: 0, why: 'mm är en mindre enhet, så talet ska bli 1000 gånger större.',
      type: 'num', a: 4, u: 'mm', calc: '0.004*1000', unitSkill: true, start: '$0{,}004 \\cdot 1000 = ?$', sol: ['1 m = 1000 mm', '$0{,}004 \\cdot 1000 = 4$ mm']
    },
    p: [
      { lv: 'A', q: 'Skriv 3,6 km i meter.', vis: { t: 'prefix', from: 'k', to: '' }, type: 'num', a: 3600, u: 'm', calc: '3.6*1000', unitSkill: true, given: ['3,6 km'], find: 'längden i m', start: '$3{,}6 \\cdot 1000$', sol: ['kilo = 1000', '$3{,}6 \\cdot 1000 = 3600$ m'] },
      { lv: 'B', q: 'En fil är 2,5 MB. Hur många kB är det? (1 MB = 1000 kB)', vis: { t: 'prefix', from: 'M', to: 'k' }, type: 'num', a: 2500, u: 'kB', calc: '2.5*1000', unitSkill: true, given: ['2,5 MB', '1 MB = 1000 kB'], find: 'storleken i kB', start: '$2{,}5 \\cdot 1000$', sol: ['Från M till k är ett steg = 1000', '$2{,}5 \\cdot 1000 = 2500$ kB'] },
      { lv: 'C', q: 'Ett vattenglas rymmer 250 ml. Hur många liter är det?', vis: { t: 'prefix', from: 'm', to: '' }, type: 'num', a: 0.25, u: 'l', calc: '250/1000', unitSkill: true, given: ['250 ml'], find: 'volymen i liter', start: 'Större enhet → dividera: $250 / 1000$', sol: ['Liter är 1000 gånger större än ml', '$250 / 1000 = 0{,}25$ l'], traps: [[250000, 'Du multiplicerade. Liter är en STÖRRE enhet, så talet ska bli mindre.']] },
      { lv: 'D', q: 'Vilket prefix motsvarar 10⁶?', type: 'choice', opts: ['milli', 'kilo', 'mega', 'giga'], a: 'mega', traps: [['kilo', 'kilo är 10³ (tusen). 10⁶ är en miljon.'], ['giga', 'giga är 10⁹ (miljard).']], sol: ['k = 10³, M = 10⁶, G = 10⁹', 'Svar: mega'] },
      { lv: 'F', q: 'En bakterie är 2 µm lång. Skriv längden i meter i grundpotensform: ? · 10ⁿ m', type: 'sci', a: [2, -6], given: ['2 µm', 'µ = 10⁻⁶'], find: 'längden i m som a · 10ⁿ', start: 'µ betyder $10^{-6}$', sol: ['mikro = $10^{-6}$', '$2 \\text{ µm} = 2 \\cdot 10^{-6}$ m'] }
    ],
    kw: 'prefix kilo mega giga milli mikro nano km mm byta enhet stora tal små tal'
  });

  S.push({
    id: 's9-scientific', ch: 's9-tal', w: [34, 35], title: 'Grundpotensform', sub: 'a · 10ⁿ – stora och små tal',
    idea: 'Grundpotensform skriver ett tal som **ett tal mellan 1 och 10** gånger en tiopotens. Exponenten säger hur många steg decimaltecknet flyttades.',
    anchor: 'Stort tal → positiv exponent. Litet tal (under 1) → negativ exponent.',
    cue: ['Mycket stora eller mycket små tal.', 'Orden "grundpotensform" eller "tiopotens".'],
    cvis: { t: 'sci', num: '320000', a: '3,2', n: 5 },
    f: {
      name: 'Grundpotensform', main: 'a \\cdot 10^n, \\quad 1 \\le a < 10', when: 'Mycket stora eller små tal, eller när du ska jämföra storleksordningar.',
      sym: [['a', 'tal mellan 1 och 10 (t.ex. 3,2)'], ['n', 'antal steg decimaltecknet flyttas']],
      forms: [['Vanligt tal → grundpotensform', '\\text{flytta komma tills } 1 \\le a < 10'], ['Grundpotensform → vanligt tal', 'n > 0: \\text{ komma } n \\text{ steg höger}']],
      ex: '$320\\,000 = 3{,}2 \\cdot 10^5$', trap: '32 · 10⁴ har rätt värde men är INTE grundpotensform – första talet måste vara under 10.'
    },
    h1: 'Det här handlar om att skriva talet som (tal mellan 1 och 10) · 10ⁿ.',
    ex: {
      q: 'Skriv 320 000 i grundpotensform.', vis: { t: 'sci', num: '320000', a: '3,2', n: 5 },
      given: ['320 000'], find: 'a · 10ⁿ', rule: 'a \\cdot 10^n',
      steps: [['Var ska kommat stå så att talet blir mellan 1 och 10?', 'Efter 3: $3{,}2$'], ['Hur många steg flyttade kommat?', '5 steg åt vänster'], ['Stort tal → positiv exponent', '$3{,}2 \\cdot 10^5$']],
      ans: '3,2 · 10⁵'
    },
    g: {
      q: 'Skriv 0,00072 i grundpotensform.', vis: { t: 'sci', num: '0,00072', a: '7,2', n: -4 }, given: ['0,00072'], find: 'a · 10ⁿ',
      opts: ['7{,}2 \\cdot 10^{-4}', '7{,}2 \\cdot 10^{4}', '72 \\cdot 10^{-5}'], oc: 0, why: 'Talet är mindre än 1 → negativ exponent, och 7,2 ligger mellan 1 och 10.',
      type: 'sci', a: [7.2, -4], start: 'Flytta kommat till efter 7. Räkna stegen.', sol: ['Komma efter 7 → 7,2', '4 steg åt höger → $10^{-4}$']
    },
    p: [
      { lv: 'A', q: 'Skriv 450 000 i grundpotensform.', vis: { t: 'sci', num: '450000', a: '4,5', n: 5 }, type: 'sci', a: [4.5, 5], given: ['450 000'], find: 'a · 10ⁿ', start: 'Kommat efter 4 → 4,5. Räkna stegen.', sol: ['$4{,}5$', '5 steg åt vänster → $4{,}5 \\cdot 10^5$'] },
      { lv: 'B', q: 'Avståndet till månen är ungefär 384 000 km. Skriv det i grundpotensform.', type: 'sci', a: [3.84, 5], given: ['384 000 km'], find: 'a · 10ⁿ', start: 'Kommat efter 3 → 3,84', sol: ['$3{,}84$', '5 steg → $3{,}84 \\cdot 10^5$ km'] },
      { lv: 'C', q: 'Skriv 6,3 · 10³ som vanligt tal.', type: 'num', a: 6300, calc: '6.3*10**3', given: ['6,3 · 10³'], find: 'vanligt tal', start: 'Positiv exponent 3 → flytta kommat 3 steg åt höger.', sol: ['$6{,}3 \\to 63 \\to 630 \\to 6300$'], traps: [[0.0063, 'Positiv exponent betyder ett STORT tal – flytta kommat åt höger.']] },
      { lv: 'C', q: 'Skriv 5 · 10⁻³ som decimaltal.', type: 'num', a: 0.005, calc: '5*10**-3', given: ['5 · 10⁻³'], find: 'decimaltal', start: 'Negativ exponent → litet tal. Flytta kommat 3 steg åt vänster.', sol: ['$5 \\to 0{,}5 \\to 0{,}05 \\to 0{,}005$'], traps: [[5000, 'Negativ exponent ger ett tal mindre än 1.']] },
      { lv: 'F', q: 'Vilket tal är störst?', type: 'choice', opts: ['9,9 · 10⁴', '1,2 · 10⁵', '8 · 10⁻⁶', '99 000'], a: '1,2 · 10⁵', traps: [['9,9 · 10⁴', 'Jämför exponenten först: 10⁵ är tio gånger större än 10⁴.'], ['99 000', '99 000 = 9,9 · 10⁴, mindre än 120 000.']], sol: ['Jämför exponenten först', '$1{,}2 \\cdot 10^5 = 120\\,000$ är störst'] }
    ],
    kw: 'grundpotensform tiopotens potensform stora tal små tal exponent 10 upphöjt'
  });

  S.push({
    id: 's9-powers', ch: 's9-tal', w: [34], title: 'Räkna med potenser', sub: 'samma bas: addera eller subtrahera exponenter',
    idea: 'En potens som $2^3$ betyder $2 \\cdot 2 \\cdot 2$. När du multiplicerar potenser med **samma bas** räknar du bara hur många faktorer det blir totalt.',
    anchor: 'Gånger → plussa exponenterna. Delat → minus. Potens av potens → gånger.',
    cue: ['Samma bas (t.ex. 10 eller 2) med olika exponenter.', 'Potenser som multipliceras, divideras eller står i en parentes med exponent.'],
    cvis: { t: 'powers', base: 2, m: 3, n: 2, op: 'mul' },
    f: {
      name: 'Potenslagar', main: 'a^m \\cdot a^n = a^{m+n}', when: 'Samma bas multipliceras, divideras eller upphöjs igen.',
      sym: [['a', 'basen (samma i båda)'], ['m, n', 'exponenterna = antal faktorer']],
      forms: [['Division', '\\frac{a^m}{a^n} = a^{m-n}'], ['Potens av potens', '(a^m)^n = a^{m \\cdot n}'], ['Nollte potens', 'a^0 = 1']],
      ex: '$10^3 \\cdot 10^4 = 10^7$', trap: 'Multiplicera INTE exponenterna vid $a^m \\cdot a^n$ – du ska addera dem.'
    },
    h1: 'Har potenserna samma bas? Då kan du räkna med exponenterna.',
    ex: {
      q: 'Förenkla 10³ · 10⁴.', vis: { t: 'powers', base: 10, m: 3, n: 4, op: 'mul' }, given: ['10³ · 10⁴'], find: 'en enda potens', rule: 'a^m \\cdot a^n = a^{m+n}',
      steps: [['Samma bas?', 'Ja, båda har bas 10.'], ['Hur många faktorer 10 totalt?', '$3 + 4 = 7$'], ['Svar', '$10^7$']], ans: '10⁷'
    },
    g: {
      q: 'Beräkna 2³ · 2².', vis: { t: 'powers', base: 2, m: 3, n: 2, op: 'mul' }, given: ['2³ · 2²'], find: 'värdet',
      opts: ['2^{3+2}', '2^{3 \\cdot 2}', '4^{5}'], oc: 0, why: 'Samma bas vid multiplikation → addera exponenterna.',
      type: 'num', a: 32, calc: '2**3*2**2', start: '$2^{3+2} = 2^5$', sol: ['$2^5$', '$2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 32$'], traps: [[64, 'Du räknade $2^6$ – exponenterna ska adderas (3 + 2 = 5), inte multipliceras.']]
    },
    p: [
      { lv: 'A', q: 'Beräkna 10⁶ / 10². Svara som vanligt tal.', vis: { t: 'powers', base: 10, m: 6, n: 2, op: 'div' }, type: 'num', a: 10000, calc: '10**6/10**2', given: ['10⁶ / 10²'], find: 'värdet', start: '$10^{6-2}$', sol: ['$10^{6-2} = 10^4$', '$= 10\\,000$'], traps: [[1000, '$10^3$ = 1000. Men 6 − 2 = 4, så svaret är $10^4$.']] },
      { lv: 'B', q: 'Beräkna (3²)².', vis: { t: 'powers', base: 3, m: 2, n: 2, op: 'pow' }, type: 'num', a: 81, calc: '(3**2)**2', given: ['(3²)²'], find: 'värdet', start: '$3^{2 \\cdot 2} = 3^4$', sol: ['Potens av potens → multiplicera: $3^4$', '$3 \\cdot 3 \\cdot 3 \\cdot 3 = 81$'] },
      { lv: 'C', q: '2ˣ · 2³ = 2⁸. Vilket tal är x?', type: 'num', a: 5, calc: '8-3', given: ['2ˣ · 2³ = 2⁸'], find: 'x', start: '$x + 3 = 8$', sol: ['Exponenterna adderas: $x + 3 = 8$', '$x = 5$'] },
      { lv: 'D', q: 'Vilket uttryck är lika med 5⁶?', type: 'choice', opts: ['5² · 5³', '5⁸ / 5²', '(5³)³', '5⁶ · 5⁰ · 5'], a: '5⁸ / 5²', traps: [['5² · 5³', '2 + 3 = 5, alltså 5⁵.'], ['(5³)³', '3 · 3 = 9, alltså 5⁹.']], sol: ['$5^8 / 5^2 = 5^{8-2} = 5^6$'] },
      { lv: 'F', q: 'Beräkna 10⁵ · 10⁻² och svara som vanligt tal.', type: 'num', a: 1000, calc: '10**5*10**-2', given: ['10⁵ · 10⁻²'], find: 'värdet', start: '$5 + (-2) = 3$', sol: ['$10^{5+(-2)} = 10^3$', '$= 1000$'] }
    ],
    kw: 'potens potenser exponent bas potenslagar upphöjt multiplicera potenser dividera'
  });

  S.push({
    id: 's9-sqrt', ch: 's9-tal', w: [36, 38], title: 'Kvadrat och kvadratrot', sub: '√ är baklänges-knappen till ²',
    idea: '$5^2 = 25$ betyder arean av en kvadrat med sidan 5. **Kvadratroten** går baklänges: $\\sqrt{25}$ frågar "vilken sida ger arean 25?"',
    anchor: 'Kvadrat: sida → area. Kvadratrot: area → sida.',
    cue: ['Tecknet √ eller ordet "kvadratrot".', 'Du vet x² och söker x.'],
    cvis: { t: 'sqrt', a: 81, r: '?' },
    f: {
      name: 'Kvadratrot', main: '\\sqrt{81} = 9', when: 'Du ska beräkna den positiva kvadratroten, eller söker en kvadrats sidlängd utifrån arean.',
      sym: [['√a', 'det positiva tal som gånger sig självt blir a']],
      forms: [['Kvadrera ett tal', 'x^2 = x \\cdot x'], ['Kvadratroten av 49', '\\sqrt{49} = 7'], ['Lös ekvationen x² = 49', 'x = \\pm 7'], ['Uppskatta', '7^2 = 49 < 50 < 64 = 8^2']],
      ex: '$\\sqrt{81} = 9$ eftersom $9 \\cdot 9 = 81$', trap: '$\\sqrt{81}=9$, inte $81/2$. Ekvationen $x^2=81$ har däremot två lösningar: 9 och −9.'
    },
    h1: 'Det handlar om kvadrater: vilket tal gånger sig självt ger talet?',
    ex: {
      q: 'Beräkna √81.', vis: { t: 'sqrt', a: 81, r: '?' }, given: ['81'], find: 'talet som gånger sig självt blir 81', rule: '\\sqrt{a}',
      steps: [['Vilket tal gånger sig självt blir 81?', 'Prova 9: $9 \\cdot 9 = 81$ ✓'], ['Svar', '$\\sqrt{81} = 9$']], ans: '9'
    },
    g: {
      q: 'Om x² = 196 och x är en längd, bestäm x.', vis: { t: 'sqrt', a: 196, r: 'x' }, given: ['x² = 196', 'x är positivt'], find: 'x',
      opts: ['x = \\sqrt{196}', 'x = 196 / 2', 'x = 196^2'], oc: 0, why: 'Kvadratroten är baklänges-operationen till att kvadrera.',
      type: 'num', a: 14, calc: 'Math.sqrt(196)', start: 'Prova tal runt 14: $14 \\cdot 14 = ?$', sol: ['$x = \\sqrt{196}$', '$14 \\cdot 14 = 196$, så $x = 14$'], traps: [[98, 'Du delade med 2. Kvadratroten frågar vilket tal gånger SIG SJÄLVT blir 196.']]
    },
    p: [
      { lv: 'A', q: 'Beräkna √144.', vis: { t: 'sqrt', a: 144, r: '?' }, type: 'num', a: 12, calc: 'Math.sqrt(144)', given: ['144'], find: '√144', start: 'Vilket tal gånger sig självt blir 144?', sol: ['$12 \\cdot 12 = 144$', '$\\sqrt{144} = 12$'], traps: [[72, 'Du delade med 2. Kvadratroten är inte hälften.']] },
      { lv: 'B', q: 'En kvadratisk matta har arean 9 m². Hur lång är en sida?', vis: { t: 'sqrt', a: '9 m²', r: '?' }, type: 'num', a: 3, u: 'm', calc: 'Math.sqrt(9)', given: ['arean 9 m²', 'kvadrat'], find: 'sidans längd', start: 'sida = √area', sol: ['$\\text{sida} = \\sqrt{9}$', '$= 3$ m'] },
      { lv: 'C', q: 'Beräkna 15².', type: 'num', a: 225, calc: '15**2', given: ['15²'], find: 'värdet', start: '$15 \\cdot 15$', sol: ['$15 \\cdot 15 = 225$'], traps: [[30, '$15^2$ betyder $15 \\cdot 15$, inte $15 \\cdot 2$.']] },
      { lv: 'D', q: 'Mellan vilka heltal ligger √50?', type: 'choice', opts: ['5 och 6', '6 och 7', '7 och 8', '24 och 26'], a: '7 och 8', traps: [['24 och 26', 'Det är 50/2. Tänk: 7² = 49 och 8² = 64.']], sol: ['$7^2 = 49$ och $8^2 = 64$', '50 ligger mellan 49 och 64 → $\\sqrt{50}$ mellan 7 och 8'] },
      { lv: 'F', q: 'Beräkna √(36 + 64).', type: 'num', a: 10, calc: 'Math.sqrt(36+64)', given: ['√(36 + 64)'], find: 'värdet', start: 'Räkna inuti roten först.', sol: ['$36 + 64 = 100$', '$\\sqrt{100} = 10$'], traps: [[14, '√36 + √64 = 14 är fel ordning. Räkna det som står under roten först.']] }
    ],
    kw: 'kvadratrot roten ur rot kvadrat i kvadrat upphöjt till två √'
  });

  S.push({
    id: 's9-number-sets', ch: 's9-tal', w: [37, 38], title: 'Talmängder', sub: 'naturliga, hela, rationella, reella',
    idea: 'Talmängder är "lådor" inuti varandra. **Naturliga tal** (0, 1, 2 …) ligger i **heltalen** (även negativa), som ligger i de **rationella** (alla bråk), som ligger i de **reella** (hela tallinjen).',
    anchor: 'ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ. Irrationellt = går inte att skriva som bråk (√2, π).',
    cue: ['Orden naturligt, heltal, rationellt, irrationellt, reellt.', 'Frågan: "vilken talmängd hör talet till?"'],
    cvis: { t: 'sets' },
    f: {
      name: 'Talmängder', main: 'ℕ \\subset ℤ \\subset ℚ \\subset ℝ', when: 'När du ska klassificera ett tal.',
      sym: [['ℕ', 'naturliga: 0, 1, 2, 3 …'], ['ℤ', 'heltal: … −2, −1, 0, 1, 2 …'], ['ℚ', 'rationella: kan skrivas a/b'], ['ℝ', 'reella: alla tal på tallinjen'], ['irrationella', 'reella men inte rationella: √2, π']],
      rules: ['Fråga i ordning: Naturligt? → Heltal? → Kan skrivas som bråk? → annars irrationellt.', 'Avslutat eller periodiskt decimaltal = rationellt.'],
      ex: '$-3$ är ett heltal men inte naturligt. $0{,}75 = 3/4$ är rationellt.', trap: 'Ett decimaltal som 2,75 är INTE irrationellt – det kan skrivas 275/100.'
    },
    h1: 'Klassificera: gå från den minsta lådan (ℕ) och utåt.',
    ex: {
      q: 'Vilken är den minsta talmängden som innehåller −3?', vis: { t: 'sets', item: '−3', hl: 'Z' }, given: ['talet −3'], find: 'minsta talmängd', rule: 'ℕ \\subset ℤ \\subset ℚ \\subset ℝ',
      steps: [['Är −3 ett naturligt tal?', 'Nej – naturliga tal är inte negativa.'], ['Är −3 ett heltal?', 'Ja.'], ['Svar', 'Heltalen ℤ']], ans: 'heltal'
    },
    g: {
      q: 'Vilket av talen är irrationellt?', vis: { t: 'sets', hl: 'R' }, type: 'choice', opts: ['0,5', '3/4', '√2', '−7'], a: '√2',
      given: ['0,5 · 3/4 · √2 · −7'], find: 'talet som inte kan skrivas som bråk',
      ropts: null, start: 'Vilket tal kan inte skrivas som ett bråk?', sol: ['0,5 = 1/2, 3/4 och −7 = −7/1 är bråk', '√2 kan inte skrivas som bråk → irrationellt'],
      traps: [['0,5', '0,5 = 1/2 – det är ett bråk, alltså rationellt.']]
    },
    p: [
      { lv: 'A', q: 'Vilken är den minsta talmängden som innehåller −8?', type: 'choice', opts: ['naturliga tal', 'heltal', 'rationella tal', 'reella tal'], a: 'heltal', traps: [['naturliga tal', 'Naturliga tal är 0, 1, 2 … – inga negativa.']], sol: ['−8 är negativt → inte naturligt', '−8 är ett heltal'] },
      { lv: 'B', q: 'Är 2,75 rationellt?', type: 'choice', opts: ['ja', 'nej'], a: 'ja', traps: [['nej', '2,75 = 275/100 = 11/4. Det går att skriva som bråk → rationellt.']], sol: ['$2{,}75 = \\frac{11}{4}$', 'Kan skrivas som bråk → rationellt'] },
      { lv: 'C', q: 'Vilket tal hör till heltalen men INTE till de naturliga talen?', type: 'choice', opts: ['0', '5', '−4', '1/2'], a: '−4', traps: [['0', '0 räknas som naturligt tal.'], ['1/2', '1/2 är inte ett heltal.']], sol: ['Negativa heltal är heltal men inte naturliga'] },
      { lv: 'D', q: 'Vilket påstående är sant?', type: 'choice', opts: ['Alla heltal är naturliga tal', 'Alla naturliga tal är heltal', 'π är rationellt', '√9 är irrationellt'], a: 'Alla naturliga tal är heltal', traps: [['√9 är irrationellt', '√9 = 3, ett heltal.'], ['π är rationellt', 'π kan inte skrivas som bråk.']], sol: ['ℕ ligger inuti ℤ'] },
      { lv: 'F', q: 'Hur många av talen är rationella?   −2  |  0,3  |  √5  |  7/9  |  π', type: 'choice', opts: ['1', '2', '3', '5'], a: '3', traps: [['5', '√5 och π kan inte skrivas som bråk.']], sol: ['−2, 0,3 och 7/9 är rationella', '√5 och π är irrationella → 3 st'] }
    ],
    kw: 'talmängder naturliga tal heltal rationella irrationella reella klassificera'
  });

  /* ================= KAPITEL 2 · GEOMETRI ================= */
  S.push({
    id: 's9-angles', ch: 's9-geo', w: [40, 43], title: 'Vinklar', sub: 'triangel 180°, rak linje 180°, varv 360°',
    idea: 'Tre summor löser nästan alla vinkeluppgifter: **triangel = 180°**, **rak linje = 180°**, **helt varv = 360°**. Vinkeln du söker är det som "fattas" till summan.',
    anchor: 'Summa minus det du vet = det som fattas.',
    cue: ['Ordet vinkel, gradtecken °.', 'En figur (triangel, linje, punkt) med en okänd vinkel.'],
    cvis: { t: 'triAngles', a: 50, b: 65, c: '?' },
    f: {
      name: 'Vinkelsummor', main: 'v_1+v_2+v_3 = 180°', when: 'En vinkel saknas i en triangel, på en rak linje eller runt en punkt.',
      sym: [['Triangel', '180°'], ['Rak linje', '180°'], ['Helt varv', '360°'], ['Vertikalvinklar', 'är lika stora']],
      forms: [['Saknad vinkel i triangel', 'v_3 = 180° - v_1 - v_2'], ['Sidovinkel på linje', 'v = 180° - u'], ['Runt en punkt', 'x = 360° - (\\text{summan av resten})']],
      ex: '$180° - 42° - 71° = 67°$', trap: 'Kolla vilken summa som gäller: triangel och rak linje = 180°, runt en punkt = 360°.'
    },
    h1: 'Vilken figur är det: triangel, rak linje eller helt varv?',
    ex: {
      q: 'En triangel har vinklarna 50° och 65°. Bestäm den tredje vinkeln.', vis: { t: 'triAngles', a: 50, b: 65, c: '?' },
      given: ['50° och 65°', 'figuren är en triangel'], find: 'den tredje vinkeln', rule: 'v_1+v_2+v_3=180°',
      steps: [['Vilken summa gäller för en triangel?', '180°'], ['Hur mycket är redan "använt"?', '$50° + 65° = 115°$'], ['Vad fattas?', '$180° - 115° = 65°$']], ans: '65°'
    },
    g: {
      q: 'En triangel har vinklarna 42° och 71°. Bestäm den tredje vinkeln.', vis: { t: 'triAngles', a: 42, b: 71, c: '?' }, given: ['42° och 71°', 'triangel'], find: 'den tredje vinkeln',
      opts: ['180° - 42° - 71°', '360° - 42° - 71°', '42° + 71°'], oc: 0, why: 'Vinkelsumman i en triangel är 180°.',
      type: 'num', a: 67, u: '°', calc: '180-42-71', start: '$42° + 71° = 113°$. Vad fattas till 180°?', sol: ['$42 + 71 = 113$', '$180 - 113 = 67°$'], traps: [[247, 'Du använde 360°. En triangel har vinkelsumman 180°.'], [113, 'Det är summan av de två du vet. Dra den från 180°.']]
    },
    p: [
      { lv: 'A', q: 'En triangel har vinklarna 35° och 90°. Bestäm den tredje vinkeln.', vis: { t: 'triAngles', a: 35, b: 90, c: '?' }, type: 'num', a: 55, u: '°', calc: '180-35-90', given: ['35° och 90°', 'triangel'], find: 'den tredje vinkeln', start: '$180° - 35° - 90°$', sol: ['$35 + 90 = 125$', '$180 - 125 = 55°$'], traps: [[235, 'En triangel har 180°, inte 360°.']] },
      { lv: 'B', q: 'En vinkel på en rak linje är 128°. Bestäm vinkeln bredvid.', vis: { t: 'lineAngle', a: 128, b: '?' }, type: 'num', a: 52, u: '°', calc: '180-128', given: ['128°', 'rak linje'], find: 'vinkeln bredvid', start: 'Rak linje = 180°', sol: ['$180° - 128° = 52°$'], traps: [[232, 'En rak linje är 180°, inte 360°.']] },
      { lv: 'C', q: 'Tre vinklar runt en punkt är 90°, 110° och x. Bestäm x.', vis: { t: 'pointAngles', list: [90, 110, '?'] }, type: 'num', a: 160, u: '°', calc: '360-90-110', given: ['90° och 110°', 'runt en punkt'], find: 'x', start: 'Helt varv = 360°', sol: ['$90 + 110 = 200$', '$360 - 200 = 160°$'], traps: [[-20, 'Runt en punkt är summan 360°, inte 180°.']] },
      { lv: 'D', q: 'I en likbent triangel är toppvinkeln 40°. De två basvinklarna är lika stora. Hur stor är en basvinkel?', vis: { t: 'triAngles', a: '?', b: '?', c: 40 }, type: 'num', a: 70, u: '°', calc: '(180-40)/2', given: ['toppvinkel 40°', 'basvinklarna är lika'], find: 'en basvinkel', start: '$180° - 40° = 140°$ delas på två lika vinklar.', sol: ['$180 - 40 = 140$', '$140 / 2 = 70°$'], traps: [[140, 'Det är båda basvinklarna tillsammans. Dela på 2.']] },
      { lv: 'F', q: 'I en rätvinklig triangel är en vinkel 28°. Hur stor är den tredje vinkeln?', vis: { t: 'triAngles', a: 28, b: 90, c: '?' }, type: 'num', a: 62, u: '°', calc: '180-90-28', given: ['28°', 'rätvinklig → 90°'], find: 'tredje vinkeln', start: 'Rätvinklig betyder att en vinkel är 90°.', sol: ['Vinklar: 90°, 28° och x', '$180 - 90 - 28 = 62°$'], traps: [[152, 'Glöm inte den räta vinkeln (90°).']] }
    ],
    kw: 'vinkel vinklar grader triangel vinkelsumma 180 360 rak linje varv tredje vinkeln'
  });

  S.push({
    id: 's9-pythagoras', ch: 's9-geo', w: [40, 43], title: 'Pythagoras sats', sub: 'räta trianglar: a² + b² = c²',
    idea: 'I en **rätvinklig** triangel gäller ett fast samband mellan sidorna: de två korta sidornas kvadrater tillsammans = den längsta sidans kvadrat. Den längsta sidan, **hypotenusan c**, ligger alltid mittemot den räta vinkeln.',
    anchor: 'Hypotenusan är längst och ligger mittemot rät vinkel. Söker c → plus. Söker a eller b → minus.',
    cue: ['Rätvinklig triangel (□ i hörnet) och en sida saknas.', 'Diagonal i rektangel/kvadrat, stege mot vägg, avstånd snett.'],
    cvis: { t: 'rightTri', a: 6, b: 8, c: '?' },
    f: {
      name: 'Pythagoras sats', main: 'a^2 + b^2 = c^2', when: 'Triangeln är rätvinklig och en sida saknas.',
      sym: [['c', 'hypotenusan – längst, mittemot räta vinkeln'], ['a, b', 'kateterna – sidorna som bildar räta vinkeln']],
      forms: [['Söker c', 'c = \\sqrt{a^2 + b^2}'], ['Söker a', 'a = \\sqrt{c^2 - b^2}'], ['Söker b', 'b = \\sqrt{c^2 - a^2}']],
      ex: '$c = \\sqrt{5^2 + 12^2} = \\sqrt{169} = 13$', trap: 'Du har räknat ut $c^2$, inte $c$. Sista steget är kvadratroten.'
    },
    h1: 'Är triangeln rätvinklig och saknas en sida? Då är det Pythagoras. Leta upp hypotenusan först.',
    ex: {
      q: 'Kateterna är 6 cm och 8 cm. Bestäm hypotenusan c.', vis: { t: 'rightTri', a: 6, b: 8, c: '?' }, given: ['a = 6 cm', 'b = 8 cm', 'rät vinkel'], find: 'hypotenusan c', rule: 'a^2 + b^2 = c^2',
      steps: [['Söker vi den längsta sidan eller en kort?', 'Den längsta (c) → addera kvadraterna.'], ['Sätt in', '$6^2 + 8^2 = 36 + 64 = 100$'], ['Vad är 100 nu – c eller c²?', 'Det är $c^2$. Ta roten: $c = \\sqrt{100} = 10$'], ['Rimligt?', '10 är längre än 6 och 8 ✓']],
      ans: '10 cm'
    },
    g: {
      q: 'En rätvinklig triangel har kateterna 5 cm och 12 cm. Bestäm hypotenusan.', vis: { t: 'rightTri', a: 5, b: 12, c: '?' }, given: ['a = 5 cm', 'b = 12 cm'], find: 'hypotenusan c',
      opts: ['c = \\sqrt{5^2 + 12^2}', 'c = \\sqrt{12^2 - 5^2}', 'c = 5 + 12'], oc: 0, why: 'Vi söker hypotenusan → addera kvadraterna och ta roten.',
      type: 'num', a: 13, u: 'cm', calc: 'Math.sqrt(5**2+12**2)', start: '$5^2 + 12^2 = 25 + 144$', sol: ['$25 + 144 = 169$', '$c = \\sqrt{169} = 13$ cm'], traps: [[169, 'Du har hittat $c^2$, inte $c$. Ett steg återstår: ta roten ur 169.'], [17, 'Sidorna kan inte bara adderas. Kvadrera först.']]
    },
    p: [
      { lv: 'A', q: 'Kateterna är 9 cm och 12 cm. Bestäm hypotenusan.', vis: { t: 'rightTri', a: 9, b: 12, c: '?' }, type: 'num', a: 15, u: 'cm', calc: 'Math.sqrt(9**2+12**2)', given: ['a = 9 cm', 'b = 12 cm'], find: 'c', start: '$c = \\sqrt{9^2 + 12^2}$', sol: ['$81 + 144 = 225$', '$c = \\sqrt{225} = 15$ cm'], traps: [[225, 'Du har $c^2$. Ta roten: $\\sqrt{225}$.'], [21, 'Kvadrera sidorna innan du adderar.']] },
      { lv: 'C', q: 'Hypotenusan är 10 cm och en katet är 6 cm. Bestäm den andra kateten.', vis: { t: 'rightTri', a: '?', b: 6, c: 10 }, type: 'num', a: 8, u: 'cm', calc: 'Math.sqrt(10**2-6**2)', given: ['c = 10 cm', 'b = 6 cm'], find: 'kateten a', start: 'Söker en kort sida → minus: $a = \\sqrt{10^2 - 6^2}$', sol: ['$100 - 36 = 64$', '$a = \\sqrt{64} = 8$ cm'], traps: [[11.66, 'Du adderade. När du söker en katet ska du subtrahera: $c^2 - b^2$.'], [64, 'Du har $a^2$. Ta roten ur 64.']], tol: 0.01 },
      { lv: 'B', q: 'En kvadrat har sidan 7 cm. Bestäm diagonalen. Avrunda till en decimal.', vis: { t: 'rightTri', a: 7, b: 7, c: '?', note: 'Diagonalen delar kvadraten i två räta trianglar' }, type: 'num', a: 9.9, u: 'cm', dec: 1, calc: 'Math.sqrt(7**2+7**2)', given: ['sidan 7 cm', 'kvadrat → rät vinkel'], find: 'diagonalen', start: '$d = \\sqrt{7^2 + 7^2}$', sol: ['$49 + 49 = 98$', '$\\sqrt{98} \\approx 9{,}9$ cm'], traps: [[98, 'Du har $d^2$. Ta roten ur 98.']] },
      { lv: 'D', q: 'En 5 m lång stege står mot en vägg. Stegens fot är 3 m från väggen. Hur högt upp når stegen?', vis: { t: 'rightTri', a: '?', b: 3, c: 5, unit: 'm', note: 'Väggen och marken bildar rät vinkel' }, type: 'num', a: 4, u: 'm', calc: 'Math.sqrt(5**2-3**2)', given: ['stegen 5 m (lutar = hypotenusa)', 'avstånd 3 m'], find: 'höjden på väggen', start: 'Stegen är hypotenusan. Söker en katet → minus.', sol: ['$h = \\sqrt{5^2 - 3^2}$', '$= \\sqrt{16} = 4$ m'], traps: [[5.83, 'Stegen är den längsta sidan (hypotenusa). Subtrahera: $5^2 - 3^2$.']], tol: 0.01 },
      { lv: 'F', q: 'En rektangulär skärm är 48 cm bred och 36 cm hög. Hur lång är diagonalen?', type: 'num', a: 60, u: 'cm', calc: 'Math.sqrt(48**2+36**2)', given: ['bredd 48 cm', 'höjd 36 cm'], find: 'diagonalen', start: 'Diagonalen är hypotenusa i en rät triangel.', sol: ['$48^2 + 36^2 = 2304 + 1296 = 3600$', '$\\sqrt{3600} = 60$ cm'], traps: [[3600, 'Du har diagonalen i kvadrat. Ta roten.']] }
    ],
    kw: 'pythagoras pytagoras rätvinklig triangel hypotenusa katet triangel sida diagonal stege a2+b2=c2'
  });

  S.push({
    id: 's9-length-scale', ch: 's9-geo', w: [41, 45], title: 'Längdskala', sub: 'kartor och ritningar',
    idea: 'Skala 1:200 betyder: **1 cm på bilden är 200 cm i verkligheten**. Bilden är förminskad. Skala 5:1 betyder förstorad: 5 cm på bilden är 1 cm i verkligheten.',
    anchor: 'Första talet = bilden. Andra talet = verkligheten.',
    cue: ['Ordet skala och ett förhållande som 1:500.', 'Karta, ritning, modell.'],
    cvis: { t: 'scaleMap', ratio: 500, img: '3 cm', real: '?' },
    f: {
      name: 'Längdskala', main: '\\text{skala} = \\frac{\\text{bildens längd}}{\\text{verklig längd}}', when: 'Karta, ritning eller modell – en längd ska översättas.',
      sym: [['1:200', '1 cm på bild = 200 cm i verklighet']],
      forms: [['Söker verklig längd', '\\text{verklig} = \\text{bild} \\cdot 200'], ['Söker bildlängd', '\\text{bild} = \\text{verklig} / 200'], ['Söker skalan', '\\text{bild} : \\text{verklig}']],
      ex: 'Skala 1:500, 3 cm → $3 \\cdot 500 = 1500$ cm $= 15$ m', trap: 'Räkna i samma enhet hela vägen (ofta cm) och byt enhet sist.'
    },
    h1: 'Det här är en skaluppgift. Går du från bild till verklighet (gånger) eller tvärtom (delat)?',
    ex: {
      q: 'Skala 1:500. En sträcka är 3 cm på ritningen. Hur lång är den i verkligheten i meter?', vis: { t: 'scaleMap', ratio: 500, img: '3 cm', real: '? m' }, given: ['skala 1:500', 'bild 3 cm'], find: 'verklig längd i m', rule: '\\text{verklig} = \\text{bild} \\cdot 500',
      steps: [['Bild → verklighet: gånger eller delat?', 'Gånger 500'], ['Räkna', '$3 \\cdot 500 = 1500$ cm'], ['Byt enhet', '$1500$ cm $= 15$ m']], ans: '15 m'
    },
    g: {
      q: 'Skala 1:200. En vägg är 4 cm på ritningen. Hur lång är den i verkligheten i meter?', vis: { t: 'scaleMap', ratio: 200, img: '4 cm', real: '? m' }, given: ['skala 1:200', 'bild 4 cm'], find: 'verklig längd i m',
      opts: ['4 \\cdot 200', '4 / 200', '200 / 4'], oc: 0, why: 'Från bild till verklighet → gånger skalans nämnare.',
      type: 'num', a: 8, u: 'm', calc: '4*200/100', unitSkill: true, start: '$4 \\cdot 200 = 800$ cm. Hur många meter?', sol: ['$4 \\cdot 200 = 800$ cm', '$800$ cm $= 8$ m'], traps: [[800, 'Det är 800 cm. Frågan vill ha meter: dela med 100.']]
    },
    p: [
      { lv: 'A', q: 'Skala 1:50 000. Avståndet på kartan är 6 cm. Hur långt är det i verkligheten i km?', vis: { t: 'scaleMap', ratio: 50000, img: '6 cm', real: '? km' }, type: 'num', a: 3, u: 'km', calc: '6*50000/100000', unitSkill: true, given: ['skala 1:50 000', 'karta 6 cm'], find: 'verkligt avstånd i km', start: '$6 \\cdot 50\\,000 = 300\\,000$ cm', sol: ['$300\\,000$ cm', '$100\\,000$ cm = 1 km → 3 km'] },
      { lv: 'C', q: 'En 12 m lång byggnad ritas i skala 1:200. Hur lång blir den på ritningen i cm?', vis: { t: 'scaleMap', ratio: 200, img: '?', real: '12 m', dir: 'down' }, type: 'num', a: 6, u: 'cm', calc: '1200/200', unitSkill: true, given: ['verklig längd 12 m', 'skala 1:200'], find: 'längd på ritningen i cm', start: 'Verklighet → bild: dela. Gör om 12 m till cm först.', sol: ['$12$ m $= 1200$ cm', '$1200 / 200 = 6$ cm'], traps: [[2400, 'Från verklighet till bild ska du dela, inte multiplicera.'], [0.06, 'Gör om 12 m till 1200 cm först.']] },
      { lv: 'C', q: 'En 4 m lång bil är 2 cm i en modell. Vilken skala är det? Svara med talet x i 1:x.', type: 'num', a: 200, calc: '400/2', given: ['verklig 4 m', 'modell 2 cm'], find: 'skalan 1:x', start: 'Samma enhet: 4 m = 400 cm. Hur många gånger större?', sol: ['$400$ cm $/ 2$ cm $= 200$', 'Skala 1:200'], traps: [[2, 'Gör om till samma enhet: 4 m = 400 cm.']] },
      { lv: 'D', q: 'Ett mikroskopfoto visar ett 0,5 mm stort sandkorn som 2 cm stort. Vilken skala? Svara med x i x:1.', type: 'num', a: 40, calc: '20/0.5', given: ['verklig 0,5 mm', 'bild 2 cm'], find: 'skalan x:1', start: '2 cm = 20 mm. Hur många gånger större är bilden?', sol: ['$2$ cm $= 20$ mm', '$20 / 0{,}5 = 40$ → skala 40:1'], traps: [[4, 'Gör om till samma enhet: 2 cm = 20 mm.']] },
      { lv: 'F', q: 'På en karta i skala 1:25 000 är en löparbana 8 cm. Hur många km är banan?', type: 'num', a: 2, u: 'km', calc: '8*25000/100000', unitSkill: true, given: ['skala 1:25 000', 'karta 8 cm'], find: 'banans längd i km', start: '$8 \\cdot 25\\,000$ cm', sol: ['$200\\,000$ cm', '$= 2$ km'] }
    ],
    kw: 'skala längdskala karta ritning modell förminskning förstoring 1:100'
  });

  S.push({
    id: 's9-area-scale', ch: 's9-geo', w: [41], title: 'Areaskala', sub: 'area ändras med k²',
    idea: 'Om alla **längder** blir 3 gånger större, blir varje ruta både 3 gånger bredare och 3 gånger högre. Arean blir därför $3 \\cdot 3 = 9$ gånger större. Area har **två** dimensioner.',
    anchor: 'Längd ×k → area ×k². Baklänges: k = √(areafaktorn).',
    cue: ['Area (cm², m²) och en förstoring/förminskning eller skala.', 'Frågan blandar längdfaktor och area.'],
    cvis: { t: 'areaScale', k: 3 },
    f: {
      name: 'Areaskala', main: 'A_2 = A_1 \\cdot k^2', when: 'En figur förstoras/förminskas och frågan gäller AREA.',
      sym: [['k', 'längdfaktorn (hur många gånger längre)'], ['k²', 'areafaktorn'], ['A₁, A₂', 'area före och efter']],
      forms: [['Söker ny area', 'A_2 = A_1 \\cdot k^2'], ['Söker längdfaktorn', 'k = \\sqrt{\\frac{A_2}{A_1}}'], ['Söker gammal area', 'A_1 = \\frac{A_2}{k^2}'], ['Skala 1:n', '\\text{areaskala } 1:n^2']],
      ex: 'Längd ×4: $6 \\cdot 4^2 = 96$ cm²', trap: 'Du använde längdfaktorn direkt. Area ändras i två dimensioner – använd $k^2$.'
    },
    h1: 'Frågan gäller area (två dimensioner), men faktorn gäller längd. Hur översätter du?',
    ex: {
      q: 'En figur förstoras med längdfaktor 3. Arean var 5 cm². Vad blir den nya arean?', vis: { t: 'areaScale', k: 3, A1: '5 cm²' }, given: ['k = 3', 'A₁ = 5 cm²'], find: 'ny area A₂', rule: 'A_2 = A_1 \\cdot k^2',
      steps: [['Längd ×3 – vad händer med arean?', '$\\times 3^2 = \\times 9$'], ['Räkna', '$5 \\cdot 9 = 45$'], ['Rimligt?', 'Area växer snabbare än längd ✓']], ans: '45 cm²'
    },
    g: {
      q: 'En figur förstoras med längdfaktor 4. Den ursprungliga arean är 6 cm². Vad blir den nya arean?', vis: { t: 'areaScale', k: 4, A1: '6 cm²' }, given: ['k = 4', 'A₁ = 6 cm²'], find: 'ny area',
      opts: ['6 \\cdot 4^2', '6 \\cdot 4', '6 \\cdot 4^3'], oc: 0, why: 'Area har två dimensioner → k².',
      type: 'num', a: 96, u: 'cm²', calc: '6*4**2', start: 'Areafaktor $= 4^2 = 16$', sol: ['$4^2 = 16$', '$6 \\cdot 16 = 96$ cm²'], traps: [[24, 'Du använde längdfaktorn direkt. Area ändras i två dimensioner – använd $4^2 = 16$.'], [384, 'Du använde $k^3$ – det är för volym.']]
    },
    p: [
      { lv: 'A', q: 'Längdskalan är 1:5. Vilken är areaskalan? Svara med n i 1:n.', type: 'num', a: 25, calc: '5**2', given: ['längdskala 1:5'], find: 'areaskala 1:n', start: 'Kvadrera 5.', sol: ['$5^2 = 25$', 'Areaskala 1:25'], traps: [[5, 'Det är längdskalan. Area: kvadrera.'], [125, '$5^3$ gäller volym.']] },
      { lv: 'C', q: 'En area blir 9 gånger större. Vilken är längdfaktorn?', vis: { t: 'areaScale', k: '?' }, type: 'num', a: 3, calc: 'Math.sqrt(9)', given: ['areafaktor 9'], find: 'längdfaktor k', start: 'Baklänges: $k = \\sqrt{9}$', sol: ['$k^2 = 9$', '$k = \\sqrt 9 = 3$'], traps: [[4.5, 'Du delade med 2. Baklänges från area: ta kvadratroten.'], [81, 'Du kvadrerade. Baklänges från area till längd: kvadratrot.']] },
      { lv: 'C', q: 'En karta har skala 1:10 000. En park är 3 cm² på kartan. Hur stor är parken i verkligheten i m²?', type: 'num', a: 30000, u: 'm²', calc: '3*10000**2/10000', given: ['skala 1:10 000', 'kartarea 3 cm²'], find: 'verklig area i m²', start: 'Areaskala $1 : 10\\,000^2$. Tänk: 1 cm på kartan = 100 m → 1 cm² = 100·100 m².', sol: ['1 cm på kartan = 10 000 cm = 100 m', '1 cm² motsvarar $100 \\cdot 100 = 10\\,000$ m²', '$3 \\cdot 10\\,000 = 30\\,000$ m²'], traps: [[300, 'Du använde längdskalan. Area: kvadrera faktorn.']] },
      { lv: 'D', q: 'En pizza har dubbelt så stor diameter som en annan. Hur många gånger större är ytan?', type: 'num', a: 4, calc: '2**2', given: ['diametern ×2'], find: 'hur många gånger större area', start: 'Diameter är en längd. Area → kvadrera.', sol: ['$k = 2$', 'Areafaktor $= 2^2 = 4$'], traps: [[2, 'Area ändras i två dimensioner: $2^2 = 4$.']] },
      { lv: 'F', q: 'Ett foto 10 cm × 15 cm förstoras så att arean blir 600 cm². Vilken är längdfaktorn?', type: 'num', a: 2, calc: 'Math.sqrt(600/150)', given: ['foto 10 × 15 cm', 'ny area 600 cm²'], find: 'längdfaktor', start: 'Gammal area $= 150$. Areafaktor $= 600/150$. Sedan roten.', sol: ['$A_1 = 10 \\cdot 15 = 150$', '$600/150 = 4$', '$k = \\sqrt 4 = 2$'], traps: [[4, 'Det är areafaktorn. Längdfaktorn är $\\sqrt 4$.']] }
    ],
    kw: 'areaskala area skala förstoring förminskning k i kvadrat längdfaktor areafaktor'
  });

  S.push({
    id: 's9-volume-scale', ch: 's9-geo', w: [41], title: 'Volymskala', sub: 'volym ändras med k³',
    idea: 'Volym har **tre** dimensioner: längd, bredd och höjd. Blir alla längder dubbelt så långa, blir volymen $2 \\cdot 2 \\cdot 2 = 8$ gånger större.',
    anchor: 'Längd → k. Area → k². Volym → k³.',
    cue: ['Volym (cm³, liter) eller vikt för lika material, plus förstoring/skala.'],
    cvis: { t: 'volScale', k: 2 },
    f: {
      name: 'Volymskala', main: 'V_2 = V_1 \\cdot k^3', when: 'En kropp förstoras/förminskas och frågan gäller VOLYM (eller vikt av samma material).',
      sym: [['k', 'längdfaktorn'], ['k³', 'volymfaktorn']],
      forms: [['Söker ny volym', 'V_2 = V_1 \\cdot k^3'], ['Söker längdfaktorn', 'k^3 = \\frac{V_2}{V_1} \\Rightarrow k = \\text{talet som}^3 \\text{ ger kvoten}'], ['Skala 1:n', '\\text{volymskala } 1:n^3']],
      ex: 'Längd ×3: $4 \\cdot 3^3 = 108$ cm³', trap: 'Volym växer med $k^3$, inte $k^2$ eller $k$.'
    },
    h1: 'Gäller frågan volym? Då är det tre dimensioner – k³.',
    ex: {
      q: 'Längdfaktorn är 2 och volymen är 10 cm³. Vad blir den nya volymen?', vis: { t: 'volScale', k: 2, V1: '10 cm³' }, given: ['k = 2', 'V₁ = 10 cm³'], find: 'ny volym', rule: 'V_2 = V_1 \\cdot k^3',
      steps: [['Volymfaktor?', '$2^3 = 8$'], ['Räkna', '$10 \\cdot 8 = 80$ cm³']], ans: '80 cm³'
    },
    g: {
      q: 'En kropp förstoras med längdfaktor 3. Den ursprungliga volymen är 4 cm³. Ny volym?', vis: { t: 'volScale', k: 3, V1: '4 cm³' }, given: ['k = 3', 'V₁ = 4 cm³'], find: 'ny volym',
      opts: ['4 \\cdot 3^3', '4 \\cdot 3^2', '4 \\cdot 3'], oc: 0, why: 'Volym → tre dimensioner → k³.',
      type: 'num', a: 108, u: 'cm³', calc: '4*3**3', start: '$3^3 = 27$', sol: ['$3^3 = 27$', '$4 \\cdot 27 = 108$ cm³'], traps: [[36, 'Du använde $k^2$ – det gäller area. Volym: $k^3$.'], [12, 'Du använde längdfaktorn direkt. Volym: $k^3$.']]
    },
    p: [
      { lv: 'A', q: 'Längdskalan är 1:4. Vilken är volymskalan? Svara med n i 1:n.', type: 'num', a: 64, calc: '4**3', given: ['längdskala 1:4'], find: 'volymskala 1:n', start: '$4^3$', sol: ['$4 \\cdot 4 \\cdot 4 = 64$'], traps: [[16, '$4^2$ gäller area. Volym: $4^3$.']] },
      { lv: 'C', q: 'Volymen blir 125 gånger större. Vilken är längdfaktorn?', type: 'num', a: 5, calc: 'Math.cbrt(125)', given: ['volymfaktor 125'], find: 'längdfaktor k', start: 'Vilket tal gånger sig självt tre gånger blir 125?', sol: ['$5 \\cdot 5 \\cdot 5 = 125$', '$k = 5$'], traps: [[11.18, 'Det är kvadratroten (area). Volym: vilket tal upphöjt till 3?']], tol: 0.01 },
      { lv: 'D', q: 'En modellbil i skala 1:10 rymmer 0,05 liter i tanken. Hur mycket rymmer den riktiga bilens tank, i liter?', type: 'num', a: 50, u: 'l', calc: '0.05*10**3', given: ['skala 1:10', 'modell 0,05 l'], find: 'riktig volym i liter', start: 'Volymfaktor $10^3 = 1000$', sol: ['$k^3 = 1000$', '$0{,}05 \\cdot 1000 = 50$ l'], traps: [[0.5, 'Du använde längdfaktorn. Volym: $10^3$.'], [5, 'Du använde $k^2$. Volym: $k^3$.']] },
      { lv: 'D', q: 'Två klot av samma material: det stora har dubbelt så stor radie. Det lilla väger 3 kg. Vad väger det stora?', type: 'num', a: 24, u: 'kg', calc: '3*2**3', given: ['radien ×2', 'lilla 3 kg', 'samma material'], find: 'stora klotets vikt', start: 'Samma material → vikten följer volymen → $k^3$.', sol: ['$2^3 = 8$', '$3 \\cdot 8 = 24$ kg'], traps: [[6, 'Vikt följer volym, inte längd: $2^3$.'], [12, 'Vikt följer volym ($k^3$), inte area.']] },
      { lv: 'F', q: 'En kub har volymen 8 cm³. En förstorad kub har volymen 216 cm³. Hur många gånger längre är sidan?', type: 'num', a: 3, calc: 'Math.cbrt(216/8)', given: ['V₁ = 8 cm³', 'V₂ = 216 cm³'], find: 'längdfaktor', start: 'Volymfaktor $= 216/8 = 27$. Vilket tal³ = 27?', sol: ['$216/8 = 27$', '$3^3 = 27$ → $k = 3$'], traps: [[27, 'Det är volymfaktorn. Längdfaktorn är talet som upphöjt till 3 blir 27.']] }
    ],
    kw: 'volymskala volym skala k i kubik förstoring modell längdfaktor tre dimensioner'
  });

  S.push({
    id: 's9-similarity', ch: 's9-geo', w: [41, 42, 45], title: 'Likformighet', sub: 'samma form, olika storlek',
    idea: 'Två figurer är **likformiga** om den ena är en förstoring av den andra: vinklarna är lika och **alla sidor har förändrats med samma faktor**.',
    anchor: 'Hitta ett par motsvarande sidor → skalfaktorn. Använd den på alla sidor.',
    cue: ['Orden likformig/likformiga.', 'Två trianglar med samma vinklar men olika storlek.', 'Skuggor, höjder mätta med pinnar.'],
    cvis: { t: 'similar', small: [3, 5], big: [9, '?'], k: 3 },
    f: {
      name: 'Likformighet', main: 'k = \\frac{\\text{stor sida}}{\\text{motsvarande liten sida}}', when: 'Två figurer har samma form (lika vinklar) men olika storlek.',
      sym: [['k', 'skalfaktorn mellan figurerna'], ['motsvarande sidor', 'sidor på samma plats i figurerna']],
      forms: [['Söker stor sida', '\\text{stor} = \\text{liten} \\cdot k'], ['Söker liten sida', '\\text{liten} = \\text{stor} / k'], ['Proportion', '\\frac{a}{A} = \\frac{b}{B}']],
      ex: 'Sidor 4 → 10 ger $k = 2{,}5$. Sidan 6 blir $6 \\cdot 2{,}5 = 15$', trap: 'Jämför MOTSVARANDE sidor (samma plats), inte vilka sidor som helst.'
    },
    h1: 'Är figurerna likformiga? Leta upp ett par sidor där du vet båda längderna.',
    ex: {
      q: 'Två likformiga trianglar. En sida i den lilla är 3, motsvarande sida i den stora är 9. En annan sida i den lilla är 5. Bestäm motsvarande sida i den stora.', vis: { t: 'similar', small: [3, 5], big: [9, '?'], unit: '' },
      given: ['par: 3 ↔ 9', 'lilla: 5'], find: 'motsvarande stora sida', rule: '\\text{stor} = \\text{liten} \\cdot k',
      steps: [['Skalfaktorn från paret?', '$k = 9/3 = 3$'], ['Använd på den andra sidan', '$5 \\cdot 3 = 15$']], ans: '15'
    },
    g: {
      q: 'Två likformiga trianglar har motsvarande sidor 4 cm och 10 cm. En annan sida i den lilla är 6 cm. Bestäm motsvarande sida i den stora.', vis: { t: 'similar', small: [4, 6], big: [10, '?'] }, given: ['par: 4 cm ↔ 10 cm', 'lilla: 6 cm'], find: 'motsvarande stora sida',
      opts: ['6 \\cdot \\frac{10}{4}', '6 + (10 - 4)', '6 \\cdot \\frac{4}{10}'], oc: 0, why: 'Likformighet = samma faktor (gånger), inte samma tillägg.',
      type: 'num', a: 15, u: 'cm', calc: '6*10/4', start: '$k = 10/4 = 2{,}5$', sol: ['$k = 2{,}5$', '$6 \\cdot 2{,}5 = 15$ cm'], traps: [[12, 'Du lade till 6 cm. Likformighet är multiplikation: samma faktor för alla sidor.'], [2.4, 'Du förminskade. Den stora sidan ska bli större.']]
    },
    p: [
      { lv: 'A', q: 'En figur förstoras med faktor 1,5. En sida var 8 cm. Hur lång blir den?', type: 'num', a: 12, u: 'cm', calc: '8*1.5', given: ['k = 1,5', 'sida 8 cm'], find: 'ny längd', start: '$8 \\cdot 1{,}5$', sol: ['$8 \\cdot 1{,}5 = 12$ cm'] },
      { lv: 'C', q: 'Två likformiga rektanglar: den stora är 15 cm × 9 cm. Den lilla är 5 cm lång. Hur bred är den lilla?', vis: { t: 'similar', small: [5, '?'], big: [15, 9] }, type: 'num', a: 3, u: 'cm', calc: '9/(15/5)', given: ['stor: 15 × 9 cm', 'liten längd 5 cm'], find: 'lilla bredden', start: '$k = 15/5 = 3$. Den lilla är 3 gånger mindre.', sol: ['$k = 3$', '$9 / 3 = 3$ cm'], traps: [[27, 'Den lilla ska vara mindre: dela med k.']] },
      { lv: 'D', q: 'En 1 m lång pinne ger en 1,5 m lång skugga. Samtidigt ger en flaggstång en 12 m lång skugga. Hur hög är flaggstången?', type: 'num', a: 8, u: 'm', calc: '12/1.5', given: ['pinne 1 m → skugga 1,5 m', 'stångens skugga 12 m'], find: 'stångens höjd', start: 'Trianglarna är likformiga: höjd/skugga är samma kvot.', sol: ['$k = 12/1{,}5 = 8$', 'Höjd $= 1 \\cdot 8 = 8$ m'], traps: [[18, 'Du multiplicerade 12 med 1,5. Höjden är kortare än skuggan här.']] },
      { lv: 'D', q: 'Vilket måste gälla för att två trianglar ska vara likformiga?', type: 'choice', opts: ['Samma area', 'Samma omkrets', 'Lika vinklar och proportionella sidor', 'Alla sidor lika långa'], a: 'Lika vinklar och proportionella sidor', traps: [['Samma area', 'Likformighet handlar om form, inte storlek.']], sol: ['Samma form = lika vinklar, sidor i samma förhållande'] },
      { lv: 'F', q: 'Trianglarna ABC och DEF är likformiga. AB = 6 cm, DE = 9 cm, EF = 12 cm. Hur lång är BC?', type: 'num', a: 8, u: 'cm', calc: '12*6/9', given: ['AB = 6 ↔ DE = 9', 'EF = 12 ↔ BC'], find: 'BC', start: '$k = 9/6 = 1{,}5$ (från liten till stor). BC är i den lilla.', sol: ['$k = 1{,}5$', '$BC = 12 / 1{,}5 = 8$ cm'], traps: [[18, 'BC hör till den mindre triangeln – dela med k.']] }
    ],
    kw: 'likformighet likformiga trianglar skalfaktor motsvarande sidor skugga proportion'
  });

  S.push({
    id: 's9-symmetry', ch: 's9-geo', w: [42], title: 'Symmetri', sub: 'spegling och rotation',
    idea: '**Spegelsymmetri**: viker du figuren längs en linje ligger halvorna exakt på varandra. **Rotationssymmetri**: vrider du figuren mindre än ett helt varv och den ser likadan ut.',
    anchor: 'Rotationsvinkel = 360° / antal lika lägen.',
    cue: ['Orden symmetrilinje, spegling, rotation.', 'Frågor om "hur många linjer" eller "minsta vinkel".'],
    cvis: { t: 'symmetry', shape: 'square', mode: 'lines' },
    f: {
      name: 'Symmetri', main: '\\text{rotationsvinkel} = \\frac{360°}{n}', when: 'Hur många symmetrilinjer, eller hur långt figuren ska vridas.',
      sym: [['n', 'antal lägen där figuren ser likadan ut under ett varv']],
      rules: ['Spegelsymmetri: vik längs linjen – passar halvorna?', 'Kvadrat: 4 linjer, 90°. Rektangel: 2 linjer, 180°. Liksidig triangel: 3 linjer, 120°. Cirkel: oändligt många.'],
      ex: 'Kvadrat: $360°/4 = 90°$', trap: 'Diagonalen i en rektangel (som inte är kvadrat) är INTE en symmetrilinje.'
    },
    h1: 'Spegla (vik) eller rotera (vrid)? Räkna lika lägen eller vikningslinjer.',
    ex: {
      q: 'Vilken är den minsta rotationsvinkeln för en kvadrat?', vis: { t: 'symmetry', shape: 'square', mode: 'rot' }, given: ['kvadrat'], find: 'minsta rotationsvinkel', rule: '360° / n',
      steps: [['Hur många lika lägen under ett varv?', '4'], ['Räkna', '$360° / 4 = 90°$']], ans: '90°'
    },
    g: {
      q: 'Vilken är den minsta rotationsvinkeln för en liksidig triangel?', vis: { t: 'symmetry', shape: 'triangle', mode: 'rot' }, given: ['liksidig triangel'], find: 'minsta rotationsvinkel',
      opts: ['360° / 3', '180° / 3', '360° / 6'], oc: 0, why: 'Tre hörn → tre lika lägen per varv.',
      type: 'num', a: 120, u: '°', calc: '360/3', start: '$360° / 3$', sol: ['3 lika lägen', '$360/3 = 120°$'], traps: [[60, 'Vinkeln i hörnet är 60°, men rotationen till nästa läge är 360°/3.']]
    },
    p: [
      { lv: 'A', q: 'Hur många symmetrilinjer har en kvadrat?', vis: { t: 'symmetry', shape: 'square', mode: 'lines' }, type: 'num', a: 4, calc: '4', given: ['kvadrat'], find: 'antal symmetrilinjer', start: 'Räkna lodrät, vågrät och diagonaler.', sol: ['1 lodrät + 1 vågrät + 2 diagonaler = 4'], traps: [[2, 'Glöm inte diagonalerna – i en kvadrat är de symmetrilinjer.']] },
      { lv: 'B', q: 'Hur många symmetrilinjer har en rektangel som inte är en kvadrat?', vis: { t: 'symmetry', shape: 'rect', mode: 'lines' }, type: 'num', a: 2, calc: '2', given: ['rektangel (ej kvadrat)'], find: 'antal symmetrilinjer', start: 'Prova att vika längs diagonalen – passar det?', sol: ['Lodrät och vågrät genom mitten', 'Diagonalen fungerar inte → 2'], traps: [[4, 'Diagonalen i en rektangel är inte en symmetrilinje – halvorna passar inte.']] },
      { lv: 'C', q: 'En figur ser likadan ut efter rotation med 60°. Hur många lika lägen har den under ett varv?', type: 'num', a: 6, calc: '360/60', given: ['rotationsvinkel 60°'], find: 'antal lägen', start: 'Baklänges: $n = 360° / 60°$', sol: ['$360/60 = 6$'] },
      { lv: 'D', q: 'Vilken figur har oändligt många symmetrilinjer?', type: 'choice', opts: ['kvadrat', 'cirkel', 'liksidig triangel', 'rektangel'], a: 'cirkel', sol: ['Varje diameter är en symmetrilinje'] },
      { lv: 'F', q: 'Bokstaven H har spegelsymmetri. Hur många symmetrilinjer har H?', type: 'num', a: 2, calc: '2', given: ['bokstaven H'], find: 'antal linjer', start: 'Prova lodrät och vågrät.', sol: ['Lodrät linje ✓ och vågrät linje ✓ → 2'] }
    ],
    kw: 'symmetri symmetrilinje spegling spegelsymmetri rotation rotationssymmetri vrida'
  });

  S.push({
    id: 's9-space-diagonal', ch: 's9-geo', w: [43], title: 'Rymddiagonal', sub: 'Pythagoras i 3D',
    idea: 'Rymddiagonalen går från ett hörn i botten till det motsatta hörnet i taket. Den är hypotenusa i en rät triangel där ena kateten är **bottendiagonalen** och den andra är **höjden**.',
    anchor: 'Pythagoras två gånger – eller allt på en gång: d² = l² + b² + h².',
    cue: ['Rätblock, kub, låda – längsta avståndet inuti.', 'Ordet rymddiagonal eller "en pinne som ska få plats i lådan".'],
    cvis: { t: 'spaceDiag', l: 3, b: 4, h: 12 },
    f: {
      name: 'Rymddiagonal', main: 'd = \\sqrt{l^2 + b^2 + h^2}', when: 'Längsta raka avståndet inuti ett rätblock eller en kub.',
      sym: [['l, b, h', 'längd, bredd, höjd'], ['d', 'rymddiagonalen']],
      forms: [['Steg 1 (botten)', 'e^2 = l^2 + b^2'], ['Steg 2 (upp)', 'd^2 = e^2 + h^2'], ['Kub med sida s', 'd = s\\sqrt{3}']],
      ex: '$\\sqrt{3^2 + 4^2 + 12^2} = \\sqrt{169} = 13$', trap: 'Glöm inte roten på slutet – $d^2$ är inte $d$.'
    },
    h1: 'Det är ett rätblock och du söker längsta sträckan genom det: Pythagoras i 3D.',
    ex: {
      q: 'Ett rätblock är 3 cm × 4 cm × 12 cm. Bestäm rymddiagonalen.', vis: { t: 'spaceDiag', l: 3, b: 4, h: 12 }, given: ['l = 3', 'b = 4', 'h = 12 (cm)'], find: 'rymddiagonalen d', rule: 'd = \\sqrt{l^2+b^2+h^2}',
      steps: [['Kvadrera alla tre', '$9 + 16 + 144 = 169$'], ['Är 169 d eller d²?', '$d^2$ → $d = \\sqrt{169} = 13$ cm']], ans: '13 cm'
    },
    g: {
      q: 'Ett rätblock är 2 cm × 3 cm × 6 cm. Bestäm rymddiagonalen.', vis: { t: 'spaceDiag', l: 2, b: 3, h: 6 }, given: ['l = 2', 'b = 3', 'h = 6 (cm)'], find: 'rymddiagonalen',
      opts: ['\\sqrt{2^2+3^2+6^2}', '2+3+6', '\\sqrt{2^2+3^2} + 6'], oc: 0, why: 'Pythagoras i tre dimensioner.',
      type: 'num', a: 7, u: 'cm', calc: 'Math.sqrt(4+9+36)', start: '$4 + 9 + 36 = ?$', sol: ['$4 + 9 + 36 = 49$', '$\\sqrt{49} = 7$ cm'], traps: [[49, 'Du har $d^2$. Ta roten ur 49.'], [11, 'Sidorna kan inte adderas direkt – kvadrera först.']]
    },
    p: [
      { lv: 'A', q: 'Ett rätblock är 6 cm × 8 cm × 24 cm. Bestäm rymddiagonalen.', vis: { t: 'spaceDiag', l: 6, b: 8, h: 24 }, type: 'num', a: 26, u: 'cm', calc: 'Math.sqrt(36+64+576)', given: ['6, 8 och 24 cm'], find: 'd', start: '$36 + 64 + 576$', sol: ['$= 676$', '$\\sqrt{676} = 26$ cm'], traps: [[676, 'Du har $d^2$. Ta roten.']] },
      { lv: 'B', q: 'En kub har sidan 2 cm. Bestäm rymddiagonalen. Avrunda till två decimaler.', vis: { t: 'spaceDiag', l: 2, b: 2, h: 2 }, type: 'num', a: 3.46, u: 'cm', dec: 2, calc: 'Math.sqrt(12)', given: ['kub, sida 2 cm'], find: 'd', start: '$\\sqrt{2^2 + 2^2 + 2^2}$', sol: ['$4 + 4 + 4 = 12$', '$\\sqrt{12} \\approx 3{,}46$ cm'], traps: [[12, 'Du har $d^2$. Ta roten.'], [2.83, 'Det är bottendiagonalen. Lägg till höjden också.']] },
      { lv: 'C', q: 'Bottendiagonalen i en låda är 50 cm och höjden är 120 cm. Hur lång är rymddiagonalen?', type: 'num', a: 130, u: 'cm', calc: 'Math.sqrt(50**2+120**2)', given: ['bottendiagonal 50 cm', 'höjd 120 cm'], find: 'rymddiagonal', start: 'Bottendiagonalen och höjden är kateter.', sol: ['$50^2 + 120^2 = 2500 + 14\\,400 = 16\\,900$', '$\\sqrt{16\\,900} = 130$ cm'] },
      { lv: 'F', q: 'Får en 1 m lång pinne plats i en låda som är 60 cm × 40 cm × 70 cm? Ange rymddiagonalen i cm (avrunda till heltal).', type: 'num', a: 100, u: 'cm', dec: 0, calc: 'Math.sqrt(3600+1600+4900)', given: ['låda 60 × 40 × 70 cm', 'pinne 100 cm'], find: 'rymddiagonalen', start: '$\\sqrt{60^2+40^2+70^2}$', sol: ['$3600 + 1600 + 4900 = 10\\,100$', '$\\sqrt{10\\,100} \\approx 100{,}5$ → ca 100 cm. Pinnen får (precis) plats.'] }
    ],
    kw: 'rymddiagonal rätblock kub diagonal 3d pythagoras låda längsta avstånd'
  });

  /* ================= KAPITEL 4 · PROCENT ================= */
  const pctIdea = 'Procent betyder **hundradelar**. Varje procentuppgift har tre storheter: **det hela** (100 %), **delen** och **andelen** (procentsatsen). Du vet alltid två – och söker den tredje.';
  const pctForms = [['Söker delen', '\\text{delen} = \\text{andelen} \\cdot \\text{det hela}'], ['Söker andelen', '\\text{andelen} = \\frac{\\text{delen}}{\\text{det hela}}'], ['Söker det hela', '\\text{det hela} = \\frac{\\text{delen}}{\\text{andelen}}']];
  S.push({
    id: 's9-percent-share', ch: 's9-procent', w: [47], title: 'Beräkna andelen', sub: 'hur många procent?',
    idea: pctIdea, anchor: 'Andel = del / hela. Svaret ×100 ger procent.',
    cue: ['"Hur många procent …?"', 'Två antal: en del och en helhet.'],
    cvis: { t: 'pctBar', whole: 60, part: 18, unk: 'pct' },
    f: { name: 'Andelen', main: '\\text{andel} = \\frac{\\text{delen}}{\\text{det hela}}', when: 'Du vet delen och det hela och söker procenten.', sym: [['delen', 'en bit av helheten'], ['det hela', 'allt = 100 %']], forms: pctForms, ex: '$18/60 = 0{,}30 = 30$ %', trap: 'Dela delen med det hela – inte tvärtom.' },
    h1: 'Du söker procenten (andelen). Vilket tal är delen och vilket är det hela?',
    ex: { q: '18 av 60 elever cyklar till skolan. Hur många procent är det?', vis: { t: 'pctBar', whole: 60, part: 18, unk: 'pct' }, given: ['delen 18', 'det hela 60'], find: 'andelen i %', rule: '\\frac{\\text{delen}}{\\text{det hela}}', steps: [['Vad är delen och vad är det hela?', 'Delen 18, det hela 60'], ['Räkna', '$18/60 = 0{,}3$'], ['Till procent', '$0{,}3 = 30$ %']], ans: '30 %' },
    g: { q: '15 av 50 är hur många procent?', vis: { t: 'pctBar', whole: 50, part: 15, unk: 'pct' }, given: ['delen 15', 'det hela 50'], find: 'andelen', opts: ['\\frac{15}{50}', '\\frac{50}{15}', '15 \\cdot 50'], oc: 0, why: 'Andel = delen / det hela.', type: 'num', a: 30, u: '%', calc: '15/50*100', start: '$15/50 = 0{,}3$', sol: ['$15/50 = 0{,}30$', '$= 30$ %'], traps: [[333.33, 'Du delade det hela med delen. Andel = delen / det hela.'], [0.3, '0,3 är rätt andel i decimalform. Skriv i procent: 30.']], tol: 0.01 },
    p: [
      { lv: 'A', q: '24 av 80 är hur många procent?', vis: { t: 'pctBar', whole: 80, part: 24, unk: 'pct' }, type: 'num', a: 30, u: '%', calc: '24/80*100', given: ['delen 24', 'det hela 80'], find: 'andelen', start: '$24/80$', sol: ['$24/80 = 0{,}3 = 30$ %'], traps: [[0.3, 'Skriv som procent: 0,3 = 30 %.']] },
      { lv: 'B', q: 'I en klass på 28 elever har 7 glasögon. Hur många procent har glasögon?', type: 'num', a: 25, u: '%', calc: '7/28*100', given: ['delen 7', 'det hela 28'], find: 'andelen', start: '$7/28$', sol: ['$7/28 = 0{,}25 = 25$ %'], traps: [[400, 'Andel = delen / det hela: 7/28.']] },
      { lv: 'D', q: 'Ett lag vann 12 matcher, spelade oavgjort 3 och förlorade 5. Hur många procent av matcherna vann de?', type: 'num', a: 60, u: '%', calc: '12/20*100', given: ['vinster 12', 'totalt 12 + 3 + 5 matcher'], find: 'andelen vinster', start: 'Det hela = alla matcher: $12 + 3 + 5 = 20$', sol: ['Det hela $= 20$', '$12/20 = 0{,}6 = 60$ %'], traps: [[240, 'Det hela är alla matcher (20), och delen är 12.'], [70.59, 'Det hela är alla 20 matcher, inte 17.']], tol: 0.01 },
      { lv: 'F', q: 'Av 250 tillfrågade svarade 45 "vet ej". Hur stor andel är det i procent?', type: 'num', a: 18, u: '%', calc: '45/250*100', given: ['delen 45', 'det hela 250'], find: 'andelen', start: '$45/250$', sol: ['$45/250 = 0{,}18 = 18$ %'] }
    ],
    kw: 'andel andelen procent hur många procent del av hela beräkna procent'
  });
  S.push({
    id: 's9-percent-part', ch: 's9-procent', w: [47], title: 'Beräkna delen', sub: '25 % av 240',
    idea: pctIdea, anchor: '"av" betyder gånger. 15 % av 320 = 0,15 · 320.',
    cue: ['"… % av …"', 'Du vet procenten och det hela.'],
    cvis: { t: 'pctBar', whole: 240, part: 60, pct: 25, unk: 'part' },
    f: { name: 'Delen', main: '\\text{delen} = \\text{andelen} \\cdot \\text{det hela}', when: 'Du vet procenten och det hela och söker hur mycket det är.', sym: [['andelen', 'i decimalform: 25 % = 0,25']], forms: pctForms, ex: '$25$ % av $240 = 0{,}25 \\cdot 240 = 60$', trap: 'Skriv procenten i decimalform: 2,5 % = 0,025 (inte 0,25).' },
    h1: '"Procent av" – du söker delen.',
    ex: { q: 'Hur mycket är 25 % av 240?', vis: { t: 'pctBar', whole: 240, part: 60, pct: 25, unk: 'part' }, given: ['andelen 25 %', 'det hela 240'], find: 'delen', rule: '\\text{andel} \\cdot \\text{hela}', steps: [['25 % i decimalform?', '$0{,}25$'], ['"av" betyder …', 'gånger: $0{,}25 \\cdot 240 = 60$']], ans: '60' },
    g: { q: 'Hur mycket är 15 % av 320?', vis: { t: 'pctBar', whole: 320, part: 48, pct: 15, unk: 'part' }, given: ['andelen 15 %', 'det hela 320'], find: 'delen', opts: ['0{,}15 \\cdot 320', '320 / 0{,}15', '15 \\cdot 320'], oc: 0, why: 'Delen = andelen · det hela.', type: 'num', a: 48, calc: '0.15*320', start: '$0{,}15 \\cdot 320$', sol: ['$0{,}15 \\cdot 320 = 48$'], traps: [[4800, 'Gör om 15 % till 0,15 först.'], [2133.33, 'Du delade. "Av" betyder gånger.']], tol: 0.01 },
    p: [
      { lv: 'A', q: 'Hur mycket är 72 % av 250?', type: 'num', a: 180, calc: '0.72*250', given: ['72 %', 'det hela 250'], find: 'delen', start: '$0{,}72 \\cdot 250$', sol: ['$= 180$'] },
      { lv: 'B', q: 'Hur mycket är 2,5 % av 800?', type: 'num', a: 20, calc: '0.025*800', given: ['2,5 %', 'det hela 800'], find: 'delen', start: '2,5 % = 0,025', sol: ['$0{,}025 \\cdot 800 = 20$'], traps: [[200, '2,5 % = 0,025, inte 0,25.']] },
      { lv: 'D', q: 'En jacka kostar 1 200 kr. Det är 30 % rabatt. Hur många kronor sparar du?', type: 'num', a: 360, u: 'kr', calc: '0.3*1200', given: ['pris 1 200 kr', 'rabatt 30 %'], find: 'rabatten i kr', start: 'Rabatten är 30 % AV priset.', sol: ['$0{,}30 \\cdot 1200 = 360$ kr'], traps: [[840, 'Det är nya priset. Frågan gäller hur mycket du SPARAR.']] },
      { lv: 'F', q: 'Moms är 25 % av priset utan moms. En vara kostar 480 kr utan moms. Hur stor är momsen?', type: 'num', a: 120, u: 'kr', calc: '0.25*480', given: ['pris utan moms 480 kr', 'moms 25 %'], find: 'momsen i kr', start: '$0{,}25 \\cdot 480$', sol: ['$= 120$ kr'] }
    ],
    kw: 'delen procent av beräkna delen rabatt hur mycket är procent av'
  });
  S.push({
    id: 's9-percent-whole', ch: 's9-procent', w: [47], title: 'Beräkna det hela', sub: '60 är 25 % av vad?',
    idea: pctIdea, anchor: 'Baklänges: det hela = delen / andelen.',
    cue: ['"… är … % av vilket tal?"', 'Du vet delen och procenten men inte helheten.'],
    cvis: { t: 'pctBar', whole: 240, part: 60, pct: 25, unk: 'whole' },
    f: { name: 'Det hela', main: '\\text{det hela} = \\frac{\\text{delen}}{\\text{andelen}}', when: 'Du vet hur mycket en del är och hur många procent den är.', sym: [['andelen', 'i decimalform']], forms: pctForms, ex: '$60 / 0{,}25 = 240$', trap: 'Svaret ska vara STÖRRE än delen (om andelen är under 100 %).' },
    h1: 'Du vet delen och procenten – det hela är okänt. Formeln baklänges.',
    ex: { q: '60 är 25 % av vilket tal?', vis: { t: 'pctBar', whole: 240, part: 60, pct: 25, unk: 'whole' }, given: ['delen 60', 'andelen 25 %'], find: 'det hela', rule: '\\frac{\\text{delen}}{\\text{andelen}}', steps: [['Vad är okänt?', 'Det hela'], ['Baklänges: dela', '$60 / 0{,}25 = 240$'], ['Rimligt?', '25 % är en fjärdedel. $4 \\cdot 60 = 240$ ✓']], ans: '240' },
    g: { q: '45 är 15 % av vilket tal?', vis: { t: 'pctBar', whole: 300, part: 45, pct: 15, unk: 'whole' }, given: ['delen 45', 'andelen 15 %'], find: 'det hela', opts: ['45 / 0{,}15', '45 \\cdot 0{,}15', '0{,}15 / 45'], oc: 0, why: 'Det hela är okänt → dela delen med andelen.', type: 'num', a: 300, calc: '45/0.15', start: '$45 / 0{,}15$', sol: ['$45/0{,}15 = 300$'], traps: [[6.75, 'Du multiplicerade. Söker du det hela ska du dela.']] },
    p: [
      { lv: 'A', q: '84 är 70 % av vilket tal?', type: 'num', a: 120, calc: '84/0.7', given: ['delen 84', '70 %'], find: 'det hela', start: '$84 / 0{,}70$', sol: ['$= 120$'], traps: [[58.8, 'Söker du det hela: dela, inte multiplicera.']] },
      { lv: 'B', q: '18 är 12 % av vilket tal?', type: 'num', a: 150, calc: '18/0.12', given: ['delen 18', '12 %'], find: 'det hela', start: '$18 / 0{,}12$', sol: ['$= 150$'] },
      { lv: 'D', q: '9 elever i en klass har syskon på skolan. Det är 36 % av klassen. Hur många elever går i klassen?', type: 'num', a: 25, calc: '9/0.36', given: ['delen 9 elever', '36 %'], find: 'antal i klassen', start: '$9 / 0{,}36$', sol: ['$9/0{,}36 = 25$ elever'], traps: [[3.24, 'Du söker hela klassen – dela 9 med 0,36.']] },
      { lv: 'F', q: 'Lisa har sparat 1 350 kr. Det är 45 % av vad en cykel kostar. Vad kostar cykeln?', type: 'num', a: 3000, u: 'kr', calc: '1350/0.45', given: ['delen 1 350 kr', '45 %'], find: 'cykelns pris', start: '$1350 / 0{,}45$', sol: ['$= 3000$ kr'] }
    ],
    kw: 'det hela procent av vilket tal hela beräkna det hela baklänges procent'
  });
  S.push({
    id: 's9-change-factor', ch: 's9-procent', w: [47], title: 'Förändringsfaktor', sub: 'ökning och minskning i ett steg',
    idea: 'Före förändringen är värdet 100 %. Ökar det med 8 % är det efteråt 108 % = **1,08**. Minskar det med 15 % är det 85 % = **0,85**. Den siffran är förändringsfaktorn.',
    anchor: 'Ökning p % → 1 + p/100. Minskning p % → 1 − p/100.',
    cue: ['Ordet ökar/minskar/höjs/sänks/rabatt med … %.', 'Du ska få nya värdet direkt.'],
    cvis: { t: 'change', start: 800, pct: 15, dir: -1 },
    f: { name: 'Förändringsfaktor', main: '\\text{nytt} = \\text{gammalt} \\cdot \\text{faktor}', when: 'Ett värde ökar eller minskar med en viss procent.', sym: [['faktor > 1', 'ökning (1,08 = +8 %)'], ['faktor < 1', 'minskning (0,85 = −15 %)']], forms: [['Söker nytt värde', '\\text{nytt} = \\text{gammalt} \\cdot f'], ['Söker gamla värdet', '\\text{gammalt} = \\frac{\\text{nytt}}{f}'], ['Söker faktorn', 'f = \\frac{\\text{nytt}}{\\text{gammalt}}'], ['Faktor → procent', '1{,}12 \\to +12\\% \\quad 0{,}88 \\to -12\\%']], ex: '$800 \\cdot 0{,}85 = 680$', trap: 'Minskning med 15 % ger faktorn 0,85 – inte 0,15.' },
    h1: 'Något ökar eller minskar med en procent. Vad är förändringsfaktorn?',
    ex: { q: '800 kr minskar med 15 %. Vad blir det nya värdet?', vis: { t: 'change', start: 800, pct: 15, dir: -1, unit: ' kr' }, given: ['gammalt 800 kr', 'minskning 15 %'], find: 'nytt värde', rule: '\\text{nytt} = \\text{gammalt} \\cdot f', steps: [['Hur många procent finns kvar?', '$100 - 15 = 85$ % → faktor $0{,}85$'], ['Räkna', '$800 \\cdot 0{,}85 = 680$ kr']], ans: '680 kr' },
    g: { q: 'En vara kostar 500 kr och priset ökar med 8 %. Vad blir det nya priset?', vis: { t: 'change', start: 500, pct: 8, dir: 1, unit: ' kr' }, given: ['500 kr', 'ökning 8 %'], find: 'nytt pris', opts: ['500 \\cdot 1{,}08', '500 \\cdot 0{,}08', '500 + 8'], oc: 0, why: '100 % + 8 % = 108 % = 1,08.', type: 'num', a: 540, u: 'kr', calc: '500*1.08', start: '$500 \\cdot 1{,}08$', sol: ['$= 540$ kr'], traps: [[40, 'Det är bara ökningen (8 %). Nya priset = 500 · 1,08.'], [508, 'Du lade till 8 kr, inte 8 %.']] },
    p: [
      { lv: 'A', q: '1 200 kr minskar med 25 %. Nytt värde?', vis: { t: 'change', start: 1200, pct: 25, dir: -1, unit: ' kr' }, type: 'num', a: 900, u: 'kr', calc: '1200*0.75', given: ['1 200 kr', 'minskning 25 %'], find: 'nytt värde', start: 'Faktor $0{,}75$', sol: ['$1200 \\cdot 0{,}75 = 900$ kr'], traps: [[300, 'Det är minskningen. Nya värdet = 1200 · 0,75.']] },
      { lv: 'B', q: 'Vilken förändringsfaktor motsvarar en minskning med 12 %?', type: 'num', a: 0.88, calc: '1-0.12', given: ['minskning 12 %'], find: 'faktorn', start: '$1 - 0{,}12$', sol: ['$1 - 0{,}12 = 0{,}88$'], traps: [[0.12, 'Det är minskningen. Faktorn är det som är kvar: 0,88.'], [1.12, 'Minskning → faktor under 1.']] },
      { lv: 'C', q: 'Ett pris är 270 kr efter en ökning med 8 %. Vad var priset före?', type: 'num', a: 250, u: 'kr', calc: '270/1.08', given: ['nytt pris 270 kr', 'ökning 8 %'], find: 'gamla priset', start: 'Baklänges: $\\text{gammalt} = 270 / 1{,}08$', sol: ['$270 / 1{,}08 = 250$ kr'], traps: [[248.4, 'Du drog av 8 % av 270. Men 8 % räknades på det gamla priset – dela med 1,08.']] },
      { lv: 'D', q: 'En aktie gick från 80 kr till 92 kr. Vilken var förändringsfaktorn?', type: 'num', a: 1.15, calc: '92/80', given: ['gammalt 80 kr', 'nytt 92 kr'], find: 'förändringsfaktorn', start: '$f = 92 / 80$', sol: ['$92/80 = 1{,}15$ (en ökning med 15 %)'], traps: [[12, 'Det är ökningen i kronor. Faktorn = nytt / gammalt.'], [0.87, 'Du delade gammalt med nytt.']], tol: 0.005 },
      { lv: 'F', q: 'En lön på 25 000 kr höjs med 4 %. Vad blir den nya lönen?', type: 'num', a: 26000, u: 'kr', calc: '25000*1.04', given: ['25 000 kr', 'höjning 4 %'], find: 'ny lön', start: 'Faktor 1,04', sol: ['$25\\,000 \\cdot 1{,}04 = 26\\,000$ kr'] }
    ],
    kw: 'förändringsfaktor ökning minskning procent höjs sänks rabatt nytt pris faktor 1,08'
  });
  S.push({
    id: 's9-repeated-change', ch: 's9-procent', w: [48], title: 'Upprepad förändring', sub: 'samma procent flera gånger',
    idea: 'Ökar något med 5 % varje år, multiplicerar du med 1,05 **varje år**. Två år: $\\cdot 1{,}05 \\cdot 1{,}05 = \\cdot 1{,}05^2$. Procenten räknas på det nya värdet varje gång.',
    anchor: 'Samma faktor n gånger → faktorⁿ. (Inte 5 % · n!)',
    cue: ['"per år", "varje månad", "två gånger i rad".', 'Ränta, värdeminskning, befolkning.'],
    cvis: { t: 'repeat', start: 1000, f: 1.1, n: 2 },
    f: { name: 'Upprepad förändring', main: '\\text{nytt} = \\text{start} \\cdot f^n', when: 'Samma procentuella förändring sker flera gånger.', sym: [['f', 'förändringsfaktorn'], ['n', 'antal gånger']], forms: [['Söker slutvärdet', 'S \\cdot f^n'], ['Söker startvärdet', '\\frac{\\text{slut}}{f^n}'], ['Total förändring', 'f^n - 1 \\text{ (i decimalform)}']], ex: '$1000 \\cdot 1{,}10^2 = 1210$', trap: '+10 % två gånger är +21 %, inte +20 %.' },
    h1: 'Samma förändring upprepas – använd faktorn upphöjd till antalet gånger.',
    ex: { q: '1 000 kr ökar med 10 % per år i två år. Hur mycket är det då?', vis: { t: 'repeat', start: 1000, f: 1.1, n: 2 }, given: ['start 1 000 kr', '+10 % per år', '2 år'], find: 'värdet efter 2 år', rule: 'S \\cdot f^n', steps: [['Faktor per år?', '$1{,}10$'], ['Två år', '$1000 \\cdot 1{,}10^2$'], ['Räkna', '$1000 \\cdot 1{,}21 = 1210$ kr'], ['Varför inte 1 200?', 'År 2 räknas 10 % på 1 100, inte på 1 000.']], ans: '1 210 kr' },
    g: { q: '2 000 kr ökar med 5 % per år i 2 år. Vad är värdet efter två år?', vis: { t: 'repeat', start: 2000, f: 1.05, n: 2 }, given: ['2 000 kr', '+5 % per år', '2 år'], find: 'slutvärdet', opts: ['2000 \\cdot 1{,}05^2', '2000 \\cdot 1{,}10', '2000 \\cdot 1{,}05 \\cdot 2'], oc: 0, why: 'Samma faktor två gånger.', type: 'num', a: 2205, u: 'kr', calc: '2000*1.05**2', start: '$1{,}05^2 = 1{,}1025$', sol: ['$2000 \\cdot 1{,}1025 = 2205$ kr'], traps: [[2200, 'Du räknade 10 % på en gång. Andra året räknas 5 % på 2100.']] },
    p: [
      { lv: 'A', q: '800 minskar med 10 % två gånger. Vad blir slutvärdet?', vis: { t: 'repeat', start: 800, f: 0.9, n: 2 }, type: 'num', a: 648, calc: '800*0.9**2', given: ['800', '−10 % två gånger'], find: 'slutvärdet', start: '$800 \\cdot 0{,}9^2$', sol: ['$0{,}9^2 = 0{,}81$', '$800 \\cdot 0{,}81 = 648$'], traps: [[640, 'Du drog av 20 % på en gång. Andra gången räknas 10 % på 720.']] },
      { lv: 'B', q: '100 ökar med 20 % tre gånger. Vad blir slutvärdet?', type: 'num', a: 172.8, calc: '100*1.2**3', given: ['100', '+20 % tre gånger'], find: 'slutvärdet', start: '$100 \\cdot 1{,}2^3$', sol: ['$1{,}2^3 = 1{,}728$', '$= 172{,}8$'], traps: [[160, 'Det är 60 % rakt på 100. Varje ökning räknas på det nya värdet.']] },
      { lv: 'C', q: 'En bil tappar 15 % av sitt värde varje år. Efter 2 år är den värd 144 500 kr. Vad var den värd från början?', type: 'num', a: 200000, u: 'kr', calc: '144500/0.85**2', given: ['efter 2 år: 144 500 kr', '−15 % per år'], find: 'startvärdet', start: 'Baklänges: $144\\,500 / 0{,}85^2$', sol: ['$0{,}85^2 = 0{,}7225$', '$144\\,500 / 0{,}7225 = 200\\,000$ kr'] },
      { lv: 'D', q: 'Ett pris höjs med 10 % och sänks sedan med 10 %. Hur många procent har priset ändrats totalt? (Svara med negativt tal om det minskat.)', type: 'num', a: -1, u: '%', calc: '(1.1*0.9-1)*100', given: ['+10 %, sedan −10 %'], find: 'total förändring i %', start: '$1{,}10 \\cdot 0{,}90 = ?$', sol: ['$1{,}1 \\cdot 0{,}9 = 0{,}99$', '$0{,}99$ = 1 % mindre → −1 %'], traps: [[0, 'De tar inte ut varandra: sänkningen räknas på ett högre pris. $1{,}1 \\cdot 0{,}9 = 0{,}99$.']] },
      { lv: 'F', q: '5 000 kr sätts in på ett konto med 3 % ränta per år. Hur mycket finns efter 4 år? Avrunda till hela kronor.', type: 'num', a: 5628, u: 'kr', dec: 0, calc: '5000*1.03**4', given: ['5 000 kr', '3 % per år', '4 år'], find: 'saldo efter 4 år', start: '$5000 \\cdot 1{,}03^4$', sol: ['$1{,}03^4 \\approx 1{,}1255$', '$5000 \\cdot 1{,}1255 \\approx 5628$ kr'], traps: [[5600, 'Det är enkel ränta. Räntan räknas på det nya saldot varje år.']] }
    ],
    kw: 'upprepad förändring ränta ränta på ränta per år flera gånger värdeminskning faktor upphöjt'
  });
  S.push({
    id: 's9-percentage-points', ch: 's9-procent', w: [48], title: 'Procentenheter', sub: 'skillnaden mellan två procentsatser',
    idea: 'När en **procentsats** ändras – t.ex. från 30 % till 38 % – är skillnaden **8 procentenheter**. Det är inte samma sak som "8 procent", som skulle betyda 8 % AV 30 %.',
    anchor: 'Procentenheter = subtrahera. Procent = jämför med där du började.',
    cue: ['Två procentsatser (t.ex. stöd för ett parti, ränta).', 'Ordet procentenheter.'],
    cvis: { t: 'pp', from: 30, to: 38 },
    f: { name: 'Procentenheter', main: '\\text{p.e.} = \\text{ny \\%} - \\text{gammal \\%}', when: 'Två procentsatser jämförs.', sym: [['p.e.', 'procentenheter – absolut skillnad']], forms: [['Skillnad i procentenheter', 'p_2 - p_1'], ['Förändring i procent', '\\frac{p_2 - p_1}{p_1}']], ex: '$38 - 30 = 8$ procentenheter (men $8/30 \\approx 27$ % ökning)', trap: 'Räntan 2 % → 3 %: +1 procentenhet, men +50 %.' },
    h1: 'Två procentsatser jämförs. Söker du skillnaden (procentenheter) eller förändringen i procent?',
    ex: { q: 'Andelen ökar från 30 % till 38 %. Hur många procentenheter är ökningen?', vis: { t: 'pp', from: 30, to: 38 }, given: ['från 30 %', 'till 38 %'], find: 'ökning i procentenheter', rule: 'p_2 - p_1', steps: [['Procentenheter = ?', 'Skillnaden'], ['Räkna', '$38 - 30 = 8$']], ans: '8 procentenheter' },
    g: { q: 'Andelen stiger från 42 % till 55 %. Hur många procentenheter är ökningen?', vis: { t: 'pp', from: 42, to: 55 }, given: ['42 %', '55 %'], find: 'procentenheter', opts: ['55 - 42', '\\frac{55-42}{42}', '\\frac{55}{42}'], oc: 0, why: 'Procentenheter är bara skillnaden.', type: 'num', a: 13, u: 'procentenheter', calc: '55-42', start: '$55 - 42$', sol: ['$= 13$ procentenheter'], traps: [[30.95, 'Det är ökningen i procent. Procentenheter = bara skillnaden.']], tol: 0.01 },
    p: [
      { lv: 'A', q: 'Andelen sjunker från 80 % till 68 %. Hur många procentenheter är minskningen?', vis: { t: 'pp', from: 80, to: 68 }, type: 'num', a: 12, u: 'procentenheter', calc: '80-68', given: ['80 %', '68 %'], find: 'minskning i p.e.', start: '$80 - 68$', sol: ['$= 12$ procentenheter'] },
      { lv: 'C', q: 'Räntan höjs från 2 % till 3 %. Hur många procent ökade räntan?', vis: { t: 'pp', from: 2, to: 3 }, type: 'num', a: 50, u: '%', calc: '(3-2)/2*100', given: ['2 %', '3 %'], find: 'ökning i procent', start: 'Förändring / ursprung: $1/2$', sol: ['Ökning = 1 procentenhet', '$1/2 = 0{,}5 = 50$ %'], traps: [[1, '1 är ökningen i procentenheter. I procent: 1 av 2 = 50 %.']] },
      { lv: 'D', q: 'Från 20 % till 30 % är ökningen i procentenheter:', type: 'choice', opts: ['10', '50', '150', '20'], a: '10', traps: [['50', '50 % är den relativa ökningen. I procentenheter: 30 − 20.']], sol: ['$30 - 20 = 10$ procentenheter'] },
      { lv: 'F', q: 'Ett parti hade 8 % och fick 6 % i nästa val. Hur många procent minskade stödet? (svara med positivt tal)', type: 'num', a: 25, u: '%', calc: '(8-6)/8*100', given: ['8 %', '6 %'], find: 'minskning i procent', start: 'Minskning 2 procentenheter, jämför med 8.', sol: ['$2/8 = 0{,}25 = 25$ %'], traps: [[2, 'Det är procentenheter. I procent: 2/8.']] }
    ],
    kw: 'procentenheter procentenhet skillnad procentsats ränta partier'
  });
  S.push({
    id: 's9-percent-problem', ch: 's9-procent', w: [49], title: 'Problemlösning med procent', sub: 'välj rätt metod',
    idea: 'Provuppgifter säger inte vilken metod du ska ta. Börja alltid med två frågor: **Vad vet jag?** och **vad söker jag?** – delen, andelen, det hela, nytt värde eller gammalt värde.',
    anchor: 'Rita en stapel: 100 % = det hela. Markera det du vet.',
    cue: ['En vardagstext med procent, pris, rabatt, lön, befolkning.'],
    cvis: { t: 'pctBar', whole: 1200, part: 900, pct: 75, unk: 'whole' },
    f: { name: 'Procent – välj metod', main: '\\text{delen} = \\text{andelen} \\cdot \\text{det hela}', when: 'Alla procentproblem – välj vilken del av sambandet som är okänd.', sym: [['efter rabatt p %', 'kvar: (100 − p) %']], forms: [['Ordinarie pris efter rabatt', '\\frac{\\text{rabatterat}}{1 - p}'], ['Ökning i procent', '\\frac{\\text{ny} - \\text{gammal}}{\\text{gammal}}'], ['Nytt värde', '\\text{gammal} \\cdot f']], ex: '900 kr efter 25 % rabatt: $900 / 0{,}75 = 1200$ kr', trap: 'Rabatten räknas på ORDINARIE pris. Lägg inte på 25 % på 900.' },
    h1: 'Sortera: vad vet du, och vad söker du – del, andel, det hela, nytt eller gammalt värde?',
    ex: { q: 'En jacka kostar 900 kr efter 25 % rabatt. Vad var ordinarie pris?', vis: { t: 'pctBar', whole: 1200, part: 900, pct: 75, unk: 'whole', unit: ' kr' }, given: ['pris efter rabatt 900 kr', 'rabatt 25 %'], find: 'ordinarie pris (det hela)', rule: '\\text{det hela} = \\frac{\\text{delen}}{\\text{andelen}}', steps: [['Hur många procent av ordinarie pris är 900 kr?', '$100 - 25 = 75$ %'], ['900 är alltså delen. Söker det hela →', '$900 / 0{,}75 = 1200$ kr'], ['Kontroll', '$1200 \\cdot 0{,}75 = 900$ ✓']], ans: '1 200 kr' },
    g: { q: 'Efter 20 % rabatt kostar en cykel 3 200 kr. Vad var ordinarie pris?', vis: { t: 'pctBar', whole: 4000, part: 3200, pct: 80, unk: 'whole', unit: ' kr' }, given: ['efter rabatt 3 200 kr', 'rabatt 20 %'], find: 'ordinarie pris', opts: ['3200 / 0{,}80', '3200 \\cdot 1{,}20', '3200 / 0{,}20'], oc: 0, why: '3 200 kr är 80 % av ordinarie pris.', type: 'num', a: 4000, u: 'kr', calc: '3200/0.8', start: '$3200 / 0{,}8$', sol: ['3 200 kr = 80 %', '$3200/0{,}8 = 4000$ kr'], traps: [[3840, 'Du lade på 20 % på 3 200. Rabatten räknades på ordinarie pris – dela med 0,8.'], [16000, '3 200 kr är 80 %, inte 20 %.']] },
    p: [
      { lv: 'A', q: 'Efter 10 % rabatt kostar en tröja 450 kr. Vad var ordinarie pris?', vis: { t: 'pctBar', whole: 500, part: 450, pct: 90, unk: 'whole', unit: ' kr' }, type: 'num', a: 500, u: 'kr', calc: '450/0.9', given: ['efter rabatt 450 kr', 'rabatt 10 %'], find: 'ordinarie pris', start: '450 kr är 90 % av ordinarie pris.', sol: ['$450 / 0{,}9 = 500$ kr'], traps: [[495, 'Du lade på 10 % på 450. Rabatten räknades på ordinarie pris – dela med 0,9.']] },
      { lv: 'B', q: 'Ett värde går från 80 till 100. Hur stor är ökningen i procent?', type: 'num', a: 25, u: '%', calc: '(100-80)/80*100', given: ['från 80', 'till 100'], find: 'ökning i %', start: 'Ökningen 20 jämförs med där du började (80).', sol: ['Ökning $= 20$', '$20/80 = 0{,}25 = 25$ %'], traps: [[20, 'Ökningen är 20 (enheter), men i procent: 20/80.'], [80, 'Det är 80/100 – men jämför med startvärdet: 20/80.']] },
      { lv: 'D', q: 'En skola har 640 elever. 35 % går i åk 9. Hur många elever går INTE i åk 9?', type: 'num', a: 416, calc: '640*0.65', given: ['640 elever', '35 % i åk 9'], find: 'elever som inte går i åk 9', start: 'Inte åk 9 = 65 %.', sol: ['$100 - 35 = 65$ %', '$0{,}65 \\cdot 640 = 416$'], traps: [[224, 'Det är antalet I åk 9. Frågan gäller de andra.']] },
      { lv: 'D', q: 'En telefon kostade 4 000 kr. Priset sänktes till 3 400 kr. Med hur många procent sänktes priset?', type: 'num', a: 15, u: '%', calc: '600/4000*100', given: ['före 4 000 kr', 'efter 3 400 kr'], find: 'sänkning i %', start: 'Sänkning 600 kr. Jämför med 4 000.', sol: ['$4000 - 3400 = 600$', '$600/4000 = 0{,}15 = 15$ %'], traps: [[17.65, 'Jämför med det ursprungliga priset (4 000), inte 3 400.']], tol: 0.01 },
      { lv: 'F', q: 'En stad hade 48 000 invånare. Den växte med 2,5 %. Hur många invånare har staden nu?', type: 'num', a: 49200, calc: '48000*1.025', given: ['48 000', '+2,5 %'], find: 'nytt antal', start: 'Faktor 1,025', sol: ['$48\\,000 \\cdot 1{,}025 = 49\\,200$'], traps: [[1200, 'Det är ökningen. Nytt antal = 48 000 · 1,025.']] }
    ],
    kw: 'procent problemlösning rabatt ordinarie pris hur procent räknar man procent ökning procent lön'
  });


  /* ================= TILLÄGG v5.1 · KAPITEL 1 · TAL (källa: HT-26 år 9, v. 34–38) ================= */
  S.push({
    id: 's9-names', ch: 's9-tal', w: [34], title: 'Namn på stora och små tal', sub: 'miljon, miljard, biljon · tusendel, miljondel',
    idea: 'Stora och små tal har egna namn. På svenska är **miljon** $10^6$, **miljard** $10^9$ och **biljon** $10^{12}$. Små tal slutar på **-del**: en **tusendel** är $10^{-3}$ och en **miljondel** är $10^{-6}$. Namnen hoppar tre nollor i taget.',
    anchor: 'Tre nollor till per namn: tusen 10³ → miljon 10⁶ → miljard 10⁹ → biljon 10¹². OBS: engelskans "billion" är svensk miljard.',
    cue: ['Orden miljon, miljard, biljon, tusendel eller miljondel.', 'Frågan ber dig skriva ett namn som tal eller som tiopotens.'],
    cvis: { t: 'names', hl: 'miljard' },
    f: {
      name: 'Namn på stora och små tal', main: '\\text{miljon}=10^6,\\ \\text{miljard}=10^9,\\ \\text{biljon}=10^{12}', when: 'När ett tal är skrivet med ord, eller ska skrivas med ord.',
      sym: [['tusen', '10³ = 1 000'], ['miljon', '10⁶ = 1 000 000'], ['miljard', '10⁹ (nio nollor)'], ['biljon', '10¹² (tolv nollor)'], ['tusendel', '10⁻³ = 0,001'], ['miljondel', '10⁻⁶ = 0,000001']],
      forms: [['Namn → tiopotens', '\\text{miljard} \\to 10^9'], ['Tiopotens → namn', '10^{6} \\to \\text{miljon}'], ['Små tal', '10^{-n} = \\text{n decimaler}']],
      ex: '$3$ miljarder $= 3 \\cdot 10^9 = 3\\,000\\,000\\,000$', trap: 'Svensk **biljon** är $10^{12}$ (tusen miljarder). Engelskans "billion" är $10^9$ = svensk miljard.'
    },
    h1: 'Det handlar om ett namn på en tiopotens. Hur många nollor har namnet?',
    ex: {
      q: 'Skriv en miljard som en tiopotens.', vis: { t: 'names', hl: 'miljard' }, given: ['en miljard'], find: 'en tiopotens 10ⁿ', rule: '\\text{miljard}=10^9',
      steps: [['Vilket namn är det?', 'En miljard har **nio** nollor: 1 000 000 000'], ['Skriv som tiopotens', '$10^9$']], ans: '10⁹'
    },
    g: {
      q: 'En biljon skrivs som $10^n$. Vilket tal är n?', vis: { t: 'names', hl: 'biljon' }, given: ['biljon'], find: 'exponenten n',
      opts: ['\\text{biljon} = 10^{12}', '\\text{biljon} = 10^{9}', '\\text{biljon} = 10^{6}'], oc: 0, why: 'Svensk biljon är tusen miljarder: $10^9 \\cdot 10^3 = 10^{12}$.',
      type: 'num', a: 12, calc: '9+3', start: 'En biljon är 1 000 miljarder.', sol: ['1 miljard $= 10^9$', 'Tusen miljarder: $10^9 \\cdot 10^3 = 10^{12}$'], traps: [[9, 'Det är en miljard. En biljon är tusen miljarder: $10^{12}$.'], [6, 'Det är en miljon. Biljon är mycket större: $10^{12}$.']], ab: ['B']
    },
    p: [
      { lv: 'A', q: 'Hur många nollor har en miljon?', vis: { t: 'names', hl: 'miljon' }, type: 'num', a: 6, calc: '6', given: ['en miljon'], find: 'antal nollor', start: '$10^n$ har n nollor. Miljon = $10^6$.', sol: ['En miljon $= 1\\,000\\,000 = 10^6$', '6 nollor'], traps: [[3, 'Tre nollor är tusen. Miljon är tusen tusen: 6 nollor.'], [9, 'Nio nollor är en miljard.']], ab: ['B'] },
      { lv: 'B', q: 'En miljard är hur många miljoner?', type: 'num', a: 1000, calc: '10**9/10**6', given: ['1 miljard = 10⁹', '1 miljon = 10⁶'], find: 'antal miljoner', start: '$10^9 / 10^6$', sol: ['$10^9 / 10^6 = 10^{9-6} = 10^3$', '$= 1000$'], traps: [[100, 'Exponenterna skiljer sig med 3 (9 − 6), så det är 10³ = 1 000.']], ab: ['B', 'M'] },
      { lv: 'C', q: 'Skriv 3 miljoner som ett vanligt tal.', type: 'num', a: 3000000, calc: '3*10**6', given: ['3 miljoner'], find: 'talet med siffror', start: '$3 \\cdot 10^6$', sol: ['En miljon $= 10^6$', '$3 \\cdot 10^6 = 3\\,000\\,000$'], traps: [[300000, 'Det är 300 tusen. En miljon har sex nollor.'], [3000000000, 'Det är 3 miljarder. En miljon har sex nollor, inte nio.']], ab: ['M'] },
      { lv: 'D', q: 'Vilket namn har 10⁻⁶?', vis: { t: 'names', hl: 'miljondel' }, type: 'choice', opts: ['tusendel', 'miljondel', 'miljarddel', 'miljon'], a: 'miljondel', traps: [['tusendel', 'En tusendel är $10^{-3}$. Här är exponenten −6.'], ['miljon', 'Miljon är $10^6$ (stort tal). Negativ exponent ger ett litet tal: miljondel.']], sol: ['$10^{-3}$ = tusendel, $10^{-6}$ = miljondel', 'Svar: miljondel'], ab: ['B'] },
      { lv: 'D', q: 'I en engelsk text står "a billion people". Vad heter talet 10⁹ på svenska?', type: 'choice', opts: ['miljon', 'miljard', 'biljon', 'biljard'], a: 'miljard', traps: [['biljon', 'Svensk biljon är $10^{12}$. Engelskans "billion" ($10^9$) motsvarar svensk miljard.']], sol: ['Svenska: miljard = $10^9$, biljon = $10^{12}$', 'Engelska "billion" = $10^9$ = svensk miljard'], ab: ['B', 'K'] },
      { lv: 'F', q: 'Ett företag omsätter 4 miljarder kronor. Skriv det i grundpotensform: ? · 10ⁿ kr', type: 'sci', a: [4, 9], given: ['4 miljarder', 'miljard = 10⁹'], find: 'omsättningen som a · 10ⁿ', start: 'Miljard $= 10^9$', sol: ['$4$ miljarder $= 4 \\cdot 10^9$ kr'], ab: ['M', 'P'] }
    ],
    kw: 'namn stora tal miljon miljard biljon tusendel miljondel biljard nollor hur många nollor namnge'
  });

  S.push({
    id: 's9-sci-calc', ch: 's9-tal', w: [35, 37], title: 'Räkna med grundpotensform', sub: 'gånger och delat med tiopotenser',
    idea: 'Vid **multiplikation** och **division** tar du talen för sig och tiopotenserna för sig. Tiopotenserna räknar du med exponenterna: gånger → **plussa** exponenterna, delat → **minus**. Blir första talet 10 eller mer (eller under 1) justerar du så att det hamnar mellan 1 och 10.',
    anchor: 'Talen för sig, tiopotenserna för sig. Gånger: exponent + exponent. Delat: exponent − exponent.',
    cue: ['Två tal i grundpotensform ska multipliceras eller divideras.', 'Svaret ska stå i grundpotensform.'],
    cvis: { t: 'sciMul', a: 3, m: 4, b: 2, n: 3 },
    f: {
      name: 'Räkna med grundpotensform', main: '(a \\cdot 10^m)(b \\cdot 10^n) = (a \\cdot b) \\cdot 10^{m+n}', when: 'Tal i grundpotensform multipliceras eller divideras.',
      sym: [['a, b', 'talen framför tiopotenserna'], ['m, n', 'exponenterna'], ['Justera', 'om a·b ≥ 10: flytta komma och höj exponenten']],
      forms: [['Division', '\\frac{a \\cdot 10^m}{b \\cdot 10^n} = \\frac{a}{b} \\cdot 10^{m-n}'], ['Justera till grundpotensform', '24 \\cdot 10^7 = 2{,}4 \\cdot 10^8'], ['Addition', '\\text{bara om exponenterna är lika}']],
      ex: '$(3 \\cdot 10^4)(2 \\cdot 10^3) = 6 \\cdot 10^{7}$', trap: 'Plussa exponenterna vid gånger – multiplicera dem inte. Och $24 \\cdot 10^7$ är inte grundpotensform ännu.'
    },
    h1: 'Gånger eller delat? Räkna talen för sig och exponenterna för sig.',
    ex: {
      q: 'Beräkna $(3 \\cdot 10^4) \\cdot (2 \\cdot 10^3)$. Svara i grundpotensform.', vis: { t: 'sciMul', a: 3, m: 4, b: 2, n: 3 }, given: ['3 · 10⁴', '2 · 10³'], find: 'a · 10ⁿ', rule: '(a \\cdot b) \\cdot 10^{m+n}',
      steps: [['Talen för sig', '$3 \\cdot 2 = 6$'], ['Tiopotenserna: gånger → plussa exponenterna', '$10^4 \\cdot 10^3 = 10^{4+3} = 10^7$'], ['Är 6 mellan 1 och 10?', 'Ja → klart: $6 \\cdot 10^7$']], ans: '6 · 10⁷'
    },
    g: {
      q: 'Beräkna $(2 \\cdot 10^5) \\cdot (4 \\cdot 10^2)$. Svara i grundpotensform.', vis: { t: 'sciMul', a: 2, m: 5, b: 4, n: 2 }, given: ['2 · 10⁵', '4 · 10²'], find: 'a · 10ⁿ',
      opts: ['(2 \\cdot 4) \\cdot 10^{5+2}', '(2 \\cdot 4) \\cdot 10^{5 \\cdot 2}', '(2 + 4) \\cdot 10^{5+2}'], oc: 0, why: 'Talen multipliceras och exponenterna adderas.',
      type: 'sci', a: [8, 7], start: '$2 \\cdot 4 = ?$ och $5 + 2 = ?$', sol: ['$2 \\cdot 4 = 8$', '$10^{5+2} = 10^7$', '$8 \\cdot 10^7$'], ab: ['M']
    },
    p: [
      { lv: 'A', q: 'Beräkna $(2 \\cdot 10^4) \\cdot (3 \\cdot 10^5)$. Svara i grundpotensform.', vis: { t: 'sciMul', a: 2, m: 4, b: 3, n: 5 }, type: 'sci', a: [6, 9], given: ['2 · 10⁴', '3 · 10⁵'], find: 'a · 10ⁿ', start: '$2 \\cdot 3$ och $4 + 5$', sol: ['$2 \\cdot 3 = 6$', '$10^{4+5} = 10^9$', '$6 \\cdot 10^9$'], ab: ['M'] },
      { lv: 'B', q: 'Beräkna $\\dfrac{8 \\cdot 10^6}{2 \\cdot 10^2}$. Svara i grundpotensform.', vis: { t: 'sciMul', a: 8, m: 6, b: 2, n: 2, op: 'div' }, type: 'sci', a: [4, 4], given: ['8 · 10⁶', '2 · 10²'], find: 'a · 10ⁿ', start: '$8 / 2$ och $6 - 2$', sol: ['$8 / 2 = 4$', '$10^{6-2} = 10^4$', '$4 \\cdot 10^4$'], ab: ['M'] },
      { lv: 'C', q: 'Beräkna $(6 \\cdot 10^5) \\cdot (4 \\cdot 10^2)$. Svara i grundpotensform.', vis: { t: 'sciMul', a: 6, m: 5, b: 4, n: 2 }, type: 'sci', a: [2.4, 8], given: ['6 · 10⁵', '4 · 10²'], find: 'a · 10ⁿ med 1 ≤ a < 10', start: '$6 \\cdot 4 = 24$ – men 24 är över 10. Flytta kommat och höj exponenten.', sol: ['$6 \\cdot 4 = 24$ och $10^{5+2} = 10^7$', '$24 \\cdot 10^7$ är inte grundpotensform', '$24 = 2{,}4 \\cdot 10$, så $2{,}4 \\cdot 10 \\cdot 10^7 = 2{,}4 \\cdot 10^8$'], ab: ['M'] },
      { lv: 'C', q: 'Beräkna $(5 \\cdot 10^3) \\cdot (4 \\cdot 10^{-5})$ och svara som decimaltal.', type: 'num', a: 0.2, calc: '5*10**3*4*10**-5', given: ['5 · 10³', '4 · 10⁻⁵'], find: 'decimaltalet', start: '$5 \\cdot 4 = 20$ och $3 + (-5) = -2$', sol: ['$5 \\cdot 4 = 20$', '$10^{3+(-5)} = 10^{-2}$', '$20 \\cdot 10^{-2} = 0{,}2$'], traps: [[20, 'Du glömde tiopotensen $10^{-2}$ (= 0,01).'], [0.002, 'Nästan: $20 \\cdot 0{,}01 = 0{,}2$, inte 0,002.']], ab: ['M'] },
      { lv: 'D', q: 'Ljuset går 3 · 10⁸ m varje sekund. Hur långt går det på 2 · 10² sekunder? Svara i grundpotensform (meter).', type: 'sci', a: [6, 10], given: ['3 · 10⁸ m/s', '2 · 10² s'], find: 'sträckan i m som a · 10ⁿ', start: 'sträcka = hastighet · tid', sol: ['$3 \\cdot 10^8 \\cdot 2 \\cdot 10^2$', '$3 \\cdot 2 = 6$ och $10^{8+2} = 10^{10}$', '$6 \\cdot 10^{10}$ m'], ab: ['P', 'M'] },
      { lv: 'D', q: 'Jordens massa är 6 · 10²⁴ kg och månens 7,3 · 10²² kg. Hur många gånger tyngre är jorden än månen? Avrunda till heltal.', type: 'num', a: 82, dec: 0, calc: '6e24/7.3e22', given: ['6 · 10²⁴', '7,3 · 10²²'], find: 'kvoten (hur många gånger)', start: 'Hur många gånger → dela. $6 / 7{,}3$ och $24 - 22$', sol: ['$\\dfrac{6}{7{,}3} \\approx 0{,}82$ och $10^{24-22} = 10^2$', '$0{,}82 \\cdot 100 \\approx 82$'], traps: [[0.82, 'Du glömde tiopotensen $10^2 = 100$.']], ab: ['P', 'M'] },
      { lv: 'F', q: 'Elin räknar $(2 \\cdot 10^3) \\cdot (5 \\cdot 10^4) = 10 \\cdot 10^7$ och lämnar in det som svar. Vad är fel?', type: 'choice', opts: ['Inget – svaret är rätt', 'Exponenterna skulle ha multiplicerats', 'Första talet ska ligga mellan 1 och 10, så svaret ska vara 1 · 10⁸', 'Hon skulle ha adderat 2 och 5'], a: 'Första talet ska ligga mellan 1 och 10, så svaret ska vara 1 · 10⁸', traps: [['Inget – svaret är rätt', 'Värdet stämmer, men grundpotensform kräver att första talet är mellan 1 och 10. $10 \\cdot 10^7 = 1 \\cdot 10^8$.'], ['Exponenterna skulle ha multiplicerats', 'Vid gånger ska exponenterna adderas: 3 + 4 = 7. Felet är att 10 är för stort som första tal.']], sol: ['$2 \\cdot 5 = 10$ och $10^{3+4} = 10^7$', '$10 \\cdot 10^7 = 1 \\cdot 10^1 \\cdot 10^7 = 1 \\cdot 10^8$'], ab: ['R', 'K'] },
      { lv: 'F', q: 'Beräkna $(3 \\cdot 10^4) + (2 \\cdot 10^3)$. Svara i grundpotensform.', type: 'sci', a: [3.2, 4], given: ['3 · 10⁴', '2 · 10³'], find: 'a · 10ⁿ', start: 'Addition går inte med exponenterna. Skriv båda som vanliga tal först.', sol: ['$3 \\cdot 10^4 = 30\\,000$ och $2 \\cdot 10^3 = 2\\,000$', '$30\\,000 + 2\\,000 = 32\\,000$', '$32\\,000 = 3{,}2 \\cdot 10^4$'], ab: ['M', 'R'] }
    ],
    kw: 'grundpotensform räkna multiplicera dividera tiopotenser exponenter plussa exponenter stora tal små tal ljusets hastighet'
  });

  S.push({
    id: 's9-sqrt-more', ch: 's9-tal', w: [38], title: 'Mer om kvadratrötter', sub: 'förenkla, multiplicera och addera rötter',
    idea: 'Rötter har egna räkneregler. Vid **multiplikation** kan du slå ihop eller dela upp under roten: $\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{a \\cdot b}$. Det använder du för att **förenkla**: $\\sqrt{50} = \\sqrt{25 \\cdot 2} = 5\\sqrt{2}$ – du drar ut det som är en jämn kvadrat. **Addition** går inte under roten: $\\sqrt{9+16}$ är inte $\\sqrt{9}+\\sqrt{16}$.',
    anchor: 'Gånger går att dela upp under roten. Plus går inte. Leta efter en kvadrat (4, 9, 16, 25 …) som delar talet.',
    cue: ['Roten ur ett tal som inte är en jämn kvadrat (√12, √50).', 'Ordet förenkla, eller två rötter som multipliceras.', 'Svaret ska vara exakt, med rot.'],
    cvis: { t: 'rootsplit', n: 50 },
    f: {
      name: 'Räkna med kvadratrötter', main: '\\sqrt{a \\cdot b} = \\sqrt{a} \\cdot \\sqrt{b}', when: 'En rot ska förenklas, eller rötter multipliceras.',
      sym: [['√a · √b', 'blir √(a·b)'], ['√(k²·n)', 'blir k·√n'], ['m√a + n√a', 'blir (m+n)√a – samma sorts rot']],
      forms: [['Förenkla en rot', '\\sqrt{50} = \\sqrt{25 \\cdot 2} = 5\\sqrt{2}'], ['Multiplicera rötter', '\\sqrt{2} \\cdot \\sqrt{8} = \\sqrt{16} = 4'], ['Addera lika rötter', '3\\sqrt{2} + 5\\sqrt{2} = 8\\sqrt{2}'], ['Fälla', '\\sqrt{a+b} \\neq \\sqrt{a} + \\sqrt{b}']],
      ex: '$\\sqrt{12} = \\sqrt{4 \\cdot 3} = 2\\sqrt{3}$', trap: '$\\sqrt{9+16} = \\sqrt{25} = 5$, men $\\sqrt{9}+\\sqrt{16} = 7$. Rötter går att dela upp vid gånger, aldrig vid plus.'
    },
    h1: 'Finns det en jämn kvadrat (4, 9, 16, 25 …) som går jämnt upp i talet under roten?',
    ex: {
      q: 'Förenkla $\\sqrt{12}$. Svara på formen $a\\sqrt{b}$.', vis: { t: 'rootsplit', n: 12 }, given: ['√12'], find: 'a√b i enklaste form', rule: '\\sqrt{k^2 \\cdot n} = k\\sqrt{n}',
      steps: [['Vilken jämn kvadrat går jämnt upp i 12?', '4, eftersom $12 = 4 \\cdot 3$'], ['Dela upp roten', '$\\sqrt{4 \\cdot 3} = \\sqrt{4} \\cdot \\sqrt{3}$'], ['Ta roten ur kvadraten', '$\\sqrt{4} = 2$, alltså $2\\sqrt{3}$']], ans: '2√3'
    },
    g: {
      q: 'Förenkla $\\sqrt{18}$. Svara på formen $a\\sqrt{b}$.', vis: { t: 'rootsplit', n: 18 }, given: ['√18'], find: 'a√b i enklaste form',
      opts: ['\\sqrt{9 \\cdot 2}', '\\sqrt{18 / 2}', '\\sqrt{9 + 9}'], oc: 0, why: 'Skriv talet som en produkt där ena faktorn är en jämn kvadrat: $18 = 9 \\cdot 2$.',
      type: 'num', a: 3 * Math.SQRT2, radical: [3, 2], calc: '3*Math.sqrt(2)', start: 'Vilken kvadrat går upp i 18? Prova 9.', sol: ['$18 = 9 \\cdot 2$', '$\\sqrt{18} = \\sqrt{9} \\cdot \\sqrt{2}$', '$= 3\\sqrt{2}$'], traps: [['9√2', 'Du glömde ta roten ur 9: $\\sqrt{9} = 3$, inte 9.'], ['2√3', 'Fel kvadrat: $18 = 9 \\cdot 2$, så det är $3\\sqrt{2}$.']], ab: ['M']
    },
    p: [
      { lv: 'A', q: 'Förenkla $\\sqrt{32}$. Svara på formen $a\\sqrt{b}$.', vis: { t: 'rootsplit', n: 32 }, type: 'num', a: 4 * Math.SQRT2, radical: [4, 2], calc: '4*Math.sqrt(2)', given: ['√32'], find: 'a√b i enklaste form', start: 'Störst jämn kvadrat som går upp i 32: 16.', sol: ['$32 = 16 \\cdot 2$', '$\\sqrt{32} = \\sqrt{16} \\cdot \\sqrt{2} = 4\\sqrt{2}$'], ab: ['M'] },
      { lv: 'B', q: 'Förenkla $\\sqrt{45}$. Svara på formen $a\\sqrt{b}$.', vis: { t: 'rootsplit', n: 45 }, type: 'num', a: 3 * Math.sqrt(5), radical: [3, 5], calc: '3*Math.sqrt(5)', given: ['√45'], find: 'a√b i enklaste form', start: '$45 = 9 \\cdot 5$', sol: ['$45 = 9 \\cdot 5$', '$\\sqrt{45} = 3\\sqrt{5}$'], ab: ['M'] },
      { lv: 'B', q: 'Beräkna $\\sqrt{2} \\cdot \\sqrt{8}$.', type: 'num', a: 4, calc: 'Math.sqrt(2)*Math.sqrt(8)', given: ['√2 · √8'], find: 'värdet', start: 'Gånger: samla under en rot, $\\sqrt{2 \\cdot 8}$.', sol: ['$\\sqrt{2} \\cdot \\sqrt{8} = \\sqrt{16}$', '$= 4$'], traps: [[10, 'Du adderade talen under roten. Vid gånger multiplicerar du: $2 \\cdot 8 = 16$.'], [16, 'Du har 2 · 8 = 16 men glömde roten: $\\sqrt{16} = 4$.']], ab: ['M'] },
      { lv: 'C', q: 'Beräkna $3\\sqrt{2} + 5\\sqrt{2}$. Svara exakt.', type: 'num', a: 8 * Math.SQRT2, radical: [8, 2], calc: '8*Math.sqrt(2)', given: ['3√2 + 5√2'], find: 'a√b', start: 'Samma sorts rot (√2), som x-termer: 3 + 5 = ?', sol: ['Samma rot → addera talen framför: $3 + 5 = 8$', '$8\\sqrt{2}$'], traps: [['8√4', 'Du adderade även talen under roten. Roten (√2) är densamma – addera bara talen framför.'], ['8', 'Roten $\\sqrt{2}$ ska vara kvar: $8\\sqrt{2}$.']], ab: ['M'] },
      { lv: 'C', q: 'Det gäller att $\\sqrt{x} = 6\\sqrt{2}$. Vilket tal är x?', type: 'num', a: 72, calc: '(6*Math.sqrt(2))**2', given: ['√x = 6√2'], find: 'x', start: 'Baklänges: kvadrera båda sidor. $(6\\sqrt{2})^2 = 6^2 \\cdot (\\sqrt{2})^2$', sol: ['$x = (6\\sqrt{2})^2$', '$= 6^2 \\cdot (\\sqrt{2})^2 = 36 \\cdot 2$', '$= 72$'], traps: [[12, 'Du multiplicerade 6 och 2. Kvadrera hela uttrycket: $36 \\cdot 2$.'], [36, 'Du kvadrerade bara 6. Även roten ska kvadreras: $(\\sqrt{2})^2 = 2$.']], ab: ['M', 'R'] },
      { lv: 'D', q: 'En kvadrat har arean 200 cm². Hur lång är sidan? Svara exakt, med rot.', vis: { t: 'sqrt', a: '200 cm²', r: '?' }, type: 'num', a: 10 * Math.SQRT2, radical: [10, 2], u: 'cm', calc: '10*Math.sqrt(2)', given: ['arean 200 cm²', 'kvadrat'], find: 'sidan, exakt', start: 'sida = √area = √200. Förenkla med $200 = 100 \\cdot 2$.', sol: ['$\\text{sida} = \\sqrt{200} = \\sqrt{100 \\cdot 2}$', '$= 10\\sqrt{2}$ cm'], ab: ['P', 'M'] },
      { lv: 'D', q: 'Vilket påstående är sant?', type: 'choice', opts: ['√(9 + 16) = √9 + √16', '√(9 · 16) = √9 · √16', '√16 − √9 = √7', '√9 · √16 = √25'], a: '√(9 · 16) = √9 · √16', traps: [['√(9 + 16) = √9 + √16', '√(9+16) = √25 = 5 men √9 + √16 = 3 + 4 = 7. Plus går inte att dela upp.'], ['√16 − √9 = √7', '√16 − √9 = 4 − 3 = 1, men √7 ≈ 2,65.'], ['√9 · √16 = √25', '√9 · √16 = 3 · 4 = 12. Vid gånger multiplicerar du talen: √(9·16) = √144 = 12.']], sol: ['$\\sqrt{9 \\cdot 16} = \\sqrt{144} = 12$', '$\\sqrt{9} \\cdot \\sqrt{16} = 3 \\cdot 4 = 12$ ✓'], ab: ['R'] },
      { lv: 'D', q: 'Hur skriver man "tre gånger roten ur fem" korrekt?', type: 'choice', opts: ['3√5', '√35', '3 + √5', '√(3 · 5)'], a: '3√5', traps: [['√35', '√35 är roten ur 35 (talet 35 under roten). Tre gånger roten ur fem skrivs 3√5.'], ['√(3 · 5)', 'Det är roten ur 15. Talet 3 ska stå utanför roten: 3√5.']], sol: ['Talet framför roten är en faktor: $3 \\cdot \\sqrt{5} = 3\\sqrt{5}$'], ab: ['K'] },
      { lv: 'F', q: 'Beräkna $\\sqrt{12} \\cdot \\sqrt{3}$.', type: 'num', a: 6, calc: 'Math.sqrt(12)*Math.sqrt(3)', given: ['√12 · √3'], find: 'värdet', start: 'Samla under en rot: $\\sqrt{12 \\cdot 3}$.', sol: ['$\\sqrt{12} \\cdot \\sqrt{3} = \\sqrt{36}$', '$= 6$'], traps: [[15, 'Du adderade. Gånger: $12 \\cdot 3 = 36$, och $\\sqrt{36} = 6$.'], [36, 'Du glömde roten. $\\sqrt{36} = 6$.']], ab: ['M'] }
    ],
    kw: 'mer om kvadratrötter förenkla rot förenkla kvadratrot rötter multiplicera rötter addera rötter rot ur exakt svar 5√2 √50 √12 √18'
  });

  S.push({
    id: 's9-sqrt-div', ch: 's9-tal', w: [38], title: 'Division med kvadratrötter', sub: '√a ÷ √b = √(a ÷ b)',
    idea: 'När du **delar** en kvadratrot med en annan kan du samla allt under **en** rot: $\\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}$. Ofta blir kvoten $a/b$ en jämn kvadrat, och då försvinner roten. Det går även åt andra hållet: roten ur ett bråk är roten ur täljaren delat med roten ur nämnaren.',
    anchor: 'Delat med rötter → dela talen under roten. Roten ur ett bråk → roten ur täljare och nämnare var för sig.',
    cue: ['Två rötter som divideras: √72 ÷ √2.', 'Roten ur ett bråk: √(9/25).', 'Frågan ber om kvoten av två rötter.'],
    cvis: { t: 'rootdiv', a: 72, b: 2 },
    f: {
      name: 'Division med kvadratrötter', main: '\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}', when: 'Två kvadratrötter divideras, eller roten ska tas ur ett bråk.',
      sym: [['√a / √b', 'samla till √(a/b)'], ['√(a/b)', 'kan delas: √a / √b'], ['Mål', 'få en jämn kvadrat under roten']],
      forms: [['Samla', '\\frac{\\sqrt{48}}{\\sqrt{3}} = \\sqrt{\\frac{48}{3}} = \\sqrt{16} = 4'], ['Dela upp bråk', '\\sqrt{\\frac{9}{25}} = \\frac{\\sqrt{9}}{\\sqrt{25}} = \\frac{3}{5}'], ['Fälla', '\\sqrt{a} \\div \\sqrt{b} \\neq \\sqrt{a - b}']],
      ex: '$\\dfrac{\\sqrt{72}}{\\sqrt{2}} = \\sqrt{36} = 6$', trap: 'Dela talen under roten – subtrahera dem inte. $\\sqrt{72} \\div \\sqrt{2} = \\sqrt{36}$, inte $\\sqrt{70}$.'
    },
    h1: 'Delat med två rötter? Samla under en rot och dela talen.',
    ex: {
      q: 'Beräkna $\\dfrac{\\sqrt{72}}{\\sqrt{2}}$.', vis: { t: 'rootdiv', a: 72, b: 2 }, given: ['√72', '√2'], find: 'kvoten', rule: '\\sqrt{a \\div b}',
      steps: [['Samla under en rot', '$\\sqrt{72 \\div 2}$'], ['Dela', '$72 \\div 2 = 36$'], ['Ta roten', '$\\sqrt{36} = 6$']], ans: '6'
    },
    g: {
      q: 'Beräkna $\\dfrac{\\sqrt{50}}{\\sqrt{2}}$.', vis: { t: 'rootdiv', a: 50, b: 2 }, given: ['√50', '√2'], find: 'kvoten',
      opts: ['\\sqrt{50 \\div 2}', '\\sqrt{50 - 2}', '\\sqrt{50} \\div 2'], oc: 0, why: 'Delat → dela talen under roten.',
      type: 'num', a: 5, calc: 'Math.sqrt(50)/Math.sqrt(2)', start: '$50 \\div 2 = ?$ och sedan roten.', sol: ['$\\sqrt{50 \\div 2} = \\sqrt{25}$', '$= 5$'], traps: [['√48', 'Du subtraherade 50 − 2. Vid delat ska du dela: 50 ÷ 2 = 25.']], ab: ['M']
    },
    p: [
      { lv: 'A', q: 'Beräkna $\\dfrac{\\sqrt{48}}{\\sqrt{3}}$.', vis: { t: 'rootdiv', a: 48, b: 3 }, type: 'num', a: 4, calc: 'Math.sqrt(48)/Math.sqrt(3)', given: ['√48', '√3'], find: 'kvoten', start: '$\\sqrt{48 \\div 3}$', sol: ['$48 \\div 3 = 16$', '$\\sqrt{16} = 4$'], ab: ['M'] },
      { lv: 'B', q: 'Beräkna $\\sqrt{\\dfrac{9}{25}}$. Svara som bråk i enklaste form.', type: 'num', a: 0.6, mustFraction: [3, 5], calc: 'Math.sqrt(9/25)', given: ['√(9/25)'], find: 'ett bråk', start: 'Roten ur täljare och nämnare var för sig.', sol: ['$\\sqrt{\\frac{9}{25}} = \\frac{\\sqrt{9}}{\\sqrt{25}}$', '$= \\frac{3}{5}$'], traps: [['9/5', 'Du tog roten ur 25 men inte ur 9. Ta roten ur båda: 3/5.']], ab: ['M'] },
      { lv: 'B', q: 'Beräkna $\\dfrac{\\sqrt{2}}{\\sqrt{8}}$. Svara som bråk i enklaste form.', vis: { t: 'rootdiv', a: 2, b: 8 }, type: 'num', a: 0.5, mustFraction: [1, 2], calc: 'Math.sqrt(2)/Math.sqrt(8)', given: ['√2', '√8'], find: 'ett bråk', start: '$\\sqrt{2 \\div 8} = \\sqrt{\\tfrac{1}{4}}$', sol: ['$\\dfrac{2}{8} = \\dfrac{1}{4}$', '$\\sqrt{\\frac{1}{4}} = \\frac{1}{2}$'], ab: ['M'] },
      { lv: 'C', q: 'Det gäller att $\\dfrac{\\sqrt{x}}{\\sqrt{3}} = 4$. Vilket tal är x?', type: 'num', a: 48, calc: '3*4**2', given: ['√x / √3 = 4'], find: 'x', start: '$\\sqrt{x/3} = 4$. Kvadrera: $x/3 = 16$.', sol: ['$\\sqrt{x \\div 3} = 4$', 'Kvadrera: $x \\div 3 = 16$', '$x = 16 \\cdot 3 = 48$'], traps: [[12, 'Du multiplicerade 4 och 3. Kvadrera först: kvoten under roten är $4^2 = 16$.'], [16, 'Det är x/3. Multiplicera med 3 för att få x.']], ab: ['M', 'R'] },
      { lv: 'D', q: 'Kvadrat A har arean 200 cm² och kvadrat B har arean 8 cm². Hur många gånger längre är sidan i A än i B?', type: 'num', a: 5, calc: 'Math.sqrt(200)/Math.sqrt(8)', given: ['A: 200 cm²', 'B: 8 cm²'], find: 'sidans längdförhållande A / B', start: 'sida = √area. Dela: $\\sqrt{200}/\\sqrt{8}$.', sol: ['$\\dfrac{\\sqrt{200}}{\\sqrt{8}} = \\sqrt{200 \\div 8} = \\sqrt{25}$', '$= 5$'], traps: [[25, 'Det är areaförhållandet. För längd tar du roten: $\\sqrt{25} = 5$.']], ab: ['P'] },
      { lv: 'D', q: 'Vilket uttryck är lika med $\\sqrt{\\dfrac{81}{9}}$?', type: 'choice', opts: ['√81 ÷ √9 = 3', '√81 − √9 = 6', '81 ÷ 9 = 9', '√81 ÷ 9 = 1'], a: '√81 ÷ √9 = 3', traps: [['√81 − √9 = 6', 'Roten ur en kvot är en kvot av rötter – inte en differens.'], ['81 ÷ 9 = 9', 'Du glömde roten: $\\sqrt{81 \\div 9} = \\sqrt{9} = 3$.'], ['√81 ÷ 9 = 1', 'Roten gäller även nämnaren: $\\sqrt{81} \\div \\sqrt{9} = 9 \\div 3 = 3$.']], sol: ['$\\sqrt{81/9} = \\sqrt{9} = 3$', '$\\sqrt{81} \\div \\sqrt{9} = 9 \\div 3 = 3$ ✓'], ab: ['B', 'R'] },
      { lv: 'F', q: 'Beräkna $\\dfrac{\\sqrt{180}}{\\sqrt{5}}$.', type: 'num', a: 6, calc: 'Math.sqrt(180)/Math.sqrt(5)', given: ['√180', '√5'], find: 'kvoten', start: '$\\sqrt{180 \\div 5}$', sol: ['$180 \\div 5 = 36$', '$\\sqrt{36} = 6$'], traps: [[175, 'Du subtraherade. Dela: 180 ÷ 5 = 36.'], [36, 'Du glömde roten: $\\sqrt{36} = 6$.']], ab: ['M'] }
    ],
    kw: 'division kvadratrötter dela rötter kvot av rötter roten ur bråk √72/√2 samla under en rot'
  });

  S.push({
    id: 's9-quadratic', ch: 's9-tal', w: [38], title: 'Andragradsekvationer', sub: 'x² = a har två lösningar',
    idea: 'En **andragradsekvation** har ett $x^2$. Den enklaste typen är $x^2 = a$: vilka tal ger $a$ när man kvadrerar dem? Både $\\sqrt{a}$ **och** $-\\sqrt{a}$, eftersom $(-5)^2 = 25$ precis som $5^2 = 25$. Står $x^2$ inte ensamt löser du ut det först. Är $a$ negativt finns **ingen** lösning, för en kvadrat är aldrig negativ.',
    anchor: 'x² = a → x = ±√a. Först x² ensamt, sedan roten – och glöm inte minus-lösningen. Negativt a: ingen lösning.',
    cue: ['En ekvation med x² (x i kvadrat).', 'Orden "lös ekvationen" och ett x som är kvadrerat.', 'Du ska hitta alla x som uppfyller ekvationen.'],
    cvis: { t: 'quad', a: 25, r1: '−5', r2: '5' },
    f: {
      name: 'Andragradsekvation x² = a', main: 'x^2 = a \\;\\Rightarrow\\; x = \\pm\\sqrt{a}', when: 'Ekvationen har x i kvadrat och inget x på första gradens sätt.',
      sym: [['±', 'både plus och minus'], ['a > 0', 'två lösningar: +√a och −√a'], ['a = 0', 'en lösning: x = 0'], ['a < 0', 'ingen reell lösning']],
      forms: [['Lös ut x² först', 'ax^2 + b = c \\;\\Rightarrow\\; x^2 = \\dfrac{c - b}{a}'], ['Sedan roten', 'x = \\sqrt{x^2} \\text{ eller } x = -\\sqrt{x^2}'], ['Kontrollera', '(-r)^2 = r^2 = a']],
      ex: '$x^2 = 49 \\Rightarrow x = 7$ eller $x = -7$', trap: 'Svaret $x = 7$ räcker inte: även $(-7)^2 = 49$. Ange **båda** lösningarna.'
    },
    h1: 'Står x² ensamt? Ta roten ur båda sidor – och kom ihåg både + och −.',
    ex: {
      q: 'Lös ekvationen $x^2 = 49$.', vis: { t: 'quad', a: 49, r1: '−7', r2: '7' }, given: ['x² = 49'], find: 'alla x som ger 49 när de kvadreras', rule: 'x = \\pm\\sqrt{a}',
      steps: [['Vilka tal gånger sig självt blir 49?', '$7 \\cdot 7 = 49$ – men också $(-7)\\cdot(-7) = 49$'], ['Skriv båda lösningarna', '$x = 7$ eller $x = -7$']], ans: 'x = 7 eller x = −7'
    },
    g: {
      q: 'Lös ekvationen $x^2 = 36$.', vis: { t: 'quad', a: 36, r1: '−6', r2: '6' }, given: ['x² = 36'], find: 'alla x',
      opts: ['x = \\pm\\sqrt{36}', 'x = 36 \\div 2', 'x = \\sqrt{36}'], oc: 0, why: 'Roten ger det positiva talet, men det negativa kvadrerat blir också 36 – därför ±.',
      type: 'roots', a: [-6, 6], calc: '[-Math.sqrt(36), Math.sqrt(36)]', start: 'Vilka två tal gånger sig själva blir 36?', sol: ['$x = \\sqrt{36} = 6$', 'Även $(-6)^2 = 36$', '$x = 6$ eller $x = -6$'], traps: [['18 och -18', 'Du delade med 2. Roten frågar vilket tal gånger SIG SJÄLVT som blir 36.']], ab: ['M']
    },
    p: [
      { lv: 'A', q: 'Lös ekvationen $x^2 = 81$.', vis: { t: 'quad', a: 81, r1: '−9', r2: '9' }, type: 'roots', a: [-9, 9], calc: '[-Math.sqrt(81), Math.sqrt(81)]', given: ['x² = 81'], find: 'alla x', start: '$x = \\pm\\sqrt{81}$', sol: ['$\\sqrt{81} = 9$', '$x = 9$ eller $x = -9$'], traps: [['81', 'Du har kvadraten. Ta roten ur 81 för att få x.']], ab: ['M'] },
      { lv: 'B', q: 'Lös ekvationen $x^2 = 2{,}25$.', type: 'roots', a: [-1.5, 1.5], calc: '[-Math.sqrt(2.25), Math.sqrt(2.25)]', given: ['x² = 2,25'], find: 'alla x', start: 'Vilket tal gånger sig självt blir 2,25? Prova 1,5.', sol: ['$1{,}5 \\cdot 1{,}5 = 2{,}25$', '$x = 1{,}5$ eller $x = -1{,}5$'], ab: ['M'] },
      { lv: 'B', q: 'Lös ekvationen $3x^2 = 75$.', type: 'roots', a: [-5, 5], calc: '[-Math.sqrt(75/3), Math.sqrt(75/3)]', given: ['3x² = 75'], find: 'alla x', start: 'Dela med 3 så att x² står ensamt.', sol: ['$x^2 = 75 \\div 3 = 25$', '$x = \\pm\\sqrt{25}$', '$x = 5$ eller $x = -5$'], traps: [['25', 'Det är x². Ta roten för att få x – och ange båda lösningarna.']], ab: ['M'] },
      { lv: 'C', q: 'Lös ekvationen $x^2 + 4 = 20$.', type: 'roots', a: [-4, 4], calc: '[-Math.sqrt(20-4), Math.sqrt(20-4)]', given: ['x² + 4 = 20'], find: 'alla x', start: 'Subtrahera 4 på båda sidor först.', sol: ['$x^2 = 20 - 4 = 16$', '$x = \\pm 4$'], traps: [['16', 'Det är x². Ta roten ur 16.']], ab: ['M'] },
      { lv: 'C', q: 'Lös ekvationen $2x^2 - 8 = 42$.', type: 'roots', a: [-5, 5], calc: '[-Math.sqrt((42+8)/2), Math.sqrt((42+8)/2)]', given: ['2x² − 8 = 42'], find: 'alla x', start: 'Addera 8, dela med 2, ta sedan roten.', sol: ['$2x^2 = 42 + 8 = 50$', '$x^2 = 25$', '$x = 5$ eller $x = -5$'], traps: [['25', 'Det är x². Ta roten för att få x.']], ab: ['M'] },
      { lv: 'D', q: 'Lös ekvationen $x^2 = -16$. Finns ingen lösning, skriv "ingen".', vis: { t: 'quad', a: -16 }, type: 'roots', a: [], calc: '[]', given: ['x² = −16'], find: 'alla reella x (eller ingen)', start: 'Kan ett tal gånger sig självt bli negativt?', sol: ['$(+4)^2 = 16$ och $(-4)^2 = 16$ – aldrig −16', 'En kvadrat är aldrig negativ → **ingen** lösning'], ab: ['R', 'B'] },
      { lv: 'D', q: 'Lös ekvationen $x^2 = 7$. Avrunda lösningarna till två decimaler.', type: 'roots', a: [-2.65, 2.65], dec: 2, calc: '[-Math.sqrt(7), Math.sqrt(7)]', given: ['x² = 7'], find: 'x, avrundat till två decimaler', start: '$x = \\pm\\sqrt{7}$. 7 ligger mellan 4 och 9, så x är mellan 2 och 3.', sol: ['$x = \\pm\\sqrt{7}$', '$\\sqrt{7} \\approx 2{,}65$', '$x \\approx 2{,}65$ eller $x \\approx -2{,}65$'], ab: ['M'] },
      { lv: 'D', q: 'En kvadratisk tomt har arean 144 m². Hur lång är en sida?', vis: { t: 'sqrt', a: '144 m²', r: '?' }, type: 'num', a: 12, u: 'm', calc: 'Math.sqrt(144)', given: ['arean 144 m²', 'kvadrat'], find: 'sidans längd', start: '$x^2 = 144$ – men en längd kan inte vara negativ.', sol: ['$x^2 = 144$ ger $x = 12$ eller $x = -12$', 'En sidlängd är positiv → $x = 12$ m'], traps: [[-12, 'En längd kan inte vara negativ. Av de två lösningarna duger bara den positiva.']], ab: ['P', 'R'] },
      { lv: 'D', q: 'Elin löste $x^2 = 100$ och svarade "x = 10". Vad är felet?', type: 'choice', opts: ['Inget – svaret är rätt', 'Hon missade att x = −10 också är en lösning', 'Hon skulle ha delat 100 med 2', 'Ekvationen saknar lösning'], a: 'Hon missade att x = −10 också är en lösning', traps: [['Inget – svaret är rätt', 'x = 10 stämmer, men det är bara hälften av svaret: $(-10)^2 = 100$ också.'], ['Ekvationen saknar lösning', 'Det finns lösningar: både 10 och −10 ger 100 när de kvadreras.']], sol: ['$10^2 = 100$ och $(-10)^2 = 100$', 'Båda är lösningar: $x = \\pm 10$'], ab: ['R'] },
      { lv: 'D', q: 'Vilken uträkning visar att x = −3 är en lösning till $x^2 = 9$?', type: 'choice', opts: ['(−3)² = 9', '−3² = 9', '−3 · 2 = 9', '3² = −9'], a: '(−3)² = 9', traps: [['−3² = 9', '−3² betyder −(3²) = −9. Sätt parentes runt −3: (−3)² = 9.']], sol: ['Sätt in x = −3: $(-3)^2 = (-3)\\cdot(-3) = 9$ ✓'], ab: ['K'] },
      { lv: 'F', q: 'Lös ekvationen $5x^2 + 3 = 128$.', type: 'roots', a: [-5, 5], calc: '[-Math.sqrt((128-3)/5), Math.sqrt((128-3)/5)]', given: ['5x² + 3 = 128'], find: 'alla x', start: 'Subtrahera 3, dela med 5, ta roten.', sol: ['$5x^2 = 125$', '$x^2 = 25$', '$x = 5$ eller $x = -5$'], traps: [['25', 'Det är x². Ta roten för att få x.']], ab: ['M'] }
    ],
    kw: 'andragradsekvation andragradsekvationer x i kvadrat x² ekvation två lösningar plus minus ± lös ekvationen kvadrat rot'
  });

  /* ================= TILLÄGG v5.1 · KAPITEL 2 · GEOMETRI (källa: HT-26 år 9, v. 40–45: "mer om vinklar", "mer om Pythagoras sats") ================= */
  S.push({
    id: 's9-angles-more', ch: 's9-geo', w: [43], title: 'Mer om vinklar', sub: 'parallella linjer och månghörningar',
    idea: 'Skär en linje två **parallella** linjer får vinklarna samma värde på samma sätt: **likbelägna** (F-formen) och **alternatvinklar** (Z-formen) är lika stora. **Vertikalvinklar** (X-formen) är alltid lika, och **sidovinklar** blir 180° tillsammans. I en **månghörning** med n hörn är vinkelsumman $(n-2) \\cdot 180°$ – dela upp i trianglar.',
    anchor: 'F och Z och X är lika. Bredvid varandra på en linje = 180°. Månghörning: (n − 2) · 180°.',
    cue: ['Två parallella linjer (pilar >>) skurna av en tredje linje.', 'En vinkel är känd och du söker en annan i figuren.', 'En månghörning (fem-, sex-, sjuhörning).'],
    cvis: { t: 'parallel', acute: 65, marks: { 1: '65°', 5: '?' } },
    f: {
      name: 'Vinklar vid parallella linjer och i månghörningar', main: '\\text{F, Z, X: lika}\\quad u+v=180°', when: 'Parallella linjer skärs av en linje, två linjer korsas, eller du ska bestämma vinkelsumman i en månghörning.',
      sym: [['Vertikalvinklar (X)', 'lika stora'], ['Likbelägna (F)', 'lika stora – kräver parallella linjer'], ['Alternatvinklar (Z)', 'lika stora – kräver parallella linjer'], ['Sidovinklar', '180° tillsammans']],
      forms: [['Vertikal', 'u = v'], ['Sidovinkel', 'u + v = 180°'], ['Månghörning', 'S = (n - 2) \\cdot 180°'], ['Regelbunden n-hörning', 'v = \\dfrac{(n-2) \\cdot 180°}{n}']],
      ex: '$65°$ och dess likbelägna vinkel är båda $65°$. En sexhörning: $(6-2) \\cdot 180° = 720°$.', trap: 'F- och Z-reglerna gäller bara om linjerna är **parallella**. Utan parallella linjer får du inte anta att vinklarna är lika.'
    },
    h1: 'Är linjerna parallella? Hitta ett F, Z eller X – eller en rak linje som ger 180°.',
    ex: {
      q: 'Linjerna är parallella. Vinkel 1 är 65°. Hur stor är vinkel 5 (likbelägen)?', vis: { t: 'parallel', acute: 65, marks: { 1: '65°', 5: '?' } }, given: ['linjerna är parallella', 'vinkel 1 = 65°'], find: 'vinkel 5', rule: '\\text{likbelägna vinklar är lika}',
      steps: [['Ligger vinklarna på samma sätt mot var sin parallell linje?', 'Ja: båda uppe till vänster om den lutande linjen (F-form).'], ['Likbelägna vinklar är lika', 'Vinkel 5 = 65°']], ans: '65°'
    },
    g: {
      q: 'Linjerna är parallella. Vinkel 3 är 65°. Bestäm vinkel 5 (alternatvinkel).', vis: { t: 'parallel', acute: 65, marks: { 3: '65°', 5: '?' } }, given: ['parallella linjer', 'vinkel 3 = 65°'], find: 'vinkel 5',
      opts: ['\\text{lika stora (Z-form)}', 'u + v = 180°', '\\text{dubbelt så stor}'], oc: 0, why: 'Alternatvinklar (Z-formen) mellan parallella linjer är lika stora.',
      type: 'num', a: 65, u: '°', calc: '65', start: 'Rita ett Z: vinkel 3 och vinkel 5 ligger på var sin sida om den lutande linjen, innanför linjerna.', sol: ['Alternatvinklar är lika', 'Vinkel 5 = 65°'], traps: [[115, 'Du räknade 180° − 65°. Alternatvinklar är lika stora, inte sidovinklar.']], ab: ['M']
    },
    p: [
      { lv: 'A', q: 'Två linjer korsar varandra. En vinkel är 48°. Hur stor är vinkeln mitt emot (vertikalvinkeln)?', vis: { t: 'parallel', acute: 48, single: true, marks: { 1: '48°', 3: '?' } }, type: 'num', a: 48, u: '°', calc: '48', given: ['vinkel 1 = 48°'], find: 'vinkel 3 (mitt emot)', start: 'Vertikalvinklar (X-formen) är lika stora.', sol: ['Vertikalvinklar är lika', 'Vinkel 3 = 48°'], traps: [[132, 'Du räknade 180° − 48° (sidovinkel). Vinkeln mitt emot är lika stor.']], ab: ['M'] },
      { lv: 'B', q: 'Vinkel 2 är 115°. Hur stor är vinkel 1 (sidovinkeln)?', vis: { t: 'parallel', acute: 65, single: true, marks: { 2: '115°', 1: '?' } }, type: 'num', a: 65, u: '°', calc: '180-115', given: ['vinkel 2 = 115°', '1 och 2 ligger bredvid varandra på en rak linje'], find: 'vinkel 1', start: 'Sidovinklar blir 180° tillsammans.', sol: ['$180° - 115° = 65°$'], traps: [[115, 'Sidovinklar är inte lika – de blir 180° tillsammans.']], ab: ['M'] },
      { lv: 'C', q: 'Linjerna är parallella. Vinkel 2 är 115°. Hur stor är vinkel 8?', vis: { t: 'parallel', acute: 65, marks: { 2: '115°', 8: '?' } }, type: 'num', a: 115, u: '°', calc: '115', given: ['parallella linjer', 'vinkel 2 = 115°'], find: 'vinkel 8', start: 'Vinkel 2 är lika med vinkel 4 (vertikal). Vinkel 4 och 8 är likbelägna.', sol: ['Vinkel 4 = vinkel 2 = 115° (vertikalvinklar)', 'Vinkel 8 = vinkel 4 = 115° (likbelägna)'], traps: [[65, 'Det är sidovinkeln. Vinkel 8 ligger på samma sätt som vinkel 4 – och 4 är lika med 2.']], ab: ['M', 'R'] },
      { lv: 'D', q: 'Hur stor är vinkelsumman i en sexhörning?', vis: { t: 'polygon', n: 6, sum: '?' }, type: 'num', a: 720, u: '°', calc: '(6-2)*180', given: ['sexhörning'], find: 'vinkelsumman', start: 'Dela upp i trianglar från ett hörn: n − 2 st.', sol: ['$n - 2 = 4$ trianglar', '$4 \\cdot 180° = 720°$'], traps: [[1080, 'Du räknade 6 · 180°. Antalet trianglar är n − 2 = 4.']], ab: ['M'] },
      { lv: 'D', q: 'En regelbunden femhörning har fem lika stora vinklar. Hur stor är varje vinkel?', vis: { t: 'polygon', n: 5, sum: '?' }, type: 'num', a: 108, u: '°', calc: '(5-2)*180/5', given: ['regelbunden femhörning'], find: 'en vinkel', start: 'Summan först: $(5-2) \\cdot 180°$. Dela sedan på 5.', sol: ['$(5-2) \\cdot 180° = 540°$', '$540° / 5 = 108°$'], traps: [[540, 'Det är summan av alla fem vinklar. Dela med 5.']], ab: ['M', 'P'] },
      { lv: 'D', q: 'Anna säger: "Två vinklar bredvid varandra på en rak linje är alltid lika stora." Vad är rätt?', type: 'choice', opts: ['Det stämmer alltid', 'Nej – de blir 180° tillsammans, och är lika bara om båda är 90°', 'Nej – de blir 360° tillsammans', 'Det stämmer om linjen är lutande'], a: 'Nej – de blir 180° tillsammans, och är lika bara om båda är 90°', traps: [['Det stämmer alltid', 'Exempel: 115° och 65° ligger bredvid varandra och är olika.'], ['Nej – de blir 360° tillsammans', 'En rak linje är 180°, inte 360° (helt varv).']], sol: ['Sidovinklar: $u + v = 180°$', 'Lika bara om $u = v = 90°$'], ab: ['R'] },
      { lv: 'F', q: 'Linjerna är parallella. Vinkel 4 är 130°. Bestäm vinkel 5.', vis: { t: 'parallel', acute: 50, marks: { 4: '130°', 5: '?' } }, type: 'num', a: 50, u: '°', calc: '180-130', given: ['parallella linjer', 'vinkel 4 = 130°'], find: 'vinkel 5', start: 'Vinkel 1 är sidovinkel till 4. Vinkel 5 är likbelägen med 1.', sol: ['Vinkel 1 $= 180° - 130° = 50°$ (sidovinklar)', 'Vinkel 5 = vinkel 1 = 50° (likbelägna)'], traps: [[130, 'Vinkel 5 är spetsig: den är likbelägen med sidovinkeln till 4, inte med 4.']], ab: ['M', 'R'] },
      { lv: 'F', q: 'I en sjuhörning är fem av vinklarna 120°, 130°, 140°, 150° och 100°. Hur stor är summan av de två övriga vinklarna?', type: 'num', a: 260, u: '°', calc: '(7-2)*180-(120+130+140+150+100)', given: ['sjuhörning', '120°, 130°, 140°, 150°, 100°'], find: 'summan av de två sista', start: 'Hela summan först: $(7-2) \\cdot 180°$.', sol: ['$(7-2) \\cdot 180° = 900°$', '$120 + 130 + 140 + 150 + 100 = 640$', '$900° - 640° = 260°$'], traps: [[640, 'Det är summan av de fem du känner till. Dra den från 900°.']], ab: ['P', 'M'] }
    ],
    kw: 'mer om vinklar parallella linjer likbelägna alternatvinklar vertikalvinklar sidovinklar månghörning vinkelsumma sexhörning femhörning F-vinkel Z-vinkel'
  });

  S.push({
    id: 's9-pyth-more', ch: 's9-geo', w: [43], title: 'Mer om Pythagoras sats', sub: 'är det en rät vinkel? höjden i likbent triangel',
    idea: 'Pythagoras sats fungerar åt **båda** hållen. Om $a^2 + b^2 = c^2$ stämmer för de tre sidorna är triangeln **rätvinklig** – använd den längsta sidan som $c$. Och många trianglar kan delas i rätvinkliga: **höjden** i en likbent triangel delar den i två lika räta trianglar.',
    anchor: 'Testa: de två korta kvadraterna ska ge den längsta i kvadrat. Likbent: höjden delar basen på mitten.',
    cue: ['"Är triangeln rätvinklig?" med tre sidor givna.', 'En likbent triangel där höjden eller arean söks.', 'Ett tak, en nock eller en lutande sida.'],
    cvis: { t: 'rightTri', a: 3, b: 4, c: 5, note: '3² + 4² = 5²' },
    f: {
      name: 'Pythagoras åt båda hållen', main: 'a^2 + b^2 = c^2 \\;\\Leftrightarrow\\; \\text{rät vinkel}', when: 'Du ska avgöra om en triangel är rätvinklig, eller bestämma höjden i en likbent triangel.',
      sym: [['c', 'den längsta sidan'], ['a, b', 'de två kortare sidorna'], ['h', 'höjden – delar basen på mitten']],
      forms: [['Testa rät vinkel', '\\text{kort}_1^2 + \\text{kort}_2^2 \\text{ jämfört med } \\text{längsta}^2'], ['Höjd i likbent triangel', 'h = \\sqrt{s^2 - (b/2)^2}'], ['Area', 'A = \\dfrac{b \\cdot h}{2}']],
      ex: '$5^2 + 12^2 = 25 + 144 = 169 = 13^2$ → rätvinklig', trap: 'Den längsta sidan är alltid $c$. Och höjden i en likbent triangel räknas med **halva** basen, inte hela.'
    },
    h1: 'Räkna kvadraterna: stämmer kort² + kort² = längst²? Eller dela den likbenta triangeln på mitten.',
    ex: {
      q: 'En triangel har sidorna 5 cm, 12 cm och 13 cm. Är den rätvinklig?', vis: { t: 'rightTri', a: 5, b: 12, c: 13 }, type: 'choice', opts: ['ja', 'nej'], a: 'ja', given: ['5, 12, 13'], find: 'ja eller nej', rule: 'a^2 + b^2 = c^2',
      steps: [['Vilken är den längsta sidan?', '13 → den är $c$'], ['Räkna de korta', '$5^2 + 12^2 = 25 + 144 = 169$'], ['Jämför med $c^2$', '$13^2 = 169$ → lika, alltså rätvinklig']], ans: 'ja'
    },
    g: {
      q: 'Sidorna är 6 cm, 8 cm och 10 cm. Är triangeln rätvinklig?', vis: { t: 'rightTri', a: 6, b: 8, c: 10 }, type: 'choice', opts: ['ja', 'nej'], a: 'ja', given: ['6, 8, 10'], find: 'ja eller nej',
      start: 'Räkna $6^2 + 8^2$ och jämför med $10^2$.', sol: ['$6^2 + 8^2 = 36 + 64 = 100$', '$10^2 = 100$ → lika → rätvinklig'], traps: [['nej', '36 + 64 = 100 = 10². Det stämmer, alltså är triangeln rätvinklig.']], ab: ['M', 'B']
    },
    p: [
      { lv: 'A', q: 'Sidorna är 7, 24 och 25. Är triangeln rätvinklig?', type: 'choice', opts: ['ja', 'nej'], a: 'ja', given: ['7, 24, 25'], find: 'ja eller nej', start: '$7^2 + 24^2$ jämfört med $25^2$', traps: [['nej', '49 + 576 = 625 = 25². Det stämmer → rätvinklig.']], sol: ['$49 + 576 = 625$', '$25^2 = 625$ ✓'], ab: ['M'] },
      { lv: 'B', q: 'Sidorna är 4, 5 och 6. Är triangeln rätvinklig?', type: 'choice', opts: ['ja', 'nej'], a: 'nej', given: ['4, 5, 6'], find: 'ja eller nej', start: 'Längsta sidan är 6. Räkna $4^2 + 5^2$.', traps: [['ja', '16 + 25 = 41 men 6² = 36. Olika → inte rätvinklig.']], sol: ['$4^2 + 5^2 = 41$', '$6^2 = 36$ → inte lika → ej rätvinklig'], ab: ['M'] },
      { lv: 'B', q: 'En likbent triangel har basen 10 cm och benen 13 cm. Hur hög är den?', vis: { t: 'isoTri', base: 10, side: 13 }, type: 'num', a: 12, u: 'cm', calc: 'Math.sqrt(13**2-5**2)', given: ['bas 10 cm', 'ben 13 cm'], find: 'höjden', start: 'Höjden delar basen på mitten: halva basen = 5 cm.', sol: ['Halva basen: $10 / 2 = 5$', '$h = \\sqrt{13^2 - 5^2} = \\sqrt{144}$', '$h = 12$ cm'], traps: [['√69', 'Du använde hela basen 10. Höjden delar basen på mitten – räkna med halva basen, 5.'], [144, 'Du har h². Ta roten.']], ab: ['M'] },
      { lv: 'C', q: 'Triangeln med basen 10 cm och benen 13 cm: bestäm arean.', vis: { t: 'isoTri', base: 10, side: 13, h: 12 }, type: 'num', a: 60, u: 'cm²', calc: '10*12/2', given: ['bas 10 cm', 'höjd 12 cm'], find: 'arean', start: '$A = b \\cdot h / 2$', sol: ['Höjden är 12 cm', '$A = 10 \\cdot 12 / 2 = 60$ cm²'], traps: [[120, 'Du glömde dela med 2.']], ab: ['M'] },
      { lv: 'C', q: 'En likbent triangel har benen 17 cm och höjden 15 cm. Hur lång är basen?', vis: { t: 'isoTri', base: '?', side: 17, h: 15 }, type: 'num', a: 16, u: 'cm', calc: '2*Math.sqrt(17**2-15**2)', given: ['ben 17 cm', 'höjd 15 cm'], find: 'basen', start: 'Först halva basen: $\\sqrt{17^2 - 15^2}$.', sol: ['$\\sqrt{17^2 - 15^2} = \\sqrt{289 - 225} = \\sqrt{64} = 8$', 'Det är **halva** basen → basen $= 2 \\cdot 8 = 16$ cm'], traps: [[8, 'Det är halva basen. Hela basen är dubbelt så lång.']], ab: ['M', 'P'] },
      { lv: 'D', q: 'Ett likbent tak har basen 8 m och sluttningen 5 m (benen). Hur hög är nocken över basen?', vis: { t: 'isoTri', base: 8, side: 5, h: '?', unit: 'm' }, type: 'num', a: 3, u: 'm', calc: 'Math.sqrt(5**2-4**2)', given: ['bas 8 m', 'sluttning 5 m'], find: 'nockhöjden', start: 'Halva basen är 4 m. Sluttningen är hypotenusa.', sol: ['$h = \\sqrt{5^2 - 4^2} = \\sqrt{9}$', '$= 3$ m'], ab: ['P', 'M'] },
      { lv: 'D', q: 'Mia mätte sidorna 9 cm, 12 cm och 16 cm och säger: "Rätvinklig, för 9 + 12 är större än 16." Vad är fel?', type: 'choice', opts: ['Hon ska jämföra kvadraterna: 9² + 12² = 225 men 16² = 256 → inte rätvinklig', 'Inget – hon har rätt', 'Hon skulle ha använt 12 som hypotenusa', 'Hon skulle ha multiplicerat sidorna'], a: 'Hon ska jämföra kvadraterna: 9² + 12² = 225 men 16² = 256 → inte rätvinklig', traps: [['Inget – hon har rätt', 'Att 9 + 12 > 16 gäller i alla trianglar och visar inget om rät vinkel. Testet är kvadraterna.'], ['Hon skulle ha använt 12 som hypotenusa', 'Hypotenusan är alltid den längsta sidan, här 16.']], sol: ['$9^2 + 12^2 = 81 + 144 = 225$', '$16^2 = 256 \\ne 225$ → inte rätvinklig'], ab: ['R'] },
      { lv: 'F', q: 'En likbent triangel har basen 16 cm och benen 17 cm. Bestäm arean.', type: 'num', a: 120, u: 'cm²', calc: '16*Math.sqrt(17**2-8**2)/2', given: ['bas 16 cm', 'ben 17 cm'], find: 'arean', start: 'Höjd först: halva basen = 8.', sol: ['$h = \\sqrt{17^2 - 8^2} = \\sqrt{225} = 15$', '$A = 16 \\cdot 15 / 2 = 120$ cm²'], traps: [[240, 'Du glömde dela med 2.']], ab: ['M', 'P'] },
      { lv: 'F', q: 'Vilken av trianglarna är rätvinklig?', type: 'choice', opts: ['5, 6, 7', '8, 15, 17', '9, 10, 12', '7, 8, 12'], a: '8, 15, 17', traps: [['5, 6, 7', '25 + 36 = 61 men 7² = 49.'], ['9, 10, 12', '81 + 100 = 181 men 12² = 144.'], ['7, 8, 12', '49 + 64 = 113 men 12² = 144.']], sol: ['$8^2 + 15^2 = 64 + 225 = 289 = 17^2$ ✓'], ab: ['M', 'R'] }
    ],
    kw: 'mer om pythagoras omvänd pythagoras rätvinklig triangel kontrollera rät vinkel likbent triangel höjd tak nock pythagoreisk trippel'
  });

  /*@@ADD9@@*/

  /* Ordning inom kapitlen följer skolplanen (HT-26 år 9). */
  /* ===== v5.1 förmågeberikning (Resonemang/Kommunikation): motexempel och motiveringar ===== */
  S.find(s => s.id === 's9-powers').p.push(
      { lv: 'F', q: 'Är $(-4)^2$ och $-4^2$ samma tal?', type: 'choice', opts: ['Ja, båda är 16', 'Nej – (−4)² = 16 men −4² = −16', 'Ja, båda är −16', 'Nej – (−4)² = −16 men −4² = 16'], a: 'Nej – (−4)² = 16 men −4² = −16', traps: [['Ja, båda är 16', 'Utan parentes gäller exponenten bara 4: −4² = −(4·4) = −16.'], ['Nej – (−4)² = −16 men −4² = 16', 'Det är tvärtom: parentesen gör att minustecknet också kvadreras, så (−4)² = 16.']], sol: ['(−4)² = (−4)·(−4) = 16', '−4² = −(4·4) = −16'], ab: ['R', 'K'] });
  S.find(s => s.id === 's9-scientific').p.push(
      { lv: 'F', q: 'Vilken motivering visar att $0{,}5 \\cdot 10^4$ inte är skrivet i grundpotensform?', type: 'choice', opts: ['0,5 är mindre än 1; rätt form är 5 · 10³', 'Exponenten 4 är för stor', 'Talet saknar decimaltecken', 'Det är grundpotensform'], a: '0,5 är mindre än 1; rätt form är 5 · 10³', traps: [['Exponenten 4 är för stor', 'Exponentens storlek avgör inte. Det är första talet som ska ligga mellan 1 och 10.'], ['Det är grundpotensform', 'Första talet 0,5 är under 1, så det är inte grundpotensform.']], sol: ['Första talet måste vara minst 1 och under 10', '0,5 · 10⁴ = 5000 = 5 · 10³'], ab: ['K', 'R'] });
  S.find(s => s.id === 's9-angles').p.push(
      { lv: 'F', q: 'Kan en triangel ha två trubbiga vinklar?', type: 'choice', opts: ['Ja', 'Nej – två vinklar över 90° ger redan mer än 180°', 'Ja, om den är likbent', 'Nej – alla vinklar är 60°'], a: 'Nej – två vinklar över 90° ger redan mer än 180°', traps: [['Ja', 'Vinkelsumman i en triangel är 180°. Två vinklar över 90° blir över 180° tillsammans.'], ['Nej – alla vinklar är 60°', 'Bara den liksidiga triangeln har tre 60°-vinklar. Skälet är vinkelsumman 180°.']], sol: ['Trubbig vinkel > 90°', '2 · 90° = 180°, så två trubbiga överskrider vinkelsumman'], ab: ['R', 'K'] });
  S.find(s => s.id === 's9-area-scale').p.push(
      { lv: 'F', q: 'Alla sidor i en kvadrat dubblas. Hur många gånger större blir arean?', type: 'choice', opts: ['2 gånger', '4 gånger', '8 gånger', '16 gånger'], a: '4 gånger', traps: [['2 gånger', 'Längden dubblas, men arean har två dimensioner: 2 · 2 = 4.'], ['8 gånger', '8 gånger gäller volymen (2 · 2 · 2).']], sol: ['Längdskala 2 ger areaskala 2² = 4'], ab: ['R'] });
  S.find(s => s.id === 's9-volume-scale').p.push(
      { lv: 'F', q: 'Alla kanter i en kub dubblas. Hur många gånger större blir volymen?', type: 'choice', opts: ['2 gånger', '4 gånger', '8 gånger', '6 gånger'], a: '8 gånger', traps: [['2 gånger', 'Volymen har tre dimensioner: 2 · 2 · 2 = 8.'], ['4 gånger', '4 gånger gäller arean. Volymen skalas med tredje potensen.']], sol: ['Längdskala 2 ger volymskala 2³ = 8'], ab: ['R'] });
  S.find(s => s.id === 's9-repeated-change').p.push(
      { lv: 'F', q: 'Ett pris höjs med 20 % och sänks sedan med 20 %. Hamnar priset där det började?', type: 'choice', opts: ['Ja', 'Nej – det blir 4 % lägre (1,2 · 0,8 = 0,96)', 'Nej – det blir 4 % högre', 'Nej – det blir 20 % lägre'], a: 'Nej – det blir 4 % lägre (1,2 · 0,8 = 0,96)', traps: [['Ja', 'De 20 % räknas på olika belopp. Förändringsfaktorerna multipliceras: 1,2 · 0,8 = 0,96.'], ['Nej – det blir 4 % högre', '0,96 är under 1, alltså en minskning.']], sol: ['1,2 · 0,8 = 0,96', 'faktor 0,96 = 4 % minskning'], ab: ['R', 'M'] });
  S.find(s => s.id === 's9-percent-problem').p.push(
      { lv: 'F', q: 'En tröja kostar 400 kr och sänks med 25 %. Vilken redovisning är rätt och tydlig?', type: 'choice', opts: ['400 · 0,75 = 300 kr', '400 − 25 = 375 kr', '400 · 0,25 = 100 kr', '400 · 1,25 = 500 kr'], a: '400 · 0,75 = 300 kr', traps: [['400 − 25 = 375 kr', '25 % är inte 25 kr. Minskning med 25 % ger förändringsfaktor 0,75.'], ['400 · 0,25 = 100 kr', 'Det är själva sänkningen, inte det nya priset. Frågan gäller nya priset (eller dra av 100).'], ['400 · 1,25 = 500 kr', 'Faktor 1,25 är en ökning.']], sol: ['Minskning 25 % → faktor 0,75', '400 · 0,75 = 300 kr'], ab: ['K', 'P'] });
  S.find(s => s.id === 's9-number-sets').p.push(
      { lv: 'F', q: 'Är $\\sqrt{16}$ ett rationellt tal?', type: 'choice', opts: ['Ja – √16 = 4 = 4/1', 'Nej – alla rötter är irrationella', 'Nej – det är ett negativt tal', 'Ja, men bara om talet är ett decimaltal'], a: 'Ja – √16 = 4 = 4/1', traps: [['Nej – alla rötter är irrationella', 'Bara rötter ur icke-kvadrater som √2 är irrationella. √16 = 4 går att skriva som bråk.']], sol: ['√16 = 4 = 4/1 → rationellt'], ab: ['R', 'B'] },
      { lv: 'F', q: 'Är 0,333… (oändligt många treor) ett rationellt tal?', type: 'choice', opts: ['Ja – det är 1/3', 'Nej – decimalerna tar aldrig slut', 'Nej – det är ett irrationellt tal', 'Ja, men bara avrundat'], a: 'Ja – det är 1/3', traps: [['Nej – decimalerna tar aldrig slut', 'Periodiska decimaler kan skrivas som bråk. 0,333… = 1/3. Irrationella tal har decimaler utan upprepning.']], sol: ['0,333… = 1/3'], ab: ['R', 'K'] },
      { lv: 'F', q: 'Alla heltal är naturliga tal. Stämmer det?', type: 'choice', opts: ['Ja', 'Nej – t.ex. −3 är ett heltal men inte ett naturligt tal'], a: 'Nej – t.ex. −3 är ett heltal men inte ett naturligt tal', traps: [['Ja', 'Motexempel: −3 är ett heltal men inget naturligt tal.']], sol: ['Ett enda motexempel räcker för att visa att ett påstående inte stämmer'], ab: ['R'] });
  S.find(s => s.id === 's9-similarity').p.push(
      { lv: 'F', q: 'Alla rektanglar är likformiga. Stämmer det?', type: 'choice', opts: ['Ja', 'Nej – 2 × 4 och 2 × 6 har olika sidförhållanden'], a: 'Nej – 2 × 4 och 2 × 6 har olika sidförhållanden', traps: [['Ja', 'Likformighet kräver samma sidförhållande. 4/2 = 2 men 6/2 = 3.']], sol: ['Motexempel: 2 × 4 och 2 × 6'], ab: ['R', 'K'] },
      { lv: 'F', q: 'Två likformiga figurer har längdskalan 1:3. Hur många gånger större är den stora figurens area?', type: 'num', a: 9, calc: '3**2', given: ['längdskala 1:3'], find: 'areaskalan', start: 'Areaskalan är längdskalan i kvadrat.', sol: ['Längdskala 3 → areaskala 3² = 9'], traps: [[3, '3 är längdskalan. Area skalas med kvadraten: 3² = 9.'], [27, '27 gäller volymen (3³).']], ab: ['R', 'M'] });

  const ORDER = ["s9-names", "s9-prefix", "s9-scientific", "s9-sci-calc", "s9-powers", "s9-sqrt", "s9-sqrt-more", "s9-sqrt-div", "s9-quadratic", "s9-number-sets", "s9-angles", "s9-angles-more", "s9-pythagoras", "s9-pyth-more", "s9-length-scale", "s9-area-scale", "s9-volume-scale", "s9-similarity", "s9-symmetry", "s9-space-diagonal", "s9-percent-share", "s9-percent-part", "s9-percent-whole", "s9-change-factor", "s9-repeated-change", "s9-percentage-points", "s9-percent-problem"];
  S.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  root.MO_CONTENT9 = S;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
