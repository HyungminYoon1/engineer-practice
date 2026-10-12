import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, emptyState, KEY, MAX_SIZE } from '../dist/src/store.js';
import { conceptStatus, sessionCodes, DAY } from '../dist/src/engine.js';
import * as bank from '../dist/src/questions.js';
import { getQuestion } from '../dist/src/questions.js';

const memory=()=>{const map=new Map();return{map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
const attempt=(code,at,extra={})=>({id:crypto.randomUUID(),code,at:new Date(at).toISOString(),answer:getQuestion(code).expected,correct:true,hinted:false,confidence:'unsure',elapsed:1,cause:'none',...extra});
const session=(mode='diagnostic')=>{const now=Date.now();return{id:crypto.randomUUID(),mode,startedAt:new Date(now).toISOString(),deadline:mode==='mock'?now+9000000:null,codes:sessionCodes(mode,7),answers:Array(20).fill(''),flagged:[],index:0};};

test('regression: long answers at valid record count do not crash on serialized capacity',()=>{
  const storage=memory(),state=emptyState();state.attempts=Array.from({length:650},()=>attempt('C01.0',Date.now(),{answer:'x'.repeat(1200),correct:false}));
  assert.ok(JSON.stringify(state).length<MAX_SIZE);storage.setItem(KEY,JSON.stringify(state));const store=createStore(storage),newest=attempt('C01.0',Date.now(),{answer:'x'.repeat(1200),correct:false});
  assert.doesNotThrow(()=>{for(let i=0;i<200;i++)store.append({...newest,id:crypto.randomUUID()});});
  assert.ok(storage.getItem(KEY).length<=MAX_SIZE);assert.ok(store.state.attempts.at(-1).answer.length===1200);
});
test('regression: duplicate old submission must not clear a newer active session',()=>{
  const store=createStore(memory()),old=session();store.active(old);const summary={id:old.id,mode:old.mode,endedAt:new Date().toISOString(),codes:old.codes,answers:old.answers,score:0,seconds:1};store.finish(summary,[]);
  const next=session('mock');store.active(next);store.finish(summary,[]);assert.equal(store.state.active?.id,next.id);assert.equal(store.state.sessions.length,1);
});
test('regression: error or hinted solution resets evidence for delayed mastery',()=>{
  const t=Date.UTC(2026,9,12),a=attempt('C01.0',t),b=attempt('C01.1',t+DAY);
  for(const interruption of [{correct:false,answer:'wrong'},{hinted:true}]){
    const records=[a,b,attempt('C01.2',t+DAY+10,interruption),attempt('C01.3',t+DAY+20)];assert.equal(conceptStatus('pointers',records,t+DAY+20).state,'learning');
  }
});
test('regression: diagnostic includes concepts as well as output/calculation in each domain',()=>{
  for(let seed=0;seed<30;seed++)for(const group of ['code','db','systems']){const qs=sessionCodes('diagnostic',seed).map(getQuestion).filter(q=>q.group===group);assert.ok(qs.some(q=>q.language==='term'));assert.ok(qs.some(q=>q.language!=='term'));}
});
test('practice navigation reaches other families rather than only wrapping eight variants',()=>{
  assert.equal(typeof bank.familyChoices,'function');assert.equal(typeof bank.nextFamilyCode,'function');
  const choices=bank.familyChoices(bank.selectCodes({language:'c'}));assert.equal(choices[0].id,'C01');assert.equal(choices[1].id,'C02');
  assert.equal(bank.nextFamilyCode('C01.7',bank.selectCodes({language:'c'})),'C02.0');
  assert.equal(bank.nextFamilyCode(choices.at(-1).codes.at(-1),bank.selectCodes({language:'c'})),'C01.0');
});
test('recursion trace does not show a child call at the base case',()=>{
  for(let v=0;v<8;v++){const q=getQuestion('C04.'+v),n=3+v%4;assert.equal(q.trace.filter(s=>s.label==='하위 호출을 기다림').length,n-1);}
});
test('rounded average in educational trace is explicitly approximate',()=>{
  for(let v=0;v<8;v++)assert.match(String(getQuestion('S03.'+v).trace[0].values.average),/≈/);
});
