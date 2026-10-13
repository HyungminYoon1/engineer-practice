import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, emptyState, parseState, validateState, KEY, MAX_SIZE, MAX_ATTEMPTS } from '../dist/src/store.js';
import { getQuestion } from '../dist/src/questions.js';
import { sessionCodes } from '../dist/src/engine.js';
function memory(){const map=new Map([['other-app','preserve']]);return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
function attempt(extra={}){return{id:crypto.randomUUID(),code:'C01.0',answer:getQuestion('C01.0').expected,correct:true,hinted:false,confidence:'unsure',elapsed:1000,at:new Date().toISOString(),cause:'none',...extra};}
test('roundtrip, fresh read merge, idempotent attempts and scoped deletion',()=>{
  const storage=memory(),one=createStore(storage),two=createStore(storage),a=attempt();assert.ok(one.append(a));assert.ok(two.append(attempt()));assert.equal(two.state.attempts.length,2);
  one.refresh();one.append(a);assert.equal(one.state.attempts.length,2);one.bookmark('C01.0');assert.deepEqual(parseState(one.export()).bookmarks,['C01.0']);one.bookmark('C01.0');assert.equal(one.state.bookmarks.length,0);
  assert.ok(one.clear());assert.equal(storage.getItem(KEY),null);assert.equal(storage.getItem('other-app'),'preserve');
});
test('corrupt and unknown versions are preserved until explicit restore',()=>{
  for(const raw of ['{bad',JSON.stringify({...emptyState(),version:99})]){
    const storage=memory();storage.setItem(KEY,raw);const store=createStore(storage);assert.ok(!store.available);assert.ok(!store.append(attempt()));assert.equal(storage.getItem(KEY),raw);
    assert.ok(store.restore(JSON.stringify(emptyState())));assert.ok(store.available);assert.equal(storage.getItem('other-app'),'preserve');
  }
});
test('quota and readback denial keep usable memory state without claiming saved',()=>{
  const storage=memory();storage.setItem=()=>{throw new Error('quota');};const store=createStore(storage);assert.ok(!store.append(attempt()));assert.equal(store.state.attempts.length,1);assert.ok(store.error);assert.ok(!store.available);
  const denied=createStore({getItem:()=>{throw new Error('denied');},setItem:()=>{},removeItem:()=>{throw new Error('denied');}});assert.ok(!denied.available);assert.ok(!denied.clear());
  const mismatch=createStore({getItem:()=>null,setItem:()=>{},removeItem:()=>{}});assert.ok(!mismatch.append(attempt()));assert.ok(mismatch.error);
});
test('invalid backup and records fail without mutation',()=>{
  const storage=memory(),store=createStore(storage);store.append(attempt());const before=storage.getItem(KEY);
  for(const raw of ['[]','null','x'.repeat(MAX_SIZE+1),JSON.stringify({...emptyState(),unexpected:'field'})]){assert.throws(()=>store.restore(raw));assert.equal(storage.getItem(KEY),before);}
  for(const changes of [{correct:false},{code:'unknown'},{answer:'x'.repeat(1201)},{confidence:'other'},{elapsed:-1},{cause:'other'}]){const state=emptyState();state.attempts=[attempt(changes)];assert.throws(()=>validateState(state));}
});
test('calendar dates and strict settings reject impossible values',()=>{
  for(const day of ['2026-99-99','2026-02-30','2025-02-29',false]){const s=emptyState();s.settings.examDate=day;assert.throws(()=>validateState(s));}
  const s=emptyState();s.settings.examDate='2028-02-29';assert.equal(validateState(s),s);
});
test('active drafts and completed sessions validate deadlines and scores',()=>{
  const storage=memory(),store=createStore(storage),now=Date.now(),active={id:crypto.randomUUID(),mode:'mock',startedAt:new Date(now).toISOString(),deadline:now+9000000,codes:sessionCodes('mock',6),answers:Array(20).fill(''),flagged:[1],index:1};
  assert.ok(store.active(active));assert.equal(parseState(store.export()).active.index,1);
  const bad=structuredClone(store.state);bad.active.deadline++;assert.throws(()=>validateState(bad));
  const summary={id:active.id,mode:'mock',endedAt:new Date(now+1000).toISOString(),codes:active.codes,answers:active.answers,score:0,seconds:1};
  assert.ok(store.finish(summary,[]));assert.equal(store.state.active,null);store.finish(summary,[]);assert.equal(store.state.sessions.length,1);
  const wrong=structuredClone(store.state);wrong.sessions[0].score=100;assert.throws(()=>validateState(wrong));
});
test('attempt cap discards oldest only, other keys remain untouched',()=>{
  const storage=memory(),state=emptyState();state.attempts=Array.from({length:MAX_ATTEMPTS},()=>attempt());storage.setItem(KEY,JSON.stringify(state));const store=createStore(storage),old=state.attempts[0].id,last=attempt();store.append(last);
  assert.equal(store.state.attempts.length,MAX_ATTEMPTS);assert.ok(!store.state.attempts.some(a=>a.id===old));assert.equal(store.state.attempts.at(-1).id,last.id);assert.equal(storage.getItem('other-app'),'preserve');
});

test('a near-capacity readable backup restores every retained record without losing drafts',()=>{
  const source=memory(),state=emptyState(),now=Date.now();
  state.attempts=Array.from({length:800},()=>attempt({answer:'가'.repeat(1200),correct:false}));
  state.bookmarks=['C01.0'];
  state.active={id:crypto.randomUUID(),mode:'mock',startedAt:new Date(now).toISOString(),deadline:now+9000000,codes:sessionCodes('mock',6),answers:Array(20).fill('작성 중 답안'),flagged:[1],index:1};
  while(JSON.stringify(state).length>MAX_SIZE)state.attempts.pop();
  source.setItem(KEY,JSON.stringify(state));const original=createStore(source),backup=original.export();
  assert.ok(backup.length>MAX_SIZE,'readable formatting must exercise the old restore boundary');
  const destination=memory(),restored=createStore(destination);
  assert.equal(restored.restore(backup),true);
  assert.deepEqual(restored.state,state);
  assert.ok(destination.getItem(KEY).length<=MAX_SIZE);
  assert.equal(destination.getItem('other-app'),'preserve');
});

test('restore rejects excessive formatting and genuinely oversized data before replacing records',()=>{
  const storage=memory(),store=createStore(storage);store.append(attempt());const before=storage.getItem(KEY),snapshot=structuredClone(store.state);
  const oversized=emptyState();oversized.attempts=Array.from({length:800},()=>attempt({answer:'x'.repeat(1200),correct:false}));
  for(const raw of [' '.repeat(MAX_SIZE*4)+JSON.stringify(emptyState()),JSON.stringify(oversized)]){
    assert.throws(()=>store.restore(raw));assert.equal(storage.getItem(KEY),before);assert.deepEqual(store.state,snapshot);
  }
});
