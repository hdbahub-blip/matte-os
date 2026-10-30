/* Matte OS – liten QR-kodsgenerator (byte-läge, felrättning L, version 1–5 = upp till 106 tecken).
   Räcker för spel-länken. Verifieras i tests/cup-qr.js genom att avkoda med en oberoende läsare (jsQR). */
(function (root) {
  'use strict';
  const CAP = [0, 19, 34, 55, 80, 108], ECC = [0, 7, 10, 15, 20, 26], ALIGN = [0, 0, 18, 22, 26, 30];
  const EXP = new Array(512), LOG = new Array(256);
  (function () { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
  function rsEcc(data, n) {
    let g = [1];
    for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; }
    const res = new Array(n).fill(0);
    for (const b of data) { const f = b ^ res[0]; res.shift(); res.push(0); for (let i = 0; i < n; i++) res[i] ^= mul(g[i + 1], f); }
    return res;
  }
  function utf8(s) { return Array.from(unescape(encodeURIComponent(s)), c => c.charCodeAt(0)); }
  function encode(text) {
    const bytes = utf8(text); let ver = 0;
    for (let v = 1; v <= 5; v++) if (bytes.length <= CAP[v] - 2) { ver = v; break; }
    if (!ver) throw new Error('QR: texten är för lång');
    const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, 8); bytes.forEach(b => put(b, 8));
    for (let i = 0; i < 4 && bits.length < CAP[ver] * 8; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const cw = []; for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let pad = 0xec; cw.length < CAP[ver]; pad ^= 0xec ^ 0x11) cw.push(pad);
    const all = cw.concat(rsEcc(cw, ECC[ver]));
    const size = 17 + 4 * ver;
    const mod = Array.from({ length: size }, () => new Array(size).fill(false)), fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= size || y >= size) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); set(x, y, d !== 2 && d !== 4); } };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    if (ver >= 2) { const c = ALIGN[ver]; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
    const fmt = mask => {
      const data = (1 << 3) | mask; let rem = data; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const b = ((data << 10) | rem) ^ 0x5412, bit = i => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i)); for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
      set(8, size - 8, true);
    };
    fmt(0);
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && i < all.length * 8) { mod[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    const MASK = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const penalty = m => {
      let p = 0;
      for (let pass = 0; pass < 2; pass++) for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { const cur = pass ? m[b][a] : m[a][b], prev = pass ? m[b - 1][a] : m[a][b - 1]; if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
      let dark = 0; for (const row of m) for (const v of row) if (v) dark++;
      p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return p;
    };
    let best = null, bestP = Infinity, bestMask = 0;
    for (let mask = 0; mask < 8; mask++) {
      const m = mod.map(r => r.slice());
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASK[mask](x, y)) m[y][x] = !m[y][x];
      const pen = penalty(m); if (pen < bestP) { bestP = pen; best = m; bestMask = mask; }
    }
    // skriv slutlig formatinfo med vald mask
    const final = best; mod.length = 0; best.forEach(r => mod.push(r)); fmt(bestMask);
    return { size, modules: mod };
  }
  function svg(text, px) {
    const q = encode(text), n = q.size, pad = 4; let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules[y][x]) d += 'M' + (x + pad) + ' ' + (y + pad) + 'h1v1h-1z';
    const t = n + pad * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t + '" width="' + (px || 220) + '" height="' + (px || 220) + '" shape-rendering="crispEdges" role="img" aria-label="QR-kod"><rect width="' + t + '" height="' + t + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  root.MOQr = { encode, svg };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MOQr;
})(typeof window !== 'undefined' ? window : globalThis);
