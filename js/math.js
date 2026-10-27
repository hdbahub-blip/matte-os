/* Matte OS v5 — math rendering + answer checking.
   No dependencies. Works in browser (window.MOMath) and Node (module.exports). */
(function (root) {
  'use strict';

  /* ---------- 1. Mini-TeX renderer ----------
     Supports: \frac{a}{b}  \sqrt{x}  x^{2} x^2  x_{1}  \pi \cdot \times \div \approx \pm \le \ge \ne \to \deg
               \text{...}  \,  and plain letters (italic) / digits / operators. */
  const SYM = { pi: 'π', cdot: '·', times: '×', div: '÷', approx: '≈', pm: '±', le: '≤', ge: '≥', ne: '≠',
    to: '→', deg: '°', Rightarrow: '⇒', subset: '⊂', in: '∈', infty: '∞', percent: '%', mu: 'µ', quad: ' ' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function readGroup(s, i) { // s[i] === '{'
    let depth = 0, j = i;
    for (; j < s.length; j++) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}') { depth--; if (depth === 0) break; }
    }
    return [s.slice(i + 1, j), j + 1];
  }
  function readArg(s, i) {
    while (s[i] === ' ') i++;
    if (s[i] === '{') return readGroup(s, i);
    if (s[i] === '\\') { const m = /^\\[a-zA-Z]+/.exec(s.slice(i)); if (m) return [m[0], i + m[0].length]; }
    return [s[i] || '', i + 1];
  }
  function tex(s) {
    s = String(s);
    let out = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') {
        const m = /^\\([a-zA-Z]+|,|;|!| |%)/.exec(s.slice(i));
        if (!m) { out += '\\'; i++; continue; }
        const name = m[1]; i += m[0].length;
        if (name === 'frac') {
          const [a, i1] = readArg(s, i); const [b, i2] = readArg(s, i1); i = i2;
          out += `<span class="m-frac"><span class="m-num">${tex(a)}</span><span class="m-den">${tex(b)}</span></span>`;
        } else if (name === 'sqrt') {
          const [a, i1] = readArg(s, i); i = i1;
          out += `<span class="m-sqrt"><span class="m-rad">√</span><span class="m-under">${tex(a)}</span></span>`;
        } else if (name === 'text') {
          const [a, i1] = readArg(s, i); i = i1; out += `<span class="m-text">${esc(a.replace(/\\%/g, '%'))}</span>`;
        } else if (name === ',' || name === ' ' || name === ';') out += '<span class="m-sp"></span>';
        else if (name === '!') { /* nothing */ }
        else if (name === '%') out += '%';
        else if (SYM[name]) {
          const op = ['cdot', 'times', 'div', 'approx', 'pm', 'le', 'ge', 'ne', 'to', 'Rightarrow', 'subset', 'in'].includes(name);
          out += op ? `<span class="m-op">${SYM[name]}</span>` : SYM[name];
        } else out += esc(name);
      } else if (c === '^' || c === '_') {
        const [a, i1] = readArg(s, i + 1); i = i1;
        out += c === '^' ? `<sup>${tex(a)}</sup>` : `<sub>${tex(a)}</sub>`;
      } else if (c === '{' ) { const [a, i1] = readGroup(s, i); i = i1; out += tex(a); }
      else if (/[a-zA-Z]/.test(c)) {
        // words of 2+ letters that are units/abbrev render upright
        const m = /^[a-zA-ZåäöÅÄÖ]+/.exec(s.slice(i)); const w = m[0];
        if (w.length > 1 && !/^[a-zA-Z]$/.test(w)) {
          // e.g. "cm", "km", "dm" -> upright unit; "ab" -> treat as product of italics
          if (/^(cm|mm|dm|km|m|kg|g|mg|ml|cl|dl|l|kr|st|inv|min|h|s|mega|kilo|milli|giga|mikro|nano|sin|cos|tan)$/.test(w) || w.length > 3)
            out += `<span class="m-up">${esc(w)}</span>`;
          else out += w.split('').map(ch => `<i>${ch}</i>`).join('');
        } else out += `<i>${esc(w)}</i>`;
        i += w.length;
      } else if (c === '-') { out += '<span class="m-op">−</span>'; i++; }
      else if (c === '+' || c === '=') { out += `<span class="m-op">${c}</span>`; i++; }
      else if (c === '*') { out += '<span class="m-op">·</span>'; i++; }
      else if (c === '<' || c === '>') { out += `<span class="m-op">${c === '<' ? '&lt;' : '&gt;'}</span>`; i++; }
      else if (c === ' ') { i++; }
      else if (c === '~') { out += '&nbsp;'; i++; }
      else { out += esc(c); i++; }
    }
    return out;
  }
  const texBlock = s => `<span class="m">${tex(s)}</span>`;
  /* Rich text: plain text with $...$ inline math. */
  function rich(s) {
    if (s == null) return '';
    return String(s).split(/(\$[^$]*\$)/g).map(part =>
      part.startsWith('$') && part.endsWith('$') && part.length > 1 ? texBlock(part.slice(1, -1)) : esc(part)
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')).join('');
  }

  /* ---------- 2. Input normalisation ---------- */
  function normalize(raw) {
    return String(raw == null ? '' : raw)
      .replace(/[−–—]/g, '-')        // minus variants
      .replace(/[·×∙⋅]/g, '*').replace(/÷/g, '/')
      .replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/(\d)[    ](?=\d{3}\b)/g, '$1') // thousands separators "4 200"
      .replace(/(\d),(\d)/g, '$1.$2')               // decimal comma
      .replace(/√/g, 'sqrt').replace(/π/g, 'pi')
      .replace(/\s+/g, '')
      .trim();
  }

  /* ---------- 3. Expression parser (numbers, x, + - * / ^, parens, sqrt, pi, implicit multiplication) ---------- */
  function parse(str, vars) {
    vars = vars || ['x'];
    const s = normalize(str).toLowerCase();
    let i = 0;
    const peek = () => s[i];
    function fail(msg) { const e = new Error(msg || 'parse'); e.parse = true; throw e; }
    function parseExpr() {
      let node = parseTerm();
      while (peek() === '+' || peek() === '-') { const op = s[i++]; node = { t: op, a: node, b: parseTerm() }; }
      return node;
    }
    function startsFactor() { const c = peek(); return c !== undefined && (/[0-9.(a-z]/.test(c)); }
    function parseTerm() {
      let node = parseUnary();
      for (;;) {
        if (peek() === '*' || peek() === '/') { const op = s[i++]; node = { t: op, a: node, b: parseUnary() }; }
        else if (startsFactor()) node = { t: '*', a: node, b: parseUnary(), implicit: true };
        else break;
      }
      return node;
    }
    function parseUnary() {
      if (peek() === '-') { i++; return { t: 'neg', a: parseUnary() }; }
      if (peek() === '+') { i++; return parseUnary(); }
      return parsePow();
    }
    function parsePow() {
      const base = parseAtom();
      if (peek() === '^') { i++; const e = parseUnary(); return { t: '^', a: base, b: e }; }
      return base;
    }
    function parseAtom() {
      const c = peek();
      if (c === undefined) fail('end');
      if (c === '(') { i++; const n = parseExpr(); if (s[i] !== ')') fail('paren'); i++; return { t: 'par', a: n }; }
      if (/[0-9.]/.test(c)) {
        const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)); if (!m) fail('num'); i += m[0].length;
        return { t: 'n', v: parseFloat(m[0]) };
      }
      if (s.startsWith('sqrt', i)) { i += 4; const a = parsePow(); return { t: 'sqrt', a }; }
      if (s.startsWith('pi', i)) { i += 2; return { t: 'n', v: Math.PI, pi: true }; }
      if (/[a-z]/.test(c)) { if (!vars.includes(c)) fail('var:' + c); i++; return { t: 'v', name: c }; }
      fail('char:' + c);
    }
    if (!s) fail('empty');
    const tree = parseExpr();
    if (i !== s.length) fail('trailing');
    return tree;
  }
  function evaluate(node, env) {
    switch (node.t) {
      case 'n': return node.v;
      case 'v': return env[node.name];
      case 'par': return evaluate(node.a, env);
      case 'neg': return -evaluate(node.a, env);
      case 'sqrt': return Math.sqrt(evaluate(node.a, env));
      case '+': return evaluate(node.a, env) + evaluate(node.b, env);
      case '-': return evaluate(node.a, env) - evaluate(node.b, env);
      case '*': return evaluate(node.a, env) * evaluate(node.b, env);
      case '/': return evaluate(node.a, env) / evaluate(node.b, env);
      case '^': return Math.pow(evaluate(node.a, env), evaluate(node.b, env));
    }
    return NaN;
  }
  const hasParen = n => !!n && (n.t === 'par' || ['a', 'b'].some(k => n[k] && hasParen(n[k])));
  const unwrap = n => (n && n.t === 'par' ? unwrap(n.a) : n);
  function isProductForm(n) { // top-level product with at least one bracket factor, e.g. 5(x+3), 3x(x+2)
    n = unwrap(n);
    return n.t === '*' && hasParen(n);
  }
  function numericValue(str) {
    const tree = parse(str, []);
    const v = evaluate(tree, {});
    return Number.isFinite(v) ? v : NaN;
  }

  /* ---------- 4. Units ---------- */
  const UNIT_ALIASES = {
    'cm2': 'cm²', 'cm^2': 'cm²', 'm2': 'm²', 'm^2': 'm²', 'km2': 'km²', 'km^2': 'km²', 'dm2': 'dm²', 'dm^2': 'dm²', 'mm2': 'mm²', 'mm^2': 'mm²',
    'cm3': 'cm³', 'cm^3': 'cm³', 'dm3': 'dm³', 'dm^3': 'dm³', 'm3': 'm³', 'm^3': 'm³', 'mm3': 'mm³', 'mm^3': 'mm³',
    'grader': '°', 'grad': '°', '°': '°', 'kr': 'kr', 'kronor': 'kr', '%': '%', 'procent': '%',
    'procentenheter': 'procentenheter', 'pe': 'procentenheter', 'p.e.': 'procentenheter', 'procentenhet': 'procentenheter',
    'inv/km2': 'inv/km²', 'inv/km^2': 'inv/km²', 'invånare/km2': 'inv/km²', 'invånare/km^2': 'inv/km²', 'inv/km²': 'inv/km²',
    'invånare': 'invånare', 'inv': 'invånare', 'st': 'st', 'liter': 'l', 'l': 'l', 'dl': 'dl', 'ml': 'ml', 'cl': 'cl',
    'm': 'm', 'cm': 'cm', 'mm': 'mm', 'dm': 'dm', 'km': 'km', 'g': 'g', 'kg': 'kg', 'mg': 'mg', 'cm²': 'cm²', 'm²': 'm²', 'km²': 'km²', 'dm²': 'dm²', 'mm²': 'mm²',
    'cm³': 'cm³', 'dm³': 'dm³', 'm³': 'm³', 'mm³': 'mm³', 'g/cm3': 'g/cm³', 'g/cm^3': 'g/cm³', 'g/cm³': 'g/cm³', 'år': 'år', 'h': 'h', 'min': 'min'
  };
  /* Split "12,5 cm²" -> {num:"12,5", unit:"cm²"} */
  function splitUnit(raw) {
    const s = String(raw || '').trim();
    const m = /^(.*?[0-9)πx])\s*([a-zA-ZåäöÅÄÖ°%/.²³^0-9]*[a-zA-ZåäöÅÄÖ°%²³][a-zA-ZåäöÅÄÖ°%/.²³^0-9]*)$/.exec(s);
    if (!m) return { num: s, unit: '' };
    const u = m[2].toLowerCase().replace(/\s/g, '');
    // do not treat "x" in "2x" style or "pi" as a unit
    if (/^(x|pi)$/.test(u)) return { num: s, unit: '' };
    return { num: m[1], unit: UNIT_ALIASES[u] || UNIT_ALIASES[m[2]] || m[2] };
  }

  /* ---------- 5. Checking ---------- */
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const near = (a, b, tol) => Math.abs(a - b) <= (tol == null ? 1e-9 : tol) + 1e-9 * Math.max(1, Math.abs(b));
  const fmt = (v, dec) => {
    if (!Number.isFinite(v)) return String(v);
    let s = dec != null ? v.toFixed(dec) : String(Math.round(v * 1e9) / 1e9);
    let [int, frac] = s.split('.');
    const neg = int.startsWith('-'); if (neg) int = int.slice(1);
    if (int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '−' : '') + int + (frac ? ',' + frac : '');
  };

  /* ex: {type, a, tol, dec, u, traps:[[value,msg]], form:'factored'|'expanded', opts}
     returns {ok, status:'correct'|'wrong'|'invalid'|'empty', msg, note} */
  function check(ex, raw) {
    const type = ex.type || 'num';
    if (type === 'choice') {
      if (raw == null || raw === '') return { ok: false, status: 'empty', msg: 'Välj ett alternativ.' };
      if (String(raw) === String(ex.a)) return { ok: true, status: 'correct' };
      const trap = (ex.traps || []).find(t => String(t[0]) === String(raw));
      return { ok: false, status: 'wrong', msg: trap ? trap[1] : null };
    }
    if (type === 'sci') { // raw = {m, e}
      const m = raw && raw.m != null ? String(raw.m) : ''; const e = raw && raw.e != null ? String(raw.e) : '';
      if (!m.trim() || !e.trim()) return { ok: false, status: 'empty', msg: 'Fyll i båda rutorna.' };
      let mv, ev;
      try { mv = numericValue(m); ev = numericValue(e); } catch (err) { return { ok: false, status: 'invalid', msg: 'Skriv bara tal i rutorna, t.ex. 4,5 och 5.' }; }
      const [am, ae] = ex.a;
      const value = mv * Math.pow(10, ev), target = am * Math.pow(10, ae);
      if (near(mv, am, 1e-9) && ev === ae) return { ok: true, status: 'correct' };
      if (near(value, target, Math.abs(target) * 1e-9)) {
        return { ok: false, status: 'wrong', msg: `Värdet stämmer, men i grundpotensform ska första talet ligga mellan 1 och 10. Flytta decimaltecknet så att du får ${fmt(am)}.` };
      }
      if (near(mv, am, 1e-9) && ev === -ae) return { ok: false, status: 'wrong', msg: ae < 0 ? 'Talet är mindre än 1, så exponenten ska vara negativ.' : 'Talet är större än 10, så exponenten ska vara positiv.' };
      if (near(mv, am, 1e-9)) return { ok: false, status: 'wrong', msg: 'Första talet är rätt. Räkna stegen som decimaltecknet flyttas en gång till.' };
      return { ok: false, status: 'wrong', msg: null };
    }
    const str = String(raw == null ? '' : raw).trim();
    if (!str) return { ok: false, status: 'empty', msg: 'Skriv ett svar först.' };

    if (type === 'expr') {
      let tree;
      try { tree = parse(str, ['x', 'a', 'b', 'y']); } catch (e) { return { ok: false, status: 'invalid', msg: 'Uttrycket gick inte att läsa. Kontrollera parenteser och tecken.' }; }
      const target = parse(ex.a, ['x', 'a', 'b', 'y']);
      const pts = [-2.5, -1, 0.5, 1.75, 3, 7.3];
      const same = t => pts.every(x => near(evaluate(t, { x, a: x + 1.3, b: x - 0.7, y: 2 * x }), evaluate(target, { x, a: x + 1.3, b: x - 0.7, y: 2 * x }), 1e-7));
      if (same(tree)) {
        if (ex.form === 'factored' && !isProductForm(tree)) return { ok: false, status: 'wrong', msg: 'Uttrycket har rätt värde, men uppgiften ber dig faktorisera: skriv det som en produkt med parentes, t.ex. 5(x + 3).' };
        if (ex.form === 'expanded' && hasParen(tree)) return { ok: false, status: 'wrong', msg: 'Rätt värde, men parentesen ska vara borta. Multiplicera in/förenkla helt.' };
        if (ex.form === 'factored' && ex.gcf != null) { // fully factored? check every bracket factor
          const flat = (n, acc) => { n = n.t === 'par' && n.a.t === '*' ? n.a : n; if (n.t === '*') { flat(n.a, acc); flat(n.b, acc); } else acc.push(n); return acc; };
          for (const f of flat(unwrap(tree), []).filter(f => f.t === 'par')) {
            const f0 = evaluate(f, { x: 0 }), c1 = evaluate(f, { x: 1 }) - f0;
            if (Math.abs(f0) < 1e-9) return { ok: false, status: 'wrong', msg: 'Nästan! Alla termer i parentesen innehåller fortfarande x – bryt ut x också.' };
            const r0 = Math.round(Math.abs(f0)), r1 = Math.round(Math.abs(c1));
            if (near(r0, Math.abs(f0), 1e-9) && near(r1, Math.abs(c1), 1e-9) && gcd(r0, r1) > 1) return { ok: false, status: 'wrong', msg: `Nästan! Termerna i parentesen har fortfarande en gemensam faktor (${gcd(r0, r1)}). Bryt ut den största gemensamma faktorn.` };
          }
        }
        return { ok: true, status: 'correct' };
      }
      for (const [tv, msg] of ex.traps || []) {
        try {
          const tt = parse(String(tv), ['x', 'a', 'b', 'y']);
          if (pts.every(x => near(evaluate(tree, { x, a: x + 1.3, b: x - 0.7, y: 2 * x }), evaluate(tt, { x, a: x + 1.3, b: x - 0.7, y: 2 * x }), 1e-7))) return { ok: false, status: 'wrong', msg };
        } catch (e) { /* ignore bad trap */ }
      }
      return { ok: false, status: 'wrong', msg: null };
    }

    // numeric (num) — may contain unit, fraction, sqrt, pi
    const { num, unit } = splitUnit(str);
    let v;
    try { v = numericValue(num); } catch (e) {
      return { ok: false, status: 'invalid', msg: 'Svaret gick inte att läsa som ett tal. Skriv t.ex. 12,5 eller 3/4.' };
    }
    if (!Number.isFinite(v)) return { ok: false, status: 'invalid', msg: 'Svaret gick inte att läsa som ett tal.' };
    const tol = ex.tol != null ? ex.tol : (ex.dec != null ? 0.5 * Math.pow(10, -ex.dec) : 1e-9);
    if (ex.mustFraction) {
      const fm = /^(-?\d+)\/(-?\d+)$/.exec(normalize(num));
      if (!fm) { if (near(v, ex.a, 1e-9)) return { ok: false, status: 'wrong', msg: 'Rätt värde! Men svara som ett bråk i enklaste form, alltså täljare/nämnare.' }; }
      else if (near(v, ex.a, 1e-9)) {
        const g = gcd(Math.abs(+fm[1]), Math.abs(+fm[2]));
        return g > 1 ? { ok: false, status: 'wrong', msg: `Rätt värde, men bråket kan förkortas mer – både ${fm[1]} och ${fm[2]} är delbara med ${g}.` } : { ok: true, status: 'correct' };
      }
    }
    const unitWrong = unit && ex.u && unit !== ex.u && !(ex.uAlt || []).includes(unit);
    if (near(v, ex.a, tol)) {
      if (unitWrong) return { ok: false, status: 'wrong', msg: `Talet stämmer, men enheten ska vara ${ex.u}, inte ${unit}.` };
      let note = null;
      if (ex.dec != null) {
        const decimals = (normalize(num).split('.')[1] || '').length;
        if (decimals > ex.dec && /^[0-9.\-]+$/.test(normalize(num))) note = `Avrunda till ${ex.dec === 0 ? 'heltal' : ex.dec + ' decimal' + (ex.dec > 1 ? 'er' : '')}: ${fmt(ex.a, ex.dec)}.`;
      }
      return { ok: true, status: 'correct', note };
    }
    for (const [tv, msg] of ex.traps || []) {
      const tval = typeof tv === 'number' ? tv : numericValue(String(tv));
      const ttol = ex.dec != null ? tol * 1.01 : Math.max(tol, 1e-9);
      if (near(v, tval, ttol)) return { ok: false, status: 'wrong', msg };
    }
    // generic misconception detectors
    if (ex.a !== 0 && near(v, -ex.a, tol)) return { ok: false, status: 'wrong', msg: 'Rätt storlek men fel tecken. Kontrollera plus/minus.' };
    if (ex.a > 0 && near(v, ex.a * ex.a, Math.max(tol, 1e-6) * Math.abs(ex.a) * 2) && ex.a > 1) return { ok: false, status: 'wrong', msg: 'Det ser ut som att du har kvadraten av svaret. Sista steget: ta kvadratroten.' };
    if (ex.unitSkill) {
      for (const k of [1, 2, 3, 4, 5, 6]) for (const sgn of [1, -1]) {
        if (near(v, ex.a * Math.pow(10, sgn * k), Math.abs(ex.a) * Math.pow(10, sgn * k) * 1e-6)) {
          const f = fmt(Math.pow(10, k));
          return { ok: false, status: 'wrong', msg: `Siffrorna stämmer, men svaret är ${f} gånger för ${sgn > 0 ? 'stort' : 'litet'}. Decimaltecknet har flyttats fel antal steg – räkna stegen mellan enheterna igen.` };
        }
      }
    }
    if (ex.dec != null && near(v, ex.a, tol * 20)) return { ok: false, status: 'wrong', msg: `Nära! Kontrollera avrundningen till ${ex.dec} decimal${ex.dec > 1 ? 'er' : ''}, och att du använt π (inte 3).` };
    return { ok: false, status: 'wrong', msg: null };
  }

  const M = { tex, texBlock, rich, esc, normalize, parse, evaluate, numericValue, splitUnit, check, fmt, near, isProductForm, hasParen };
  if (typeof module !== 'undefined' && module.exports) module.exports = M; else root.MOMath = M;
})(typeof window !== 'undefined' ? window : globalThis);
