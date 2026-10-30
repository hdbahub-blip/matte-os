/* Matte OS Cup – klientens autentiseringshuvuden. Verifierar att publishable keys (sb_publishable_…, inte JWT) aldrig skickas som
   Authorization: Bearer, men att gamla JWT-anonnycklar fungerar. Kör mot en lokal gateway-emulator som beter sig som Supabase:
   Authorization måste vara en giltig JWT om den finns, annars 401. OBS: detta är EMULERING; test mot riktigt Supabase kräver godkänt projekt. */
'use strict';
const http = require('http'); const API = require('../js/cup-api.js');
let pass = 0, fail = 0; const bad = []; const ok = (c, m) => { if (c) pass++; else { fail++; bad.push('✗ ' + m); } };
const seen = [];
const srv = http.createServer((req, res) => {
  let b = ''; req.on('data', d => b += d); req.on('end', () => {
    seen.push({ apikey: req.headers.apikey, auth: req.headers.authorization });
    const a = req.headers.authorization; const jwtLike = a && /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/.test(a);
    if (a && !jwtLike) { res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"message":"Invalid JWT"}'); }
    if (!req.headers.apikey) { res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"message":"No API key found in request"}'); }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}');
  });
});
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const url = 'http://127.0.0.1:' + srv.address().port;
  const pub = 'sb_publishable_AbCdEf123456_xYz', jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.c2ln';
  ok(API.authHeaders(pub).authorization === undefined && API.authHeaders(pub).apikey === pub, 'publishable key: bara apikey, ingen Authorization');
  ok(API.authHeaders(jwt).authorization === 'Bearer ' + jwt, 'JWT-anonnyckel: Bearer skickas');
  ok(API.authHeaders('').authorization === undefined, 'tom nyckel: ingen Authorization');
  seen.length = 0; const r1 = await API.client({ url, anonKey: pub })._rpc('cup_state', {}); ok(r1.ok === true && seen[0].auth === undefined, 'publishable key accepteras av gateway-emulatorn');
  const r2 = await API.client({ url, anonKey: jwt })._rpc('cup_state', {}); ok(r2.ok === true && seen[1].auth === 'Bearer ' + jwt, 'JWT-nyckel accepteras av gateway-emulatorn');
  let err = null; try { await API.client({ url, anonKey: '' })._rpc('cup_state', {}); } catch (e) { err = e; } ok(err && err.status === 401, 'utan nyckel nekas (kontrollfall)');
  // kontrollbevis: den gamla koden (alltid Bearer) hade fått 401 på publishable key
  const old = await fetch(url + '/rest/v1/rpc/x', { method: 'POST', headers: { apikey: pub, authorization: 'Bearer ' + pub }, body: '{}' }); ok(old.status === 401, 'kontroll: gamla beteendet (Bearer sb_publishable_) ger 401 i emulatorn');
  srv.close(); console.log(`cup-api-headers: ${pass} PASS, ${fail} FAIL`); if (fail) { console.log(bad.join('\n')); process.exit(1); }
})();
