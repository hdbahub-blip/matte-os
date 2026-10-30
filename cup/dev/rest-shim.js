/* Utvecklingsshim: efterliknar Supabase/PostgREST "POST /rest/v1/rpc/<fn>" mot en lokal Postgres.
   Kör som rollen "anon" (precis som publik klient) – endast för test. Används INTE i produktion. */
'use strict';
const http = require('http');
const { Pool } = require('pg');
const port = +process.env.PORT || 8787;
const pool = new Pool({ host: process.env.PGHOST || '/tmp/pgdata', port: +(process.env.PGPORT || 5544), user: 'postgres', database: process.env.PGDATABASE || 'cuptest', max: 20 });
const stats = { calls: 0, errors: 0 };
const server = http.createServer(async (req, res) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST,GET,OPTIONS', 'content-type': 'application/json' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (req.url === '/__stats') { res.writeHead(200, cors); return res.end(JSON.stringify(stats)); }
  const m = /^\/rest\/v1\/rpc\/(cup_[a-z_]+)$/.exec(req.url.split('?')[0]);
  if (!m || req.method !== 'POST') { res.writeHead(404, cors); return res.end(JSON.stringify({ message: 'Not found' })); }
  let body = ''; for await (const c of req) { body += c; if (body.length > 20000) break; }
  let args; try { args = JSON.parse(body || '{}'); } catch { res.writeHead(400, cors); return res.end('{"message":"bad json"}'); }
  const keys = Object.keys(args);
  if (!keys.every(k => /^p_[a-z_]+$/.test(k))) { res.writeHead(400, cors); return res.end('{"message":"bad args"}'); }
  const vals = keys.map(k => Array.isArray(args[k]) ? '{' + args[k].join(',') + '}' : args[k]);
  const sql = `select public.${m[1]}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as r`;
  const c = await pool.connect();
  try {
    await c.query('begin'); await c.query('set local role anon');
    const r = await c.query(sql, vals);
    await c.query('commit'); stats.calls++;
    res.writeHead(200, cors); res.end(JSON.stringify(r.rows[0].r));
  } catch (e) {
    await c.query('rollback').catch(() => {}); stats.errors++;
    res.writeHead(e.code === 'P0001' ? 400 : 500, cors); res.end(JSON.stringify({ message: e.message, code: e.code }));
  } finally { c.release(); }
});
server.listen(port, () => console.log('rest shim on ' + port));
