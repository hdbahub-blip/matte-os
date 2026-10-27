/* Matte OS v5 — context-specific mathematical diagrams (pure SVG strings, no dependencies).
   Every diagram takes the exercise's own data so the picture matches the problem. */
(function (root) {
  'use strict';
  const R = (n, d = 1) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dec = v => { if (typeof v !== 'number') return v; let [i, f] = String(R(v, 3)).split('.'); if (i.replace('-', '').length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009'); return i + (f ? ',' + f : ''); };
  const svg = (w, h, body, label) =>
    `<svg class="vz" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || 'Figur')}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
  const T = (x, y, s, cls = 'lb', anchor = 'middle', extra = '') =>
    `<text x="${R(x)}" y="${R(y)}" class="${cls}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
  const L = (x1, y1, x2, y2, cls = 'ln') => `<line x1="${R(x1)}" y1="${R(y1)}" x2="${R(x2)}" y2="${R(y2)}" class="${cls}"/>`;
  const P = (pts, cls = 'ln') => `<polygon points="${pts.map(p => R(p[0]) + ',' + R(p[1])).join(' ')}" class="${cls}"/>`;
  const PL = (pts, cls = 'ln') => `<polyline points="${pts.map(p => R(p[0]) + ',' + R(p[1])).join(' ')}" class="${cls}"/>`;
  const C = (x, y, r, cls = 'ln') => `<circle cx="${R(x)}" cy="${R(y)}" r="${R(r)}" class="${cls}"/>`;
  const RECT = (x, y, w, h, cls = 'ln', rx = 0) => `<rect x="${R(x)}" y="${R(y)}" width="${R(w)}" height="${R(h)}" rx="${rx}" class="${cls}"/>`;
  const arrowDefs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ahd"/></marker></defs>`;
  const ARR = (x1, y1, x2, y2, cls = 'arr') => `<line x1="${R(x1)}" y1="${R(y1)}" x2="${R(x2)}" y2="${R(y2)}" class="${cls}" marker-end="url(#ah)"/>`;
  const CURVE = (x1, y1, x2, y2, lift, cls = 'arr') => { const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - lift; return `<path d="M${R(x1)},${R(y1)} Q${R(mx)},${R(my)} ${R(x2)},${R(y2)}" class="${cls}" marker-end="url(#ah)"/>`; };
  function angArc(V, A, B, r, cls = 'arcm') { // arc at vertex V between rays to A and B (interior, < 180)
    let a1 = Math.atan2(A[1] - V[1], A[0] - V[0]), a2 = Math.atan2(B[1] - V[1], B[0] - V[0]);
    let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
    const p1 = [V[0] + r * Math.cos(a1), V[1] + r * Math.sin(a1)], p2 = [V[0] + r * Math.cos(a1 + d), V[1] + r * Math.sin(a1 + d)];
    const mid = a1 + d / 2;
    return { d: `<path d="M${R(p1[0])},${R(p1[1])} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${R(p2[0])},${R(p2[1])}" class="${cls}"/>`, mid };
  }
  const isUnk = v => v === '?' || v === 'x' || v == null;
  const lab = (v, unit = '') => (isUnk(v) ? '?' : dec(v) + unit);
  const fitPts = (pts, x0, y0, w, h) => { // scale polygon to box
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const s = Math.min(w / (maxx - minx || 1), h / (maxy - miny || 1));
    const ox = x0 + (w - (maxx - minx) * s) / 2, oy = y0 + (h - (maxy - miny) * s) / 2;
    return pts.map(p => [ox + (p[0] - minx) * s, oy + (p[1] - miny) * s]);
  };
  const rightMark = (V, A, B, s = 11) => { // small square at V between directions to A and B
    const u = n => { const l = Math.hypot(n[0], n[1]); return [n[0] / l, n[1] / l]; };
    const a = u([A[0] - V[0], A[1] - V[1]]), b = u([B[0] - V[0], B[1] - V[1]]);
    const p1 = [V[0] + a[0] * s, V[1] + a[1] * s], p3 = [V[0] + b[0] * s, V[1] + b[1] * s], p2 = [p1[0] + b[0] * s, p1[1] + b[1] * s];
    return PL([p1, p2, p3], 'ln thin');
  };
  const iso = (x, y, z, ox, oy, s) => [ox + (x - y) * s * 0.866, oy + (x + y) * s * 0.5 - z * s];

  const V = {};

  /* ===== TAL ===== */
  V.prefix = ({ from = 'k', to = '', note } = {}) => {
    const P_ = [['G', 9, 'giga'], ['M', 6, 'mega'], ['k', 3, 'kilo'], ['', 0, '—'], ['m', -3, 'milli'], ['µ', -6, 'mikro'], ['n', -9, 'nano']];
    const W = 340, x0 = 22, dx = 49;
    let b = arrowDefs;
    P_.forEach(([sym, e, name], i) => {
      const x = x0 + i * dx, act = sym === from || sym === to;
      b += RECT(x - 20, 52, 40, 40, act ? 'box hl' : 'box', 8);
      b += T(x, 78, sym || '1', act ? 'lb big acc' : 'lb big');
      b += T(x, 108, '10^' + e, 'lbs');
      b += T(x, 124, name, 'lbs mut');
    });
    const fi = P_.findIndex(p => p[0] === from), ti = P_.findIndex(p => p[0] === to);
    if (fi >= 0 && ti >= 0 && fi !== ti) {
      const steps = Math.abs(P_[fi][1] - P_[ti][1]);
      b += CURVE(x0 + fi * dx, 48, x0 + ti * dx, 48, 30, 'arr acc');
      b += T((x0 + (fi + ti) / 2 * dx), 16, (fi < ti ? '× 10^' : '÷ 10^') + steps + (fi < ti ? '  (större tal)' : '  (mindre tal)'), 'lb acc');
    }
    if (note) b += T(W / 2, 148, note, 'lbs mut');
    return svg(W, note ? 156 : 134, b.replace(/10\^(-?\d+)/g, (m, e) => '10' + sup(e)), 'Prefixtrappa');
  };
  const SUPS = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sup = e => String(e).split('').map(c => SUPS[c] || c).join('');
  V.sci = ({ num = '450000', a = '4,5', n = 5 } = {}) => {
    const raw = String(num).replace(/\s/g, '').replace('.', ',');
    const origGap = raw.includes(',') ? raw.indexOf(',') : raw.length;
    const digits = raw.replace(',', '').split('');
    const firstNZ = digits.findIndex(d => d !== '0');
    const finalGap = firstNZ + 1;
    const cw = 24, W = 320, x0 = (W - digits.length * cw) / 2;
    const gx = g => x0 + g * cw;
    let b = arrowDefs;
    digits.forEach((ch, i) => { b += T(x0 + i * cw + cw / 2, 92, ch, i === firstNZ ? 'lb big acc' : 'lb big'); });
    b += T(gx(origGap), 96, ',', 'lb big mut');
    b += T(gx(finalGap), 96, ',', 'lb big acc');
    const steps = Math.abs(finalGap - origGap), dir = finalGap < origGap ? -1 : 1;
    for (let k = 0; k < steps; k++) { const g1 = origGap + dir * k, g2 = g1 + dir; b += CURVE(gx(g1), 70, gx(g2) + (dir < 0 ? 3 : -3), 70, 14, 'arr acc thin'); }
    b += T(W / 2, 30, `${steps} steg ${dir < 0 ? 'åt vänster' : 'åt höger'}  →  10${sup(n)}`, 'lb acc');
    b += T(W / 2, 128, `${a} · 10${sup(n)}`, 'lb big');
    b += T(W / 2, 150, n < 0 ? 'litet tal (< 1) → negativ exponent' : 'stort tal (≥ 10) → positiv exponent', 'lbs mut');
    return svg(W, 158, b, 'Decimaltecknet flyttas');
  };
  V.powers = ({ base = 2, m = 3, n = 2, op = 'mul' } = {}) => {
    const W = 330; let b = '';
    const box = (x, cnt, label) => { let s = ''; for (let i = 0; i < cnt; i++) s += RECT(x + i * 26, 46, 22, 30, 'box', 5) + T(x + i * 26 + 11, 67, base, 'lb'); return s + T(x + cnt * 13 - 2, 98, label, 'lbs acc'); };
    if (op === 'mul') {
      b += box(18, m, `${base}${sup(m)}`); b += T(18 + m * 26 + 8, 67, '·', 'lb big');
      b += box(18 + m * 26 + 20, n, `${base}${sup(n)}`);
      const x2 = 18 + (m + n) * 26 + 34;
      b += T(x2, 67, '=', 'lb big') + T(x2 + 34, 67, `${base}${sup(m + n)}`, 'lb big acc');
      b += T(W / 2, 128, `${m} + ${n} = ${m + n} faktorer ${base}`, 'lbs mut');
    } else if (op === 'pow') {
      b += T(W / 2, 40, `(${base}${sup(m)})${sup(n)} = ${Array(n).fill(base + sup(m)).join(' · ')}`, 'lb');
      b += T(W / 2, 80, `= ${base}${sup(m * n)}`, 'lb big acc');
      b += T(W / 2, 118, `${n} grupper med ${m} faktorer → ${m}·${n} = ${m * n}`, 'lbs mut');
    } else {
      b += T(W / 2, 40, `${base}${sup(m)} / ${base}${sup(n)}`, 'lb big');
      b += T(W / 2, 80, `${n} faktorer tar ut ${n} faktorer`, 'lbs mut');
      b += T(W / 2, 112, `= ${base}${sup(m - n)}`, 'lb big acc');
    }
    return svg(W, 140, b, 'Potenser som upprepad multiplikation');
  };
  V.sqrt = ({ a = 144, r = '?' } = {}) => {
    const s = 100; let b = '';
    b += RECT(110, 20, s, s, 'fillsoft');
    for (let i = 1; i < 6; i++) { b += L(110 + i * s / 6, 20, 110 + i * s / 6, 120, 'grid'); b += L(110, 20 + i * s / 6, 210, 20 + i * s / 6, 'grid'); }
    b += T(160, 76, `area ${a}`, 'lb');
    b += T(160, 140, `sida = ${r === '?' ? '?' : r}`, 'lb acc');
    b += T(96, 74, r === '?' ? '?' : r, 'lb acc', 'end');
    b += T(160, 160, `kvadratroten = sidan i en kvadrat med arean ${a}`, 'lbs mut');
    return svg(320, 168, b, 'Kvadrat med area och sida');
  };
  V.sets = ({ item, hl } = {}) => {
    let b = '';
    const E = (cx, rx, ry, cls) => `<ellipse cx="${cx}" cy="98" rx="${rx}" ry="${ry}" class="${cls}"/>`;
    const sets = [['R', 'reella', 150, 140, 86], ['Q', 'rationella', 130, 112, 68], ['Z', 'heltal', 110, 80, 50], ['N', 'naturliga', 92, 44, 30]];
    sets.forEach(([k, name, cx, rx, ry]) => { b += E(cx, rx, ry, k === hl ? 'set hl' : 'set'); });
    b += T(92, 100, 'ℕ', 'lb') + T(92, 116, '0, 1, 2…', 'lbs mut');
    b += T(160, 100, 'ℤ', 'lb') + T(162, 116, '−3, −1', 'lbs mut');
    b += T(218, 92, 'ℚ', 'lb') + T(222, 108, '½  0,75', 'lbs mut');
    b += T(272, 70, 'ℝ', 'lb') + T(272, 140, '√2  π', 'lbs acc');
    b += T(272, 154, 'irrationella', 'lbs mut');
    if (item) b += T(160, 24, `Var hör ${item} hemma?`, 'lb acc');
    return svg(320, 190, b, 'Talmängder inuti varandra');
  };

  /* ===== GEOMETRI: vinklar, Pythagoras, skala ===== */
  V.triAngles = ({ a = 42, b = 71, c = '?', W = 320 } = {}) => {
    const A = isUnk(a) ? 60 : a, B = isUnk(b) ? 60 : b;
    const Cang = 180 - A - B;
    const rad = d => d * Math.PI / 180;
    // base AB length 1, C via law of sines
    const ac = Math.sin(rad(B)) / Math.sin(rad(Cang || 1));
    let pts = [[0, 0], [1, 0], [ac * Math.cos(rad(A)), -ac * Math.sin(rad(A))]];
    pts = fitPts(pts, 40, 26, W - 80, 120);
    const [pA, pB, pC] = pts;
    let s = P(pts, 'ln fillsoft');
    const lblAt = (Vx, Pp, Qq, text, cls) => { const r = angArc(Vx, Pp, Qq, 22, cls === 'lb acc' ? 'arcm acc' : 'arcm'); return r.d + T(Vx[0] + 40 * Math.cos(r.mid), Vx[1] + 40 * Math.sin(r.mid) + 5, text, cls); };
    s += lblAt(pA, pB, pC, lab(a, '°'), isUnk(a) ? 'lb acc' : 'lb');
    s += lblAt(pB, pC, pA, lab(b, '°'), isUnk(b) ? 'lb acc' : 'lb');
    s += lblAt(pC, pA, pB, lab(c, '°'), isUnk(c) ? 'lb acc' : 'lb');
    s += T(W / 2, 176, 'Alla tre vinklarna tillsammans = 180°', 'lbs mut');
    return svg(W, 184, s, `Triangel med vinklarna ${lab(a, '°')}, ${lab(b, '°')} och ${lab(c, '°')}`);
  };
  V.lineAngle = ({ a = 128, b = '?' } = {}) => {
    const O = [160, 120], ang = (isUnk(a) ? 120 : a) * Math.PI / 180;
    const Rr = [O[0] + 110 * Math.cos(Math.PI - ang), O[1] - 110 * Math.sin(Math.PI - ang)];
    let s = L(30, 120, 290, 120) + L(O[0], O[1], Rr[0], Rr[1]);
    const r1 = angArc(O, [30, 120], Rr, 26, isUnk(a) ? 'arcm acc' : 'arcm');
    const r2 = angArc(O, Rr, [290, 120], 34, isUnk(b) ? 'arcm acc' : 'arcm');
    s += r1.d + T(O[0] + 50 * Math.cos(r1.mid), O[1] + 50 * Math.sin(r1.mid) + 4, lab(a, '°'), isUnk(a) ? 'lb acc' : 'lb');
    s += r2.d + T(O[0] + 58 * Math.cos(r2.mid), O[1] + 58 * Math.sin(r2.mid) + 4, lab(b, '°'), isUnk(b) ? 'lb acc' : 'lb');
    s += T(160, 150, 'Rak linje = 180°', 'lbs mut');
    return svg(320, 158, s, 'Vinklar på en rak linje');
  };
  V.pointAngles = ({ list = [90, 110, '?'] } = {}) => {
    const O = [160, 92], r = 70; let s = '', start = -90;
    const known = list.filter(v => !isUnk(v)).reduce((p, q) => p + q, 0);
    const vals = list.map(v => (isUnk(v) ? 360 - known : v));
    vals.forEach((v, i) => {
      const a = start * Math.PI / 180; s += L(O[0], O[1], O[0] + r * Math.cos(a), O[1] + r * Math.sin(a));
      const end = start + v, m = (start + end) / 2 * Math.PI / 180;
      const p1 = [O[0] + 24 * Math.cos(a), O[1] + 24 * Math.sin(a)], e = end * Math.PI / 180, p2 = [O[0] + 24 * Math.cos(e), O[1] + 24 * Math.sin(e)];
      s += `<path d="M${R(p1[0])},${R(p1[1])} A24,24 0 ${v > 180 ? 1 : 0} 1 ${R(p2[0])},${R(p2[1])}" class="arcm${isUnk(list[i]) ? ' acc' : ''}"/>`;
      s += T(O[0] + 46 * Math.cos(m), O[1] + 46 * Math.sin(m) + 5, lab(list[i], '°'), isUnk(list[i]) ? 'lb acc' : 'lb');
      start = end;
    });
    s += C(O[0], O[1], 2.5, 'dot');
    s += T(160, 182, 'Ett helt varv = 360°', 'lbs mut');
    return svg(320, 190, s, 'Vinklar runt en punkt');
  };
  V.rightTri = ({ a = 6, b = 8, c = '?', unit = 'cm', note } = {}) => {
    const na = isUnk(a) ? (isUnk(b) || isUnk(c) ? 3 : Math.sqrt(c * c - b * b)) : +a;
    const nb = isUnk(b) ? (isUnk(c) ? 4 : Math.sqrt(c * c - na * na)) : +b;
    const pts = fitPts([[0, 0], [0, na], [nb, na]], 70, 18, 190, 120); // top, right-angle corner, right
    const [Tp, Cr, Rt] = pts;
    let s = P(pts, 'ln fillsoft') + rightMark(Cr, Tp, Rt);
    s += `<line x1="${R(Tp[0])}" y1="${R(Tp[1])}" x2="${R(Rt[0])}" y2="${R(Rt[1])}" class="ln hyp"/>`;
    const u = v => lab(v, isUnk(v) ? '' : ' ' + unit);
    s += T(Cr[0] - 10, (Tp[1] + Cr[1]) / 2 + 4, 'a = ' + u(a), isUnk(a) ? 'lb acc' : 'lb', 'end');
    s += T((Cr[0] + Rt[0]) / 2, Cr[1] + 22, 'b = ' + u(b), isUnk(b) ? 'lb acc' : 'lb');
    s += T((Tp[0] + Rt[0]) / 2 + 12, (Tp[1] + Rt[1]) / 2 - 6, 'c = ' + u(c), isUnk(c) ? 'lb acc' : 'lb acc2', 'start');
    s += T(160, 182, note || 'c = hypotenusan, mittemot den räta vinkeln', 'lbs mut');
    return svg(320, 190, s, 'Rätvinklig triangel');
  };
  V.scaleMap = ({ ratio = 200, img = '4 cm', real = '?', dir = 'up' } = {}) => {
    let s = arrowDefs;
    s += T(20, 32, 'Ritning / karta', 'lbs mut', 'start');
    s += RECT(20, 42, 60, 12, 'fillacc', 3) + T(90, 53, img, img === '?' ? 'lb acc' : 'lb', 'start');
    s += T(20, 104, 'Verklighet', 'lbs mut', 'start');
    s += RECT(20, 114, 280, 12, 'fillsoft', 3) + T(296, 146, real, real === '?' ? 'lb acc' : 'lb', 'end');
    s += dir === 'up' ? ARR(160, 60, 160, 106, 'arr acc') : ARR(160, 106, 160, 62, 'arr acc');
    s += T(172, 88, dir === 'up' ? `× ${String(ratio).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}` : `÷ ${ratio}`, 'lb acc', 'start');
    s += T(160, 168, `1 cm på bilden = ${String(ratio).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} cm på riktigt`, 'lbs mut');
    return svg(320, 176, s, 'Skala: bild och verklighet');
  };
  V.areaScale = ({ k = 3, A1, A2 } = {}) => {
    const kn = isUnk(k) ? 3 : +k; const kk = Math.max(1, Math.min(5, Math.round(kn || 3))); const u = 18; let s = '';
    s += RECT(30, 120 - u, u, u, 'fillacc'); s += T(30 + u / 2, 140, '1', 'lbs');
    s += T(30 + u / 2, 160, 'längd 1', 'lbs mut');
    const x0 = 120, y0 = 120 - kk * u;
    for (let i = 0; i < kk; i++) for (let j = 0; j < kk; j++) s += RECT(x0 + i * u, y0 + j * u, u, u, i === 0 && j === kk - 1 ? 'fillacc' : 'fillsoft');
    s += T(x0 + kk * u / 2, 140, `${k}`, 'lbs') + T(x0 - 8, y0 + kk * u / 2 + 4, `${k}`, 'lbs', 'end');
    s += T(x0 + kk * u / 2, 160, `längd × ${k}`, 'lbs acc');
    s += T(250, 64, `area × ${k}·${k}`, 'lb acc') + T(250, 86, isUnk(k) ? '= × ?' : `= × ${dec(k * k)}`, 'lb big acc');
    if (A1 != null) s += T(250, 112, `${dec(A1)} → ${A2 == null ? '?' : dec(A2)}`, 'lbs');
    return svg(320, 168, s, 'Areaskala: längdfaktor i kvadrat');
  };
  V.volScale = ({ k = 2, V1, V2 } = {}) => {
    const kk = Math.max(1, Math.min(4, Math.round(+k || 2))); const s0 = 16; let s = '';
    const cube = (ox, oy, n, sz, hlFirst) => {
      let out = '';
      // draw visible faces as grids
      const top = [], left = [], right = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        top.push([iso(i, j, n, ox, oy, sz), iso(i + 1, j, n, ox, oy, sz), iso(i + 1, j + 1, n, ox, oy, sz), iso(i, j + 1, n, ox, oy, sz)]);
        left.push([iso(i, n, j, ox, oy, sz), iso(i + 1, n, j, ox, oy, sz), iso(i + 1, n, j + 1, ox, oy, sz), iso(i, n, j + 1, ox, oy, sz)]);
        right.push([iso(n, i, j, ox, oy, sz), iso(n, i + 1, j, ox, oy, sz), iso(n, i + 1, j + 1, ox, oy, sz), iso(n, i, j + 1, ox, oy, sz)]);
      }
      top.forEach((q, i) => out += P(q, 'cube-top')); left.forEach(q => out += P(q, 'cube-l')); right.forEach(q => out += P(q, 'cube-r'));
      if (hlFirst) { const q = [iso(n - 1, n, 0, ox, oy, sz), iso(n, n, 0, ox, oy, sz), iso(n, n, 1, ox, oy, sz), iso(n - 1, n, 1, ox, oy, sz)]; out += P(q, 'fillacc'); }
      return out;
    };
    const big = Math.min(18, 56 / kk);
    s += cube(52, 140 - s0, 1, s0, true) + T(52, 168, 'längd 1', 'lbs mut');
    s += cube(150, 140 - kk * big, kk, big, false) + T(150, 168, `längd × ${k}`, 'lbs acc');
    s += T(262, 60, `volym × ${k}·${k}·${k}`, 'lb acc') + T(262, 84, `= × ${dec(k * k * k)}`, 'lb big acc');
    if (V1 != null) s += T(262, 110, `${dec(V1)} → ${V2 == null ? '?' : dec(V2)}`, 'lbs');
    return svg(320, 178, s, 'Volymskala: längdfaktor upphöjt till tre');
  };
  V.similar = ({ small = [4, 6], big = [10, '?'], k, unit = 'cm' } = {}) => {
    let s = '';
    const tri = (ox, oy, sc) => [[ox, oy], [ox + 4 * sc, oy], [ox + 1.2 * sc, oy - 3 * sc]];
    const t1 = tri(20, 130, 18), t2 = tri(130, 150, 40);
    s += P(t1, 'ln fillsoft') + P(t2, 'ln fillsoft');
    const lbl = (t, vals, big) => T((t[0][0] + t[1][0]) / 2, t[0][1] + 18, lab(vals[0], isUnk(vals[0]) ? '' : ' ' + unit), isUnk(vals[0]) ? 'lb acc' : 'lb') +
      T((t[1][0] + t[2][0]) / 2 + 10, (t[1][1] + t[2][1]) / 2, lab(vals[1], isUnk(vals[1]) ? '' : ' ' + unit), isUnk(vals[1]) ? 'lb acc' : 'lb', 'start');
    s += lbl(t1, small) + lbl(t2, big);
    s += T(160, 18, k != null ? `Skalfaktor k = ${dec(k)}` : 'Samma form – samma faktor på alla sidor', 'lb acc');
    return svg(320, 176, s, 'Två likformiga trianglar');
  };
  V.symmetry = ({ shape = 'square', mode = 'lines' } = {}) => {
    let s = arrowDefs; const cx = 160, cy = 92;
    if (shape === 'square') s += RECT(cx - 55, cy - 55, 110, 110, 'ln fillsoft');
    if (shape === 'rect') s += RECT(cx - 80, cy - 45, 160, 90, 'ln fillsoft');
    if (shape === 'circle') s += C(cx, cy, 62, 'ln fillsoft');
    if (shape === 'triangle') s += P([[cx, cy - 64], [cx + 64 * 0.866, cy + 32], [cx - 64 * 0.866, cy + 32]], 'ln fillsoft');
    if (mode === 'lines') {
      const lines = { square: [0, 45, 90, 135], rect: [0, 90], circle: [0, 30, 60, 90, 120, 150], triangle: [90, 210, 330] }[shape];
      lines.forEach(a => { const r = a * Math.PI / 180, d = 82; s += L(cx - d * Math.cos(r), cy - d * Math.sin(r), cx + d * Math.cos(r), cy + d * Math.sin(r), 'ln dashed acc'); });
      s += T(cx, 184, shape === 'circle' ? 'Varje diameter är en symmetrilinje (oändligt många)' : `${lines.length} symmetrilinjer`, 'lbs mut');
    } else {
      const n = { square: 4, rect: 2, triangle: 3, circle: 0 }[shape];
      s += `<path d="M${cx + 75},${cy} A75,75 0 0 0 ${R(cx + 75 * Math.cos(-2 * Math.PI / (n || 4)))},${R(cy + 75 * Math.sin(-2 * Math.PI / (n || 4)))}" class="arr acc" marker-end="url(#ah)"/>`;
      s += C(cx, cy, 3, 'dot') + T(cx, 184, n ? `360° / ${n} = ${360 / n}° → samma figur igen` : 'Vilken vinkel som helst', 'lbs mut');
    }
    return svg(320, 192, s, 'Symmetri');
  };
  V.spaceDiag = ({ l = 3, b = 4, h = 12, unit = 'cm', d = '?' } = {}) => {
    const nl = +l || 3, nb = +b || 4, nh = +h || 12, mx = Math.max(nl, nb, nh);
    const cl = v => Math.max(34, 120 * v / mx);
    const L_ = Math.min(cl(nl), 110), B_ = Math.min(cl(nb) * 0.75, 64), H_ = Math.min(cl(nh), 96);
    const o = [96, 168];
    const pt = (x, y, z) => [o[0] + x + y * 0.6, o[1] - z - y * 0.42];
    const c = { A: pt(0, 0, 0), B: pt(L_, 0, 0), Cc: pt(L_, B_, 0), D: pt(0, B_, 0), E: pt(0, 0, H_), F: pt(L_, 0, H_), G: pt(L_, B_, H_), Hh: pt(0, B_, H_) };
    let s = '';
    s += L(...c.A, ...c.D, 'ln dashed thin') + L(...c.D, ...c.Cc, 'ln dashed thin') + L(...c.D, ...c.Hh, 'ln dashed thin');
    s += P([c.A, c.B, c.F, c.E], 'ln fillsoft') + P([c.B, c.Cc, c.G, c.F], 'ln fillsoft2') + P([c.E, c.F, c.G, c.Hh], 'ln fillsoft');
    s += L(...c.A, ...c.Cc, 'ln dashed acc2') + L(...c.A, ...c.G, 'ln hyp');
    s += T((c.A[0] + c.B[0]) / 2, c.A[1] + 18, 'l = ' + lab(l, ' ' + unit), 'lb');
    s += T((c.B[0] + c.Cc[0]) / 2 + 10, (c.B[1] + c.Cc[1]) / 2 + 14, 'b = ' + lab(b, ' ' + unit), 'lb', 'start');
    s += T(c.A[0] - 8, (c.A[1] + c.E[1]) / 2 + 4, 'h = ' + lab(h, ' ' + unit), 'lb', 'end');
    s += T(c.G[0] + 8, c.G[1] - 4, 'd = ' + (isUnk(d) ? '?' : d), 'lb acc', 'start');
    return svg(320, 190, s, 'Rätblock med rymddiagonal');
  };

  /* ===== PROCENT ===== */
  V.pctBar = ({ whole = 60, part = 18, pct = 30, unk = 'pct', unit = '' } = {}) => {
    const W = 320, x0 = 20, w = 280; const p = (isUnk(pct) || pct === '?') ? (part / whole * 100) : +pct;
    let s = arrowDefs;
    s += RECT(x0, 60, w, 34, 'fillsoft', 6);
    s += RECT(x0, 60, Math.max(4, w * Math.min(p, 100) / 100), 34, 'fillacc', 6);
    for (let i = 1; i < 10; i++) s += L(x0 + w * i / 10, 60, x0 + w * i / 10, 94, 'grid');
    const lbl = (k, v) => unk === k ? '?' : v;
    s += T(x0, 48, 'delen', 'lbs mut', 'start') + T(x0 + 4, 82, lbl('part', dec(part) + unit), unk === 'part' ? 'lb acc w' : 'lb w', 'start');
    s += `<text x="${x0 + w}" y="48" class="lbs mut" text-anchor="end">det hela (100 %): <tspan class="${unk === 'whole' ? 'acc' : 'ink'}" style="font-size:14px;font-weight:700">${esc(lbl('whole', dec(whole) + unit))}</tspan></text>`;
    s += T(Math.min(x0 + w - 24, Math.max(x0 + 24, x0 + w * Math.min(p, 100) / 100)), 120, 'andelen ' + lbl('pct', dec(R(p, 2)) + ' %'), unk === 'pct' ? 'lb acc' : 'lb', 'middle');
    s += T(160, 150, 'delen = andelen · det hela', 'lbs mut');
    return svg(W, 158, s, 'Procentstapel: delen, andelen, det hela');
  };
  V.change = ({ start = 500, pct = 8, dir = 1, unit = '' } = {}) => {
    const W = 320, x0 = 20, base = 200; const f = 1 + dir * pct / 100;
    let s = '';
    s += T(x0, 34, 'före = 100 %', 'lbs mut', 'start');
    s += RECT(x0, 42, base, 24, 'fillsoft', 5) + T(x0 + base - 6, 59, dec(start) + unit, 'lb', 'end');
    s += T(x0, 98, `efter = ${dec(R(100 + dir * pct, 3))} %`, 'lbs mut', 'start');
    s += RECT(x0, 106, base * f, 24, 'fillacc', 5) + T(x0 + base * f - 6, 123, '?', 'lb w', 'end');
    if (dir > 0) s += RECT(x0 + base, 106, base * (f - 1), 24, 'fillacc2', 0);
    else s += RECT(x0 + base * f, 106, base * (1 - f), 24, 'ghost', 0);
    s += T(x0 + base * Math.max(1, f) + 10, 123, `${dir > 0 ? '+' : '−'}${dec(pct)} %`, 'lbs acc', 'start');
    s += T(300, 82, `faktor ${dec(R(f, 4))}`, 'lb acc', 'end');
    s += T(160, 158, `nytt = gammalt · ${dec(R(f, 4))}`, 'lbs mut');
    return svg(W, 166, s, 'Förändringsfaktor');
  };
  V.repeat = ({ start = 2000, f = 1.05, n = 2 } = {}) => {
    const W = 320; let s = arrowDefs; const steps = Math.min(n, 3);
    const xs = Array.from({ length: steps + 1 }, (_, i) => 40 + i * (240 / steps));
    xs.forEach((x, i) => { s += RECT(x - 30, 60, 60, 34, i === 0 ? 'fillsoft' : 'fillacc', 7) + T(x, 82, i === 0 ? dec(start) : i === steps ? '?' : '…', i === 0 ? 'lb' : 'lb w'); });
    for (let i = 0; i < steps; i++) { s += CURVE(xs[i] + 10, 58, xs[i + 1] - 10, 58, 22, 'arr acc'); s += T((xs[i] + xs[i + 1]) / 2, 30, '· ' + dec(f), 'lbs acc'); }
    s += T(160, 124, `${dec(start)} · ${dec(f)}${sup(n)}`, 'lb');
    s += T(160, 146, `samma faktor ${n} gånger → upphöjt till ${n}`, 'lbs mut');
    return svg(W, 154, s, 'Upprepad förändring');
  };
  V.pp = ({ from = 42, to = 55 } = {}) => {
    const W = 320, y0 = 150, hS = 104 / Math.max(from, to, 1); let s = '';
    s += L(40, y0, 280, y0, 'ln thin');
    s += RECT(80, y0 - from * hS, 60, from * hS, 'fillsoft', 4) + T(110, y0 - from * hS - 8, from + ' %', 'lb');
    s += RECT(180, y0 - to * hS, 60, to * hS, 'fillacc', 4) + T(210, y0 - to * hS - 8, to + ' %', 'lb');
    const top = Math.max(from, to) * hS, bot = Math.min(from, to) * hS;
    s += L(250, y0 - bot, 268, y0 - bot, 'ln dashed thin') + L(250, y0 - top, 268, y0 - top, 'ln dashed thin') + L(262, y0 - top, 262, y0 - bot, 'ln acc');
    s += T(110, y0 + 16, 'före', 'lbs mut') + T(210, y0 + 16, 'efter', 'lbs mut');
    s += T(160, 18, `skillnad = ${Math.abs(to - from)} procentenheter`, 'lb acc');
    return svg(W, 172, s, 'Procentenheter: skillnaden mellan två procentsatser');
  };

  /* ===== BRÅK, DECIMALTAL, NEGATIVA ===== */
  const fracBar = (x, y, w, n, d, cls = 'fillacc', h = 26) => {
    let s = ''; for (let i = 0; i < d; i++) s += RECT(x + i * w / d, y, w / d, h, i < n ? cls : 'fillsoft');
    return s;
  };
  V.fracCompare = ({ a = [2, 3], b = [3, 5], la, lb_ } = {}) => {
    let s = ''; const w = 240, x0 = 50;
    const val = f => (Array.isArray(f) ? f[0] / f[1] : f);
    const draw = (f, y, label) => {
      if (Array.isArray(f)) s += fracBar(x0, y, w, f[0], f[1]);
      else { s += RECT(x0, y, w, 26, 'fillsoft'); s += RECT(x0, y, w * f, 26, 'fillacc'); for (let i = 1; i < 10; i++) s += L(x0 + w * i / 10, y, x0 + w * i / 10, y + 26, 'grid'); }
      s += T(x0 - 8, y + 18, label, 'lb', 'end');
    };
    draw(a, 34, la || (Array.isArray(a) ? `${a[0]}/${a[1]}` : dec(a))); draw(b, 84, lb_ || (Array.isArray(b) ? `${b[0]}/${b[1]}` : dec(b)));
    s += L(x0 + w * val(a), 26, x0 + w * val(a), 120, 'ln dashed acc');
    s += T(160, 140, 'Samma helhet → jämför längden', 'lbs mut');
    return svg(320, 148, s, 'Jämför två tal på samma helhet');
  };
  V.fracAdd = ({ a = [1, 4], b = [1, 2], op = '+' } = {}) => {
    const lcm = (x, y) => { const g = (p, q) => (q ? g(q, p % q) : p); return x * y / g(x, y); };
    const D = lcm(a[1], b[1]); const na = a[0] * D / a[1], nb = b[0] * D / b[1];
    const w = 240, x0 = 60; let s = '';
    s += fracBar(x0, 18, w, a[0], a[1]) + T(x0 - 8, 36, `${a[0]}/${a[1]}`, 'lb', 'end');
    s += fracBar(x0, 54, w, b[0], b[1], 'fillacc2') + T(x0 - 8, 72, `${b[0]}/${b[1]}`, 'lb', 'end');
    s += T(160, 104, `gemensam nämnare ${D}: ${na}/${D} ${op === '+' ? '+' : '−'} ${nb}/${D}`, 'lbs acc');
    // result bar
    for (let i = 0; i < D; i++) {
      let cls = 'fillsoft';
      if (op === '+') cls = i < na ? 'fillacc' : i < na + nb ? 'fillacc2' : 'fillsoft';
      else cls = i < na - nb ? 'fillacc' : i < na ? 'ghost' : 'fillsoft';
      s += RECT(x0 + i * w / D, 116, w / D, 26, cls);
    }
    s += T(x0 - 8, 134, '=', 'lb', 'end');
    return svg(320, 156, s, 'Bråk med gemensam nämnare');
  };
  V.fracMul = ({ a = [3, 4], b = [2, 5] } = {}) => {
    const x0 = 80, y0 = 20, w = 160, h = 120; let s = '';
    for (let i = 0; i < a[1]; i++) for (let j = 0; j < b[1]; j++) {
      const inA = i < a[0], inB = j < b[0];
      s += RECT(x0 + i * w / a[1], y0 + j * h / b[1], w / a[1], h / b[1], inA && inB ? 'fillacc' : inA || inB ? 'fillsoft2' : 'fillsoft');
    }
    s += T(x0 + w / 2, y0 + h + 18, `${a[0]}/${a[1]} av bredden`, 'lbs');
    s += T(x0 - 8, y0 + h / 2, `${b[0]}/${b[1]}`, 'lbs', 'end');
    s += T(160, 178, `överlapp: ${a[0] * b[0]} av ${a[1] * b[1]} rutor = ${a[0] * b[0]}/${a[1] * b[1]}`, 'lbs acc');
    return svg(320, 186, s, 'Areamodell för bråkmultiplikation');
  };
  V.fracDiv = ({ a = [3, 4], b = [1, 2] } = {}) => {
    const x0 = 30, w = 260; let s = '';
    s += fracBar(x0, 30, w, a[0], a[1]) + T(x0, 22, `${a[0]}/${a[1]}`, 'lbs', 'start');
    const q = (a[0] / a[1]) / (b[0] / b[1]); const piece = w * b[0] / b[1];
    for (let i = 0; i < Math.ceil(q - 1e-9); i++) {
      const ww = Math.min(piece, w * a[0] / a[1] - i * piece);
      s += RECT(x0 + i * piece, 78, ww, 22, 'fillacc2', 0) + T(x0 + i * piece + ww / 2, 94, i + 1 <= q + 1e-9 ? `${i + 1}` : 'del', 'lbs');
    }
    s += T(160, 128, `Hur många ${b[0]}/${b[1]} får plats i ${a[0]}/${a[1]}?  ${Number.isInteger(R(q, 6)) || R(q, 2) === R(q, 6) ? dec(R(q, 2)) : '≈ ' + dec(R(q, 2))}`, 'lbs acc');
    s += T(160, 148, 'Dividera = multiplicera med det inverterade talet', 'lbs mut');
    return svg(320, 156, s, 'Division med bråk: hur många får plats');
  };
  V.decimal = ({ n = '4,75' } = {}) => {
    const [i, f = ''] = String(n).split(','); const cols = ['tiotal', 'ental', 'tiondel', 'hundradel', 'tusendel'];
    const digs = [i.length > 1 ? i[i.length - 2] : '', i[i.length - 1], f[0] || '', f[1] || '', f[2] || ''];
    let s = ''; const cw = 58, x0 = 15;
    cols.forEach((c, k) => { s += RECT(x0 + k * cw, 40, cw - 4, 50, k < 2 ? 'fillsoft' : 'fillsoft2', 6) + T(x0 + k * cw + cw / 2 - 2, 74, digs[k], 'lb big') + T(x0 + k * cw + cw / 2 - 2, 108, c, 'lbx mut'); });
    s += C(x0 + 2 * cw - 2, 88, 3.5, 'dot acc');
    s += T(160, 26, 'Decimaltecknet skiljer hela från delar', 'lbs acc');
    return svg(320, 120, s, 'Positionssystem för decimaltal');
  };
  V.numline = ({ start = -7, move = 12, from = -10, to = 10 } = {}) => {
    const x0 = 20, w = 280, step = w / (to - from); const X = v => x0 + (v - from) * step; let s = arrowDefs;
    s += L(x0, 100, x0 + w, 100);
    for (let v = from; v <= to; v++) { s += L(X(v), 95, X(v), 105, v === 0 ? 'ln' : 'ln thin'); if ((v % 5 === 0 && Math.abs(v - start) > 1 && Math.abs(v - start - move) > 1) || v === start || v === start + move) s += T(X(v), 124, v < 0 ? '−' + (-v) : v, v === 0 ? 'lbs' : 'lbs mut'); }
    s += C(X(start), 100, 5, 'dot');
    if (move) { s += CURVE(X(start), 90, X(start + move), 90, 40, 'arr acc'); s += T((X(start) + X(start + move)) / 2, 40, (move > 0 ? '+' : '−') + Math.abs(move), 'lb acc'); s += C(X(start + move), 100, 5, 'dot acc'); }
    s += T(x0, 146, '← mindre', 'lbs mut', 'start') + T(x0 + w, 146, 'större →', 'lbs mut', 'end');
    return svg(320, 154, s, 'Tallinje');
  };
  V.signs = () => {
    let s = '';
    const rows = [['+ · +', '+'], ['− · −', '+'], ['+ · −', '−'], ['− · +', '−']];
    rows.forEach(([a, b], i) => { s += RECT(60, 20 + i * 34, 200, 28, i < 2 ? 'fillsoft' : 'fillsoft2', 6) + T(110, 39 + i * 34, a, 'lb') + T(170, 39 + i * 34, '→', 'lbs mut') + T(220, 39 + i * 34, b, 'lb big acc'); });
    s += T(160, 166, 'Lika tecken ger plus · olika tecken ger minus', 'lbs mut');
    return svg(320, 174, s, 'Teckenregler');
  };

  /* ===== ENHETER, OMKRETS, AREA ===== */
  V.units = ({ dim = 1, from = 'm', to = 'cm' } = {}) => {
    const base = ['m', 'dm', 'cm', 'mm'];
    const sfx = dim === 1 ? '' : dim === 2 ? '²' : '³';
    const names = base.map(u => u + sfx);
    const factor = dim === 1 ? '10' : dim === 2 ? '100' : '1000';
    const norm = u => String(u).replace('^2', '²').replace('^3', '³');
    const fi = names.indexOf(norm(from)), ti = names.indexOf(norm(to));
    let s = arrowDefs; const bw = 58, gap = 22, x0 = (320 - (4 * bw + 3 * gap)) / 2;
    names.forEach((n, i) => {
      const x = x0 + i * (bw + gap), act = i === fi || i === ti;
      s += RECT(x, 54, bw, 36, act ? 'box hl' : 'box', 8) + T(x + bw / 2, 77, n, act ? 'lb acc' : 'lb');
      if (i < 3) { const between = (fi >= 0 && ti >= 0) && i >= Math.min(fi, ti) && i < Math.max(fi, ti); s += T(x + bw + gap / 2, 108, '·' + factor, between ? 'lbs acc' : 'lbs mut'); }
    });
    if (fi >= 0 && ti >= 0 && fi !== ti) {
      const steps = Math.abs(ti - fi), tot = Math.pow(+factor, steps), xa = x0 + fi * (bw + gap) + bw / 2, xb = x0 + ti * (bw + gap) + bw / 2;
      s += CURVE(xa, 50, xb, 50, 24, 'arr acc');
      s += T(160, 134, `${steps} steg · ${factor} per steg → ${ti > fi ? '×' : '÷'} ${String(tot).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`, 'lb acc');
    }
    const gx = 40, gy = 160;
    if (dim === 1) s += L(gx, gy, gx + 26, gy, 'ln acc') + T(gx + 36, gy + 4, '1 dimension → 10 per steg', 'lbs mut', 'start');
    if (dim === 2) s += RECT(gx + 4, gy - 9, 18, 18, 'fillacc') + T(gx + 36, gy + 4, '2 dimensioner → 10 · 10 = 100 per steg', 'lbs mut', 'start');
    if (dim === 3) s += P([iso(0, 0, 1, gx + 13, gy + 8, 11), iso(1, 0, 1, gx + 13, gy + 8, 11), iso(1, 1, 1, gx + 13, gy + 8, 11), iso(0, 1, 1, gx + 13, gy + 8, 11)], 'fillacc') + T(gx + 36, gy + 4, '3 dim. → 10 · 10 · 10 = 1000 per steg', 'lbs mut', 'start');
    if (dim === 3) s += T(160, 184, '1 dm³ = 1 liter', 'lbs acc');
    return svg(320, dim === 3 ? 192 : 174, s, 'Enhetstrappa');
  };
  V.perim = ({ shape = 'rect', w = 9, h = 4, sides = [6, 8, 11], unit = 'cm', side } = {}) => {
    let s = '';
    if (shape === 'rect' || shape === 'square') {
      const ww = shape === 'square' ? 104 : 180, hh = shape === 'square' ? 104 : Math.max(50, Math.min(110, 180 * h / w));
      const x = 160 - ww / 2, y = 16 + (124 - hh) / 2;
      s += RECT(x, y, ww, hh, 'ln fillsoft') + RECT(x - 6, y - 6, ww + 12, hh + 12, 'ln dashed acc thin', 4);
      s += T(160, y + hh + 22, dec(shape === 'square' ? side : w) + ' ' + unit, 'lb') + T(x - 12, y + hh / 2 + 5, dec(shape === 'square' ? side : h) + ' ' + unit, 'lb', 'end');
      s += T(x + ww + 12, y + hh / 2 + 5, shape === 'square' ? '' : h + ' ' + unit, 'lbs mut', 'start') + T(160, y - 12, shape === 'square' ? '' : w + ' ' + unit, 'lbs mut');
    } else {
      const [a, b, c] = sides; const cx = (a * a + c * c - b * b) / (2 * a); const cy = Math.sqrt(Math.max(1, c * c - cx * cx));
      const pts = fitPts([[0, 0], [a, 0], [cx, -cy]], 70, 20, 180, 110);
      s += P(pts, 'ln fillsoft');
      s += T((pts[0][0] + pts[1][0]) / 2, pts[0][1] + 20, a + ' ' + unit, 'lb');
      s += T((pts[1][0] + pts[2][0]) / 2 + 10, (pts[1][1] + pts[2][1]) / 2, b + ' ' + unit, 'lb', 'start');
      s += T((pts[0][0] + pts[2][0]) / 2 - 10, (pts[0][1] + pts[2][1]) / 2, c + ' ' + unit, 'lb', 'end');
    }
    s += T(160, 176, 'Omkrets = gå runt kanten och addera alla sidor', 'lbs mut');
    return svg(320, 184, s, 'Omkrets runt en figur');
  };
  V.area = ({ shape = 'rect', b = 12, h = 7, unit = 'cm', A } = {}) => {
    let s = ''; const hn = isUnk(h) ? b * 0.6 : +h, bn = isUnk(b) ? 10 : +b; const bb = 180, hh = Math.max(50, Math.min(110, 180 * hn / bn)); const x = 70, y = 140 - hh;
    if (shape === 'rect') {
      s += RECT(x, y, bb, hh, 'fillacc'); const nx = Math.min(bn, 14), ny = Math.min(hn, 10);
      for (let i = 1; i < nx; i++) s += L(x + i * bb / nx, y, x + i * bb / nx, y + hh, 'grid w');
      for (let j = 1; j < ny; j++) s += L(x, y + j * hh / ny, x + bb, y + j * hh / ny, 'grid w');
      s += RECT(x, y, bb, hh, 'ln');
    }
    if (shape === 'tri') {
      const apex = x + bb * 0.35;
      s += RECT(x, y, bb, hh, 'ghost') + P([[x, y + hh], [x + bb, y + hh], [apex, y]], 'ln fillacc');
      s += L(apex, y, apex, y + hh, 'ln dashed') + rightMark([apex, y + hh], [apex, y], [x + bb, y + hh], 9);
      s += T(160, 176, 'Triangeln är halva rektangeln → b · h / 2', 'lbs mut');
    }
    if (shape === 'para') {
      const off = 40;
      s += P([[x, y + hh], [x + bb - off, y + hh], [x + bb, y], [x + off, y]], 'ln fillacc');
      s += L(x + off, y, x + off, y + hh, 'ln dashed') + rightMark([x + off, y + hh], [x + off, y], [x + bb, y + hh], 9);
      s += P([[x, y + hh], [x + off, y + hh], [x + off, y]], 'ghost');
      s += T(160, 176, 'Flytta den sneda biten → en rektangel b · h', 'lbs mut');
    }
    s += T(x + bb / 2, y + hh + 18, 'b = ' + lab(b, isUnk(b) ? '' : ' ' + unit), isUnk(b) ? 'lb acc' : 'lb');
    s += T((shape === 'rect' ? x : shape === 'tri' ? x + bb * 0.35 : x + 40) - 8, y + hh / 2 + 4, 'h = ' + lab(h, isUnk(h) ? '' : ' ' + unit), isUnk(h) ? 'lb acc' : 'lb', 'end');
    if (shape === 'rect') s += T(160, 176, `${b} rutor i varje rad · ${h} rader`, 'lbs mut');
    return svg(320, 184, s, 'Area');
  };
  V.circle = ({ r, d, show = 'r', unk, unit = 'cm', A, O } = {}) => {
    const cx = 96, cy = 90, rr = 62; let s = '';
    if (show === 'A') s += C(cx, cy, rr, 'ln fillacc'); else s += C(cx, cy, rr, show === 'O' ? 'ln circ' : 'ln fillsoft');
    s += C(cx, cy, 2.5, 'dot');
    if (d != null) { s += L(cx - rr, cy, cx + rr, cy, 'ln acc2') + T(cx, cy - 8, 'd = ' + lab(d, isUnk(d) ? '' : ' ' + unit), isUnk(d) ? 'lb acc' : 'lb'); }
    else { s += L(cx, cy, cx + rr * 0.8, cy - rr * 0.6, 'ln acc2') + T(cx + rr * 0.5, cy - rr * 0.42 - 6, 'r = ' + lab(r, isUnk(r) ? '' : ' ' + unit), isUnk(r) ? 'lb acc' : 'lb', 'end'); }
    const right = 178;
    if (show === 'O') s += T(right, 70, 'Omkrets = varvet runt', 'lbs mut', 'start') + T(right, 92, O != null ? 'O = ' + dec(O) : 'O = ?', isUnk(O) || O == null ? 'lb acc' : 'lb', 'start');
    if (show === 'A') s += T(right, 70, 'Area = hela ytan', 'lbs mut', 'start') + T(right, 92, A != null ? 'A = ' + dec(A) : 'A = ?', A == null || isUnk(A) ? 'lb acc' : 'lb', 'start');
    if (show === 'r' || show === 'd') s += T(right, 70, 'd = 2 · r', 'lb', 'start') + T(right, 92, 'r = d / 2', 'lb', 'start');
    s += T(right, 124, d != null ? 'Diameter: hela vägen' : 'Radie: mitten → kanten', 'lbs mut', 'start');
    s += T(right, 140, d != null ? 'genom mitten' : '', 'lbs mut', 'start');
    return svg(320, 168, s, 'Cirkel');
  };
  V.sector = ({ v = 90, r = 6, show = 'area', unit = 'cm' } = {}) => {
    const cx = 110, cy = 92, rr = 66; let s = C(cx, cy, rr, 'ln fillsoft');
    const a2 = -v * Math.PI / 180; const p2 = [cx + rr * Math.cos(a2), cy + rr * Math.sin(a2)];
    const large = v > 180 ? 1 : 0;
    if (show === 'area') s += `<path d="M${cx},${cy} L${cx + rr},${cy} A${rr},${rr} 0 ${large} 0 ${R(p2[0])},${R(p2[1])} Z" class="ln fillacc"/>`;
    else s += L(cx, cy, cx + rr, cy, 'ln') + L(cx, cy, p2[0], p2[1], 'ln') + `<path d="M${cx + rr},${cy} A${rr},${rr} 0 ${large} 0 ${R(p2[0])},${R(p2[1])}" class="ln circ"/>`;
    s += `<path d="M${cx + 20},${cy} A20,20 0 ${large} 0 ${R(cx + 20 * Math.cos(a2))},${R(cy + 20 * Math.sin(a2))}" class="arcm"/>`;
    s += T(cx + 30 * Math.cos(a2 / 2), cy + 30 * Math.sin(a2 / 2) + 4, v + '°', 'lbs acc');
    s += T(cx + rr / 2, cy + 16, 'r = ' + lab(r, ' ' + unit), 'lbs');
    s += T(200, 70, `andel = ${v}/360`, 'lb acc', 'start') + T(200, 94, show === 'area' ? '· hela arean πr²' : '· hela omkretsen 2πr', 'lbs', 'start');
    return svg(320, 168, s, 'Cirkelsektor');
  };

  /* ===== RYMDGEOMETRI ===== */
  V.cuboid = ({ l = 8, b = 3, h = 2, unit = 'cm', cube = false } = {}) => {
    const mx = Math.max(+l, +b, +h) || 1; const cl = v => Math.max(28, 110 * v / mx);
    const L_ = cl(+l) * 1.1, B_ = cl(+b) * 0.7, H_ = Math.min(cl(+h), 100);
    const o = [cube ? 100 : 84, 156]; const pt = (x, y, z) => [o[0] + x + y * 0.6, o[1] - z - y * 0.42];
    const A = pt(0, 0, 0), B = pt(L_, 0, 0), Cc = pt(L_, B_, 0), E = pt(0, 0, H_), F = pt(L_, 0, H_), G = pt(L_, B_, H_), Hh = pt(0, B_, H_);
    let s = P([A, B, F, E], 'ln fillsoft') + P([B, Cc, G, F], 'ln fillsoft2') + P([E, F, G, Hh], 'ln fillacc');
    s += T((A[0] + B[0]) / 2, A[1] + 18, (cube ? 's = ' : 'l = ') + dec(l) + ' ' + unit, 'lb');
    if (!cube) s += T((B[0] + Cc[0]) / 2 + 10, (B[1] + Cc[1]) / 2 + 14, 'b = ' + dec(b) + ' ' + unit, 'lb', 'start');
    if (!cube) s += T(A[0] - 8, (A[1] + E[1]) / 2 + 4, 'h = ' + dec(h) + ' ' + unit, 'lb', 'end');
    s += T(160, 196, cube ? 'V = s · s · s = s³' : 'V = basytan · höjden = l · b · h', 'lbs mut');
    return svg(320, 204, s, 'Rätblock');
  };
  V.cylinder = ({ r = 2, h = 10, d, unit = 'cm' } = {}) => {
    const cx = 130, rx = 60, ry = 16, top = 40, bot = 150; let s = '';
    s += `<path d="M${cx - rx},${top} L${cx - rx},${bot} A${rx},${ry} 0 0 0 ${cx + rx},${bot} L${cx + rx},${top}" class="ln fillsoft2"/>`;
    s += `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" class="ln fillacc"/>`;
    s += `<path d="M${cx - rx},${bot} A${rx},${ry} 0 0 1 ${cx + rx},${bot}" class="ln dashed thin"/>`;
    if (d != null) s += L(cx - rx, top, cx + rx, top, 'ln acc2') + T(cx, top - 22, 'd = ' + dec(d) + ' ' + unit, 'lb');
    else s += L(cx, top, cx + rx, top, 'ln acc2') + T(cx + rx / 2, top - 22, 'r = ' + dec(r) + ' ' + unit, 'lb');
    s += L(cx + rx + 14, top, cx + rx + 14, bot, 'ln thin') + T(cx + rx + 22, (top + bot) / 2, 'h = ' + dec(h) + ' ' + unit, 'lb', 'start');
    s += T(160, 190, 'V = bottenytan (cirkel πr²) · höjden', 'lbs mut');
    return svg(320, 198, s, 'Cylinder');
  };
  V.pyramid = ({ s: side, B, h = 6, unit = 'cm' } = {}) => {
    const o = [80, 156], w = 150, dp = 60; const pt = (x, y, z) => [o[0] + x + y * 0.6, o[1] - z - y * 0.4];
    const A = pt(0, 0, 0), Bp = pt(w, 0, 0), Cc = pt(w, dp, 0), D = pt(0, dp, 0), Tp = pt(w / 2, dp / 2, 130), Fm = pt(w / 2, dp / 2, 0);
    let s = P([A, Bp, Cc, D], 'ln fillacc') + L(...D, ...Tp, 'ln dashed thin') + L(...Cc, ...Tp) + P([A, Bp, Tp], 'ln fillsoft') + P([Bp, Cc, Tp], 'ln fillsoft2');
    s += L(...Tp, ...Fm, 'ln dashed acc') + T(Fm[0] + 6, (Tp[1] + Fm[1]) / 2, 'h = ' + dec(h) + ' ' + unit, 'lb acc', 'start');
    s += T((A[0] + Bp[0]) / 2, A[1] + 18, side != null ? 'sida ' + dec(side) + ' ' + unit : 'basarea B = ' + dec(B) + ' ' + unit + '²', 'lb');
    s += T(160, 192, 'V = B · h / 3  (en tredjedel av ett prisma)', 'lbs mut');
    return svg(320, 200, s, 'Pyramid');
  };
  V.cone = ({ r = 3, h = 10, d, B, unit = 'cm' } = {}) => {
    const cx = 130, rx = 64, ry = 16, apexY = 26, bot = 150; let s = '';
    s += `<path d="M${cx - rx},${bot} L${cx},${apexY} L${cx + rx},${bot} A${rx},${ry} 0 0 1 ${cx - rx},${bot}" class="ln fillsoft2"/>`;
    s += `<path d="M${cx - rx},${bot} A${rx},${ry} 0 0 1 ${cx + rx},${bot}" class="ln dashed thin"/>`;
    s += `<ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" class="fillacc o5"/>`;
    s += L(cx, apexY, cx, bot, 'ln dashed acc') + T(cx + 6, 95, 'h = ' + dec(h) + ' ' + unit, 'lb acc', 'start');
    if (B != null) s += T(cx, bot + 34, 'basarea B = ' + dec(B) + ' ' + unit + '²', 'lb');
    else if (d != null) s += L(cx - rx, bot, cx + rx, bot, 'ln acc2') + T(cx, bot + 34, 'd = ' + dec(d) + ' ' + unit, 'lb');
    else s += L(cx, bot, cx + rx, bot, 'ln acc2') + T(cx + rx / 2, bot + 34, 'r = ' + dec(r) + ' ' + unit, 'lb');
    s += T(160, 208, 'V = πr² · h / 3  (en tredjedel av en cylinder)', 'lbs mut');
    return svg(320, 214, s, 'Kon');
  };
  V.sphere = ({ r = 2, d, unit = 'cm', area = false } = {}) => {
    const cx = 130, cy = 96, rr = 70; let s = C(cx, cy, rr, area ? 'ln fillacc' : 'ln fillsoft2');
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rr}" ry="20" class="ln dashed thin"/>`;
    if (d != null) s += L(cx - rr, cy, cx + rr, cy, 'ln acc2') + T(cx, cy - 8, 'd = ' + dec(d) + ' ' + unit, 'lb');
    else s += L(cx, cy, cx + rr, cy, 'ln acc2') + T(cx + rr / 2, cy - 8, 'r = ' + dec(r) + ' ' + unit, 'lb');
    s += T(218, 80, area ? 'A = 4πr²' : 'V = 4πr³ / 3', 'lb acc', 'start');
    s += T(218, 104, area ? '(ytan, i kvadrat)' : '(volym, i kubik)', 'lbs mut', 'start');
    return svg(320, 180, s, 'Klot');
  };
  V.net = ({ kind = 'cube', a = 5, b = 3, c = 4, unit = 'cm' } = {}) => {
    let s = ''; const u = 34; const x0 = 60, y0 = 26;
    const faces = [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]];
    faces.forEach(([i, j], k) => s += RECT(x0 + i * u, y0 + j * u, u, u, k % 2 ? 'ln fillsoft' : 'ln fillacc'));
    s += T(x0 + 1.5 * u, y0 + 1.6 * u, dec(a) + '²', 'lbs');
    s += T(240, 60, kind === 'cube' ? '6 kvadrater' : '3 par av rektanglar', 'lb acc', 'middle');
    s += T(240, 84, kind === 'cube' ? `A = 6 · ${dec(a)}²` : 'A = 2(ab + ac + bc)', 'lb', 'middle');
    s += T(160, 158, 'Begränsningsyta = summan av alla sidors area', 'lbs mut');
    return svg(320, 166, s, 'Utvikt kub (nät)');
  };
  V.density = ({ people = 45000, area = 90, unk = 'd' } = {}) => {
    let s = ''; const cols = 5, rows = 3, u = 32, x0 = 16, y0 = 30;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      s += RECT(x0 + i * u, y0 + j * u, u, u, i === 0 && j === 0 ? 'ln fillacc' : 'ln fillsoft');
      for (let k = 0; k < 5; k++) s += C(x0 + i * u + 7 + (k % 3) * 10, y0 + j * u + 10 + Math.floor(k / 3) * 12, 2.2, 'dot' + (i === 0 && j === 0 ? ' w' : ''));
    }
    s += T(x0 + cols * u + 14, 50, '1 ruta = 1 km²', 'lbs mut', 'start');
    s += T(x0 + cols * u + 14, 76, 'Hur många bor', 'lb', 'start') + T(x0 + cols * u + 14, 96, 'i EN ruta?', 'lb acc', 'start');
    s += T(160, 160, `${unk === 'p' ? '?' : dec(people)} invånare / ${unk === 'a' ? '?' : dec(area)} km² = ${unk === 'd' ? '?' : ''} inv/km²`, 'lbs');
    return svg(320, 168, s, 'Befolkningstäthet');
  };

  /* ===== ALGEBRA ===== */
  V.tiles = ({ groups = [[4, 'x'], [3, 'x'], [2, '1']] } = {}) => {
    let s = '', x = 14; const yX = 40;
    groups.forEach(([n, t]) => {
      const neg = n < 0; const k = Math.abs(n);
      for (let i = 0; i < k; i++) {
        if (t === 'x') { s += RECT(x, yX, 14, 54, neg ? 'tile neg' : 'tile x', 3); x += 18; }
        else { s += RECT(x, yX + 40, 14, 14, neg ? 'tile neg' : 'tile one', 3); x += 18; }
      }
      x += 12;
    });
    s += T(160, 124, 'lång bit = x · liten ruta = 1', 'lbs mut');
    s += T(160, 22, 'Samla lika sorter: x med x, tal med tal', 'lbs acc');
    return svg(320, 134, s, 'Algebrabrickor');
  };
  V.balance = ({ left = '4x + 7', right = '31', step } = {}) => {
    let s = '';
    s += P([[160, 150], [148, 170], [172, 170]], 'ln fillsoft');
    s += L(160, 150, 160, 70) + L(40, 70, 280, 70);
    s += L(70, 70, 60, 96, 'ln thin') + L(70, 70, 80, 96, 'ln thin') + L(250, 70, 240, 96, 'ln thin') + L(250, 70, 260, 96, 'ln thin');
    s += RECT(20, 96, 110, 34, 'fillacc', 8) + RECT(190, 96, 110, 34, 'fillsoft2', 8);
    s += T(75, 119, left, 'lb w') + T(245, 119, right, 'lb');
    s += T(160, 32, step || 'Gör samma sak på båda sidor → vågen är i balans', 'lbs acc');
    return svg(320, 180, s, 'Ekvation som balansvåg');
  };
  V.tape = ({ parts = ['x', 'x', 'x', 'x', '40'], total = '360' } = {}) => {
    const x0 = 20, w = 280; let s = arrowDefs; const n = parts.length; const xw = w / n;
    parts.forEach((p, i) => s += RECT(x0 + i * xw, 50, xw, 34, p === 'x' ? 'fillacc' : 'fillsoft2') + T(x0 + i * xw + xw / 2, 72, p, p === 'x' ? 'lb w' : 'lb'));
    s += RECT(x0, 50, w, 34, 'ln');
    s += L(x0, 100, x0 + w, 100, 'ln thin') + L(x0, 94, x0, 106, 'ln thin') + L(x0 + w, 94, x0 + w, 106, 'ln thin');
    s += T(160, 122, 'totalt ' + total, 'lb');
    s += T(160, 30, 'Rita det du läser → ekvationen syns', 'lbs acc');
    return svg(320, 136, s, 'Stapelmodell för ekvation');
  };
  V.brackets = ({ before = '7x − (3x + 4)', after = '7x − 3x − 4', sign = '−' } = {}) => {
    let s = arrowDefs;
    s += T(160, 44, before, 'lb big');
    s += ARR(160, 56, 160, 88, 'arr acc');
    s += T(160, 118, after, 'lb big');
    s += T(160, 144, sign === '−' ? 'Minus framför: byt tecken på allt inuti' : 'Plus framför: inget ändras', 'lbs acc');
    return svg(320, 152, s, 'Parentes med tecken framför');
  };
  V.distribute = ({ a = '4', t1 = 'x', t2 = '2', sign = '+' } = {}) => {
    let s = ''; const x0 = 70, y0 = 36, h = 70, w1 = 120, w2 = 70;
    s += RECT(x0, y0, w1, h, 'ln fillacc') + RECT(x0 + w1, y0, w2, h, 'ln fillsoft2');
    s += T(x0 + w1 / 2, y0 - 10, t1, 'lb') + T(x0 + w1 + w2 / 2, y0 - 10, (sign === '−' ? '−' : '') + t2, 'lb') + T(x0 - 10, y0 + h / 2 + 5, a, 'lb', 'end');
    s += T(x0 + w1 / 2, y0 + h / 2 + 5, `${a}·${t1}`, 'lb w') + T(x0 + w1 + w2 / 2, y0 + h / 2 + 5, `${a}·${sign === '−' ? '(−' + t2 + ')' : t2}`, 'lbs');
    s += T(160, 140, 'Multiplicera talet framför med VARJE term i parentesen', 'lbs mut');
    return svg(320, 150, s, 'Areamodell: multiplicera in i parentes');
  };
  V.conjugate = ({ a = 'x', b = '5' } = {}) => {
    let s = ''; const sq = t => (String(t).length > 1 ? `(${t})²` : `${t}²`); const x0 = 40, y0 = 20, A = 120, Bb = 44;
    s += RECT(x0, y0, A, A, 'ln fillacc') + RECT(x0 + A - Bb, y0 + A - Bb, Bb, Bb, 'ln ghost');
    s += T(x0 + A / 2, y0 + A + 18, a, 'lb') + T(x0 + A - Bb / 2, y0 + A - Bb / 2 + 5, b + '²', 'lbs');
    s += T(x0 + (A - Bb) / 2, y0 + (A - Bb) / 2 + 5, sq(a) + ' − ' + b + '²', 'lbs w');
    s += T(236, 60, `(${a} + ${b})(${a} − ${b})`, 'lb', 'middle') + T(236, 86, '=', 'lb') + T(236, 112, `${sq(a)} − ${b}²`, 'lb big acc');
    s += T(160, 176, `Mitten-termerna tar ut varandra: +${b}·${a} − ${b}·${a} = 0`, 'lbs mut');
    return svg(320, 184, s, 'Konjugatregeln');
  };
  V.factor = ({ g = '5', t1 = 'x', t2 = '3', expr = '5x + 15' } = {}) => {
    let s = ''; const x0 = 90, y0 = 46, h = 60, w1 = 100, w2 = 60;
    s += T(160, 24, expr + '  →  vad finns i BÅDA termerna?', 'lbs acc');
    s += RECT(x0, y0, w1, h, 'ln fillacc') + RECT(x0 + w1, y0, w2, h, 'ln fillsoft2');
    s += T(x0 - 10, y0 + h / 2 + 5, g, 'lb acc', 'end') + T(x0 + w1 / 2, y0 + h + 18, t1, 'lb') + T(x0 + w1 + w2 / 2, y0 + h + 18, t2, 'lb');
    s += T(160, 150, /^[−-]/.test(String(t2)) ? `= ${g}(${t1} − ${String(t2).slice(1)})` : `= ${g}(${t1} + ${t2})`, 'lb big');
    return svg(320, 162, s, 'Faktorisering: bryt ut gemensam faktor');
  };

  /* ===== NYA DIAGRAM (rapport 5.1: andragradsekvationer, rötter, parallella linjer m.m.) ===== */
  const gcd_ = (a, b) => (b ? gcd_(b, a % b) : Math.abs(a));
  const bigSq = n => { let best = 1; for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) best = k * k; return best; };
  const fr = (a, b) => { const g = gcd_(a, b) || 1; const n = a / g, d = b / g; return d === 1 ? String(n) : n + '/' + d; };
  /* Kedja av rutor med pilar: [{t:'text', hl:bool, s:'förklaring'}] */
  function chainBoxes(rows, w = 320, note) {
    const bh = 34, gap = 22, x = 40, bw = w - 80; let b = arrowDefs, y = 8;
    rows.forEach((r, i) => {
      b += RECT(x, y, bw, bh, r.hl ? 'box hl' : 'box', 9) + T(w / 2, y + 22, r.t, r.hl ? 'lb big acc' : 'lb big');
      if (i < rows.length - 1) { b += ARR(w / 2, y + bh + 2, w / 2, y + bh + gap - 3); if (r.s) b += T(w / 2 + 10, y + bh + 15, r.s, 'lbs mut', 'start'); }
      y += bh + gap;
    });
    if (note) b += T(w / 2, y + 2, note, 'lbs mut');
    return svg(w, y + (note ? 14 : -6), b, 'Steg för steg');
  }
  V.names = ({ hl } = {}) => {
    const big = [['tusen', 3], ['miljon', 6], ['miljard', 9], ['biljon', 12]], small = [['tusendel', -3], ['miljondel', -6], ['miljarddel', -9], ['biljondel', -12]];
    let b = T(160, 14, 'Stora tal: antal nollor', 'lbs mut');
    big.forEach(([n, e], i) => { const x = 8 + i * 78, a = n === hl; b += RECT(x, 22, 72, 52, a ? 'box hl' : 'box', 8) + T(x + 36, 42, n, a ? 'lb acc' : 'lb') + T(x + 36, 60, '10' + sup(e), a ? 'lb big acc' : 'lb big') ; });
    b += T(160, 96, 'Små tal: antal decimaler', 'lbs mut');
    small.forEach(([n, e], i) => { const x = 8 + i * 78, a = n === hl; b += RECT(x, 104, 72, 52, a ? 'box hl' : 'box', 8) + T(x + 36, 124, n, a ? 'lb acc' : 'lb') + T(x + 36, 142, '10' + sup(e), a ? 'lb big acc' : 'lb big'); });
    return svg(320, 166, b, 'Namn på stora och små tal');
  };
  V.sciMul = ({ a = 3, m = 4, b = 2, n = 3, op = 'mul' } = {}) => {
    const mul = op === 'mul', p = mul ? a * b : a / b, e = mul ? m + n : m - n, o = mul ? '·' : '÷';
    const rows = [{ t: `(${dec(a)}·10${sup(m)}) ${o} (${dec(b)}·10${sup(n)})`, s: 'sortera faktorerna' },
      { t: `(${dec(a)} ${o} ${dec(b)}) · (10${sup(m)} ${o} 10${sup(n)})`, s: mul ? 'exponenterna adderas' : 'exponenterna subtraheras' },
      { t: `${dec(p)} · 10${sup(e)}`, hl: p >= 1 && p < 10 }];
    if (!(p >= 1 && p < 10)) { let q = p, f = e; while (q >= 10) { q /= 10; f++; } while (q < 1) { q *= 10; f--; } rows[2].s = 'talet ska vara 1–10'; rows.push({ t: `${dec(q)} · 10${sup(f)}`, hl: true }); }
    return chainBoxes(rows);
  };
  V.rootsplit = ({ n = 50 } = {}) => {
    const sq = bigSq(n), rest = n / sq, r = Math.sqrt(sq);
    if (sq === 1) return chainBoxes([{ t: `√${n}` }, { t: `${n} har ingen kvadrat som faktor`, hl: true }], 320, 'Då kan roten inte förenklas');
    return chainBoxes([{ t: `√${n}`, s: `skriv ${n} som ${sq} · ${rest}` }, { t: `√(${sq} · ${rest})`, s: 'dela upp i två rötter' }, { t: `√${sq} · √${rest}`, s: `√${sq} = ${r}` }, { t: `${r}√${rest}`, hl: true }]);
  };
  V.rootdiv = ({ a = 72, b = 2 } = {}) => {
    const q = a / b, qs = Number.isInteger(q) ? String(q) : fr(a, b), root = Math.sqrt(q);
    const rt = Number.isInteger(root) ? String(root) : (() => { const [n, d] = qs.split('/').map(Number); return d && Number.isInteger(Math.sqrt(n)) && Number.isInteger(Math.sqrt(d)) ? Math.sqrt(n) + '/' + Math.sqrt(d) : '≈ ' + dec(root); })();
    return chainBoxes([{ t: `√${a} ÷ √${b}`, s: 'samla under en rot' }, { t: `√(${a} ÷ ${b})`, s: `${a} ÷ ${b} = ${qs}` }, { t: `√${qs.includes('/') ? '(' + qs + ')' : qs}`, s: 'ta kvadratroten' }, { t: rt, hl: true }]);
  };
  V.quad = ({ a = 25, r1, r2 } = {}) => {
    const na = typeof a === 'number' ? a : parseFloat(String(a).replace(',', '.'));
    const ox = 160, oy = 120, k = 92; let b = L(20, oy, 300, oy, 'ln thin') + L(ox, 10, ox, 150, 'ln thin');
    const pts = []; for (let u = -100; u <= 100; u += 4) pts.push([ox + u, oy - u * u / k]); b += PL(pts, 'ln acc');
    b += T(300, oy + 14, 'x', 'lbs mut', 'end') + T(ox + 8, 16, 'y', 'lbs mut', 'start');
    b += T(ox + 14, 22, 'y = x²', 'lb acc', 'start');
    if (na > 0) {
      const ly = oy - 56, u = Math.sqrt(56 * k);
      b += L(24, ly, 296, ly, 'ln dashed') + T(26, ly - 6, `y = ${dec(na)}`, 'lb', 'start');
      b += C(ox - u, ly, 4.5, 'dot acc') + C(ox + u, ly, 4.5, 'dot acc');
      b += L(ox - u, ly, ox - u, oy, 'ln thin dashed') + L(ox + u, ly, ox + u, oy, 'ln thin dashed');
      b += T(ox - u, oy + 16, r1 != null ? String(r1) : '?', 'lb acc') + T(ox + u, oy + 16, r2 != null ? String(r2) : '?', 'lb acc');
      b += T(160, 166, 'Linjen skär kurvan två gånger → två lösningar', 'lbs mut');
    } else if (na === 0) {
      b += C(ox, oy, 4.5, 'dot acc') + T(ox + 10, oy + 16, 'x = 0', 'lb acc', 'start') + T(26, oy - 6, 'y = 0', 'lb', 'start');
      b += T(160, 166, 'Linjen rör kurvan en gång → en lösning', 'lbs mut');
    } else {
      const ly = oy + 26; b += L(24, ly, 296, ly, 'ln dashed') + T(26, ly - 6, `y = ${dec(na)}`, 'lb', 'start');
      b += T(160, 166, 'Linjen ligger under kurvan → ingen lösning', 'lbs mut');
    }
    return svg(320, 176, b, 'Parabeln y = x² och en vågrät linje');
  };
  V.parallel = ({ acute = 65, marks = {}, note } = {}) => {
    const th = Math.max(30, Math.min(80, +acute)) * Math.PI / 180, y1 = 54, y2 = 128, dx = (y2 - y1) / Math.tan(th), cx1 = 160 - dx / 2, cx2 = cx1 + dx;
    const u = [Math.cos(th), Math.sin(th)];
    let b = L(20, y1, 288, y1, 'ln') + L(20, y2, 288, y2, 'ln') + L(cx1 - u[0] * 34, y1 - u[1] * 34, cx2 + u[0] * 34, y2 + u[1] * 34, 'ln acc2');
    for (const y of [y1, y2]) b += PL([[276, y - 6], [284, y], [276, y + 6]], 'ln thin');
    const regions = (I, off) => [[off + 1, 'UL'], [off + 2, 'UR'], [off + 3, 'LR'], [off + 4, 'LL']].map(([id, q]) => {
      const mid = q === 'UR' ? (Math.PI - th) / 2 : q === 'UL' ? Math.PI - th / 2 : q === 'LL' ? 1.5 * Math.PI - th / 2 : 2 * Math.PI - th / 2;
      const rays = { right: [I[0] + 40, I[1]], left: [I[0] - 40, I[1]], up: [I[0] - u[0] * 40, I[1] - u[1] * 40], down: [I[0] + u[0] * 40, I[1] + u[1] * 40] };
      const pair = q === 'UR' ? [rays.right, rays.up] : q === 'UL' ? [rays.up, rays.left] : q === 'LL' ? [rays.left, rays.down] : [rays.down, rays.right];
      return { id, mid, pair, I };
    });
    [regions([cx1, y1], 0), regions([cx2, y2], 4)].flat().forEach(r => {
      const mk = marks[r.id]; if (mk == null) return;
      const unk = isUnk(mk), tx = r.I[0] + 31 * Math.cos(r.mid), ty = r.I[1] - 31 * Math.sin(r.mid);
      b += angArc(r.I, r.pair[0], r.pair[1], 14, unk ? 'arcm acc' : 'arcm').d + T(tx, ty + 4, unk ? '?' : mk, unk ? 'lb acc' : 'lb');
    });
    b += T(300, y1 - 10, 'parallella', 'lbs mut', 'end');
    if (note) b += T(160, 168, note, 'lbs mut');
    return svg(320, 176, b, 'Två parallella linjer skurna av en tredje linje');
  };
  V.polygon = ({ n = 6, sum } = {}) => {
    const cx = 160, cy = 80, r = 66; const pts = Array.from({ length: n }, (_, i) => [cx + r * Math.sin(2 * Math.PI * i / n), cy - r * Math.cos(2 * Math.PI * i / n)]);
    let b = P(pts, 'ln fillsoft'); for (let i = 2; i < n - 1; i++) b += L(pts[0][0], pts[0][1], pts[i][0], pts[i][1], 'ln dashed');
    b += T(160, 168, `${n}-hörning → ${n - 2} trianglar → ${n - 2} · 180° = ${isUnk(sum) && sum != null ? '?' : (n - 2) * 180 + '°'}`, 'lbs mut');
    return svg(320, 176, b, `${n}-hörning delad i trianglar`);
  };
  V.isoTri = ({ base = 10, side = 13, h = '?', unit = 'cm' } = {}) => {
    const hv = isUnk(h) ? null : +h, nb = isUnk(base) ? 2 * Math.sqrt(side * side - hv * hv) : +base, hn = isUnk(h) ? Math.sqrt(side * side - nb * nb / 4) : hv;
    const pts = fitPts([[0, 0], [-nb / 2, hn], [nb / 2, hn]], 50, 14, 220, 122); const [A, Bp, Cp] = pts, M = [A[0], Bp[1]];
    let s = P(pts, 'ln fillsoft') + L(A[0], A[1], M[0], M[1], 'ln dashed') + rightMark(M, A, Cp, 9);
    s += T(M[0], Bp[1] + 18, isUnk(base) ? 'bas = ?' : `bas = ${dec(nb)} ${unit}`, isUnk(base) ? 'lb acc' : 'lb') + T(A[0] + 8, A[1] + (M[1] - A[1]) * 0.76, isUnk(h) ? 'h = ?' : `h = ${dec(hn)} ${unit}`, isUnk(h) ? 'lb acc' : 'lb', 'start');
    s += T((A[0] + Cp[0]) / 2 + 12, (A[1] + Cp[1]) / 2 - 2, isUnk(side) ? '?' : dec(side) + ' ' + unit, 'lb', 'start');
    s += T(160, 170, 'Höjden delar triangeln i två räta trianglar', 'lbs mut');
    return svg(320, 178, s, 'Likbent triangel med höjd');
  };
  V.trapezoid = ({ a = 4, b = 10, h = 5, unit = 'cm', A } = {}) => {
    const na = isUnk(a) ? 5 : +a, nb = isUnk(b) ? 11 : +b, nh = isUnk(h) ? 4 : +h, sc = 190 / Math.max(na, nb), hh = Math.max(46, Math.min(96, nh * sc)), x0 = 60, y0 = 24;
    const off = (nb - na) * sc / 2; const bw = nb * sc, tw = na * sc;
    let s = P([[x0, y0 + hh], [x0 + bw, y0 + hh], [x0 + off + tw, y0], [x0 + off, y0]], 'ln fillsoft');
    s += L(x0 + off + tw * 0.25, y0, x0 + off + tw * 0.25, y0 + hh, 'ln dashed') + rightMark([x0 + off + tw * 0.25, y0 + hh], [x0 + off + tw * 0.25, y0], [x0 + bw, y0 + hh], 9);
    s += T(x0 + off + tw / 2, y0 - 6, `a = ${lab(a, ' ' + unit)}`, isUnk(a) ? 'lb acc' : 'lb') + T(x0 + bw / 2, y0 + hh + 18, `b = ${lab(b, ' ' + unit)}`, isUnk(b) ? 'lb acc' : 'lb');
    s += T(x0 + off + tw * 0.25 + 8, y0 + hh / 2 + 4, `h = ${lab(h, ' ' + unit)}`, isUnk(h) ? 'lb acc' : 'lb', 'start');
    s += T(160, y0 + hh + 44, 'A = (a + b) · h / 2', 'lbs mut');
    return svg(320, y0 + hh + 56, s, 'Trapets');
  };
  V.lshape = ({ W = 10, H = 8, w = 4, h = 3, unit = 'cm' } = {}) => {
    const sc = Math.min(190 / W, 110 / H), x0 = 60, y0 = 16, X = W * sc, Y = H * sc, nw = w * sc, nh = h * sc;
    let s = RECT(x0 + X - nw, y0, nw, nh, 'ghost') + P([[x0, y0], [x0 + X - nw, y0], [x0 + X - nw, y0 + nh], [x0 + X, y0 + nh], [x0 + X, y0 + Y], [x0, y0 + Y]], 'ln fillsoft');
    s += T(x0 + (X - nw) / 2, y0 + Y + 18, `${W - w} ${unit}`, 'lb') + T(x0 + X - nw / 2, y0 + nh + 18, `${w} ${unit}`, 'lb');
    s += T(x0 - 8, y0 + Y / 2 + 4, `${H} ${unit}`, 'lb', 'end') + T(x0 + X + 8, y0 + nh / 2 + 4, `${h} ${unit}`, 'lb', 'start');
    s += T(160, 176, 'Dela upp – eller hela minus biten som saknas', 'lbs mut');
    return svg(320, 184, s, 'L-formad figur');
  };
  V.ftree = ({ n = 60 } = {}) => {
    let idx = 0, maxD = 0;
    const build = (m, d) => { maxD = Math.max(maxD, d); let p = 0; for (let k = 2; k * k <= m; k++) if (m % k === 0) { p = k; break; } if (!p) return { v: m, d, leaf: true, x: 28 + 44 * idx++ }; const l = { v: p, d: d + 1, leaf: true, x: 28 + 44 * idx++ }; maxD = Math.max(maxD, d + 1); const r = build(m / p, d + 1); return { v: m, d, kids: [l, r], x: (l.x + r.x) / 2 }; };
    const root = build(n, 0); const H = 40 + maxD * 40; let s = '';
    const lx = []; (function f(nd) { if (nd.leaf) lx.push(nd.x); else nd.kids.forEach(f); })(root);
    const lw = Math.max(320, 56 + idx * 44), shift = lw / 2 - (Math.min(...lx) + Math.max(...lx)) / 2;
    (function f(nd) { nd.x += shift; if (nd.kids) nd.kids.forEach(f); })(root);
    const draw = nd => { if (nd.kids) { nd.kids.forEach(k => { s += L(nd.x, 22 + nd.d * 40 + 12, k.x, 22 + k.d * 40 - 14, 'ln thin'); draw(k); }); } s += C(nd.x, 22 + nd.d * 40, 15, nd.leaf ? 'dot acc' : 'box') ; s += T(nd.x, 22 + nd.d * 40 + 5, nd.v, nd.leaf ? 'lb big w' : 'lb big'); };
    draw(root);
    const leaves = []; (function f(nd) { if (nd.leaf) leaves.push(nd.v); else nd.kids.forEach(f); })(root);
    s += T(lw / 2, H + 22, `${n} = ${leaves.slice().sort((a, b) => a - b).join(' · ')}`, 'lb big acc');
    return svg(lw, H + 34, s, 'Primtalsfaktorisering');
  };
  V.prec = ({ hl = -1 } = {}) => chainBoxes([{ t: '1  Parenteser ( )', hl: hl === 0 }, { t: '2  Potenser  aⁿ', hl: hl === 1 }, { t: '3  Gånger · och delat ÷', s: 'från vänster till höger', hl: hl === 2 }, { t: '4  Plus + och minus −', hl: hl === 3 }].map((r, i, a) => i === 2 ? r : r), 320, 'Börja överst – räkna alltid det viktigaste först');
  V.bigarea = ({ hl } = {}) => {
    let b = arrowDefs;
    b += RECT(14, 12, 84, 56, hl === 'm2' ? 'box hl' : 'box', 9) + T(56, 36, 'm²', 'lb big') + T(56, 56, 'kvadratmeter', 'lbs mut');
    b += RECT(118, 12, 84, 56, hl === 'ha' ? 'box hl' : 'box', 9) + T(160, 36, 'ha', 'lb big') + T(160, 56, 'hektar', 'lbs mut');
    b += RECT(222, 12, 84, 56, hl === 'km2' ? 'box hl' : 'box', 9) + T(264, 36, 'km²', 'lb big') + T(264, 56, 'kvadratkilometer', 'lbs mut');
    b += ARR(100, 40, 116, 40) + ARR(204, 40, 220, 40);
    b += T(108, 28, '', 'lbs') + T(160, 90, '1 ha = 10 000 m²', 'lb acc') + T(160, 110, '(100 m · 100 m)', 'lbs mut') + T(160, 134, '1 km² = 100 ha = 1 000 000 m²', 'lb acc') + T(160, 154, '(1000 m · 1000 m)', 'lbs mut');
    return svg(320, 164, b, 'Stora ytor: m², hektar, km²');
  };

  function render(spec) {
    if (!spec || !spec.t || !V[spec.t]) return '';
    try { return V[spec.t](spec); } catch (e) { console.warn('visual failed', spec, e); return ''; }
  }
  const API = { render, types: Object.keys(V) };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.MOVis = API;
})(typeof window !== 'undefined' ? window : globalThis);
