/* Matte OS v5 — innehåll åk 8 (Tal · Geometri · Algebra). Samma schema som content9.js. */
(function (root) {
  'use strict';
  const S = [];
  const PI = 'π';

  /* ================= KAPITEL 1 · TAL ================= */
  S.push({
    id: 'f8-fractions-compare', ch: 'f8-tal', w: [34], title: 'Jämföra bråk och decimaltal', sub: 'vilket är störst?',
    idea: 'Bråk och decimaltal är två sätt att skriva samma sak: $\\frac{3}{4} = 0{,}75$. För att jämföra måste talen stå på **samma form** – båda som decimaltal, eller båda med samma nämnare.',
    anchor: 'Gör om till samma form innan du jämför.',
    cue: ['"Vilket är störst/minst?"', 'Ett bråk och ett decimaltal blandat.'],
    cvis: { t: 'fracCompare', a: [3, 4], b: 0.7 },
    f: {
      name: 'Jämföra tal', main: '\\frac{a}{b} = a \\div b', when: 'Två tal på olika form ska jämföras.',
      sym: [['täljare a', 'antal delar du har'], ['nämnare b', 'antal delar helheten är delad i']],
      rules: ['Bråk → decimaltal: dela täljaren med nämnaren.', 'Två bråk: förläng till gemensam nämnare och jämför täljarna.', 'Rimlighetskoll: ligger talet närmast 0, ½ eller 1?'],
      ex: '$\\frac{3}{4} = 0{,}75 > 0{,}7$', trap: '0,45 är inte större än 0,5 bara för att 45 > 5. Jämför tiondelarna först.'
    },
    h1: 'Talen står på olika form. Gör om dem till samma form först.',
    ex: { q: 'Vilket är störst: 3/4 eller 0,7?', vis: { t: 'fracCompare', a: [3, 4], b: 0.7 }, given: ['3/4', '0,7'], find: 'det största talet', rule: '\\frac{a}{b} = a \\div b', steps: [['Gör om 3/4 till decimaltal', '$3 \\div 4 = 0{,}75$'], ['Jämför', '$0{,}75 > 0{,}70$']], ans: '3/4' },
    g: { q: 'Vilket är störst?', vis: { t: 'fracCompare', a: [2, 3], b: 0.6 }, type: 'choice', opts: ['2/3', '0,6'], a: '2/3', given: ['2/3', '0,6'], find: 'det största', start: '$2 \\div 3 \\approx 0{,}667$', sol: ['$\\frac{2}{3} \\approx 0{,}667$', '$0{,}667 > 0{,}6$'] },
    p: [
      { lv: 'A', q: 'Vilket är minst?', vis: { t: 'fracCompare', a: [1, 2], b: 0.45 }, type: 'choice', opts: ['0,45', '1/2'], a: '0,45', traps: [['1/2', '1/2 = 0,50, och 0,45 < 0,50.']], sol: ['$\\frac{1}{2} = 0{,}50$', '$0{,}45 < 0{,}50$'] },
      { lv: 'B', q: 'Skriv 3/8 i decimalform.', type: 'num', a: 0.375, calc: '3/8', given: ['3/8'], find: 'decimaltal', start: '$3 \\div 8$', sol: ['$3 \\div 8 = 0{,}375$'], traps: [[2.6667, 'Du delade 8 med 3. Täljaren delas med nämnaren: 3 ÷ 8.'], [0.38, 'Svara exakt: 0,375.']], tol: 0.0001 },
      { lv: 'C', q: 'Skriv 0,35 som ett bråk i enklaste form. Svara som a/b.', type: 'num', a: 0.35, calc: '7/20', mustFraction: [7, 20], given: ['0,35'], find: 'bråk', start: '$0{,}35 = \\frac{35}{100}$. Förkorta.', sol: ['$\\frac{35}{100}$', 'Dela med 5: $\\frac{7}{20}$'], answerHint: 'Skriv t.ex. 7/20' },
      { lv: 'D', q: 'Ordna från minst till störst:   0,6   |   5/8   |   0,58', type: 'choice', opts: ['0,58 < 0,6 < 5/8', '5/8 < 0,6 < 0,58', '0,6 < 0,58 < 5/8', '0,58 < 5/8 < 0,6'], a: '0,58 < 0,6 < 5/8', sol: ['$\\frac{5}{8} = 0{,}625$', '$0{,}58 < 0{,}60 < 0{,}625$'] },
      { lv: 'F', q: 'Amir har läst 2/5 av en bok. Sara har läst 0,38 av samma bok. Vem har läst mest?', type: 'choice', opts: ['Amir', 'Sara', 'lika mycket'], a: 'Amir', sol: ['$\\frac{2}{5} = 0{,}40$', '$0{,}40 > 0{,}38$ → Amir'] }
    ],
    kw: 'jämföra bråk decimaltal störst minst ordna bråk till decimal'
  });

  S.push({
    id: 'f8-fractions-add', ch: 'f8-tal', w: [34], title: 'Addera och subtrahera bråk', sub: 'gemensam nämnare först',
    idea: 'Du kan bara lägga ihop bitar av **samma storlek**. Tredjedelar och sjättedelar är olika stora bitar – gör om dem till samma sort (gemensam nämnare). Sedan adderar du täljarna.',
    anchor: 'Samma nämnare → addera täljarna. Nämnaren ändras inte.',
    cue: ['Bråk med + eller −.', 'Olika nämnare.'],
    cvis: { t: 'fracAdd', a: [1, 3], b: [1, 6] },
    f: {
      name: 'Addition av bråk', main: '\\frac{a}{n} + \\frac{b}{n} = \\frac{a+b}{n}', when: 'Bråk ska adderas eller subtraheras.',
      sym: [['n', 'gemensam nämnare']],
      forms: [['Olika nämnare', '\\frac{1}{3} + \\frac{1}{6} = \\frac{2}{6} + \\frac{1}{6}'], ['Subtraktion', '\\frac{a}{n} - \\frac{b}{n} = \\frac{a-b}{n}']],
      ex: '$\\frac{1}{3} + \\frac{1}{6} = \\frac{2}{6} + \\frac{1}{6} = \\frac{3}{6} = \\frac{1}{2}$', trap: 'Addera inte nämnarna: $\\frac{1}{4} + \\frac{1}{2} \\ne \\frac{2}{6}$.'
    },
    h1: 'Bråk som adderas/subtraheras. Har de samma nämnare?',
    ex: { q: 'Beräkna 1/3 + 1/6.', vis: { t: 'fracAdd', a: [1, 3], b: [1, 6] }, given: ['1/3', '1/6'], find: 'summan', rule: '\\frac{a}{n}+\\frac{b}{n}=\\frac{a+b}{n}', steps: [['Gemensam nämnare?', '6'], ['Gör om 1/3', '$\\frac{1}{3} = \\frac{2}{6}$'], ['Addera täljarna', '$\\frac{2}{6} + \\frac{1}{6} = \\frac{3}{6}$'], ['Förkorta', '$\\frac{3}{6} = \\frac{1}{2}$']], ans: '1/2' },
    g: { q: 'Beräkna 1/4 + 1/2.', vis: { t: 'fracAdd', a: [1, 4], b: [1, 2] }, given: ['1/4', '1/2'], find: 'summan', opts: ['\\frac{1}{4} + \\frac{2}{4}', '\\frac{1+1}{4+2}', '\\frac{1 \\cdot 1}{4 \\cdot 2}'], oc: 0, why: 'Gör om till fjärdedelar först.', type: 'num', a: 0.75, calc: '1/4+1/2', start: '$\\frac{1}{2} = \\frac{2}{4}$', sol: ['$\\frac{1}{4} + \\frac{2}{4} = \\frac{3}{4}$'], traps: [[1 / 3, 'Du adderade nämnarna (4 + 2). Gör om till samma nämnare istället.']], answerHint: 'Svara som bråk (3/4) eller decimal' },
    p: [
      { lv: 'A', q: 'Beräkna 2/5 + 3/10.', vis: { t: 'fracAdd', a: [2, 5], b: [3, 10] }, type: 'num', a: 0.7, calc: '2/5+3/10', given: ['2/5', '3/10'], find: 'summan', start: '$\\frac{2}{5} = \\frac{4}{10}$', sol: ['$\\frac{4}{10} + \\frac{3}{10} = \\frac{7}{10}$'], traps: [[1 / 3, 'Addera inte nämnarna.']], answerHint: 'Svara som bråk eller decimal' },
      { lv: 'B', q: 'Beräkna 5/6 − 1/3.', vis: { t: 'fracAdd', a: [5, 6], b: [1, 3], op: '-' }, type: 'num', a: 0.5, calc: '5/6-1/3', given: ['5/6', '1/3'], find: 'differensen', start: '$\\frac{1}{3} = \\frac{2}{6}$', sol: ['$\\frac{5}{6} - \\frac{2}{6} = \\frac{3}{6} = \\frac{1}{2}$'], traps: [[4 / 3, 'Du subtraherade nämnarna. Gör om till sjättedelar.']], answerHint: 'Svara som bråk eller decimal' },
      { lv: 'C', q: 'Vilket bråk ska läggas till 3/8 för att få 1?', type: 'num', a: 0.625, calc: '1-3/8', given: ['3/8 + ? = 1'], find: 'det som fattas', start: '$1 = \\frac{8}{8}$', sol: ['$\\frac{8}{8} - \\frac{3}{8} = \\frac{5}{8}$'], answerHint: 'Svara som bråk' },
      { lv: 'F', q: 'Ali äter 1/4 av en pizza och Bea 1/3. Hur stor del av pizzan har de ätit tillsammans?', type: 'num', a: 7 / 12, calc: '1/4+1/3', given: ['1/4', '1/3'], find: 'tillsammans', start: 'Gemensam nämnare 12.', sol: ['$\\frac{3}{12} + \\frac{4}{12} = \\frac{7}{12}$'], traps: [[2 / 7, 'Addera inte nämnarna. Använd tolftedelar.']], tol: 0.0005, answerHint: 'Svara som bråk' }
    ],
    kw: 'addera bråk subtrahera bråk gemensam nämnare plus minus bråk'
  });

  S.push({
    id: 'f8-fractions-multiply', ch: 'f8-tal', w: [34, 35], title: 'Multiplicera bråk', sub: 'täljare · täljare, nämnare · nämnare',
    idea: '$\\frac{3}{4} \\cdot \\frac{2}{5}$ betyder "$\\frac{3}{4}$ **av** $\\frac{2}{5}$". I en rektangel blir det överlappet. Därför multiplicerar du täljare med täljare och nämnare med nämnare.',
    anchor: '"av" = gånger. Ingen gemensam nämnare behövs.',
    cue: ['Bråk · bråk eller "bråk av något".'],
    cvis: { t: 'fracMul', a: [3, 4], b: [2, 5] },
    f: { name: 'Multiplikation av bråk', main: '\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{a \\cdot c}{b \\cdot d}', when: 'Bråk multipliceras, eller "en del av en del".', sym: [['a, c', 'täljare'], ['b, d', 'nämnare']], forms: [['Heltal · bråk', 'n \\cdot \\frac{a}{b} = \\frac{n \\cdot a}{b}'], ['Förkorta först', '\\frac{7}{8} \\cdot \\frac{4}{7} = \\frac{1}{2}']], ex: '$\\frac{2}{3} \\cdot \\frac{3}{5} = \\frac{6}{15} = \\frac{2}{5}$', trap: 'Vid multiplikation behövs INGEN gemensam nämnare.' },
    h1: 'Bråk gånger bråk – täljare för sig, nämnare för sig.',
    ex: { q: 'Beräkna 2/3 · 3/5.', vis: { t: 'fracMul', a: [2, 3], b: [3, 5] }, given: ['2/3', '3/5'], find: 'produkten', rule: '\\frac{ac}{bd}', steps: [['Täljare', '$2 \\cdot 3 = 6$'], ['Nämnare', '$3 \\cdot 5 = 15$'], ['Förkorta', '$\\frac{6}{15} = \\frac{2}{5}$']], ans: '2/5' },
    g: { q: 'Beräkna 3/4 · 2/5.', vis: { t: 'fracMul', a: [3, 4], b: [2, 5] }, given: ['3/4', '2/5'], find: 'produkten', opts: ['\\frac{3 \\cdot 2}{4 \\cdot 5}', '\\frac{3+2}{4+5}', '\\frac{3}{4} \\cdot \\frac{5}{2}'], oc: 0, why: 'Täljare gånger täljare, nämnare gånger nämnare.', type: 'num', a: 0.3, calc: '3/4*2/5', start: '$\\frac{6}{20}$', sol: ['$\\frac{6}{20} = \\frac{3}{10}$'], traps: [[1.875, 'Du vände det andra bråket – det gör man vid division, inte multiplikation.']], answerHint: 'Svara som bråk eller decimal' },
    p: [
      { lv: 'A', q: 'Beräkna 5/6 · 3/10.', vis: { t: 'fracMul', a: [5, 6], b: [3, 10] }, type: 'num', a: 0.25, calc: '5/6*3/10', given: ['5/6', '3/10'], find: 'produkten', start: '$\\frac{15}{60}$', sol: ['$\\frac{15}{60} = \\frac{1}{4}$'], answerHint: 'Svara som bråk' },
      { lv: 'B', q: 'Beräkna 7/8 · 4/7.', type: 'num', a: 0.5, calc: '7/8*4/7', given: ['7/8', '4/7'], find: 'produkten', start: 'Förkorta 7 mot 7 först.', sol: ['$\\frac{28}{56} = \\frac{1}{2}$'], answerHint: 'Svara som bråk' },
      { lv: 'D', q: 'En klass har 30 elever. 2/3 av dem spelar ett instrument. Hur många elever spelar?', type: 'num', a: 20, calc: '30*2/3', given: ['30 elever', '2/3 av dem'], find: 'antal som spelar', start: '"av" = gånger: $\\frac{2}{3} \\cdot 30$', sol: ['$30 / 3 = 10$', '$10 \\cdot 2 = 20$'] },
      { lv: 'F', q: 'Halva tårtan är kvar. Du äter 1/4 av det som är kvar. Hur stor del av hela tårtan äter du?', type: 'num', a: 0.125, calc: '1/2*1/4', given: ['1/2 kvar', '1/4 av resten'], find: 'del av hela tårtan', start: '$\\frac{1}{4}$ av $\\frac{1}{2}$', sol: ['$\\frac{1}{4} \\cdot \\frac{1}{2} = \\frac{1}{8}$'], traps: [[0.25, '1/4 av det som är KVAR, inte av hela tårtan.']], answerHint: 'Svara som bråk' }
    ],
    kw: 'multiplicera bråk gånger bråk bråk av tal del av'
  });

  S.push({
    id: 'f8-fractions-divide', ch: 'f8-tal', w: [35, 39], title: 'Dividera bråk', sub: 'vänd och multiplicera',
    idea: '$\\frac{3}{4} \\div \\frac{1}{2}$ frågar: **hur många halvor får plats i tre fjärdedelar?** Svaret är 1,5. Snabbmetoden: vänd det andra bråket och multiplicera.',
    anchor: 'Dela med bråk = gånger det upp-och-nervända bråket.',
    cue: ['Bråk ÷ bråk, eller "hur många … får plats".'],
    cvis: { t: 'fracDiv', a: [3, 4], b: [1, 2] },
    f: { name: 'Division av bråk', main: '\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c}', when: 'Ett tal ska delas med ett bråk.', sym: [['d/c', 'det inverterade (vända) bråket']], forms: [['Bråk ÷ heltal', '\\frac{a}{b} \\div n = \\frac{a}{b \\cdot n}'], ['Heltal ÷ bråk', 'n \\div \\frac{1}{k} = n \\cdot k']], ex: '$\\frac{2}{3} \\div \\frac{4}{5} = \\frac{2}{3} \\cdot \\frac{5}{4} = \\frac{10}{12} = \\frac{5}{6}$', trap: 'Vänd bara det bråk du DELAR MED (det andra), inte det första.' },
    h1: 'Division med bråk: vilket bråk ska vändas?',
    ex: { q: 'Beräkna 2/3 ÷ 4/5.', vis: { t: 'fracDiv', a: [2, 3], b: [4, 5] }, given: ['2/3', '4/5'], find: 'kvoten', rule: '\\frac{a}{b} \\cdot \\frac{d}{c}', steps: [['Vänd det andra bråket', '$\\frac{4}{5} \\to \\frac{5}{4}$'], ['Multiplicera', '$\\frac{2}{3} \\cdot \\frac{5}{4} = \\frac{10}{12}$'], ['Förkorta', '$\\frac{5}{6}$']], ans: '5/6' },
    g: { q: 'Beräkna 3/4 ÷ 1/2.', vis: { t: 'fracDiv', a: [3, 4], b: [1, 2] }, given: ['3/4', '1/2'], find: 'kvoten', opts: ['\\frac{3}{4} \\cdot \\frac{2}{1}', '\\frac{4}{3} \\cdot \\frac{1}{2}', '\\frac{3}{4} \\cdot \\frac{1}{2}'], oc: 0, why: 'Vänd bråket du delar med.', type: 'num', a: 1.5, calc: '(3/4)/(1/2)', start: '$\\frac{3}{4} \\cdot 2$', sol: ['$\\frac{3 \\cdot 2}{4} = \\frac{6}{4} = 1{,}5$'], traps: [[0.375, 'Du multiplicerade utan att vända. Vid division: vänd det andra bråket.'], [2 / 3, 'Du vände det första bråket. Vänd det du delar med.']], tol: 0.001 },
    p: [
      { lv: 'A', q: 'Beräkna 5/6 ÷ 10/9.', type: 'num', a: 0.75, calc: '(5/6)/(10/9)', given: ['5/6', '10/9'], find: 'kvoten', start: '$\\frac{5}{6} \\cdot \\frac{9}{10}$', sol: ['$\\frac{45}{60} = \\frac{3}{4}$'], answerHint: 'Svara som bråk eller decimal' },
      { lv: 'B', q: 'Beräkna 2/5 ÷ 4.', type: 'num', a: 0.1, calc: '(2/5)/4', given: ['2/5', '4'], find: 'kvoten', start: '$4 = \\frac{4}{1}$ → vänd till $\\frac{1}{4}$', sol: ['$\\frac{2}{5} \\cdot \\frac{1}{4} = \\frac{2}{20} = \\frac{1}{10}$'], traps: [[1.6, 'Du multiplicerade med 4. Vid division blir talet mindre.']] },
      { lv: 'D', q: 'Hur många glas à 1/4 liter kan du fylla med 3 liter saft?', type: 'num', a: 12, calc: '3/(1/4)', given: ['3 liter', '1/4 liter per glas'], find: 'antal glas', start: 'Hur många fjärdedelar får plats i 3? $3 \\div \\frac{1}{4}$', sol: ['$3 \\cdot 4 = 12$ glas'], traps: [[0.75, 'Det ska bli FLER glas än liter: 3 ÷ 1/4 = 3 · 4.']] },
      { lv: 'F', q: 'En bräda är 7/8 m lång och sågas i bitar som är 1/8 m. Hur många bitar blir det?', type: 'num', a: 7, calc: '(7/8)/(1/8)', given: ['7/8 m', 'bitar 1/8 m'], find: 'antal bitar', start: '$\\frac{7}{8} \\div \\frac{1}{8}$', sol: ['$\\frac{7}{8} \\cdot 8 = 7$'] }
    ],
    kw: 'dividera bråk division med bråk dela bråk vända bråket invertera'
  });

  S.push({
    id: 'f8-decimals', ch: 'f8-tal', w: [35, 36], title: 'Räkna med decimaltal', sub: '+ − · ÷ och rimlighet',
    idea: 'Decimaltecknet skiljer hela från delar: tiondelar, hundradelar … Vid **+ och −** ställer du kommat under kommat. Vid **· och ÷** uppskattar du först, så du vet ungefär vad svaret ska bli.',
    anchor: 'Gånger ett tal under 1 → svaret blir mindre. Delat med ett tal under 1 → svaret blir större.',
    cue: ['Tal med decimaltecken och räknesätt.'],
    cvis: { t: 'decimal', n: '4,75' },
    f: { name: 'Decimaltal', main: '0{,}1 = \\frac{1}{10} \\quad 0{,}01 = \\frac{1}{100}', when: 'Räkning med decimaltal.', sym: [['tiondel', '0,1'], ['hundradel', '0,01']], rules: ['+/−: komma under komma, fyll ut med nollor (2,6 = 2,60).', '·: räkna utan komma, antal decimaler i svaret = summan av decimalerna.', '÷ med decimaltal: förläng båda så nämnaren blir heltal (7,2 ÷ 0,6 = 72 ÷ 6).'], ex: '$6{,}4 \\cdot 0{,}25 = 1{,}6$ (en fjärdedel av 6,4)', trap: '0,6 · 0,5 är inte 3 – svaret är 0,3 (mindre än båda talen).' },
    h1: 'Vilket räknesätt? Uppskatta svaret innan du räknar.',
    ex: { q: 'Beräkna 3,6 · 0,5.', vis: { t: 'decimal', n: '3,6' }, given: ['3,6', '0,5'], find: 'produkten', rule: '\\text{uppskatta först}', steps: [['Vad betyder · 0,5?', 'Hälften'], ['Hälften av 3,6', '$1{,}8$']], ans: '1,8' },
    g: { q: 'Beräkna 4,75 + 2,6.', vis: { t: 'decimal', n: '4,75' }, given: ['4,75', '2,6'], find: 'summan', opts: ['4{,}75 + 2{,}60', '4{,}75 + 0{,}26', '475 + 26'], oc: 0, why: 'Komma under komma: 2,6 = 2,60.', type: 'num', a: 7.35, calc: '4.75+2.6', start: 'Skriv 2,60 under 4,75.', sol: ['$4{,}75 + 2{,}60 = 7{,}35$'], traps: [[5.01, 'Du ställde upp fel: 2,6 är 2 hela och 6 tiondelar = 2,60.']] },
    p: [
      { lv: 'A', q: 'Beräkna 6,4 · 0,25.', type: 'num', a: 1.6, calc: '6.4*0.25', given: ['6,4', '0,25'], find: 'produkten', start: '0,25 = en fjärdedel', sol: ['$6{,}4 / 4 = 1{,}6$'], traps: [[16, 'Svaret ska vara mindre än 6,4 – du multiplicerar med ett tal under 1.']] },
      { lv: 'B', q: 'Beräkna 7,2 ÷ 0,6.', type: 'num', a: 12, calc: '7.2/0.6', given: ['7,2', '0,6'], find: 'kvoten', start: 'Gör båda 10 gånger större: $72 \\div 6$', sol: ['$72 \\div 6 = 12$'], traps: [[1.2, 'Delar du med ett tal under 1 blir svaret större än 7,2.']] },
      { lv: 'C', q: '0,3 · ? = 2,4. Vilket tal fattas?', type: 'num', a: 8, calc: '2.4/0.3', given: ['0,3 · ? = 2,4'], find: 'talet', start: 'Baklänges: $2{,}4 \\div 0{,}3$', sol: ['$24 \\div 3 = 8$'] },
      { lv: 'F', q: 'Bananer kostar 24,90 kr/kg. Vad kostar 1,5 kg? Svara i kronor med två decimaler.', type: 'num', a: 37.35, u: 'kr', dec: 2, calc: '24.9*1.5', given: ['24,90 kr/kg', '1,5 kg'], find: 'priset', start: '$24{,}90 \\cdot 1{,}5$', sol: ['$24{,}90 + 12{,}45 = 37{,}35$ kr'] }
    ],
    kw: 'decimaltal decimal komma räkna med decimaler multiplicera decimaltal dela decimaltal'
  });

  S.push({
    id: 'f8-powers', ch: 'f8-tal', w: [36], title: 'Tal i potensform', sub: 'aⁿ = upprepad multiplikation',
    idea: '$3^4$ betyder **3 gånger sig självt 4 gånger**: $3 \\cdot 3 \\cdot 3 \\cdot 3$. Basen (3) är talet som multipliceras. Exponenten (4) är hur många gånger.',
    anchor: 'Exponenten räknar faktorer – den är inte en faktor själv. 2³ ≠ 2 · 3.',
    cue: ['Ett litet upphöjt tal: 2⁵, 10³.'],
    cvis: { t: 'powers', base: 3, m: 2, n: 2, op: 'mul' },
    f: { name: 'Potens', main: 'a^n = \\underbrace{a \\cdot a \\cdots a}_{n}', when: 'Samma tal multipliceras med sig självt flera gånger.', sym: [['a', 'basen'], ['n', 'exponenten = antal faktorer']], forms: [['Tiopotenser', '10^3 = 1000 \\text{ (1 och 3 nollor)}'], ['Prioritet', '\\text{potens före } \\cdot \\text{ och } +']], ex: '$2^5 = 2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2 = 32$', trap: '$2^3 = 8$, inte $6$.' },
    h1: 'Potens: skriv ut multiplikationen.',
    ex: { q: 'Beräkna 3⁴.', vis: { t: 'powers', base: 3, m: 2, n: 2, op: 'mul' }, given: ['3⁴'], find: 'värdet', rule: 'a^n', steps: [['Skriv ut', '$3 \\cdot 3 \\cdot 3 \\cdot 3$'], ['Räkna stegvis', '$9 \\cdot 9 = 81$']], ans: '81' },
    g: { q: 'Beräkna 2⁵.', given: ['2⁵'], find: 'värdet', opts: ['2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2', '2 \\cdot 5', '5 \\cdot 5'], oc: 0, why: 'Exponenten 5 = fem faktorer 2.', type: 'num', a: 32, calc: '2**5', start: '$2 \\cdot 2 \\cdot 2 \\cdot 2 \\cdot 2$', sol: ['$4 \\cdot 4 \\cdot 2 = 32$'], traps: [[10, '$2^5$ är inte $2 \\cdot 5$. Det är fem tvåor multiplicerade.'], [25, 'Det är $5^2$. Här är basen 2 och exponenten 5.']] },
    p: [
      { lv: 'A', q: 'Beräkna 10³.', type: 'num', a: 1000, calc: '10**3', given: ['10³'], find: 'värdet', start: '1 följt av 3 nollor', sol: ['$10 \\cdot 10 \\cdot 10 = 1000$'], traps: [[30, '$10^3 = 10 \\cdot 10 \\cdot 10$.']] },
      { lv: 'B', q: 'Beräkna 5² + 2³.', type: 'num', a: 33, calc: '5**2+2**3', given: ['5² + 2³'], find: 'värdet', start: 'Potenserna först.', sol: ['$25 + 8 = 33$'], traps: [[16, '$5^2 = 25$ och $2^3 = 8$ (inte 10 och 6).']] },
      { lv: 'C', q: '2ⁿ = 64. Vilket är n?', type: 'num', a: 6, calc: 'Math.log2(64)', given: ['2ⁿ = 64'], find: 'exponenten n', start: 'Dubbla från 2 tills du når 64. Räkna stegen.', sol: ['2, 4, 8, 16, 32, 64', 'Sex tvåor → n = 6'], traps: [[32, 'Det är 64/2. Frågan är hur många tvåor.']] },
      { lv: 'F', q: 'Beräkna (−3)².', type: 'num', a: 9, calc: '(-3)**2', given: ['(−3)²'], find: 'värdet', start: '$(-3) \\cdot (-3)$', sol: ['Minus gånger minus blir plus: $9$'], traps: [[-9, '$(-3)^2 = (-3) \\cdot (-3) = +9$.'], [-6, 'Potens är inte gånger 2.']] }
    ],
    kw: 'potens potensform exponent bas upphöjt tiopotens 10 upphöjt'
  });

  S.push({
    id: 'f8-negative', ch: 'f8-tal', w: [37, 39], title: 'Negativa tal', sub: 'tallinje och teckenregler',
    idea: 'Negativa tal ligger till **vänster om noll** på tallinjen. Addera = gå åt höger, subtrahera = gå åt vänster. Vid gånger och delat räcker teckenregeln.',
    anchor: 'Lika tecken → plus. Olika tecken → minus. (gäller · och ÷)',
    cue: ['Minus framför ett tal, temperaturer, skulder.'],
    cvis: { t: 'numline', start: -4, move: 7 },
    f: { name: 'Negativa tal', main: '(-a)\\cdot(-b) = +ab', when: 'Räkning med negativa tal.', sym: [['−', 'negativt – vänster om 0']], rules: ['+ och −: använd tallinjen.', 'Minus ett negativt tal = plus: $5 - (-3) = 5 + 3$.', '· och ÷: lika tecken → +, olika tecken → −.'], ex: '$-4 \\cdot (-3) = 12$', trap: '$-7 + 12$: börja på −7 och gå 12 steg åt höger = 5, inte −19.' },
    h1: 'Addition/subtraktion → tallinjen. Multiplikation/division → teckenregeln.',
    ex: { q: 'Beräkna −4 · (−3).', vis: { t: 'signs' }, given: ['−4', '−3'], find: 'produkten', rule: '(-a)(-b) = +ab', steps: [['Vilka tecken?', 'Två minus – lika tecken'], ['Lika tecken ger …', 'plus'], ['Svar', '$4 \\cdot 3 = 12$']], ans: '12' },
    g: { q: 'Beräkna −7 + 12.', vis: { t: 'numline', start: -7, move: 12 }, given: ['start −7', '+12'], find: 'summan', opts: ['\\text{gå 12 steg åt höger från } -7', '-(7+12)', '7 + 12'], oc: 0, why: 'Plus = gå åt höger på tallinjen.', type: 'num', a: 5, calc: '-7+12', start: 'Från −7: 7 steg till 0, sedan 5 steg till.', sol: ['$-7 + 7 = 0$', '$0 + 5 = 5$'], traps: [[-19, 'Du gick åt fel håll. Plus 12 = 12 steg åt höger.'], [19, 'Starttalet är −7, inte 7.']] },
    p: [
      { lv: 'A', q: 'Beräkna −6 · 4.', vis: { t: 'signs' }, type: 'num', a: -24, calc: '-6*4', given: ['−6', '4'], find: 'produkten', start: 'Olika tecken.', sol: ['Olika tecken → minus: $-24$'] },
      { lv: 'B', q: 'Beräkna −30 ÷ (−5).', type: 'num', a: 6, calc: '-30/-5', given: ['−30', '−5'], find: 'kvoten', start: 'Lika tecken.', sol: ['Lika tecken → plus: $6$'] },
      { lv: 'C', q: 'Beräkna 5 − (−3).', vis: { t: 'numline', start: 5, move: 3, from: -5, to: 10 }, type: 'num', a: 8, calc: '5-(-3)', given: ['5', '− (−3)'], find: 'värdet', start: 'Minus ett negativt tal = plus.', sol: ['$5 - (-3) = 5 + 3 = 8$'], traps: [[2, 'Två minus i rad blir plus: 5 + 3.']] },
      { lv: 'F', q: 'Temperaturen är −8 °C på morgonen och stiger 13 grader. Vad blir temperaturen?', vis: { t: 'numline', start: -8, move: 13 }, type: 'num', a: 5, u: '°C', uAlt: ['°', 'grader'], calc: '-8+13', given: ['−8 °C', 'stiger 13 grader'], find: 'ny temperatur', start: 'Stiger = åt höger på tallinjen.', sol: ['$-8 + 13 = 5$ °C'], traps: [[-21, 'Temperaturen STIGER – gå åt höger.']] }
    ],
    kw: 'negativa tal minus tallinje teckenregel minus gånger minus temperatur'
  });

  S.push({
    id: 'f8-simplify-fraction', ch: 'f8-tal', w: [39], title: 'Förkorta bråk', sub: 'samma värde, mindre tal',
    idea: 'Att förkorta betyder att dela täljare och nämnare med **samma tal**. Bråket blir enklare men har **samma värde**, som när du byter 2 tjugor mot en fyrtia.',
    anchor: 'Dela uppe och nere med samma tal. Fortsätt tills inget tal (utom 1) delar båda.',
    cue: ['"Förkorta" eller "enklaste form".', 'Täljare och nämnare har en gemensam faktor.'],
    cvis: { t: 'fracCompare', a: [3, 4], b: [18, 24], la: '3/4', lb_: '18/24' },
    f: { name: 'Förkorta bråk', main: '\\frac{a}{b} = \\frac{a \\div k}{b \\div k}', when: 'Bråk ska skrivas i enklaste form.', sym: [['k', 'tal som delar både täljare och nämnare']], forms: [['Förlänga (baklänges)', '\\frac{a}{b} = \\frac{a \\cdot k}{b \\cdot k}']], ex: '$\\frac{18}{24} = \\frac{18 \\div 6}{24 \\div 6} = \\frac{3}{4}$', trap: 'Dela båda med samma tal – annars ändras värdet.' },
    h1: 'Vilket tal delar både täljaren och nämnaren?',
    ex: { q: 'Förkorta 18/24 så långt som möjligt.', vis: { t: 'fracCompare', a: [3, 4], b: [18, 24], la: '3/4', lb_: '18/24' }, given: ['18/24'], find: 'enklaste form', rule: '\\frac{a \\div k}{b \\div k}', steps: [['Största tal som delar både 18 och 24?', '6'], ['Dela', '$\\frac{18 \\div 6}{24 \\div 6} = \\frac{3}{4}$']], ans: '3/4' },
    g: { q: 'Vilket är 21/28 i enklaste form?', type: 'choice', opts: ['3/4', '4/3', '7/9', '2/3'], a: '3/4', given: ['21/28'], find: 'enklaste form', start: 'Både 21 och 28 finns i 7-ans tabell.', sol: ['$\\frac{21 \\div 7}{28 \\div 7} = \\frac{3}{4}$'], traps: [['4/3', 'Täljaren (21) ska fortfarande stå överst.']] },
    p: [
      { lv: 'A', q: 'Förkorta 12/18 så långt som möjligt. Svara som a/b.', type: 'num', a: 2 / 3, calc: '12/18', mustFraction: [2, 3], given: ['12/18'], find: 'enklaste form', start: 'Dela med 6.', sol: ['$\\frac{12 \\div 6}{18 \\div 6} = \\frac{2}{3}$'], answerHint: 'Skriv t.ex. 2/3' },
      { lv: 'B', q: 'Förkorta 15/25 så långt som möjligt. Svara som a/b.', type: 'num', a: 0.6, calc: '15/25', mustFraction: [3, 5], given: ['15/25'], find: 'enklaste form', start: 'Dela med 5.', sol: ['$\\frac{3}{5}$'], answerHint: 'Skriv t.ex. 3/5' },
      { lv: 'C', q: 'Förläng 2/5 så att nämnaren blir 30. Vilken blir täljaren?', type: 'num', a: 12, calc: '2*30/5', given: ['2/5', 'ny nämnare 30'], find: 'ny täljare', start: '$5 \\cdot 6 = 30$ → gör samma med täljaren.', sol: ['$\\frac{2 \\cdot 6}{5 \\cdot 6} = \\frac{12}{30}$'], traps: [[27, 'Du lade till 25. Förlänga = multiplicera med samma tal.']] },
      { lv: 'F', q: 'Av 40 elever valde 24 fotboll. Hur stor andel är det, i enklaste form? Svara som a/b.', type: 'num', a: 0.6, calc: '24/40', mustFraction: [3, 5], given: ['24 av 40'], find: 'andel i enklaste form', start: '$\\frac{24}{40}$ – dela med 8.', sol: ['$\\frac{24 \\div 8}{40 \\div 8} = \\frac{3}{5}$'], answerHint: 'Skriv t.ex. 3/5' }
    ],
    kw: 'förkorta bråk enklaste form förlänga bråk gemensam faktor'
  });

  /* ================= KAPITEL 2 · GEOMETRI ================= */
  S.push({
    id: 'f8-units', ch: 'f8-geo', w: [40, 41], title: 'Längd-, area- och volymenheter', sub: '×10, ×100, ×1000 per steg',
    idea: 'Hur mycket du multiplicerar beror på **antalet dimensioner**. Längd har 1 dimension: ×10 per steg. Area har 2 (bredd och höjd): 10·10 = **×100** per steg. Volym har 3: 10·10·10 = **×1000** per steg.',
    anchor: 'Titta på exponenten: inget = 10, ² = 100, ³ = 1000 per steg.',
    cue: ['Byta enhet: m → cm, m² → cm², dm³ → cm³, liter.'],
    cvis: { t: 'units', dim: 2, from: 'm²', to: 'dm²' },
    f: { name: 'Enhetsbyten', main: '1\\,\\text{m} = 10\\,\\text{dm} \\quad 1\\,\\text{m}^2 = 100\\,\\text{dm}^2 \\quad 1\\,\\text{m}^3 = 1000\\,\\text{dm}^3', when: 'Längd, area eller volym ska skrivas i en annan enhet.', sym: [['1 dimension', '×10 per steg'], ['2 dimensioner', '×100 per steg'], ['3 dimensioner', '×1000 per steg'], ['1 dm³', '= 1 liter']], forms: [['Till mindre enhet', '\\text{gånger}'], ['Till större enhet', '\\text{delat}'], ['1 m² i cm²', '100 \\cdot 100 = 10\\,000']], ex: '$2{,}5$ m² $= 2{,}5 \\cdot 10\\,000 = 25\\,000$ cm²', trap: '1 m² är INTE 100 cm² – det är 100 · 100 = 10 000 cm².' },
    h1: 'Är det längd, area (²) eller volym (³)? Det bestämmer faktorn per steg.',
    ex: { q: 'Omvandla 2,5 m² till cm².', vis: { t: 'units', dim: 2, from: 'm²', to: 'cm²' }, given: ['2,5 m²'], find: 'arean i cm²', rule: '\\times 100 \\text{ per steg}', steps: [['Längd, area eller volym?', 'Area (²) → ×100 per steg'], ['Hur många steg m² → cm²?', '2 steg (m² → dm² → cm²) → $100 \\cdot 100 = 10\\,000$'], ['Räkna', '$2{,}5 \\cdot 10\\,000 = 25\\,000$ cm²']], ans: '25 000 cm²' },
    g: { q: 'Omvandla 1,5 m² till cm².', vis: { t: 'units', dim: 2, from: 'm²', to: 'cm²' }, given: ['1,5 m²'], find: 'arean i cm²', opts: ['1{,}5 \\cdot 10\\,000', '1{,}5 \\cdot 100', '1{,}5 \\cdot 1000'], oc: 0, why: 'Area: ×100 per steg, två steg → ×10 000.', type: 'num', a: 15000, u: 'cm²', calc: '1.5*100*100', unitSkill: true, start: '$1{,}5 \\cdot 10\\,000$', sol: ['$1$ m² $= 10\\,000$ cm²', '$1{,}5 \\cdot 10\\,000 = 15\\,000$ cm²'], traps: [[150, 'Du räknade som längd (×100 totalt). Area: ×100 per steg, 2 steg = ×10 000.']] },
    p: [
      { lv: 'A', q: 'Omvandla 3,2 m till cm.', vis: { t: 'units', dim: 1, from: 'm', to: 'cm' }, type: 'num', a: 320, u: 'cm', calc: '3.2*100', unitSkill: true, given: ['3,2 m'], find: 'längden i cm', start: 'Längd: ×10 per steg, 2 steg.', sol: ['$3{,}2 \\cdot 100 = 320$ cm'] },
      { lv: 'B', q: 'Omvandla 2 dm³ till cm³.', vis: { t: 'units', dim: 3, from: 'dm³', to: 'cm³' }, type: 'num', a: 2000, u: 'cm³', calc: '2*1000', unitSkill: true, given: ['2 dm³'], find: 'volymen i cm³', start: 'Volym: ×1000 per steg, 1 steg.', sol: ['$2 \\cdot 1000 = 2000$ cm³'], traps: [[20, 'Volym har tre dimensioner: ×1000 per steg.'], [200, 'Volym: ×1000 per steg, inte ×100.']] },
      { lv: 'C', q: 'Omvandla 4 500 cm² till m².', vis: { t: 'units', dim: 2, from: 'cm²', to: 'm²' }, type: 'num', a: 0.45, u: 'm²', calc: '4500/10000', unitSkill: true, given: ['4 500 cm²'], find: 'arean i m²', start: 'Till större enhet → dela med 10 000.', sol: ['$4500 / 10\\,000 = 0{,}45$ m²'], traps: [[45, 'Area: dela med 10 000, inte 100.']] },
      { lv: 'D', q: 'Ett akvarium rymmer 60 dm³. Hur många liter är det?', type: 'num', a: 60, u: 'l', calc: '60', given: ['60 dm³'], find: 'liter', start: '1 dm³ = 1 liter', sol: ['$60$ dm³ $= 60$ liter'] },
      { lv: 'F', q: 'Ett golv är 4 m × 3 m. Hur många cm² är golvet?', type: 'num', a: 120000, u: 'cm²', calc: '12*10000', unitSkill: true, given: ['4 m × 3 m'], find: 'arean i cm²', start: 'Arean $= 12$ m². Sedan ×10 000.', sol: ['$4 \\cdot 3 = 12$ m²', '$12 \\cdot 10\\,000 = 120\\,000$ cm²'], traps: [[1200, 'Area: 1 m² = 10 000 cm², inte 100.']] }
    ],
    kw: 'enheter omvandla enheter längdenheter areaenheter volymenheter m2 cm2 dm3 liter kvadratmeter'
  });

  S.push({
    id: 'f8-perimeter', ch: 'f8-geo', w: [40, 43], title: 'Omkrets', sub: 'gå runt kanten',
    idea: 'Omkrets är **längden runt** en figur – som ett staket runt en trädgård. Du adderar alla sidor. Enheten är en längd (cm, m), inte kvadrat.',
    anchor: 'Omkrets = staketet. Area = gräsmattan.',
    cue: ['Orden omkrets, runt, staket, kant, ram.'],
    cvis: { t: 'perim', shape: 'rect', w: 8, h: 5 },
    f: { name: 'Omkrets', main: 'O = \\text{summan av alla sidor}', when: 'Längden runt en figur.', sym: [['O', 'omkrets (enhet: cm, m)']], forms: [['Rektangel', 'O = 2b + 2h'], ['Kvadrat', 'O = 4s'], ['Söker en sida (rektangel)', 'b = \\frac{O - 2h}{2}']], ex: 'Rektangel 8 × 5: $8 + 5 + 8 + 5 = 26$ cm', trap: 'Glöm inte de sidor som inte har siffror utskrivna – i en rektangel är motstående sidor lika.' },
    h1: 'Gå runt figuren. Har du räknat med alla sidor?',
    ex: { q: 'En rektangel är 8 cm × 5 cm. Bestäm omkretsen.', vis: { t: 'perim', shape: 'rect', w: 8, h: 5 }, given: ['b = 8 cm', 'h = 5 cm'], find: 'omkretsen', rule: 'O = 2b + 2h', steps: [['Hur många sidor har en rektangel?', '4 – två av varje'], ['Addera', '$8 + 5 + 8 + 5 = 26$ cm']], ans: '26 cm' },
    g: { q: 'En rektangel är 9 cm × 4 cm. Bestäm omkretsen.', vis: { t: 'perim', shape: 'rect', w: 9, h: 4 }, given: ['9 cm', '4 cm'], find: 'omkretsen', opts: ['2 \\cdot 9 + 2 \\cdot 4', '9 \\cdot 4', '9 + 4'], oc: 0, why: 'Omkrets = alla fyra sidorna.', type: 'num', a: 26, u: 'cm', calc: '2*9+2*4', start: '$18 + 8$', sol: ['$2 \\cdot 9 + 2 \\cdot 4 = 26$ cm'], traps: [[36, 'Det är arean (9 · 4). Omkrets = summan av sidorna.'], [13, 'Du räknade bara två sidor. En rektangel har fyra.']] },
    p: [
      { lv: 'A', q: 'En kvadrat har sidan 7,5 cm. Bestäm omkretsen.', vis: { t: 'perim', shape: 'square', side: 7.5 }, type: 'num', a: 30, u: 'cm', calc: '4*7.5', given: ['sida 7,5 cm'], find: 'omkretsen', start: '$4 \\cdot 7{,}5$', sol: ['$= 30$ cm'], traps: [[56.25, 'Det är arean. Omkrets = 4 sidor.']] },
      { lv: 'B', q: 'En triangel har sidorna 6 cm, 8 cm och 11 cm. Bestäm omkretsen.', vis: { t: 'perim', shape: 'tri', sides: [11, 8, 6] }, type: 'num', a: 25, u: 'cm', calc: '6+8+11', given: ['6, 8 och 11 cm'], find: 'omkretsen', start: 'Addera alla tre.', sol: ['$6 + 8 + 11 = 25$ cm'] },
      { lv: 'C', q: 'En rektangel har omkretsen 30 cm och bredden 6 cm. Hur lång är den?', type: 'num', a: 9, u: 'cm', calc: '(30-2*6)/2', given: ['O = 30 cm', 'bredd 6 cm'], find: 'längden', start: 'Två bredder: 12 cm. Resten delas på två längder.', sol: ['$30 - 12 = 18$', '$18 / 2 = 9$ cm'], traps: [[24, 'Du drog bara bort en bredd. Det finns två.'], [18, 'Det är båda längderna tillsammans. Dela på 2.']] },
      { lv: 'F', q: 'En kvadratisk hage ska få staket. Hagen har arean 49 m². Hur många meter staket behövs?', type: 'num', a: 28, u: 'm', calc: '4*Math.sqrt(49)', given: ['kvadrat', 'area 49 m²'], find: 'omkretsen', start: 'Sidan: $\\sqrt{49}$', sol: ['Sida $= 7$ m', '$4 \\cdot 7 = 28$ m'], traps: [[49, 'Det är arean. Hitta sidan först.']] }
    ],
    kw: 'omkrets runt staket kant rektangel kvadrat triangel summan av sidorna'
  });

  S.push({
    id: 'f8-area', ch: 'f8-geo', w: [41, 45], title: 'Area', sub: 'rektangel, triangel, parallellogram',
    idea: 'Area mäter **hur många rutor** som får plats inuti figuren. En rektangel 12 × 7 rymmer 12 rutor i varje rad och 7 rader. En triangel är **halva** rektangeln runt den.',
    anchor: 'Rektangel b·h. Triangel b·h/2. Höjden står alltid vinkelrät mot basen.',
    cue: ['Orden area, yta, cm², m², golv, tapet.'],
    cvis: { t: 'area', shape: 'rect', b: 6, h: 4 },
    f: { name: 'Area', main: 'A = b \\cdot h', when: 'Ytan av en rektangel eller parallellogram.', sym: [['b', 'basen'], ['h', 'höjden – vinkelrät mot basen'], ['A', 'area (cm², m²)']], forms: [['Triangel', 'A = \\frac{b \\cdot h}{2}'], ['Söker höjden', 'h = \\frac{A}{b}'], ['Triangel, söker höjden', 'h = \\frac{2A}{b}']], ex: 'Triangel $b = 10$, $h = 6$: $\\frac{10 \\cdot 6}{2} = 30$ cm²', trap: 'Höjden är inte den sneda sidan – den är rät mot basen.' },
    h1: 'Vilken figur? Rektangel/parallellogram: b·h. Triangel: b·h/2.',
    ex: { q: 'En triangel har basen 10 cm och höjden 6 cm. Bestäm arean.', vis: { t: 'area', shape: 'tri', b: 10, h: 6 }, given: ['b = 10 cm', 'h = 6 cm'], find: 'arean', rule: 'A = \\frac{b \\cdot h}{2}', steps: [['Varför delat med 2?', 'Triangeln är halva rektangeln'], ['Räkna', '$\\frac{10 \\cdot 6}{2} = 30$ cm²']], ans: '30 cm²' },
    g: { q: 'En triangel har basen 9 cm och höjden 8 cm. Bestäm arean.', vis: { t: 'area', shape: 'tri', b: 9, h: 8 }, given: ['b = 9 cm', 'h = 8 cm'], find: 'arean', opts: ['\\frac{9 \\cdot 8}{2}', '9 \\cdot 8', '9 + 8'], oc: 0, why: 'Triangel = halva rektangeln.', type: 'num', a: 36, u: 'cm²', calc: '9*8/2', start: '$72 / 2$', sol: ['$\\frac{72}{2} = 36$ cm²'], traps: [[72, 'Det är hela rektangeln. Triangeln är hälften.']] },
    p: [
      { lv: 'A', q: 'En rektangel är 12 cm × 7 cm. Bestäm arean.', vis: { t: 'area', shape: 'rect', b: 12, h: 7 }, type: 'num', a: 84, u: 'cm²', calc: '12*7', given: ['12 cm', '7 cm'], find: 'arean', start: '$12 \\cdot 7$', sol: ['$= 84$ cm²'], traps: [[38, 'Det är omkretsen. Area = b · h.']] },
      { lv: 'B', q: 'En parallellogram har basen 11 cm och höjden 5 cm. Bestäm arean.', vis: { t: 'area', shape: 'para', b: 11, h: 5 }, type: 'num', a: 55, u: 'cm²', calc: '11*5', given: ['b = 11 cm', 'h = 5 cm'], find: 'arean', start: '$11 \\cdot 5$', sol: ['$= 55$ cm²'], traps: [[27.5, 'Parallellogram: b · h (ingen delning med 2).']] },
      { lv: 'C', q: 'En triangel har arean 24 cm² och basen 8 cm. Hur hög är den?', vis: { t: 'area', shape: 'tri', b: 8, h: '?' }, type: 'num', a: 6, u: 'cm', calc: '2*24/8', given: ['A = 24 cm²', 'b = 8 cm'], find: 'höjden', start: 'Baklänges: $h = \\frac{2A}{b}$', sol: ['$2 \\cdot 24 = 48$', '$48 / 8 = 6$ cm'], traps: [[3, 'Glöm inte att triangeln är halva rektangeln: h = 2A/b.']] },
      { lv: 'F', q: 'Ett rum är 4,5 m × 3,2 m. Golvmattan kostar 200 kr/m². Vad kostar mattan?', type: 'num', a: 2880, u: 'kr', calc: '4.5*3.2*200', given: ['4,5 m × 3,2 m', '200 kr/m²'], find: 'kostnaden', start: 'Arean först: $4{,}5 \\cdot 3{,}2$', sol: ['$A = 14{,}4$ m²', '$14{,}4 \\cdot 200 = 2880$ kr'] }
    ],
    kw: 'area yta rektangel triangel parallellogram bas höjd kvadratcentimeter golv'
  });

  S.push({
    id: 'f8-circle-circ', ch: 'f8-geo', w: [41], title: 'Cirkelns omkrets', sub: 'O = πd = 2πr',
    idea: 'I **alla** cirklar är omkretsen drygt 3 gånger diametern – exakt π ≈ 3,14 gånger. Därför: $O = \\pi \\cdot d$. Och eftersom $d = 2r$ blir det också $O = 2\\pi r$.',
    anchor: 'Radien = mitten till kanten. Diametern = hela vägen genom mitten = 2r.',
    cue: ['Cirkel och ordet omkrets, varv, runt, hjul.'],
    cvis: { t: 'circle', r: 4, show: 'O' },
    f: { name: 'Cirkelns omkrets', main: 'O = \\pi d = 2\\pi r', when: 'Längden runt en cirkel.', sym: [['r', 'radie'], ['d', 'diameter = 2r'], ['π', '≈ 3,14']], forms: [['Söker radien', 'r = \\frac{O}{2\\pi}'], ['Söker diametern', 'd = \\frac{O}{\\pi}']], ex: '$r = 5$: $O = 2\\pi \\cdot 5 \\approx 31{,}42$ cm', trap: 'Har du diametern? Använd $\\pi d$ – eller halvera först till radien.' },
    h1: 'Cirkel + omkrets. Har du radien eller diametern?',
    ex: { q: 'En cirkel har radien 4 cm. Bestäm omkretsen. Avrunda till två decimaler.', vis: { t: 'circle', r: 4, show: 'O' }, given: ['r = 4 cm'], find: 'omkretsen O', rule: 'O = 2\\pi r', steps: [['Radie eller diameter?', 'Radie → $2\\pi r$'], ['Räkna', '$2 \\cdot \\pi \\cdot 4 = 8\\pi \\approx 25{,}13$ cm']], ans: '≈ 25,13 cm' },
    g: { q: 'En cirkel har radien 5 cm. Bestäm omkretsen. Avrunda till två decimaler.', vis: { t: 'circle', r: 5, show: 'O' }, given: ['r = 5 cm'], find: 'omkretsen', opts: ['2 \\pi \\cdot 5', '\\pi \\cdot 5^2', '\\pi \\cdot 5'], oc: 0, why: 'Omkrets med radie: 2πr. (πr² är arean.)', type: 'num', a: 31.42, u: 'cm', dec: 2, calc: '2*Math.PI*5', start: '$10\\pi$', sol: ['$2\\pi \\cdot 5 = 10\\pi \\approx 31{,}42$ cm'], traps: [[78.54, 'Det är arean (πr²). Omkrets: 2πr.'], [15.71, 'Du använde radien som diameter. Med radien: 2πr.']] },
    p: [
      { lv: 'A', q: 'Diametern är 12 cm. Bestäm omkretsen. Avrunda till två decimaler.', vis: { t: 'circle', d: 12, show: 'O' }, type: 'num', a: 37.7, u: 'cm', dec: 2, calc: 'Math.PI*12', given: ['d = 12 cm'], find: 'omkretsen', start: '$O = \\pi d$', sol: ['$12\\pi \\approx 37{,}70$ cm'], traps: [[75.4, 'Du använde diametern som radie: 2π·12. Med diameter: πd.']] },
      { lv: 'C', q: 'Omkretsen är 31,4 cm. Bestäm radien. Använd π ≈ 3,14.', vis: { t: 'circle', r: '?', show: 'O', O: '31,4 cm' }, type: 'num', a: 5, u: 'cm', calc: '31.4/(2*3.14)', given: ['O = 31,4 cm', 'π ≈ 3,14'], find: 'radien', start: 'Baklänges: $r = \\frac{O}{2\\pi}$', sol: ['$31{,}4 / 6{,}28 = 5$ cm'], traps: [[10, 'Det är diametern (O/π). Radien är hälften.']], tol: 0.01 },
      { lv: 'D', q: 'Ett cykelhjul har diametern 70 cm. Hur långt rullar cykeln när hjulet snurrar ett varv? Svara i cm, avrunda till heltal.', type: 'num', a: 220, u: 'cm', dec: 0, calc: 'Math.PI*70', given: ['d = 70 cm', 'ett varv'], find: 'sträckan', start: 'Ett varv = omkretsen.', sol: ['$70\\pi \\approx 219{,}9$ ≈ 220 cm'] },
      { lv: 'F', q: 'En cirkelformad rabatt har radien 3 m. Hur många meter kantsten behövs runt den? Avrunda till en decimal.', type: 'num', a: 18.8, u: 'm', dec: 1, calc: '2*Math.PI*3', given: ['r = 3 m'], find: 'omkretsen', start: '$2\\pi \\cdot 3$', sol: ['$6\\pi \\approx 18{,}8$ m'], traps: [[28.3, 'Det är arean. Kantsten = omkrets.']] }
    ],
    kw: 'cirkel omkrets pi diameter radie hjul varv runt cirkeln'
  });

  S.push({
    id: 'f8-circle-area', ch: 'f8-geo', w: [41], title: 'Cirkelns area', sub: 'A = πr²',
    idea: 'Arean av en cirkel är **π gånger radien i kvadrat**. Tänk: en kvadrat med sidan r rymms ungefär 3,14 gånger i cirkeln. Använd alltid **radien** – inte diametern.',
    anchor: 'Area → r². Har du diametern: halvera först!',
    cue: ['Cirkel och area, yta, pizza, bord, rabatt.'],
    cvis: { t: 'circle', r: 3, show: 'A' },
    f: { name: 'Cirkelns area', main: 'A = \\pi r^2', when: 'Ytan av en cirkel.', sym: [['r', 'radien'], ['r²', 'r · r (inte 2r!)']], forms: [['Söker radien', 'r = \\sqrt{\\frac{A}{\\pi}}'], ['Med diameter', 'A = \\pi \\left(\\frac{d}{2}\\right)^2']], ex: '$r = 4$: $A = \\pi \\cdot 16 \\approx 50{,}27$ cm²', trap: 'Du använde diametern som radie. Radien är halva diametern.' },
    h1: 'Cirkelarea – har du radien? Annars: halvera diametern.',
    ex: { q: 'En cirkel har radien 3 cm. Bestäm arean. Avrunda till två decimaler.', vis: { t: 'circle', r: 3, show: 'A' }, given: ['r = 3 cm'], find: 'arean', rule: 'A = \\pi r^2', steps: [['Kvadrera radien', '$3^2 = 9$'], ['Gånger π', '$9\\pi \\approx 28{,}27$ cm²']], ans: '≈ 28,27 cm²' },
    g: { q: 'Radien är 4 cm. Bestäm arean. Avrunda till två decimaler.', vis: { t: 'circle', r: 4, show: 'A' }, given: ['r = 4 cm'], find: 'arean', opts: ['\\pi \\cdot 4^2', '2\\pi \\cdot 4', '\\pi \\cdot 4 \\cdot 2'], oc: 0, why: 'Area = πr².', type: 'num', a: 50.27, u: 'cm²', dec: 2, calc: 'Math.PI*16', start: '$16\\pi$', sol: ['$\\pi \\cdot 16 \\approx 50{,}27$ cm²'], traps: [[25.13, 'Det är omkretsen (2πr). Area: πr².']] },
    p: [
      { lv: 'A', q: 'Diametern är 10 cm. Bestäm arean. Avrunda till två decimaler.', vis: { t: 'circle', d: 10, show: 'A' }, type: 'num', a: 78.54, u: 'cm²', dec: 2, calc: 'Math.PI*25', given: ['d = 10 cm'], find: 'arean', start: 'Radien $= 5$ cm', sol: ['$r = 5$', '$\\pi \\cdot 25 \\approx 78{,}54$ cm²'], traps: [[314.16, 'Du använde diametern som radie. Radien är halva diametern: 5 cm.']] },
      { lv: 'C', q: 'En cirkel har arean 78,5 cm². Bestäm radien. Använd π ≈ 3,14.', vis: { t: 'circle', r: '?', show: 'A', A: '78,5 cm²' }, type: 'num', a: 5, u: 'cm', calc: 'Math.sqrt(78.5/3.14)', given: ['A = 78,5 cm²'], find: 'radien', start: '$r^2 = 78{,}5 / 3{,}14$', sol: ['$r^2 = 25$', '$r = \\sqrt{25} = 5$ cm'], traps: [[25, 'Det är $r^2$. Ta roten: r = 5.']], tol: 0.01 },
      { lv: 'D', q: 'En pizza har diametern 30 cm. Hur stor är ytan? Avrunda till heltal cm².', type: 'num', a: 707, u: 'cm²', dec: 0, calc: 'Math.PI*15**2', given: ['d = 30 cm'], find: 'arean', start: 'Radien 15 cm.', sol: ['$\\pi \\cdot 15^2 = 225\\pi \\approx 707$ cm²'], traps: [[2827, 'Radien är 15 cm, inte 30.'], [94, 'Det är omkretsen.']] },
      { lv: 'F', q: 'En rund matta har radien 1,2 m. Hur stor är den? Avrunda till två decimaler.', type: 'num', a: 4.52, u: 'm²', dec: 2, calc: 'Math.PI*1.44', given: ['r = 1,2 m'], find: 'arean', start: '$1{,}2^2 = 1{,}44$', sol: ['$1{,}44\\pi \\approx 4{,}52$ m²'] }
    ],
    kw: 'cirkel area cirkelarea yta pi r2 radie diameter pizza'
  });

  S.push({
    id: 'f8-sector', ch: 'f8-geo', w: [41], title: 'Cirkelbåge och sektor', sub: 'en bit av cirkeln',
    idea: 'En **sektor** är en tårtbit av cirkeln. Hur stor bit? Medelpunktsvinkeln delat med 360°. Sedan tar du **samma andel** av hela arean (sektor) eller hela omkretsen (båge).',
    anchor: 'Andel = v/360. Gånger hela arean eller hela omkretsen.',
    cue: ['Tårtbit, del av cirkel, vinkel vid mitten, båge.'],
    cvis: { t: 'sector', v: 90, r: 4, show: 'area' },
    f: { name: 'Sektor och båge', main: '\\text{andel} = \\frac{v}{360°}', when: 'En del av en cirkel med medelpunktsvinkeln v.', sym: [['v', 'medelpunktsvinkel'], ['r', 'radie']], forms: [['Sektorns area', 'A = \\frac{v}{360} \\cdot \\pi r^2'], ['Bågens längd', 'b = \\frac{v}{360} \\cdot 2\\pi r'], ['Söker vinkeln', 'v = \\frac{A}{\\pi r^2} \\cdot 360']], ex: '$90°$ av $r = 4$: $\\frac{1}{4} \\cdot 16\\pi \\approx 12{,}57$', trap: 'Bågen hör ihop med omkretsen (2πr), sektorn med arean (πr²).' },
    h1: 'Hur stor bit av cirkeln? Börja med v/360.',
    ex: { q: 'En 90° sektor har radien 4 cm. Bestäm sektorns area. Avrunda till två decimaler.', vis: { t: 'sector', v: 90, r: 4, show: 'area' }, given: ['v = 90°', 'r = 4 cm'], find: 'sektorns area', rule: '\\frac{v}{360} \\cdot \\pi r^2', steps: [['Hur stor andel?', '$90/360 = 1/4$'], ['Hela arean', '$\\pi \\cdot 16 \\approx 50{,}27$'], ['En fjärdedel', '$50{,}27 / 4 \\approx 12{,}57$ cm²']], ans: '≈ 12,57 cm²' },
    g: { q: 'En 90° sektor har radien 6 cm. Bestäm sektorns area. Avrunda till två decimaler.', vis: { t: 'sector', v: 90, r: 6, show: 'area' }, given: ['v = 90°', 'r = 6 cm'], find: 'sektorns area', opts: ['\\frac{90}{360} \\cdot \\pi \\cdot 6^2', '\\frac{90}{360} \\cdot 2\\pi \\cdot 6', '90 \\cdot \\pi \\cdot 6^2'], oc: 0, why: 'Sektor = andel av arean.', type: 'num', a: 28.27, u: 'cm²', dec: 2, calc: '0.25*Math.PI*36', start: '$\\frac{1}{4} \\cdot 36\\pi$', sol: ['$36\\pi \\approx 113{,}10$', '$/4 \\approx 28{,}27$ cm²'], traps: [[9.42, 'Det är bågens längd. Sektorns area: andel av πr².'], [113.1, 'Det är hela cirkeln. Ta bara 90/360.']] },
    p: [
      { lv: 'A', q: 'En 180° cirkelbåge har radien 5 cm. Hur lång är bågen? Avrunda till två decimaler.', vis: { t: 'sector', v: 180, r: 5, show: 'arc' }, type: 'num', a: 15.71, u: 'cm', dec: 2, calc: '0.5*2*Math.PI*5', given: ['v = 180°', 'r = 5 cm'], find: 'bågens längd', start: 'Halva omkretsen.', sol: ['$\\frac{1}{2} \\cdot 2\\pi \\cdot 5 = 5\\pi \\approx 15{,}71$ cm'], traps: [[39.27, 'Det är halva arean. Bågen hör till omkretsen.']] },
      { lv: 'B', q: 'En sektor har vinkeln 120°. Hur stor del av cirkeln är det i procent? Avrunda till en decimal.', type: 'num', a: 33.3, u: '%', dec: 1, calc: '120/360*100', given: ['v = 120°'], find: 'andel i %', start: '$120/360$', sol: ['$= 1/3 \\approx 33{,}3$ %'] },
      { lv: 'C', q: 'En sektor i en cirkel med radien 10 cm har arean 78,5 cm². Hur stor är vinkeln? Använd π ≈ 3,14.', vis: { t: 'sector', v: 90, r: 10, show: 'area' }, type: 'num', a: 90, u: '°', calc: '78.5/(3.14*100)*360', given: ['r = 10 cm', 'sektorarea 78,5 cm²'], find: 'vinkeln v', start: 'Hela cirkeln: $3{,}14 \\cdot 100 = 314$. Andel = 78,5/314.', sol: ['$78{,}5/314 = 0{,}25$', '$0{,}25 \\cdot 360 = 90°$'], tol: 0.01 },
      { lv: 'F', q: 'En pizza med radien 15 cm delas i 8 lika bitar. Hur stor yta har en bit? Avrunda till en decimal.', type: 'num', a: 88.4, u: 'cm²', dec: 1, calc: 'Math.PI*225/8', given: ['r = 15 cm', '8 lika bitar'], find: 'en bits area', start: 'Hela pizzan $\\pi \\cdot 15^2$, delat på 8.', sol: ['$225\\pi \\approx 706{,}9$', '$/ 8 \\approx 88{,}4$ cm²'] }
    ],
    kw: 'sektor cirkelsektor cirkelbåge båge tårtbit medelpunktsvinkel del av cirkel'
  });

  S.push({
    id: 'f8-volume-units', ch: 'f8-geo', w: [42], title: 'Volym och volymenheter', sub: 'rätblock och kub',
    idea: 'Volym mäter hur många **kubikcentimeter-kuber** som får plats. Ett rätblock 4 × 3 × 5: varje lager har 4 · 3 = 12 kuber, och det finns 5 lager.',
    anchor: 'V = basytan · höjden. 1 dm³ = 1 liter = 1000 cm³.',
    cue: ['Volym, rymmer, liter, cm³, låda, akvarium.'],
    cvis: { t: 'cuboid', l: 4, b: 3, h: 5 },
    f: { name: 'Rätblockets volym', main: 'V = l \\cdot b \\cdot h', when: 'Volymen av ett rätblock (låda) eller en kub.', sym: [['l, b, h', 'längd, bredd, höjd'], ['cm³', 'kubikcentimeter'], ['1 liter', '= 1 dm³ = 1000 cm³']], forms: [['Kub', 'V = s^3'], ['Söker höjden', 'h = \\frac{V}{l \\cdot b}'], ['Enhet', '1\\,\\text{dm}^3 = 1000\\,\\text{cm}^3']], ex: '$4 \\cdot 3 \\cdot 5 = 60$ cm³', trap: 'Alla mått måste ha samma enhet innan du multiplicerar.' },
    h1: 'Volym av en låda: tre mått multipliceras.',
    ex: { q: 'Ett rätblock är 4 cm × 3 cm × 5 cm. Bestäm volymen.', vis: { t: 'cuboid', l: 4, b: 3, h: 5 }, given: ['l = 4', 'b = 3', 'h = 5 (cm)'], find: 'volymen', rule: 'V = l \\cdot b \\cdot h', steps: [['Bottenlagret', '$4 \\cdot 3 = 12$ kuber'], ['5 lager', '$12 \\cdot 5 = 60$ cm³']], ans: '60 cm³' },
    g: { q: 'Ett rätblock är 8 cm × 3 cm × 2 cm. Bestäm volymen.', vis: { t: 'cuboid', l: 8, b: 3, h: 2 }, given: ['8, 3 och 2 cm'], find: 'volymen', opts: ['8 \\cdot 3 \\cdot 2', '8 + 3 + 2', '2(8 \\cdot 3 + 8 \\cdot 2 + 3 \\cdot 2)'], oc: 0, why: 'Volym = l · b · h. (Det sista är begränsningsytan.)', type: 'num', a: 48, u: 'cm³', calc: '8*3*2', start: '$8 \\cdot 3 = 24$', sol: ['$24 \\cdot 2 = 48$ cm³'], traps: [[13, 'Måtten ska multipliceras, inte adderas.'], [92, 'Det är begränsningsytan. Volym: l · b · h.']] },
    p: [
      { lv: 'A', q: 'En kub har sidan 4 cm. Bestäm volymen.', vis: { t: 'cuboid', l: 4, b: 4, h: 4, cube: true }, type: 'num', a: 64, u: 'cm³', calc: '4**3', given: ['s = 4 cm'], find: 'volymen', start: '$4 \\cdot 4 \\cdot 4$', sol: ['$= 64$ cm³'], traps: [[12, '$s^3 = 4 \\cdot 4 \\cdot 4$, inte $4 \\cdot 3$.'], [16, 'Det är en sidas area. Volym: tre mått.']] },
      { lv: 'B', q: '3 000 cm³ är hur många dm³?', type: 'num', a: 3, u: 'dm³', calc: '3000/1000', unitSkill: true, given: ['3 000 cm³'], find: 'dm³', start: '1 dm³ = 1000 cm³', sol: ['$3000/1000 = 3$ dm³'], traps: [[30, 'Volym: 1000 per steg, inte 100.']] },
      { lv: 'C', q: 'Ett akvarium har bottenytan 50 cm × 30 cm och rymmer 45 liter. Hur högt står vattnet? (1 liter = 1000 cm³)', type: 'num', a: 30, u: 'cm', calc: '45000/(50*30)', given: ['botten 50 × 30 cm', 'V = 45 l = 45 000 cm³'], find: 'vattnets höjd', start: '$h = \\frac{V}{l \\cdot b}$', sol: ['$45\\,000 / 1500 = 30$ cm'], traps: [[0.03, 'Gör om 45 liter till 45 000 cm³ först.']] },
      { lv: 'F', q: 'En mjölkförpackning är 7 cm × 7 cm × 20 cm. Rymmer den 1 liter? Ange volymen i cm³.', type: 'num', a: 980, u: 'cm³', calc: '7*7*20', given: ['7 × 7 × 20 cm'], find: 'volymen', start: '$7 \\cdot 7 \\cdot 20$', sol: ['$49 \\cdot 20 = 980$ cm³ – lite mindre än 1 liter (1000 cm³).'] }
    ],
    kw: 'volym rätblock kub kubikcentimeter cm3 liter dm3 låda akvarium'
  });

  S.push({
    id: 'f8-cylinder', ch: 'f8-geo', w: [42], title: 'Cylinderns volym', sub: 'V = πr² · h',
    idea: 'En cylinder är en hög med **cirklar** staplade på varandra. Volym = bottenytan (en cirkel, πr²) gånger höjden – precis som för en låda.',
    anchor: 'Alla "raka" kroppar: V = bottenyta · höjd.',
    cue: ['Burk, rör, tunna, glas, cylinder.'],
    cvis: { t: 'cylinder', r: 3, h: 5 },
    f: { name: 'Cylinderns volym', main: 'V = \\pi r^2 h', when: 'Volymen av en burk, ett rör eller en tunna.', sym: [['r', 'bottencirkelns radie'], ['h', 'höjden'], ['B', 'basarea = πr²']], forms: [['Med basarea', 'V = B \\cdot h'], ['Söker höjden', 'h = \\frac{V}{\\pi r^2}']], ex: '$r = 3$, $h = 5$: $\\pi \\cdot 9 \\cdot 5 = 45\\pi \\approx 141{,}37$ cm³', trap: 'Radie, inte diameter, i πr².' },
    h1: 'Raka kroppar: bottenyta gånger höjd. Bottenytan är en cirkel.',
    ex: { q: 'En cylinder har r = 3 cm och h = 5 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'cylinder', r: 3, h: 5 }, given: ['r = 3 cm', 'h = 5 cm'], find: 'volymen', rule: 'V = \\pi r^2 h', steps: [['Bottenyta', '$\\pi \\cdot 3^2 = 9\\pi$'], ['Gånger höjden', '$9\\pi \\cdot 5 = 45\\pi \\approx 141{,}37$ cm³']], ans: '≈ 141,37 cm³' },
    g: { q: 'En cylinder har radien 2 cm och höjden 10 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'cylinder', r: 2, h: 10 }, given: ['r = 2 cm', 'h = 10 cm'], find: 'volymen', opts: ['\\pi \\cdot 2^2 \\cdot 10', '2\\pi \\cdot 2 \\cdot 10', '\\pi \\cdot 2 \\cdot 10'], oc: 0, why: 'Bottenytan är πr².', type: 'num', a: 125.66, u: 'cm³', dec: 2, calc: 'Math.PI*4*10', start: '$\\pi \\cdot 4 \\cdot 10 = 40\\pi$', sol: ['$40\\pi \\approx 125{,}66$ cm³'] },
    p: [
      { lv: 'A', q: 'En cylinder har diametern 8 cm och höjden 6 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'cylinder', d: 8, h: 6 }, type: 'num', a: 301.59, u: 'cm³', dec: 2, calc: 'Math.PI*16*6', given: ['d = 8 cm', 'h = 6 cm'], find: 'volymen', start: '$r = 4$ cm', sol: ['$\\pi \\cdot 16 \\cdot 6 = 96\\pi \\approx 301{,}59$ cm³'], traps: [[1206.37, 'Du använde diametern som radie. r = 4 cm.']] },
      { lv: 'B', q: 'En cylinder har basarean 50 cm² och höjden 7 cm. Bestäm volymen.', type: 'num', a: 350, u: 'cm³', calc: '50*7', given: ['B = 50 cm²', 'h = 7 cm'], find: 'volymen', start: '$V = B \\cdot h$', sol: ['$50 \\cdot 7 = 350$ cm³'] },
      { lv: 'C', q: 'En burk med radien 4 cm rymmer 1 000 cm³. Hur hög är burken? Avrunda till en decimal.', type: 'num', a: 19.9, u: 'cm', dec: 1, calc: '1000/(Math.PI*16)', given: ['r = 4 cm', 'V = 1 000 cm³'], find: 'höjden', start: 'Baklänges: $h = \\frac{V}{\\pi r^2}$', sol: ['$\\pi \\cdot 16 \\approx 50{,}27$', '$1000 / 50{,}27 \\approx 19{,}9$ cm'] },
      { lv: 'F', q: 'En regntunna har radien 0,3 m och höjden 0,9 m. Hur många liter rymmer den? (1 m³ = 1000 l) Avrunda till heltal.', type: 'num', a: 254, u: 'l', dec: 0, calc: 'Math.PI*0.09*0.9*1000', given: ['r = 0,3 m', 'h = 0,9 m'], find: 'volymen i liter', start: '$V = \\pi \\cdot 0{,}3^2 \\cdot 0{,}9$ m³', sol: ['$\\pi \\cdot 0{,}09 \\cdot 0{,}9 \\approx 0{,}254$ m³', '$\\approx 254$ liter'] }
    ],
    kw: 'cylinder volym burk rör tunna basarea pi r2 h'
  });

  S.push({
    id: 'f8-pyramid', ch: 'f8-geo', w: [42], title: 'Pyramidens volym', sub: 'V = B · h / 3',
    idea: 'En pyramid som har samma bas och höjd som ett prisma rymmer exakt **en tredjedel** så mycket. Därför: bottenyta · höjd, delat med 3.',
    anchor: 'Spetsig kropp → dela med 3.',
    cue: ['Pyramid, spetsig topp med platt botten.'],
    cvis: { t: 'pyramid', B: 24, h: 9 },
    f: { name: 'Pyramidens volym', main: 'V = \\frac{B \\cdot h}{3}', when: 'Volymen av en pyramid.', sym: [['B', 'basarea (bottenytan)'], ['h', 'höjden – lodrätt från spetsen']], forms: [['Kvadratisk bas', 'V = \\frac{s^2 \\cdot h}{3}'], ['Söker höjden', 'h = \\frac{3V}{B}'], ['Söker basarean', 'B = \\frac{3V}{h}']], ex: '$B = 24$, $h = 9$: $\\frac{24 \\cdot 9}{3} = 72$ cm³', trap: 'Glöm inte att dela med 3.' },
    h1: 'Spetsig kropp: bottenyta · höjd / 3.',
    ex: { q: 'En pyramid har basarean 24 cm² och höjden 9 cm. Bestäm volymen.', vis: { t: 'pyramid', B: 24, h: 9 }, given: ['B = 24 cm²', 'h = 9 cm'], find: 'volymen', rule: 'V = \\frac{B \\cdot h}{3}', steps: [['Bas gånger höjd', '$24 \\cdot 9 = 216$'], ['Dela med 3', '$216/3 = 72$ cm³']], ans: '72 cm³' },
    g: { q: 'En pyramid har basarean 30 cm² och höjden 6 cm. Bestäm volymen.', vis: { t: 'pyramid', B: 30, h: 6 }, given: ['B = 30 cm²', 'h = 6 cm'], find: 'volymen', opts: ['\\frac{30 \\cdot 6}{3}', '30 \\cdot 6', '\\frac{30 \\cdot 6}{2}'], oc: 0, why: 'Pyramid = en tredjedel av prismat.', type: 'num', a: 60, u: 'cm³', calc: '30*6/3', start: '$180/3$', sol: ['$= 60$ cm³'], traps: [[180, 'Glöm inte att dela med 3.'], [90, 'Pyramid: dela med 3, inte 2.']] },
    p: [
      { lv: 'A', q: 'En kvadratisk pyramid har bassidan 4 cm och höjden 9 cm. Bestäm volymen.', vis: { t: 'pyramid', s: 4, h: 9 }, type: 'num', a: 48, u: 'cm³', calc: '16*9/3', given: ['bassida 4 cm', 'h = 9 cm'], find: 'volymen', start: 'Basarea $4 \\cdot 4 = 16$', sol: ['$16 \\cdot 9 / 3 = 48$ cm³'], traps: [[12, 'Basarean är 4 · 4 = 16, inte 4.'], [144, 'Dela med 3.']] },
      { lv: 'C', q: 'En pyramid har volymen 100 cm³ och basarean 25 cm². Hur hög är den?', type: 'num', a: 12, u: 'cm', calc: '3*100/25', given: ['V = 100 cm³', 'B = 25 cm²'], find: 'höjden', start: 'Baklänges: $h = \\frac{3V}{B}$', sol: ['$3 \\cdot 100 = 300$', '$300/25 = 12$ cm'], traps: [[4, 'Glöm inte gånger 3: h = 3V/B.']] },
      { lv: 'D', q: 'En pyramid och ett rätblock har samma bas och höjd. Rätblocket har volymen 90 cm³. Pyramidens volym?', type: 'num', a: 30, u: 'cm³', calc: '90/3', given: ['samma bas och höjd', 'rätblock 90 cm³'], find: 'pyramidens volym', start: 'En tredjedel.', sol: ['$90/3 = 30$ cm³'] },
      { lv: 'F', q: 'Cheopspyramiden hade bassidan ca 230 m och höjden ca 147 m. Ungefär hur stor volym? Svara med antal miljoner m³, avrundat till en decimal.', type: 'num', a: 2.6, ul: 'miljoner m³', dec: 1, calc: '230*230*147/3/1e6', given: ['bassida 230 m', 'h = 147 m'], find: 'volymen i miljoner m³', start: '$230^2 \\cdot 147 / 3$', sol: ['$52\\,900 \\cdot 147 / 3 \\approx 2\\,592\\,100$ m³', '≈ 2,6 miljoner m³'] }
    ],
    kw: 'pyramid volym spetsig basarea dela med tre'
  });

  S.push({
    id: 'f8-cone', ch: 'f8-geo', w: [42], title: 'Konens volym', sub: 'V = πr² · h / 3',
    idea: 'En kon är en "rund pyramid". Den rymmer **en tredjedel** av en cylinder med samma botten och höjd: πr² · h / 3.',
    anchor: 'Kon = cylinder / 3.',
    cue: ['Strut, glasstrut, kon, trafikkon.'],
    cvis: { t: 'cone', r: 3, h: 4 },
    f: { name: 'Konens volym', main: 'V = \\frac{\\pi r^2 h}{3}', when: 'Volymen av en kon (strut).', sym: [['r', 'bottenradie'], ['h', 'höjden (lodrätt)']], forms: [['Med basarea', 'V = \\frac{B \\cdot h}{3}'], ['Söker höjden', 'h = \\frac{3V}{\\pi r^2}']], ex: '$r = 3$, $h = 4$: $\\frac{\\pi \\cdot 9 \\cdot 4}{3} = 12\\pi \\approx 37{,}70$', trap: 'Dela med 3 – annars får du cylinderns volym.' },
    h1: 'Rund och spetsig: cirkelbotten · höjd / 3.',
    ex: { q: 'En kon har r = 3 cm och h = 4 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'cone', r: 3, h: 4 }, given: ['r = 3 cm', 'h = 4 cm'], find: 'volymen', rule: '\\frac{\\pi r^2 h}{3}', steps: [['Bottenyta', '$9\\pi$'], ['Gånger höjd, delat med 3', '$9\\pi \\cdot 4 / 3 = 12\\pi \\approx 37{,}70$ cm³']], ans: '≈ 37,70 cm³' },
    g: { q: 'En kon har radien 3 cm och höjden 10 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'cone', r: 3, h: 10 }, given: ['r = 3 cm', 'h = 10 cm'], find: 'volymen', opts: ['\\frac{\\pi \\cdot 3^2 \\cdot 10}{3}', '\\pi \\cdot 3^2 \\cdot 10', '\\frac{2\\pi \\cdot 3 \\cdot 10}{3}'], oc: 0, why: 'Kon = cylinder / 3.', type: 'num', a: 94.25, u: 'cm³', dec: 2, calc: 'Math.PI*9*10/3', start: '$\\frac{90\\pi}{3} = 30\\pi$', sol: ['$30\\pi \\approx 94{,}25$ cm³'], traps: [[282.74, 'Det är cylinderns volym. Dela med 3.']] },
    p: [
      { lv: 'A', q: 'En kon har diametern 10 cm och höjden 12 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'cone', d: 10, h: 12 }, type: 'num', a: 314.16, u: 'cm³', dec: 2, calc: 'Math.PI*25*12/3', given: ['d = 10 cm', 'h = 12 cm'], find: 'volymen', start: '$r = 5$', sol: ['$\\pi \\cdot 25 \\cdot 12 / 3 = 100\\pi \\approx 314{,}16$ cm³'], traps: [[1256.64, 'Radien är 5 cm, inte 10.']] },
      { lv: 'B', q: 'En kon har basarean 18 cm² och höjden 5 cm. Bestäm volymen.', vis: { t: 'cone', B: 18, h: 5 }, type: 'num', a: 30, u: 'cm³', calc: '18*5/3', given: ['B = 18 cm²', 'h = 5 cm'], find: 'volymen', start: '$\\frac{18 \\cdot 5}{3}$', sol: ['$90/3 = 30$ cm³'], traps: [[90, 'Dela med 3.']] },
      { lv: 'C', q: 'En kon med radien 3 cm har volymen 94,2 cm³. Hur hög är den? Använd π ≈ 3,14.', type: 'num', a: 10, u: 'cm', calc: '3*94.2/(3.14*9)', given: ['r = 3 cm', 'V = 94,2 cm³'], find: 'höjden', start: '$h = \\frac{3V}{\\pi r^2}$', sol: ['$3 \\cdot 94{,}2 = 282{,}6$', '$282{,}6 / 28{,}26 = 10$ cm'], tol: 0.01 },
      { lv: 'F', q: 'En glasstrut har diametern 6 cm och höjden 12 cm. Hur många cm³ glass ryms i struten (utan kula ovanpå)? Avrunda till heltal.', type: 'num', a: 113, u: 'cm³', dec: 0, calc: 'Math.PI*9*12/3', given: ['d = 6 cm', 'h = 12 cm'], find: 'volymen', start: '$r = 3$', sol: ['$\\pi \\cdot 9 \\cdot 12 / 3 = 36\\pi \\approx 113$ cm³'] }
    ],
    kw: 'kon konens volym strut glasstrut spetsig rund'
  });

  S.push({
    id: 'f8-sphere', ch: 'f8-geo', w: [42, 45], title: 'Klotets volym', sub: 'V = 4πr³ / 3',
    idea: 'Ett klot (en boll) har volymen $\\frac{4\\pi r^3}{3}$. Märk att radien står **i kubik** – volym har tre dimensioner. Dubblar du radien blir volymen $2^3 = 8$ gånger större.',
    anchor: 'Volym → r³. Area → r².',
    cue: ['Klot, boll, sfär, kula, jordglob.'],
    cvis: { t: 'sphere', r: 3 },
    f: { name: 'Klotets volym', main: 'V = \\frac{4 \\pi r^3}{3}', when: 'Volymen av ett klot (boll).', sym: [['r', 'radien'], ['r³', 'r · r · r']], forms: [['Med diameter', 'r = d/2 \\text{ först}'], ['Söker r³', 'r^3 = \\frac{3V}{4\\pi}']], ex: '$r = 3$: $\\frac{4\\pi \\cdot 27}{3} = 36\\pi \\approx 113{,}10$ cm³', trap: '$r^3$ är $r \\cdot r \\cdot r$, inte $3r$.' },
    h1: 'Klot: radien i kubik.',
    ex: { q: 'Ett klot har r = 3 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'sphere', r: 3 }, given: ['r = 3 cm'], find: 'volymen', rule: '\\frac{4\\pi r^3}{3}', steps: [['r³', '$27$'], ['Formeln', '$\\frac{4\\pi \\cdot 27}{3} = 36\\pi \\approx 113{,}10$ cm³']], ans: '≈ 113,10 cm³' },
    g: { q: 'Ett klot har radien 2 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'sphere', r: 2 }, given: ['r = 2 cm'], find: 'volymen', opts: ['\\frac{4\\pi \\cdot 2^3}{3}', '4\\pi \\cdot 2^2', '\\frac{4\\pi \\cdot 2^2}{3}'], oc: 0, why: 'Volym → r³.', type: 'num', a: 33.51, u: 'cm³', dec: 2, calc: '4*Math.PI*8/3', start: '$2^3 = 8$', sol: ['$\\frac{32\\pi}{3} \\approx 33{,}51$ cm³'], traps: [[50.27, 'Det är klotets area (4πr²). Volym: 4πr³/3.']] },
    p: [
      { lv: 'A', q: 'Ett klot har diametern 6 cm. Bestäm volymen. Avrunda till två decimaler.', vis: { t: 'sphere', d: 6 }, type: 'num', a: 113.1, u: 'cm³', dec: 2, calc: '4*Math.PI*27/3', given: ['d = 6 cm'], find: 'volymen', start: '$r = 3$', sol: ['$36\\pi \\approx 113{,}10$ cm³'], traps: [[904.78, 'Radien är 3 cm, inte 6.']] },
      { lv: 'D', q: 'Om radien fördubblas – hur många gånger större blir klotets volym?', type: 'num', a: 8, calc: '2**3', given: ['r → 2r'], find: 'volymfaktor', start: 'Volym beror på $r^3$.', sol: ['$2^3 = 8$'], traps: [[2, 'Volym följer r³: 2 · 2 · 2.'], [4, 'Det gäller area (r²). Volym: r³.']] },
      { lv: 'B', q: 'En fotboll har radien 11 cm. Hur stor volym? Avrunda till heltal cm³.', type: 'num', a: 5575, u: 'cm³', dec: 0, calc: '4*Math.PI*11**3/3', given: ['r = 11 cm'], find: 'volymen', start: '$11^3 = 1331$', sol: ['$\\frac{4\\pi \\cdot 1331}{3} \\approx 5575$ cm³'] },
      { lv: 'F', q: 'En halvklotformad skål har radien 9 cm. Hur många liter rymmer den? Avrunda till en decimal.', type: 'num', a: 1.5, u: 'l', dec: 1, calc: '4*Math.PI*729/3/2/1000', given: ['halvklot', 'r = 9 cm'], find: 'volymen i liter', start: 'Halva klotet. 1 liter = 1000 cm³.', sol: ['$\\frac{4\\pi \\cdot 729}{3} \\approx 3053{,}6$ cm³', 'Hälften ≈ 1526,8 cm³ ≈ 1,5 l'] }
    ],
    kw: 'klot klotets volym boll sfär kula r3 halvklot'
  });

  S.push({
    id: 'f8-surface-area', ch: 'f8-geo', w: [45], title: 'Begränsningsyta', sub: 'all yta som omsluter kroppen',
    idea: 'Begränsningsytan är **hela utsidan** – som papperet du behöver för att slå in en present. Vik ut kroppen till ett nät och addera arean av varje sida. Svaret är en **area** (cm²).',
    anchor: 'Begränsningsyta = papper. Volym = innehåll.',
    cue: ['Måla, slå in, tapetsera, yta, begränsningsarea.'],
    cvis: { t: 'net', kind: 'cube', a: 5 },
    f: { name: 'Begränsningsyta', main: 'A = \\text{summan av alla sidors area}', when: 'Hur mycket material som täcker utsidan.', sym: [['enhet', 'cm², m² (area)']], forms: [['Kub', 'A = 6s^2'], ['Rätblock', 'A = 2(lb + lh + bh)'], ['Klot', 'A = 4\\pi r^2'], ['Cylinder', 'A = 2\\pi r^2 + 2\\pi r h']], ex: 'Kub med sidan 5: $6 \\cdot 25 = 150$ cm²', trap: 'Begränsningsyta är area (cm²), inte volym (cm³).' },
    h1: 'Hur ser kroppen ut utvikt? Räkna varje sida och addera.',
    ex: { q: 'En kub har sidan 5 cm. Bestäm begränsningsytan.', vis: { t: 'net', kind: 'cube', a: 5 }, given: ['s = 5 cm'], find: 'begränsningsytan', rule: 'A = 6s^2', steps: [['Hur många sidor har en kub?', '6 kvadrater'], ['En sida', '$5^2 = 25$ cm²'], ['Alla', '$6 \\cdot 25 = 150$ cm²']], ans: '150 cm²' },
    g: { q: 'Ett rätblock är 2 cm × 3 cm × 4 cm. Bestäm begränsningsytan.', vis: { t: 'cuboid', l: 4, b: 3, h: 2 }, given: ['2, 3 och 4 cm'], find: 'begränsningsytan', opts: ['2(2 \\cdot 3 + 2 \\cdot 4 + 3 \\cdot 4)', '2 \\cdot 3 \\cdot 4', '2 \\cdot 3 + 2 \\cdot 4 + 3 \\cdot 4'], oc: 0, why: 'Tre par av sidor.', type: 'num', a: 52, u: 'cm²', calc: '2*(6+8+12)', start: '$6 + 8 + 12 = 26$', sol: ['$2 \\cdot 26 = 52$ cm²'], traps: [[24, 'Det är volymen. Begränsningsyta = alla sidor.'], [26, 'Varje sida finns två gånger (fram/bak, upp/ner, höger/vänster).']] },
    p: [
      { lv: 'A', q: 'En kub har sidan 4 cm. Bestäm begränsningsytan.', vis: { t: 'net', kind: 'cube', a: 4 }, type: 'num', a: 96, u: 'cm²', calc: '6*16', given: ['s = 4 cm'], find: 'begränsningsytan', start: '$6 \\cdot 4^2$', sol: ['$6 \\cdot 16 = 96$ cm²'], traps: [[64, 'Det är volymen.']] },
      { lv: 'B', q: 'Ett klot har radien 2 cm. Bestäm begränsningsytan. Avrunda till två decimaler.', vis: { t: 'sphere', r: 2, area: true }, type: 'num', a: 50.27, u: 'cm²', dec: 2, calc: '4*Math.PI*4', given: ['r = 2 cm'], find: 'begränsningsytan', start: '$4\\pi r^2$', sol: ['$4\\pi \\cdot 4 = 16\\pi \\approx 50{,}27$ cm²'], traps: [[33.51, 'Det är volymen.']] },
      { lv: 'C', q: 'En kub har begränsningsytan 54 cm². Hur lång är sidan?', type: 'num', a: 3, u: 'cm', calc: 'Math.sqrt(54/6)', given: ['A = 54 cm²', 'kub'], find: 'sidan', start: 'En sida: $54/6$', sol: ['$54/6 = 9$', '$s = \\sqrt 9 = 3$ cm'], traps: [[9, 'Det är en sidas area. Sidan = √9.']] },
      { lv: 'F', q: 'En presentkartong är 30 cm × 20 cm × 10 cm. Hur mycket papper behövs minst? Svara i cm².', type: 'num', a: 2200, u: 'cm²', calc: '2*(600+300+200)', given: ['30 × 20 × 10 cm'], find: 'begränsningsytan', start: '$2(30 \\cdot 20 + 30 \\cdot 10 + 20 \\cdot 10)$', sol: ['$2(600 + 300 + 200) = 2200$ cm²'], traps: [[6000, 'Det är volymen.']] }
    ],
    kw: 'begränsningsyta begränsningsarea yta utsida måla slå in nät kub klot'
  });

  S.push({
    id: 'f8-density', ch: 'f8-geo', w: [45], title: 'Befolkningstäthet', sub: 'invånare per km²',
    idea: 'Befolkningstäthet svarar på: **hur många bor det på en ruta på 1 km²** i genomsnitt? Du delar antalet invånare med arean.',
    anchor: '"per" betyder delat med. inv/km² = invånare ÷ km².',
    cue: ['Invånare, area, km², "per km²".'],
    cvis: { t: 'density', people: 20000, area: 50 },
    f: { name: 'Befolkningstäthet', main: '\\text{täthet} = \\frac{\\text{invånare}}{\\text{area}}', when: 'Hur tätt befolkat ett område är.', sym: [['enhet', 'inv/km²']], forms: [['Söker invånare', '\\text{inv} = \\text{täthet} \\cdot \\text{area}'], ['Söker area', '\\text{area} = \\frac{\\text{inv}}{\\text{täthet}}']], ex: '$20\\,000 / 50 = 400$ inv/km²', trap: 'Dela invånare med area – inte tvärtom.' },
    h1: '"Per km²" – dela med arean.',
    ex: { q: '20 000 invånare bor på 50 km². Vad är befolkningstätheten?', vis: { t: 'density', people: 20000, area: 50 }, given: ['20 000 invånare', '50 km²'], find: 'täthet', rule: '\\frac{\\text{inv}}{\\text{area}}', steps: [['Per = ?', 'delat med'], ['Räkna', '$20\\,000/50 = 400$ inv/km²']], ans: '400 inv/km²' },
    g: { q: '45 000 invånare bor på 90 km². Vad är befolkningstätheten?', vis: { t: 'density', people: 45000, area: 90 }, given: ['45 000 inv', '90 km²'], find: 'täthet', opts: ['\\frac{45\\,000}{90}', '\\frac{90}{45\\,000}', '45\\,000 \\cdot 90'], oc: 0, why: 'Invånare per km².', type: 'num', a: 500, u: 'inv/km²', calc: '45000/90', start: '$45\\,000 / 90$', sol: ['$= 500$ inv/km²'], traps: [[0.002, 'Du delade arean med invånarna. Täthet = invånare / area.']] },
    p: [
      { lv: 'A', q: '12 000 invånare bor på 30 km². Befolkningstäthet?', type: 'num', a: 400, u: 'inv/km²', calc: '12000/30', given: ['12 000 inv', '30 km²'], find: 'täthet', start: '$12\\,000 / 30$', sol: ['$= 400$ inv/km²'] },
      { lv: 'C', q: 'Ett område har tätheten 250 inv/km² och arean 40 km². Hur många bor där?', vis: { t: 'density', people: '?', area: 40, unk: 'p' }, type: 'num', a: 10000, u: 'invånare', calc: '250*40', given: ['250 inv/km²', '40 km²'], find: 'antal invånare', start: 'Baklänges: täthet · area', sol: ['$250 \\cdot 40 = 10\\,000$'], traps: [[6.25, 'Du delade. Invånare = täthet · area.']] },
      { lv: 'C', q: 'En stad har 84 000 invånare och tätheten 1 200 inv/km². Hur stor är staden i km²?', type: 'num', a: 70, u: 'km²', calc: '84000/1200', given: ['84 000 inv', '1 200 inv/km²'], find: 'arean', start: '$\\text{area} = \\frac{\\text{inv}}{\\text{täthet}}$', sol: ['$84\\,000/1200 = 70$ km²'] },
      { lv: 'F', q: 'Sverige har ca 10,5 miljoner invånare och arean ca 450 000 km². Ungefär hur stor är befolkningstätheten? Avrunda till heltal.', type: 'num', a: 23, u: 'inv/km²', dec: 0, calc: '10500000/450000', given: ['10 500 000 inv', '450 000 km²'], find: 'täthet', start: '$10\\,500\\,000 / 450\\,000$', sol: ['$\\approx 23{,}3$ → 23 inv/km²'] }
    ],
    kw: 'befolkningstäthet täthet invånare per km2 per kvadratkilometer'
  });

  /* ================= KAPITEL 3 · ALGEBRA ================= */
  S.push({
    id: 'f8-expressions', ch: 'f8-alg', w: [47, 49], title: 'Uttryck med variabler', sub: 'samla lika termer',
    idea: 'En **variabel** (x) står för ett tal du inte vet. I ett uttryck kan du bara slå ihop **lika sorter**: x-termer med x-termer, tal med tal – som äpplen med äpplen.',
    anchor: '3x + 2x = 5x. Men 3x + 2 går inte att slå ihop.',
    cue: ['"Förenkla" och bokstäver i uttrycket.'],
    cvis: { t: 'tiles', groups: [[3, 'x'], [5, '1'], [2, 'x'], [-1, '1']] },
    f: { name: 'Förenkla uttryck', main: 'ax + bx = (a+b)x', when: 'Ett uttryck med flera termer ska förenklas.', sym: [['x', 'variabel – ett okänt tal'], ['term', 'delar som skiljs av + eller −'], ['koefficient', 'talet framför x']], rules: ['Samla x-termer för sig, konstanter för sig.', 'Tecknet framför termen följer med.', 'Värdet av uttrycket: sätt in x-värdet.'], ex: '$3x + 5 + 2x - 1 = 5x + 4$', trap: '$3x + 2 \\ne 5x$ – x-termer och tal kan inte slås ihop.' },
    h1: 'Sortera termerna: x-termer i en hög, tal i en annan.',
    ex: { q: 'Förenkla 3x + 5 + 2x − 1.', vis: { t: 'tiles', groups: [[3, 'x'], [2, 'x'], [5, '1'], [-1, '1']] }, given: ['3x + 5 + 2x − 1'], find: 'förenklat uttryck', rule: 'ax + bx = (a+b)x', steps: [['x-termer', '$3x + 2x = 5x$'], ['Tal', '$5 - 1 = 4$'], ['Tillsammans', '$5x + 4$']], ans: '5x + 4' },
    g: { q: 'Förenkla 4x + 3x + 2.', vis: { t: 'tiles', groups: [[4, 'x'], [3, 'x'], [2, '1']] }, given: ['4x + 3x + 2'], find: 'förenklat uttryck', opts: ['7x + 2', '9x', '12x + 2'], oc: 0, why: 'Bara x-termerna slås ihop.', type: 'expr', a: '7x+2', start: '$4x + 3x = ?$', sol: ['$4x + 3x = 7x$', 'Svar: $7x + 2$'], traps: [['9x', 'Talet 2 är inte en x-term och kan inte slås ihop med 7x.'], ['12x+2', '4x + 3x betyder 4 + 3 stycken x, inte 4 · 3.']] },
    p: [
      { lv: 'A', q: 'Förenkla 6x − 2x + 5 − 3.', type: 'expr', a: '4x+2', given: ['6x − 2x + 5 − 3'], find: 'förenklat', start: 'x-termer: 6x − 2x. Tal: 5 − 3.', sol: ['$4x + 2$'], traps: [['6x', 'Talen 2 och 4x kan inte slås ihop.']] },
      { lv: 'B', q: 'Förenkla 2x + 7 + x − 4.', vis: { t: 'tiles', groups: [[2, 'x'], [1, 'x'], [7, '1'], [-4, '1']] }, type: 'expr', a: '3x+3', given: ['2x + 7 + x − 4'], find: 'förenklat', start: 'Ensamt x = 1x.', sol: ['$2x + x = 3x$', '$7 - 4 = 3$', '$3x + 3$'], traps: [['2x+3', 'x betyder 1x: 2x + x = 3x.']] },
      { lv: 'C', q: 'Beräkna värdet av 3x + 4 om x = 5.', type: 'num', a: 19, calc: '3*5+4', given: ['3x + 4', 'x = 5'], find: 'värdet', start: 'Byt x mot 5: $3 \\cdot 5 + 4$', sol: ['$15 + 4 = 19$'], traps: [[39, '3x betyder 3 · x = 15, inte 35.']] },
      { lv: 'F', q: 'Skriv ett förenklat uttryck för omkretsen av en rektangel med sidorna x och x + 3.', type: 'expr', a: '4x+6', given: ['sidor x och x + 3'], find: 'omkrets som uttryck', start: '$x + (x+3) + x + (x+3)$', sol: ['$4x + 6$'], traps: [['2x+3', 'Det är bara två sidor. En rektangel har fyra.']] }
    ],
    kw: 'uttryck variabel förenkla samla termer x algebra lika termer'
  });

  S.push({
    id: 'f8-equations', ch: 'f8-alg', w: [47], title: 'Ekvationer', sub: 'gör samma sak på båda sidor',
    idea: 'En ekvation är en **balansvåg**: vänster led väger lika mycket som höger. Gör du samma sak på båda sidor förblir den i balans. Målet: få **x ensamt**.',
    anchor: 'Ta bort det som "sitter fast" vid x med motsatt räknesätt – i omvänd ordning.',
    cue: ['Likhetstecken och ett okänt x.', '"Lös ekvationen".'],
    cvis: { t: 'balance', left: '3x + 5', right: '20' },
    f: { name: 'Lösa ekvationer', main: 'ax + b = c \\Rightarrow x = \\frac{c - b}{a}', when: 'Ett okänt tal ska bestämmas.', sym: [['led', 'varje sida av ='], ['lösning', 'värdet på x som gör båda leden lika']], forms: [['+ b → ', '\\text{subtrahera } b'], ['· a →', '\\text{dividera med } a'], ['/ a →', '\\text{multiplicera med } a'], ['Kontroll', '\\text{sätt in x i ursprungsekvationen}']], ex: '$3x + 5 = 20 \\Rightarrow 3x = 15 \\Rightarrow x = 5$', trap: 'Gör samma sak med HELA ledet på båda sidor.' },
    h1: 'Vad sitter fast vid x? Ta bort det med motsatt räknesätt på båda sidor.',
    ex: { q: 'Lös 3x + 5 = 20.', vis: { t: 'balance', left: '3x + 5', right: '20' }, given: ['3x + 5 = 20'], find: 'x', rule: '\\text{samma sak i båda leden}', steps: [['Vad tar bort +5?', '$-5$ i båda leden: $3x = 15$'], ['Vad tar bort ·3?', '$\\div 3$: $x = 5$'], ['Kontroll', '$3 \\cdot 5 + 5 = 20$ ✓']], ans: 'x = 5' },
    g: { q: 'Lös 4x + 7 = 31.', vis: { t: 'balance', left: '4x + 7', right: '31' }, given: ['4x + 7 = 31'], find: 'x', opts: ['\\text{först } -7, \\text{ sedan } \\div 4', '\\text{först } \\div 4, \\text{ sedan } -7', '+7 \\text{ i båda leden}'], oc: 0, why: 'Ta bort det som står längst från x först (+7).', type: 'num', a: 6, calc: '(31-7)/4', start: '$4x = 31 - 7 = 24$', sol: ['$4x = 24$', '$x = 6$'], traps: [[9.5, 'Du dividerade 38 med 4. Subtrahera 7 (inte addera).'], [24, 'Det är 4x. Dela med 4.']] },
    p: [
      { lv: 'A', q: 'Lös 5x − 10 = 25.', vis: { t: 'balance', left: '5x − 10', right: '25' }, type: 'num', a: 7, calc: '(25+10)/5', given: ['5x − 10 = 25'], find: 'x', start: '+10 i båda leden', sol: ['$5x = 35$', '$x = 7$'], traps: [[3, 'Addera 10 (inte subtrahera) för att ta bort −10.']] },
      { lv: 'B', q: 'Lös x/3 + 4 = 10.', vis: { t: 'balance', left: 'x/3 + 4', right: '10' }, type: 'num', a: 18, calc: '(10-4)*3', given: ['x/3 + 4 = 10'], find: 'x', start: '−4, sedan ·3', sol: ['$x/3 = 6$', '$x = 18$'], traps: [[2, 'x/3 = 6 → multiplicera med 3.']] },
      { lv: 'C', q: 'Lös 2(x + 3) = 16.', type: 'num', a: 5, calc: '16/2-3', given: ['2(x + 3) = 16'], find: 'x', start: 'Dela med 2: $x + 3 = 8$', sol: ['$x + 3 = 8$', '$x = 5$'], traps: [[6.5, 'Multiplicera in 2 i båda termerna: 2x + 6 = 16.']] },
      { lv: 'F', q: 'Lös 7 − 2x = 1.', type: 'num', a: 3, calc: '(7-1)/2', given: ['7 − 2x = 1'], find: 'x', start: '−7 i båda: $-2x = -6$', sol: ['$-2x = -6$', '$x = 3$'], traps: [[-3, 'Minus delat med minus blir plus: −6 / −2 = 3.'], [4, '7 − 1 = 6, sedan dela med 2.']] }
    ],
    kw: 'ekvation lösa ekvation x balansvåg båda leden okänt tal'
  });

  S.push({
    id: 'f8-x-both-sides', ch: 'f8-alg', w: [47], title: 'x i båda leden', sub: 'samla x på en sida',
    idea: 'När x finns på båda sidor flyttar du först alla **x-termer till ett led** (ta bort den minsta x-termen från båda leden). Sedan löser du som vanligt.',
    anchor: 'Ta bort den minsta x-termen → x hamnar bara på en sida.',
    cue: ['x står både till vänster och höger om ='],
    cvis: { t: 'balance', left: '5x + 2', right: '2x + 14' },
    f: { name: 'x i båda leden', main: 'ax + b = cx + d \\Rightarrow (a-c)x = d - b', when: 'Ekvationen har x-termer i båda leden.', sym: [['a, c', 'koefficienterna framför x']], forms: [['Steg 1', '-cx \\text{ i båda leden}'], ['Steg 2', '-b \\text{ i båda leden}'], ['Steg 3', '\\div (a-c)']], ex: '$5x + 2 = 2x + 14 \\Rightarrow 3x = 12 \\Rightarrow x = 4$', trap: 'När du tar bort 4x från höger måste du ta bort 4x från vänster också.' },
    h1: 'x på båda sidor – flytta x-termerna till en sida först.',
    ex: { q: 'Lös 5x + 2 = 2x + 14.', vis: { t: 'balance', left: '5x + 2', right: '2x + 14' }, given: ['5x + 2 = 2x + 14'], find: 'x', rule: '-2x \\text{ i båda leden}', steps: [['Vilken x-term är minst?', '$2x$ → ta bort $2x$ på båda sidor'], ['Resultat', '$3x + 2 = 14$'], ['Lös', '$3x = 12$, $x = 4$'], ['Kontroll', '$22 = 22$ ✓']], ans: 'x = 4' },
    g: { q: 'Lös 7x + 3 = 4x + 18.', vis: { t: 'balance', left: '7x + 3', right: '4x + 18' }, given: ['7x + 3 = 4x + 18'], find: 'x', opts: ['-4x \\text{ i båda leden}', '-4x \\text{ bara i högra ledet}', '\\div 7 \\text{ i båda leden}'], oc: 0, why: 'Ta bort den minsta x-termen från båda sidor.', type: 'num', a: 5, calc: '(18-3)/(7-4)', start: '$3x + 3 = 18$', sol: ['$3x = 15$', '$x = 5$'], traps: [[1.91, 'Du adderade x-termerna. Subtrahera 4x i båda leden.']], tol: 0.01 },
    p: [
      { lv: 'A', q: 'Lös 6x − 5 = 2x + 19.', vis: { t: 'balance', left: '6x − 5', right: '2x + 19' }, type: 'num', a: 6, calc: '(19+5)/(6-2)', given: ['6x − 5 = 2x + 19'], find: 'x', start: '−2x: $4x - 5 = 19$', sol: ['$4x = 24$', '$x = 6$'], traps: [[3.5, 'Addera 5 (för att ta bort −5): 4x = 24.']] },
      { lv: 'B', q: 'Lös 9x + 7 = 5x − 9.', type: 'num', a: -4, calc: '(-9-7)/(9-5)', given: ['9x + 7 = 5x − 9'], find: 'x', start: '−5x: $4x + 7 = -9$', sol: ['$4x = -16$', '$x = -4$'], traps: [[4, 'Kontrollera tecknet: −9 − 7 = −16.'], [-0.5, '−9 − 7 = −16, inte −2.']] },
      { lv: 'C', q: 'Lös 3x + 10 = 5x.', type: 'num', a: 5, calc: '10/2', given: ['3x + 10 = 5x'], find: 'x', start: '−3x: $10 = 2x$', sol: ['$2x = 10$', '$x = 5$'], traps: [[1.25, 'Du adderade 3x och 5x. Subtrahera 3x från båda.']] },
      { lv: 'F', q: 'Gym A kostar 150 kr i startavgift + 50 kr per besök. Gym B kostar 80 kr per besök. Efter hur många besök kostar de lika mycket?', type: 'num', a: 5, u: 'besök', calc: '150/30', given: ['A: 150 + 50x', 'B: 80x'], find: 'antal besök x när kostnaden är lika', start: '$150 + 50x = 80x$', sol: ['$150 = 30x$', '$x = 5$ besök (båda kostar 400 kr)'], traps: [[1.15, 'Subtrahera 50x från båda leden: 150 = 30x.']], tol: 0.01 }
    ],
    kw: 'x i båda leden ekvation båda sidor flytta x samla x'
  });

  S.push({
    id: 'f8-parentheses-add', ch: 'f8-alg', w: [47], title: 'Parenteser med + och −', sub: 'minus framför byter tecken',
    idea: '**Plus** framför en parentes: ta bara bort parentesen. **Minus** framför: ta bort parentesen och **byt tecken på varje term** inuti – minuset gäller hela parentesen.',
    anchor: '−(a + b) = −a − b. Minuset delas ut till alla.',
    cue: ['Parentes med + eller − framför (inget tal).'],
    cvis: { t: 'brackets', before: '5x − (2x + 3)', after: '5x − 2x − 3' },
    f: { name: 'Ta bort parentes', main: '-(a + b) = -a - b', when: 'Minus eller plus står direkt framför en parentes.', sym: [['+( )', 'inget ändras'], ['−( )', 'alla tecken inuti byts']], forms: [['Plus framför', '+(a - b) = a - b'], ['Minus framför', '-(a - b) = -a + b']], ex: '$5x - (2x + 3) = 5x - 2x - 3 = 3x - 3$', trap: 'Byt tecken på ALLA termer i parentesen, inte bara den första.' },
    h1: 'Står det plus eller minus framför parentesen?',
    ex: { q: 'Förenkla 5x − (2x + 3).', vis: { t: 'brackets', before: '5x − (2x + 3)', after: '5x − 2x − 3' }, given: ['5x − (2x + 3)'], find: 'förenklat', rule: '-(a+b) = -a-b', steps: [['Minus framför – vad händer?', 'Byt tecken på båda: $-2x - 3$'], ['Förenkla', '$5x - 2x - 3 = 3x - 3$']], ans: '3x − 3' },
    g: { q: 'Förenkla 7x − (3x + 4).', vis: { t: 'brackets', before: '7x − (3x + 4)', after: '7x − 3x − 4' }, given: ['7x − (3x + 4)'], find: 'förenklat', opts: ['7x - 3x - 4', '7x - 3x + 4', '7x + 3x + 4'], oc: 0, why: 'Minus framför → båda tecknen byts.', type: 'expr', a: '4x-4', form: 'expanded', start: '$7x - 3x - 4$', sol: ['$4x - 4$'], traps: [['4x+4', 'Minuset gäller hela parentesen – även +4 blir −4.']] },
    p: [
      { lv: 'A', q: 'Förenkla 4x + (2x − 5).', vis: { t: 'brackets', before: '4x + (2x − 5)', after: '4x + 2x − 5', sign: '+' }, type: 'expr', a: '6x-5', form: 'expanded', given: ['4x + (2x − 5)'], find: 'förenklat', start: 'Plus framför: inget ändras.', sol: ['$4x + 2x - 5 = 6x - 5$'] },
      { lv: 'B', q: 'Förenkla 10 − (x − 3).', vis: { t: 'brackets', before: '10 − (x − 3)', after: '10 − x + 3' }, type: 'expr', a: '13-x', form: 'expanded', given: ['10 − (x − 3)'], find: 'förenklat', start: '$-(x - 3) = -x + 3$', sol: ['$10 - x + 3 = 13 - x$'], traps: [['7-x', '−(−3) blir +3, inte −3.']] },
      { lv: 'C', q: 'Förenkla (5x + 2) − (2x − 6).', type: 'expr', a: '3x+8', form: 'expanded', given: ['(5x + 2) − (2x − 6)'], find: 'förenklat', start: '$5x + 2 - 2x + 6$', sol: ['$3x + 8$'], traps: [['3x-4', '−(−6) = +6.']] },
      { lv: 'F', q: 'Lös ekvationen 12 − (x + 4) = 3.', type: 'num', a: 5, calc: '12-4-3', given: ['12 − (x + 4) = 3'], find: 'x', start: 'Ta bort parentesen: $12 - x - 4 = 3$', sol: ['$8 - x = 3$', '$x = 5$'], traps: [[-5, 'Om 8 − x = 3 så är x = 5.']] }
    ],
    kw: 'parentes minus framför parentes ta bort parentes byta tecken plus parentes'
  });

  S.push({
    id: 'f8-parentheses-multiply', ch: 'f8-alg', w: [48], title: 'Multiplicera in i parentes', sub: 'a(b + c) = ab + ac',
    idea: 'Talet framför parentesen ska multipliceras med **varje** term inuti. Tänk på en rektangel som är a hög och (b + c) bred: arean är två delar, ab och ac.',
    anchor: 'Pilar från talet till varje term. Glöm inte tecknet.',
    cue: ['Ett tal eller en variabel direkt framför en parentes.'],
    cvis: { t: 'distribute', a: '3', t1: 'x', t2: '4' },
    f: { name: 'Distributiva lagen', main: 'a(b + c) = ab + ac', when: 'Ett tal står framför en parentes.', sym: [['a', 'faktorn framför']], forms: [['Med minus', 'a(b - c) = ab - ac'], ['Negativt tal framför', '-a(b - c) = -ab + ac'], ['Baklänges', '\\text{faktorisering}']], ex: '$3(x + 4) = 3x + 12$', trap: 'Multiplicera även den andra termen: $3(x + 4) \\ne 3x + 4$.' },
    h1: 'Talet framför ska multipliceras med varje term i parentesen.',
    ex: { q: 'Multiplicera in: 3(x + 4).', vis: { t: 'distribute', a: '3', t1: 'x', t2: '4' }, given: ['3(x + 4)'], find: 'uttryck utan parentes', rule: 'a(b+c) = ab+ac', steps: [['3 gånger första termen', '$3 \\cdot x = 3x$'], ['3 gånger andra termen', '$3 \\cdot 4 = 12$'], ['Svar', '$3x + 12$']], ans: '3x + 12' },
    g: { q: 'Multiplicera in: 4(x + 2).', vis: { t: 'distribute', a: '4', t1: 'x', t2: '2' }, given: ['4(x + 2)'], find: 'utan parentes', opts: ['4x + 8', '4x + 2', 'x + 8'], oc: 0, why: 'Båda termerna ska multipliceras med 4.', type: 'expr', a: '4x+8', form: 'expanded', start: '$4 \\cdot x + 4 \\cdot 2$', sol: ['$4x + 8$'], traps: [['4x+2', 'Även 2 ska multipliceras med 4.']] },
    p: [
      { lv: 'A', q: 'Multiplicera in: 3(2x − 5).', vis: { t: 'distribute', a: '3', t1: '2x', t2: '5', sign: '−' }, type: 'expr', a: '6x-15', form: 'expanded', given: ['3(2x − 5)'], find: 'utan parentes', start: '$3 \\cdot 2x$ och $3 \\cdot (-5)$', sol: ['$6x - 15$'], traps: [['6x-5', 'Även 5 ska multipliceras med 3.']] },
      { lv: 'B', q: 'Multiplicera in: −2(x − 6).', type: 'expr', a: '-2x+12', form: 'expanded', given: ['−2(x − 6)'], find: 'utan parentes', start: '$-2 \\cdot x$ och $-2 \\cdot (-6)$', sol: ['$-2x + 12$'], traps: [['-2x-12', 'Minus gånger minus blir plus: −2 · (−6) = +12.']] },
      { lv: 'C', q: 'Multiplicera in och förenkla: x(x + 3).', type: 'expr', a: 'x^2+3x', form: 'expanded', given: ['x(x + 3)'], find: 'utan parentes', start: '$x \\cdot x = x^2$', sol: ['$x^2 + 3x$'], traps: [['2x+3', 'x · x = x², inte 2x.']] },
      { lv: 'F', q: 'Förenkla 2(x + 5) + 3(x − 1).', type: 'expr', a: '5x+7', form: 'expanded', given: ['2(x + 5) + 3(x − 1)'], find: 'förenklat', start: '$2x + 10 + 3x - 3$', sol: ['$5x + 7$'] }
    ],
    kw: 'multiplicera in parentes distributiva lagen gånger parentes'
  });

  S.push({
    id: 'f8-equation-problems', ch: 'f8-alg', w: [48, 50], title: 'Problemlösning med ekvationer', sub: 'från text till ekvation',
    idea: 'Fyra steg: **1.** Bestäm vad x är. **2.** Skriv texten som en ekvation. **3.** Lös. **4.** Kontrollera att svaret passar i TEXTEN.',
    anchor: 'Rita stapeln – då syns ekvationen.',
    cue: ['En vardagstext där ett tal är okänt.'],
    cvis: { t: 'tape', parts: ['x', 'x', 'x', '30'], total: '210' },
    f: { name: 'Text → ekvation', main: '\\text{x = det okända}', when: 'En textuppgift med ett okänt tal.', sym: [['x', 'det du söker – skriv ut vad det är!']], rules: ['"tre lika biljetter" → 3x', '"och en avgift på 30" → + 30', '"kostar totalt 210" → = 210', 'Kontrollera svaret i texten, inte bara i ekvationen.'], ex: '$3x + 30 = 210 \\Rightarrow x = 60$', trap: 'Svara på frågan – ibland söks något annat än x.' },
    h1: 'Vad är det okända? Kalla det x och skriv texten som en ekvation.',
    ex: { q: 'Tre lika biljetter plus en avgift på 30 kr kostar 210 kr. Vad kostar en biljett?', vis: { t: 'tape', parts: ['x', 'x', 'x', '30'], total: '210' }, given: ['3 lika biljetter', 'avgift 30 kr', 'totalt 210 kr'], find: 'pris per biljett (x)', rule: '3x + 30 = 210', steps: [['Vad är x?', 'priset för en biljett'], ['Ekvation', '$3x + 30 = 210$'], ['Lös', '$3x = 180$, $x = 60$'], ['Kontroll', '$3 \\cdot 60 + 30 = 210$ ✓']], ans: '60 kr' },
    g: { q: 'Fyra lika böcker och en frakt på 40 kr kostar 360 kr. Vad kostar en bok?', vis: { t: 'tape', parts: ['x', 'x', 'x', 'x', '40'], total: '360' }, given: ['4 lika böcker', 'frakt 40 kr', 'totalt 360 kr'], find: 'pris per bok', opts: ['4x + 40 = 360', '4 + x + 40 = 360', '4(x + 40) = 360'], oc: 0, why: 'Fyra böcker à x kr = 4x, plus 40.', type: 'num', a: 80, u: 'kr', calc: '(360-40)/4', start: '$4x = 320$', sol: ['$4x = 320$', '$x = 80$ kr'], traps: [[100, 'Glöm inte att dra bort frakten (40 kr) först.'], [50, 'Frakten betalas en gång, inte för varje bok.']] },
    p: [
      { lv: 'A', q: 'Ett tal multipliceras med 5 och minskas sedan med 7. Resultatet är 38. Vilket är talet?', type: 'num', a: 9, calc: '(38+7)/5', given: ['5x − 7 = 38'], find: 'talet', start: '$5x - 7 = 38$', sol: ['$5x = 45$', '$x = 9$'] },
      { lv: 'B', q: 'Omkretsen av en liksidig triangel är 36 cm. Hur lång är en sida?', type: 'num', a: 12, u: 'cm', calc: '36/3', given: ['3 lika sidor', 'omkrets 36 cm'], find: 'sidan', start: '$3x = 36$', sol: ['$x = 12$ cm'] },
      { lv: 'C', q: 'Mira är 4 år äldre än Leo. Tillsammans är de 30 år. Hur gammal är Leo?', vis: { t: 'tape', parts: ['x', 'x', '4'], total: '30' }, type: 'num', a: 13, u: 'år', calc: '(30-4)/2', given: ['Leo = x', 'Mira = x + 4', 'summa 30'], find: 'Leos ålder', start: '$x + (x + 4) = 30$', sol: ['$2x + 4 = 30$', '$x = 13$ år'], traps: [[17, 'Det är Miras ålder. Frågan gäller Leo.'], [15, 'De är inte lika gamla – Mira är 4 år äldre.']] },
      { lv: 'F', q: 'En rektangel är 3 cm längre än den är bred. Omkretsen är 26 cm. Hur bred är den?', type: 'num', a: 5, u: 'cm', calc: '(26-6)/4', given: ['bredd x', 'längd x + 3', 'omkrets 26 cm'], find: 'bredden', start: '$2x + 2(x + 3) = 26$', sol: ['$4x + 6 = 26$', '$x = 5$ cm'], traps: [[8, 'Det är längden. Frågan gäller bredden.']] }
    ],
    kw: 'problemlösning ekvation textuppgift skriv ekvation okänt tal hur mycket kostar'
  });

  S.push({
    id: 'f8-conjugate', ch: 'f8-alg', w: [50], title: 'Konjugatregeln', sub: '(a + b)(a − b) = a² − b²',
    idea: 'När två parenteser bara skiljer sig i **tecknet** – $(x + 5)(x - 5)$ – tar mittentermerna ut varandra ($+5x - 5x = 0$). Kvar blir **första i kvadrat minus andra i kvadrat**.',
    anchor: 'Samma två termer, olika tecken → a² − b².',
    cue: ['Två parenteser med samma termer men + i den ena och − i den andra.'],
    cvis: { t: 'conjugate', a: 'x', b: '3' },
    f: { name: 'Konjugatregeln', main: '(a + b)(a - b) = a^2 - b^2', when: 'Parenteserna har samma termer men olika tecken.', sym: [['a', 'första termen'], ['b', 'andra termen']], forms: [['Baklänges (faktorisera)', 'a^2 - b^2 = (a+b)(a-b)'], ['Med koefficient', '(2x+3)(2x-3) = 4x^2 - 9']], ex: '$(x + 3)(x - 3) = x^2 - 9$', trap: '$(2x)^2 = 4x^2$, inte $2x^2$. Kvadrera hela termen.' },
    h1: 'Samma termer, olika tecken? Det är konjugatregeln.',
    ex: { q: 'Förenkla (x + 3)(x − 3).', vis: { t: 'conjugate', a: 'x', b: '3' }, given: ['(x + 3)(x − 3)'], find: 'förenklat', rule: '(a+b)(a-b) = a^2 - b^2', steps: [['Vad är a och b?', '$a = x$, $b = 3$'], ['Varför försvinner mitten?', '$+3x - 3x = 0$'], ['Svar', '$x^2 - 9$']], ans: 'x² − 9' },
    g: { q: 'Förenkla (x + 5)(x − 5).', vis: { t: 'conjugate', a: 'x', b: '5' }, given: ['(x + 5)(x − 5)'], find: 'förenklat', opts: ['x^2 - 25', 'x^2 + 25', 'x^2 - 10'], oc: 0, why: 'a² − b² med a = x, b = 5.', type: 'expr', a: 'x^2-25', form: 'expanded', start: '$x^2 - 5^2$', sol: ['$x^2 - 25$'], traps: [['x^2+25', 'Det ska vara minus: a² − b².'], ['x^2-10', '5² = 25, inte 10.']] },
    p: [
      { lv: 'A', q: 'Förenkla (x + 1)(x − 1).', type: 'expr', a: 'x^2-1', form: 'expanded', given: ['(x + 1)(x − 1)'], find: 'förenklat', start: 'a = x, b = 1', sol: ['$x^2 - 1$'] },
      { lv: 'B', q: 'Förenkla (2x + 3)(2x − 3).', vis: { t: 'conjugate', a: '2x', b: '3' }, type: 'expr', a: '4x^2-9', form: 'expanded', given: ['(2x + 3)(2x − 3)'], find: 'förenklat', start: '$a = 2x$ → $a^2 = 4x^2$', sol: ['$(2x)^2 - 3^2 = 4x^2 - 9$'], traps: [['2x^2-9', '(2x)² = 2x · 2x = 4x².']] },
      { lv: 'C', q: 'Faktorisera x² − 49 med konjugatregeln.', type: 'expr', a: '(x+7)(x-7)', form: 'factored', given: ['x² − 49'], find: 'som produkt', start: '$49 = 7^2$', sol: ['$x^2 - 7^2 = (x + 7)(x - 7)$'] },
      { lv: 'F', q: 'Beräkna 21 · 19 med konjugatregeln: (20 + 1)(20 − 1).', type: 'num', a: 399, calc: '21*19', given: ['(20 + 1)(20 − 1)'], find: 'värdet', start: '$20^2 - 1^2$', sol: ['$400 - 1 = 399$'] }
    ],
    kw: 'konjugatregeln konjugat a2-b2 parenteser kvadrat minus kvadrat'
  });

  S.push({
    id: 'f8-factor', ch: 'f8-alg', w: [50], title: 'Faktorisera', sub: 'bryt ut gemensam faktor',
    idea: 'Faktorisera är **att multiplicera in baklänges**. Leta efter det som finns i **alla** termer, ställ det framför en parentes, och skriv det som blir kvar inuti.',
    anchor: 'Kontroll: multiplicera in igen – får du tillbaka uttrycket?',
    cue: ['Ordet faktorisera / bryt ut.'],
    cvis: { t: 'factor', g: '6', t1: 'x', t2: '2', expr: '6x + 12' },
    f: { name: 'Faktorisering', main: 'ab + ac = a(b + c)', when: 'Ett uttryck ska skrivas som en produkt.', sym: [['a', 'största gemensamma faktorn']], forms: [['Framåt (multiplicera in)', 'a(b + c) = ab + ac'], ['Med variabel', '3x^2 + 6x = 3x(x + 2)'], ['Konjugat', 'a^2 - b^2 = (a+b)(a-b)']], ex: '$6x + 12 = 6(x + 2)$', trap: 'Bryt ut den STÖRSTA gemensamma faktorn: 8x − 12 = 4(2x − 3), inte 2(4x − 6).' },
    h1: 'Vad finns i alla termer? Det ställer du framför parentesen.',
    ex: { q: 'Faktorisera 6x + 12.', vis: { t: 'factor', g: '6', t1: 'x', t2: '2', expr: '6x + 12' }, given: ['6x + 12'], find: 'som produkt', rule: 'ab + ac = a(b+c)', steps: [['Vad delar både 6x och 12?', '6'], ['Vad blir kvar?', '$6x / 6 = x$ och $12/6 = 2$'], ['Svar', '$6(x + 2)$'], ['Kontroll', '$6 \\cdot x + 6 \\cdot 2 = 6x + 12$ ✓']], ans: '6(x + 2)' },
    g: { q: 'Faktorisera 5x + 15.', vis: { t: 'factor', g: '5', t1: 'x', t2: '3', expr: '5x + 15' }, given: ['5x + 15'], find: 'som produkt', opts: ['5(x + 3)', '5(x + 15)', 'x(5 + 15)'], oc: 0, why: '5 finns i båda: 5x = 5 · x och 15 = 5 · 3.', type: 'expr', a: '5(x+3)', form: 'factored', start: 'Bryt ut 5.', sol: ['$5(x + 3)$'] },
    p: [
      { lv: 'A', q: 'Faktorisera 8x − 12 fullständigt.', vis: { t: 'factor', g: '4', t1: '2x', t2: '−3', expr: '8x − 12' }, type: 'expr', a: '4(2x-3)', form: 'factored', gcf: 4, given: ['8x − 12'], find: 'som produkt', start: 'Största gemensamma faktor är 4.', sol: ['$4(2x - 3)$'] },
      { lv: 'B', q: 'Faktorisera 3x² + 6x fullständigt.', type: 'expr', a: '3x(x+2)', form: 'factored', gcf: '3x', given: ['3x² + 6x'], find: 'som produkt', start: 'Både 3 och x finns i båda termerna.', sol: ['$3x(x + 2)$'] },
      { lv: 'C', q: 'Faktorisera 10x + 25 fullständigt.', type: 'expr', a: '5(2x+5)', form: 'factored', gcf: 5, given: ['10x + 25'], find: 'som produkt', start: 'Vilket tal delar både 10 och 25?', sol: ['$5(2x + 5)$'] },
      { lv: 'F', q: 'Faktorisera x² − 16.', type: 'expr', a: '(x+4)(x-4)', form: 'factored', given: ['x² − 16'], find: 'som produkt', start: 'Kvadrat minus kvadrat → konjugatregeln baklänges.', sol: ['$x^2 - 4^2 = (x + 4)(x - 4)$'] }
    ],
    kw: 'faktorisera bryt ut gemensam faktor faktorisering produkt'
  });

  root.MO_CONTENT8 = S;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
