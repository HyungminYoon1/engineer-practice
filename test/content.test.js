import test from 'node:test';
import assert from 'node:assert/strict';
import { concepts, references } from '../dist/src/curriculum.js';
import { questionCodes, getQuestion, itemFamilies, selectCodes } from '../dist/src/questions.js';
import { grade, sessionCodes, scoreSession, conceptStatus, reviewConcepts, remainingSeconds, DAY, nextVariant } from '../dist/src/engine.js';

test('bounded original catalog, concepts, prerequisites and source lines',()=>{
  assert.equal(concepts.length,88);assert.equal(questionCodes.length,304);assert.equal(new Set(questionCodes).size,304);
  assert.equal(itemFamilies.length,30);const ids=new Set(concepts.map(c=>c.id));
  for(const c of concepts){assert.ok(c.rule&&c.prompt&&c.answers.length&&references[c.reference]);for(const id of c.prerequisites)assert.ok(ids.has(id));}
  for(const code of questionCodes){const q=getQuestion(code);assert.equal(q.code,code);assert.equal(q.source,'자체 제작');assert.ok(q.explanation&&q.expected);assert.ok(q.conceptIds.every(id=>ids.has(id)));
    if(q.sourceCode)for(const frame of q.trace)assert.ok(frame.line>0&&frame.line<=q.sourceCode.split('\n').length,code);
    assert.ok(grade(q,q.expected).correct,code);assert.ok(!grade(q,'definitely wrong').correct,code);assert.ok(grade(q,'').empty);
  }
  for(const code of ['C01.8','C01.00','T-unknown.0','__proto__.0',null,'x'.repeat(100)])assert.equal(getQuestion(code),null);
});
test('grading distinguishes aliases, integer units, table rows and significant output spacing',()=>{
  assert.ok(grade(getQuestion('T-overriding.0'),' OVERRIDING ').correct);
  assert.ok(grade(getQuestion('T-sql-join.0'),'left outer join').correct);
  assert.ok(!grade(getQuestion('T-overriding.0'),'오버라이딩인가요').correct);
  const n=getQuestion('N01.0');assert.ok(grade(n,'１２６').correct);assert.ok(grade(n,'+126.00').correct);
  for(const answer of ['126개','126.1','Infinity','126e0','0x7e'])assert.ok(!grade(n,answer).correct);
  const c=getQuestion('C01.0');assert.ok(grade(c,'\n'+c.expected+'\r\n').correct);assert.ok(!grade(c,c.expected.replace(' ','  ')).correct);
  const s=getQuestion('S01.0');assert.ok(grade(s,s.expected.replaceAll('|',' | ')).correct);assert.ok(!grade(s,s.expected.split('\n').reverse().join('\n')).correct);
  assert.ok(!grade(s,'a'.repeat(1201)).correct);
});
test('calculation references independently checked against fixed mathematical cases',()=>{
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('N01.'+v).expected),['126','62','30','14','6']);
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('N02.'+v).expected),['64','96','128','128','160']);
  // FCFS waits: 0,4,6,13. SJF waits: 0,1,4,10.
  // FIFO misses at positions 1,2,3,5,7,8,9,10,11; LRU at 1,2,3,5,6,7,8,10,11.
  for(let v=0;v<5;v++){assert.equal(getQuestion('N03.'+v).expected,String(23+4*v));assert.equal(getQuestion('N04.'+v).expected,String(15+6*v));assert.equal(getQuestion('N05.'+v).expected,'9');assert.equal(getQuestion('N06.'+v).expected,'9');assert.equal(getQuestion('N07.'+v).expected,String(205-4*v));assert.equal(getQuestion('N08.'+v).expected,String(15+7*v));}
});
test('selection respects group, language and difficulty; variant cycle is bounded',()=>{
  assert.equal(selectCodes({language:'c'}).length,48);assert.equal(selectCodes({language:'java'}).length,40);assert.equal(selectCodes({language:'sql'}).length,48);
  assert.equal(selectCodes({group:'dev',language:'c'}).length,0);assert.ok(selectCodes({concept:'pointers'}).every(code=>getQuestion(code).conceptIds.includes('pointers')));
  assert.equal(nextVariant('C01.7'),'C01.0');assert.equal(nextVariant('T-pointers.0'),'T-pointers.0');assert.equal(nextVariant('bad'),null);
});
test('balanced 20-item sessions avoid cloned families across 100 seeds',()=>{
  for(const mode of ['mock','diagnostic'])for(let seed=0;seed<100;seed++){
    const codes=sessionCodes(mode,seed);assert.equal(codes.length,20);assert.equal(new Set(codes.map(c=>getQuestion(c).family)).size,20);
    const counts=Object.fromEntries(['code','db','systems','dev'].map(g=>[g,codes.filter(c=>getQuestion(c).group===g).length]));
    assert.deepEqual(counts,mode==='mock'?{code:8,db:4,systems:4,dev:4}:{code:5,db:5,systems:5,dev:5});
    assert.deepEqual(codes,sessionCodes(mode,seed));
  }
  assert.notDeepEqual(sessionCodes('mock',1),sessionCodes('mock',2));assert.throws(()=>sessionCodes('invalid'));
});
test('session scoring includes unanswered; absolute deadline survives clock jumps',()=>{
  const codes=sessionCodes('mock',5),answers=codes.map(c=>getQuestion(c).expected);assert.equal(scoreSession({codes,answers}).score,100);
  answers[0]='';answers[1]='wrong';const score=scoreSession({codes,answers});assert.equal(score.score,90);assert.equal(score.unanswered,1);
  assert.equal(remainingSeconds({mode:'mock',deadline:10000},9999),1);assert.equal(remainingSeconds({mode:'mock',deadline:10000},12000),0);assert.equal(remainingSeconds({mode:'diagnostic'},0),null);
});
const attempt=(code,at,extra={})=>({id:crypto.randomUUID(),code,at:new Date(at).toISOString(),correct:true,hinted:false,confidence:'unsure',...extra});
test('mastery needs delayed unhinted attempts and new conditions for transfer',()=>{
  const now=Date.UTC(2026,9,12),a=attempt('C01.0',now);assert.equal(conceptStatus('pointers',[]).state,'new');assert.equal(conceptStatus('pointers',[a],now).state,'learning');
  assert.equal(conceptStatus('pointers',[a,attempt('C01.1',now+DAY-1)],now+DAY).state,'learning');
  assert.equal(conceptStatus('pointers',[a,attempt('C01.0',now+DAY)],now+DAY).state,'reviewed');
  assert.equal(conceptStatus('pointers',[a,attempt('C01.1',now+DAY)],now+DAY).state,'applied');
  assert.equal(conceptStatus('pointers',[a,attempt('C01.1',now+DAY,{hinted:true})],now+DAY).state,'learning');
  assert.equal(conceptStatus('pointers',[a,attempt('C01.1',now+DAY,{correct:false})],now+DAY).state,'learning');
  const term=attempt('T-pointers.0',now);assert.equal(conceptStatus('pointers',[term,attempt('T-pointers.0',now+DAY)],now+DAY).state,'reviewed');
});
test('confident errors get priority and become due after ten minutes',()=>{
  const now=Date.UTC(2026,9,12),a=attempt('C01.0',now,{correct:false,confidence:'sure'});
  assert.ok(!conceptStatus('pointers',[a],now+599999).due);assert.ok(conceptStatus('pointers',[a],now+600000).due);
  assert.ok(reviewConcepts([a],now+600000).some(c=>c.id==='pointers'));
});
