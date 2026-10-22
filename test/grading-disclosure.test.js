import test from 'node:test';
import assert from 'node:assert/strict';
import { grade, scoreSession, sessionCodes } from '../dist/src/engine.js';
import { getQuestion, questionCodes } from '../dist/src/questions.js';
import { createStore, emptyState, parseBackup, KEY } from '../dist/src/store.js';

const memory=()=>{const map=new Map([['other-app','keep']]);return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
function historicState(){
  const state=emptyState(),codes=['X11.0','S13.0',...sessionCodes('diagnostic',17).filter(c=>!['X11.0','S13.0'].includes(c))].slice(0,20),answers=Array(20).fill('');
  answers[0]='setstring';answers[1]=getQuestion('S13.0').expected.replace('A team','Ａ team');
  state.attempts=[{id:crypto.randomUUID(),code:'X11.0',answer:'setstring',correct:true,hinted:false,confidence:'unsure',elapsed:1,at:'2026-10-13T00:00:00.000Z',cause:'none'}];
  state.sessions=[{id:crypto.randomUUID(),mode:'diagnostic',endedAt:'2026-10-13T00:00:00.000Z',codes,answers,score:5,seconds:1}];
  return state;
}

test('JDBC identifier blanks preserve case and code points for every condition',()=>{
  for(let v=0;v<5;v++){
    const q=getQuestion('X11.'+v);
    assert.equal(grade(q,'setString').correct,true);
    assert.equal(grade(q,' \tsetString\r\n').correct,true);
    for(const answer of ['setstring','SETSTRING','SetString','set String','set-String','setString()','ｓｅｔＳｔｒｉｎｇ','setＳtring','set\u200bString'])assert.equal(grade(q,answer).correct,false,q.code+' '+answer);
  }
});

test('ordinary terminology aliases retain formatting tolerance',()=>{
  const term={kind:'term',expected:'상호 배제',aliases:['상호 배제','mutual exclusion']};
  for(const answer of ['상호배제','상호 배제','MUTUAL EXCLUSION','mutual-exclusion'])assert.equal(grade(term,answer).correct,true);
  assert.equal(grade(getQuestion('X12.0'),'ssrf').correct,true);
});

test('all published expected answers still pass their explicit rubric',()=>{
  for(const code of questionCodes){const q=getQuestion(code);assert.equal(grade(q,q.expected).correct,true,code);}
});

test('new sessions give no credit to a wrong-case Java identifier',()=>{
  const state=historicState();
  assert.equal(scoreSession(state.sessions[0]).score,0);
});

test('old JDBC and SQL grades survive reading, export, restore and a fresh correct grading record',()=>{
  for(const historicScore of [5,10]){
    const state=historicState();state.sessions[0].score=historicScore;
    const raw=JSON.stringify(state),storage=memory();storage.setItem(KEY,raw);
    const store=createStore(storage);
    assert.equal(store.available,true);assert.deepEqual(store.state,state);assert.equal(storage.getItem(KEY),raw);
    const restored=createStore(memory());assert.equal(restored.restore(store.export()),true);assert.deepEqual(restored.state,state);
    assert.equal(store.append({...state.attempts[0],id:crypto.randomUUID(),correct:false}),true);
    assert.equal(store.state.attempts.at(-1).correct,false);assert.equal(store.state.attempts[0].correct,true);assert.equal(storage.getItem('other-app'),'keep');
  }
});

test('historical compatibility does not admit unrelated wrong answers or impossible scores',()=>{
  const state=historicState();state.attempts[0].answer='setInt';assert.throws(()=>parseBackup(JSON.stringify(state)));
  const invalid=historicState();invalid.sessions[0].score=15;assert.throws(()=>parseBackup(JSON.stringify(invalid)));
});
