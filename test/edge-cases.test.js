import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { grade, sessionCodes, scoreSession, canEditSession, remainingSeconds, DAY, conceptStatus } from '../dist/src/engine.js';
import { createStore, emptyState, parseState, KEY, MAX_SIZE, MAX_BACKUP_SIZE } from '../dist/src/store.js';
import { getQuestion, questionCodes } from '../dist/src/questions.js';

const time=Date.UTC(2026,9,13);
function memory(){const map=new Map([['other-app','keep']]);return{map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
function session(mode='mock'){return{id:crypto.randomUUID(),mode,startedAt:new Date(time).toISOString(),deadline:mode==='mock'?time+9000000:null,codes:sessionCodes(mode,17),answers:Array(20).fill(''),flagged:[],index:0};}
function summary(s){return{id:s.id,mode:s.mode,endedAt:new Date(time+1000).toISOString(),codes:s.codes,answers:s.answers,score:scoreSession(s).score,seconds:1};}
function record(extra={}){return{id:crypto.randomUUID(),code:'C01.0',answer:getQuestion('C01.0').expected,correct:true,hinted:false,confidence:'unsure',elapsed:0,at:new Date(time).toISOString(),cause:'none',...extra};}

test('edge SQL quoted values are not compatibility-normalized into different values',()=>{
  const q=getQuestion('S13.0');
  assert.match(q.expected,/'A team'/);
  const db=new DatabaseSync(':memory:');
  try {
    for(const value of ['Ａ team','A\u00a0team','A\u3000team']){
      assert.equal(db.prepare('SELECT ? = ? AS same').get('A team',value).same,0);
      assert.equal(grade(q,q.expected.replace('A team',value)).correct,false);
    }
    assert.equal(grade(q,'\n'+q.expected.replace('UPDATE','update')+'\n').correct,true);
  } finally {db.close();}
});

test('edge stale completion after another tab abandons a session creates no result',()=>{
  const storage=memory(),a=createStore(storage),s=session();a.active(s);const b=createStore(storage);b.active(null);
  a.finish(summary(s),[]);
  assert.equal(a.state.sessions.length,0);assert.equal(a.state.active,null);
  assert.equal(parseState(storage.getItem(KEY)).sessions.length,0);
});

test('edge stale completion after explicit deletion cannot recreate cleared records',()=>{
  const storage=memory(),a=createStore(storage),s=session();a.active(s);const b=createStore(storage);assert.equal(b.clear(),true);
  a.finish(summary(s),[]);
  assert.equal(a.state.sessions.length,0);assert.equal(a.state.active,null);
  assert.equal(storage.getItem(KEY),null);
  assert.equal(storage.getItem('other-app'),'keep');
});

test('edge historical SQL grades remain readable without regrading or rewriting backups',()=>{
  const storage=memory(),old=emptyState(),q=getQuestion('S13.0'),answer=q.expected.replace('A team','Ａ team');
  old.attempts=[record({code:q.code,answer,correct:true})];
  const s=session('diagnostic');s.codes[0]=q.code;assert.equal(new Set(s.codes).size,20);s.answers[0]=answer;
  old.sessions=[{...summary(s),score:5}];const raw=JSON.stringify(old);storage.setItem(KEY,raw);
  const store=createStore(storage);assert.equal(store.available,true);assert.deepEqual(store.state,old);assert.equal(storage.getItem(KEY),raw);
  const restored=createStore(memory());assert.equal(restored.restore(store.export()),true);assert.deepEqual(restored.state,old);
});

test('edge answer bounds, exact output case and invalid numeric suffixes',()=>{
  const q=getQuestion('C01.0');
  for(const value of [null,1,[],{},'',' \t\n','x'.repeat(1201)])assert.equal(grade(q,value).empty,true);
  assert.equal(grade(q,'x'.repeat(1200)).empty,false);
  const n=getQuestion('N01.0');
  for(const value of ['126e0','126n','126 0','126/1','NaN','1e999','126.0001'])assert.equal(grade(n,value).correct,false);
  assert.equal(grade(n,'+000126.000').correct,true);
  assert.equal(grade({kind:'output',expected:'Ab c'},'ab c').correct,false);
  assert.equal(grade({kind:'output',expected:'Ab c'},'Ab  c').correct,false);
});

test('edge SQL accepts only declared token forms and preserves escaped quoted content',()=>{
  const q={kind:'tokens',expected:"SELECT 'a''b', \"A B\" FROM t;"};
  assert.equal(grade(q," select 'a''b',\n\"A B\" from t ").correct,true);
  for(const value of [q.expected+';',q.expected+' --x',q.expected.replace("'a''b'","'a b'"),q.expected.replace('A B','a b'),"SELECT 'unfinished",q.expected+' DELETE FROM t'])assert.equal(grade(q,value).correct,false);
});

test('edge exact deadline, first and last score boundaries and deterministic extreme entropy',()=>{
  const s=session();
  assert.equal(canEditSession(s,s.deadline-1),true);assert.equal(canEditSession(s,s.deadline),false);assert.equal(canEditSession(s,s.deadline+1),false);
  assert.equal(remainingSeconds(s,s.deadline-1),1);assert.equal(remainingSeconds(s,s.deadline),0);
  for(const seed of [0,1,2147483647,4294967295])for(const mode of ['mock','diagnostic']){
    const codes=sessionCodes(mode,seed);assert.equal(new Set(codes).size,20);assert.deepEqual(codes,sessionCodes(mode,seed));
    assert.equal(scoreSession({codes,answers:Array(20).fill('')}).score,0);
    const answers=codes.map(c=>getQuestion(c).expected);assert.equal(scoreSession({codes,answers}).score,100);
    answers[19]='';assert.equal(scoreSession({codes,answers}).score,95);
  }
});

test('edge malformed active records reject atomically without replacing memory or siblings',()=>{
  const storage=memory(),store=createStore(storage);store.append(record());const before=store.export(),saved=storage.getItem(KEY);
  for(const alter of [s=>s.index=-1,s=>s.index=20,s=>s.deadline++,s=>s.flagged=[0,0],s=>s.flagged=[20],s=>s.answers.pop(),s=>s.answers[0]='x'.repeat(1201),s=>s.codes[1]=s.codes[0]]){
    const bad=emptyState();bad.active=session();alter(bad.active);assert.throws(()=>store.restore(JSON.stringify(bad)));assert.equal(store.export(),before);assert.equal(storage.getItem(KEY),saved);
  }
  for(const raw of ['null','[]','{"__proto__":{}}',' '.repeat(MAX_BACKUP_SIZE+1)])assert.throws(()=>store.restore(raw));
  assert.equal(storage.getItem('other-app'),'keep');
});

test('edge exact serialized input limit and backup whitespace limit',()=>{
  const raw=JSON.stringify(emptyState());assert.deepEqual(parseState(raw+' '.repeat(MAX_SIZE-raw.length)),emptyState());
  assert.throws(()=>parseState(raw+' '.repeat(MAX_SIZE+1-raw.length)));
  const store=createStore(memory());assert.equal(store.restore(raw+' '.repeat(MAX_BACKUP_SIZE-raw.length)),true);
  assert.throws(()=>store.restore(raw+' '.repeat(MAX_BACKUP_SIZE+1-raw.length)));
});

test('edge refused delete and interrupted readback retain a usable prior record',()=>{
  const storage=memory(),store=createStore(storage);store.append(record());const before=store.export(),persisted=storage.getItem(KEY);
  storage.removeItem=()=>{};assert.equal(store.clear(),false);assert.equal(store.export(),before);assert.equal(storage.getItem(KEY),persisted);assert.ok(store.error);
  storage.setItem=()=>{};assert.equal(store.bookmark('C01.0'),false);assert.equal(store.available,false);assert.equal(storage.getItem(KEY),persisted);assert.deepEqual(store.state.bookmarks,['C01.0']);
  assert.equal(storage.getItem('other-app'),'keep');
});

test('edge bookmark and completed-session caps remove oldest, not current draft',()=>{
  const storage=memory(),state=emptyState();state.bookmarks=questionCodes.slice(0,128);
  for(let i=0;i<20;i++)state.sessions.push(summary(session('diagnostic')));
  state.active=session();storage.setItem(KEY,JSON.stringify(state));const store=createStore(storage);
  store.bookmark(questionCodes[128]);assert.equal(store.state.bookmarks.length,128);assert.equal(store.state.bookmarks[0],questionCodes[1]);assert.equal(store.state.active.id,state.active.id);
  const first=state.sessions[0].id;store.finish(summary(state.active),[]);assert.equal(store.state.sessions.length,20);assert.notEqual(store.state.sessions[0].id,first);
});

test('edge mastery due boundary and shuffled input order do not mutate records',()=>{
  const a=record(),b=record({code:'C01.1',at:new Date(time+DAY).toISOString()});const inputs=[b,a],snapshot=structuredClone(inputs);
  assert.equal(conceptStatus('pointers',inputs,time+DAY).state,'applied');assert.deepEqual(inputs,snapshot);
  const due=conceptStatus('pointers',inputs,time+DAY).dueAt;
  assert.equal(conceptStatus('pointers',inputs,due-1).due,false);assert.equal(conceptStatus('pointers',inputs,due).due,true);
});
