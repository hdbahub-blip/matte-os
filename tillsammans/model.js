/* Matte OS · Guests & Together v1. Non-school, local-only data and sessions.
   IMPORTANT: no reads/writes to matteos.v5, matteos.larande.v1 or Supabase. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MOTogether = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const KEY = 'matteos.guests.v1';
  const SESSION_KEY = 'matteos.together.session.v1';
  const THEMES = Object.freeze({
    emerald: { label: 'Emerald', accent: '#176B50', light: '#E7F3EB', dark: '#10271F' },
    plum: { label: 'Royal Plum', accent: '#70437E', light: '#F3ECF5', dark: '#231829' },
    teal: { label: 'Midnight Teal', accent: '#246D73', light: '#E9F3F3', dark: '#10282C' },
    champagne: { label: 'Champagne', accent: '#876238', light: '#F8F1E6', dark: '#28231D' }
  });
  const THEMENAMES = Object.keys(THEMES);
  const APPEARANCES = ['light', 'dark', 'system'];
  const DEFAULTS = [['Joker One', 'emerald'], ['Joker Two', 'plum'], ['Joker Three', 'teal']];
  const GUEST_LIMIT = 20;
  const MEMBER_LIMIT = 10;
  const VALID_ID = /^[a-zA-Z0-9_-]{8,70}$/;
  const now = () => Date.now();
  const isObject = x => x && typeof x === 'object' && !Array.isArray(x);
  function uid() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (root.crypto && typeof root.crypto.getRandomValues === 'function') root.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  function cleanName(n) {
    return String(n == null ? '' : n).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  }
  function boundedCount(n) { return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 0; }
  function cleanStats(s) {
    const out = {};
    if (!isObject(s)) return out;
    for (const key of ['sv', 'en', 'study', 'math', 'table']) {
      const v = s[key];
      if (!isObject(v)) continue;
      const total = boundedCount(v.total);
      out[key] = { total, correct: Math.min(total, boundedCount(v.correct)) };
    }
    return out;
  }
  function newGuest(name, theme) {
    return { id: uid(), type: 'guest', name: cleanName(name) || 'Gäst',
      theme: THEMES[theme] ? theme : 'emerald', appearance: 'system', stats: {}, createdAt: now() };
  }
  function initial() {
    return { version: 1, activeGuestId: null, guests: DEFAULTS.map(x => newGuest(x[0], x[1])) };
  }
  function sanitize(raw) {
    if (!isObject(raw) || raw.version !== 1 || !Array.isArray(raw.guests)) return initial();
    const result = { version: 1, activeGuestId: null, guests: [] };
    const seen = new Set();
    for (const g of raw.guests.slice(0, GUEST_LIMIT)) {
      if (!isObject(g) || g.type !== 'guest' || typeof g.id !== 'string'
        || !VALID_ID.test(g.id) || seen.has(g.id)) continue;
      seen.add(g.id);
      result.guests.push({
        id: g.id, type: 'guest', name: cleanName(g.name) || 'Gäst',
        theme: THEMES[g.theme] ? g.theme : 'emerald',
        appearance: APPEARANCES.includes(g.appearance) ? g.appearance : 'system',
        stats: cleanStats(g.stats),
        createdAt: Number.isFinite(g.createdAt) ? Math.floor(g.createdAt) : now()
      });
    }
    if (result.guests.some(g => g.id === raw.activeGuestId)) result.activeGuestId = raw.activeGuestId;
    return result;
  }
  let memory = null;
  let storageOk = true;
  function readKey(key) {
    try { return root.localStorage ? root.localStorage.getItem(key) : null; }
    catch (_) { storageOk = false; return null; }
  }
  function writeKey(key, value) {
    try {
      if (!root.localStorage) { storageOk = false; return false; }
      root.localStorage.setItem(key, value);
      storageOk = true;
      return true;
    } catch (_) { storageOk = false; return false; }
  }
  function removeKey(key) {
    try { if (!root.localStorage) return false; root.localStorage.removeItem(key); return true; }
    catch (_) { storageOk = false; return false; }
  }
  function load() {
    if (memory) return memory;
    const raw = readKey(KEY);
    let parsed;
    try { parsed = raw === null ? null : JSON.parse(raw); } catch (_) { parsed = null; }
    memory = sanitize(parsed);
    if (raw === null) writeKey(KEY, JSON.stringify(memory));
    return memory;
  }
  function save() { return writeKey(KEY, JSON.stringify(load())); }
  function status() { return { storageOk, hasLocalStorage: !!root.localStorage }; }
  function addGuest(name) {
    const st = load();
    if (st.guests.length >= GUEST_LIMIT) return null;
    const guest = newGuest(name || 'Joker ' + (st.guests.length + 1), THEMENAMES[st.guests.length % THEMENAMES.length]);
    st.guests.push(guest);
    if (!st.activeGuestId) st.activeGuestId = guest.id;
    save();
    return guest;
  }
  function updateGuest(id, patch) {
    const g = load().guests.find(x => x.id === id);
    if (!g || !isObject(patch)) return false;
    if (Object.prototype.hasOwnProperty.call(patch, 'name')) {
      const n = cleanName(patch.name);
      if (!n) return false;
      g.name = n;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'theme')) {
      if (!THEMES[patch.theme]) return false;
      g.theme = patch.theme;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'appearance')) {
      if (!APPEARANCES.includes(patch.appearance)) return false;
      g.appearance = patch.appearance;
    }
    save(); return true;
  }
  function activate(id) {
    if (!load().guests.some(g => g.id === id)) return false;
    load().activeGuestId = id; save(); return true;
  }
  function deleteGuest(id) {
    const st = load();
    if (!st.guests.some(g => g.id === id)) return false;
    st.guests = st.guests.filter(g => g.id !== id);
    if (st.activeGuestId === id) st.activeGuestId = st.guests[0]?.id || null;
    save();
    const s = restoreSession();
    if (s && s.members.includes(id)) removeKey(SESSION_KEY);
    return true;
  }
  function recordSolo(id, topic, correct) {
    if (!['sv', 'en', 'study', 'math', 'table'].includes(topic)) return false;
    const g = load().guests.find(x => x.id === id);
    if (!g) return false;
    const r = g.stats[topic] || { total: 0, correct: 0 };
    r.total = Math.min(100000, r.total + 1);
    if (correct) r.correct = Math.min(r.total, r.correct + 1);
    g.stats[topic] = r; save(); return true;
  }
  function exportGuests() {
    return JSON.stringify({ app: 'matte-os-guests', v: 1, exported: new Date().toISOString(), state: load() }, null, 2);
  }
  function importGuests(text) {
    let obj;
    if (typeof text !== 'string' || text.length > 250000) return { ok: false, message: 'Filen är för stor eller felaktig.' };
    try { obj = JSON.parse(text); } catch (_) { return { ok: false, message: 'Filen är inte giltig JSON.' }; }
    if (!isObject(obj) || obj.app !== 'matte-os-guests' || obj.v !== 1
      || !isObject(obj.state) || obj.state.version !== 1 || !Array.isArray(obj.state.guests))
      return { ok: false, message: 'Det här är inte en Matte OS-gästsäkerhetskopia.' };
    const next = sanitize(obj.state), old = load();
    memory = next;
    if (!save()) { memory = old; return { ok: false, message: 'Kunde inte lagra kopian. Ingenting ersattes.' }; }
    removeKey(SESSION_KEY);
    return { ok: true, message: 'Gästprofiler återställda. Skolprofiler har inte ändrats.' };
  }
  const allowedMember = id => id === 'grade8' || id === 'grade9' || load().guests.some(g => g.id === id);
  function startSession(members, contentRef, questionCount) {
    if (!Array.isArray(members) || members.length < 1 || members.length > MEMBER_LIMIT
      || new Set(members).size !== members.length || !members.every(allowedMember)
      || typeof contentRef !== 'string' || !/^(sv|en|study|math|table):[a-zA-Z0-9_-]{1,64}(:v[0-9]{1,3})?$/.test(contentRef)
      || !Number.isInteger(questionCount) || questionCount < 1 || questionCount > 30) return null;
    const session = { v: 1, id: uid(), mode: 'same-device',
      contentRef, members: members.slice(), count: questionCount, round: 0, turn: 0,
      phase: 'handoff', answers: [], scores: Object.fromEntries(members.map(id => [id, 0])),
      createdAt: now(), updatedAt: now() };
    if (!writeKey(SESSION_KEY, JSON.stringify(session))) return null;
    return session;
  }
  function validSession(s) {
    return isObject(s) && s.v === 1 && s.mode === 'same-device'
      && typeof s.id === 'string' && VALID_ID.test(s.id)
      && Array.isArray(s.members) && s.members.length >= 1 && s.members.length <= MEMBER_LIMIT
      && s.members.every(allowedMember) && new Set(s.members).size === s.members.length
      && typeof s.contentRef === 'string' && /^(sv|en|study|math|table):[a-zA-Z0-9_-]{1,64}(:v[0-9]{1,3})?$/.test(s.contentRef)
      && Number.isInteger(s.count) && s.count >= 1 && s.count <= 30
      && Number.isInteger(s.round) && s.round >= 0 && s.round < s.count
      && Number.isInteger(s.turn) && s.turn >= 0 && s.turn < s.members.length
      && ['handoff', 'answer', 'reveal', 'done'].includes(s.phase)
      && Array.isArray(s.answers) && s.answers.length <= s.count
      && isObject(s.scores) && s.members.every(id => Number.isInteger(s.scores[id]) && s.scores[id] >= 0 && s.scores[id] <= s.count);
  }
  function restoreSession() {
    let s;
    try { s = JSON.parse(readKey(SESSION_KEY)); } catch (_) { return null; }
    if (!validSession(s)) return null;
    if (!Number.isFinite(s.createdAt) || s.createdAt > now() + 60000 || now() - s.createdAt > 7 * 86400000)
      return null;
    return s;
  }
  function persistSession(s) { s.updatedAt = now(); return writeKey(SESSION_KEY, JSON.stringify(s)); }
  function beginTurn(s) {
    if (!validSession(s) || s.phase !== 'handoff') return false;
    s.phase = 'answer'; return persistSession(s);
  }
  function answerTurn(s, value, optionCount, correctIndex) {
    if (!validSession(s) || s.phase !== 'answer' || !Number.isInteger(value)
      || !Number.isInteger(optionCount) || optionCount < 2 || optionCount > 8
      || value < 0 || value >= optionCount || !Number.isInteger(correctIndex)
      || correctIndex < 0 || correctIndex >= optionCount) return false;
    const pid = s.members[s.turn], record = s.answers[s.round] || {};
    if (Object.prototype.hasOwnProperty.call(record, pid)) return false;
    record[pid] = value;
    s.answers[s.round] = record;
    if (s.turn + 1 < s.members.length) {
      s.turn += 1; s.phase = 'handoff';
    } else {
      for (const member of s.members) if (record[member] === correctIndex) s.scores[member] += 1;
      s.phase = 'reveal';
    }
    return persistSession(s);
  }
  function nextRound(s) {
    if (!validSession(s) || s.phase !== 'reveal') return false;
    if (s.round + 1 >= s.count) s.phase = 'done';
    else { s.round += 1; s.turn = 0; s.phase = 'handoff'; }
    return persistSession(s);
  }
  function endSession() { return removeKey(SESSION_KEY); }
  function _clearMemory() { memory = null; storageOk = true; }
  return { KEY, SESSION_KEY, THEMES, GUEST_LIMIT, MEMBER_LIMIT,
    cleanName, sanitize, initial, load, save, status, addGuest, updateGuest, activate,
    deleteGuest, recordSolo, exportGuests, importGuests,
    startSession, validSession, restoreSession, beginTurn, answerTurn, nextRound, endSession, _clearMemory };
});
