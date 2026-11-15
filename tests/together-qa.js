/* Matte OS · guest and same-device session contract tests. Never touches production data. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mock = new Map();
global.localStorage = {
  getItem(k) { return mock.has(k) ? mock.get(k) : null; },
  setItem(k,v) { mock.set(k,String(v)); },
  removeItem(k) { mock.delete(k); }
};
const S = require('../tillsammans/model.js');
const origMath = '{"school":"grade8 unchanged"}';
const origLang = '{"school":"grade9 unchanged"}';
mock.set('matteos.v5',origMath); mock.set('matteos.larande.v1',origLang);
let s = S.load();
assert.equal(s.guests.length,3);
assert.deepEqual(s.guests.map(g=>g.name),['Joker One','Joker Two','Joker Three']);
assert.equal(new Set(s.guests.map(g=>g.id)).size,3);
assert.deepEqual(s.guests.map(g=>g.theme),['emerald','plum','teal']);
assert.equal(s.activeGuestId,null);
const ids=s.guests.map(g=>g.id), id=ids[0];
assert.equal(S.updateGuest(id,{name:'  A  B ',theme:'champagne',appearance:'dark'}),true);
assert.equal(S.load().guests[0].name,'A B');
assert.equal(S.load().guests[0].id,id);
assert.equal(S.updateGuest(id,{name:'   '}),false);
assert.equal(S.updateGuest(id,{theme:'<script>'}),false);
assert.equal(S.updateGuest(id,{name:'MUST NOT APPLY',theme:'invalid'}),false,'Reject entire invalid patch');
assert.equal(S.load().guests[0].name,'A B','No partial mutation on invalid patch');
const realSet=global.localStorage.setItem;
global.localStorage.setItem=()=>{throw Error('QuotaExceededError');};
assert.equal(S.updateGuest(id,{name:'MUST ROLL BACK'}),false,'Report unsaved edit as failure');
assert.equal(S.load().guests[0].name,'A B','Rollback in-memory edit if storage fails');
global.localStorage.setItem=realSet;
assert.equal(S.cleanName('<b>Hej</b>'),'<b>Hej</b>');
assert.equal(S.recordSolo(id,'sv',true),true);
assert.equal(S.recordSolo(id,'sv',false),true);
assert.deepEqual(S.load().guests[0].stats.sv,{total:2,correct:1});
const backup=S.exportGuests();
assert.equal(S.importGuests('{"v":0}').ok,false);
assert.equal(S.importGuests(backup).ok,true);
S._clearMemory();
assert.equal(S.load().guests[0].id,id);
assert.equal(S.load().guests[0].name,'A B');
assert.equal(S.load().guests[0].stats.sv.total,2);
const fourth=S.addGuest('Joker Four');
assert.ok(fourth && fourth.id!==id);
assert.equal(S.activate(fourth.id),true);
assert.equal(S.load().activeGuestId,fourth.id);
const members=['grade8','grade9',...ids,fourth.id];
const sess=S.startSession(members,'sv:buss:v1',2);
assert.ok(sess);
assert.equal(sess.phase,'handoff');
assert.equal(S.beginTurn(sess),true);
assert.equal(sess.phase,'answer');
assert.equal(S.answerTurn(sess,1,4,1),true);
assert.equal(sess.phase,'handoff');
assert.equal(sess.turn,1);
assert.equal(sess.scores.grade8,0);
for(let i=1;i<members.length;i++){
  assert.equal(S.beginTurn(sess),true);
  assert.equal(S.answerTurn(sess,i%2,4,1),true);
}
assert.equal(sess.phase,'reveal');
assert.equal(sess.scores.grade8,1);
assert.equal(sess.scores.grade9,1);
assert.equal(sess.scores[ids[0]],0);
assert.equal(S.answerTurn(sess,1,4,1),false);
assert.equal(S.nextRound(sess),true);
assert.equal(sess.phase,'handoff');
assert.equal(sess.round,1);
assert.equal(S.restoreSession().id,sess.id);
assert.equal(S.beginTurn(sess),true);
for(let i=0;i<members.length;i++){
 if(i>0)assert.equal(S.beginTurn(sess),true);
 assert.equal(S.answerTurn(sess,2,4,2),true);
}
assert.equal(sess.phase,'reveal');
assert.equal(S.nextRound(sess),true);
assert.equal(sess.phase,'done');
assert.equal(S.nextRound(sess),false);
assert.equal(S.startSession(['grade8','grade8'],'en:test:v1',1),null);
assert.equal(S.startSession(['attacker'],'en:test:v1',1),null);
assert.equal(S.startSession(['grade9'],'../../private',1),null);
assert.equal(S.startSession(Array(11).fill('grade8'),'sv:buss:v1',1),null);
const tmp=S.startSession(ids,'math:f8-fractions-compare',1);
assert.ok(tmp);
assert.equal(S.deleteGuest(ids[1]),true);
assert.equal(S.restoreSession(),null,'session with removed member must be invalidated');
assert.equal(S.load().guests.find(g=>g.id===ids[1]),undefined);
assert.equal(mock.get('matteos.v5'),origMath);
assert.equal(mock.get('matteos.larande.v1'),origLang);
assert.ok(!fs.readFileSync(path.resolve(__dirname,'../tillsammans/model.js'),'utf8').includes('signInAnonymously'));
const realStorage=global.localStorage;
Object.defineProperty(global,'localStorage',{configurable:true,get(){throw Error('storage denied');}});
assert.doesNotThrow(()=>S.status(),'Denied storage getter must not crash UI');
assert.equal(S.status().storageOk,false);
Object.defineProperty(global,'localStorage',{configurable:true,writable:true,value:realStorage});
console.log('Matte OS Together: seeded guests, stable IDs, themes, backups, isolation, N-person turns, reveal + resume PASS');
