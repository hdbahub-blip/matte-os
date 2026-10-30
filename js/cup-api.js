/* Matte OS Cup – klient mot spelbackend (Supabase RPC). Fungerar i webbläsare och Node.
   Konfig: window.MO_CUP_CONFIG = { url: 'https://<projekt>.supabase.co', anonKey: '<publishable/anon>' }.
   Anon/publishable-nyckeln är avsedd att vara publik; backend skyddar via RPC + hemligheter. Aldrig service_role här. */
(function (root) {
  'use strict';
  const MSG = {
    NO_ROOM: 'Rummet finns inte. Kontrollera koden.', GONE: 'Spelet är avslutat.', NOT_HOST: 'Bara värden kan göra detta.',
    BAD_PLAYER: 'Du känns inte igen i det här spelet. Gå med igen.', KICKED: 'Värden har tagit bort dig från spelet.',
    STARTED: 'Spelet har redan startat.', FULL: 'Spelet är fullt.', BAD_NICK: 'Smeknamnet ska vara 1–16 tecken: bokstäver, siffror, mellanslag, punkt, bindestreck.',
    TOO_FEW: 'Minst två spelare krävs.', LATE: 'Tiden var slut.', EARLY: 'Rundan har inte börjat.', BUSY: 'Servern är upptagen. Försök om en stund.',
    BAD_STATE: 'Det går inte att göra just nu.', OUT_OF_ORDER: 'Fel fråga.', NET: 'Ingen kontakt med spelservern. Kontrollera nätet.'
  };
  function client(cfg) {
    const base = String(cfg.url || '').replace(/\/$/, '') + '/rest/v1/rpc/';
    async function rpc(name, args, opts) {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const t = ctrl ? setTimeout(() => ctrl.abort(), (opts && opts.timeout) || 8000) : null;
      let res;
      try {
        res = await fetch(base + name, {
          method: 'POST', cache: 'no-store', signal: ctrl && ctrl.signal,
          headers: { 'content-type': 'application/json', apikey: cfg.anonKey || '', authorization: 'Bearer ' + (cfg.anonKey || '') },
          body: JSON.stringify(args || {})
        });
      } catch (e) { const er = new Error(MSG.NET); er.code = 'NET'; throw er; } finally { if (t) clearTimeout(t); }
      let body = null; try { body = await res.json(); } catch (e) { /* tomt */ }
      if (!res.ok) {
        const raw = (body && body.message) || ('HTTP ' + res.status);
        const m = /^([A-Z_]+): (.*)$/.exec(raw);
        const er = new Error(m ? (MSG[m[1]] || m[2]) : 'Något gick fel (' + res.status + ').');
        er.code = m ? m[1] : 'HTTP_' + res.status; er.status = res.status; throw er;
      }
      return body;
    }
    return {
      create: (tables, qualQ, secPerQ) => rpc('cup_create', { p_tables: tables, p_qual_q: qualQ, p_sec_per_q: secPerQ }),
      join: (code, nick, device) => rpc('cup_join', { p_code: code, p_nick: nick, p_device: device }),
      ready: (code, pid, secret, ready) => rpc('cup_ready', { p_code: code, p_player: pid, p_secret: secret, p_ready: ready }),
      leave: (code, pid, secret) => rpc('cup_leave', { p_code: code, p_player: pid, p_secret: secret }),
      kick: (code, hs, pid) => rpc('cup_kick', { p_code: code, p_host_secret: hs, p_player: pid }),
      cancel: (code, hs) => rpc('cup_cancel', { p_code: code, p_host_secret: hs }),
      start: (code, hs) => rpc('cup_start', { p_code: code, p_host_secret: hs }),
      endRound: (code, hs) => rpc('cup_end_round', { p_code: code, p_host_secret: hs }),
      next: (code, hs) => rpc('cup_next', { p_code: code, p_host_secret: hs }),
      answer: (code, pid, secret, round, idx, val) => rpc('cup_answer', { p_code: code, p_player: pid, p_secret: secret, p_round: round, p_idx: idx, p_val: val }),
      state: (code, pid, secret, hs) => rpc('cup_state', { p_code: code, p_player: pid || null, p_secret: secret || null, p_host_secret: hs || null }),
      _rpc: rpc
    };
  }
  root.MOCupApi = { client, MSG };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MOCupApi;
})(typeof window !== 'undefined' ? window : globalThis);
