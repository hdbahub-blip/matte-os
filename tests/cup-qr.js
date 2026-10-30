/* Verifierar den inbyggda QR-generatorn genom avkodning med oberoende läsare (jsQR). */
'use strict';
const path = require('path');
const jsQR = require('jsqr');
const Q = require('../js/qr.js');
let pass = 0, fail = 0;
const samples = ['https://mohamed321966-wq.github.io/matte-os/#/cup/join/ABCDE', 'https://mohamed321966-wq.github.io/matte-os/#/cup/join/Z9K2M', 'HEJ', 'x'.repeat(100), 'https://localhost:8765/#/cup/join/HWF85', 'Åäö 123'];
for (const t of samples) {
  const { size, modules } = Q.encode(t), S = 6, pad = 4, W = (size + pad * 2) * S;
  const img = new Uint8ClampedArray(W * W * 4).fill(255);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) { const o = (((y + pad) * S + dy) * W + (x + pad) * S + dx) * 4; img[o] = img[o + 1] = img[o + 2] = 0; }
  const r = jsQR(img, W, W);
  if (r && r.data === t) pass++; else { fail++; console.log('✗ avkodning fel för', t.slice(0, 40), r && r.data); }
}
try { Q.encode('x'.repeat(120)); fail++; console.log('✗ för lång text borde ge fel'); } catch (e) { pass++; }
console.log(`cup-qr: ${pass} PASS, ${fail} FAIL`); if (fail) process.exit(1);
