import test from 'node:test';
import assert from 'node:assert/strict';
import { getConcept, concepts } from '../dist/src/curriculum.js';
import { getQuestion, questionCodes, itemFamilies } from '../dist/src/questions.js';
import { canEditSession } from '../dist/src/engine.js';
import * as engine from '../dist/src/engine.js';

test('source-gap additions have original concept explanation and linked reasoning',()=>{
  for(const id of ['fd','candidate-key','normal-2nf','normal-3nf','normal-bcnf','stack','unix-permission','uml-relations','csrf','py-set'])assert.ok(getConcept(id)?.example,id);
  assert.equal(concepts.length,134);assert.equal(itemFamilies.length,70);assert.equal(questionCodes.length,583);
  for(const id of ['C07','J06','P06','S07','S08','S09','S10','D01','D02','D03'])assert.ok(getQuestion(id+'.0')?.explanation,id);
});
test('normal-form and test-set references are independently specified',()=>{
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('D02.'+v)?.expected),['1NF','2NF','BCNF','1NF','2NF']);
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('D01.'+v)?.expected),['2','3','2','3','2']);
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('D03.'+v)?.expected),['754','640','751','600','664']);
});
test('deadline editing is false exactly at the deadline, diagnostics stay untimed',()=>{
  assert.ok(canEditSession({mode:'mock',deadline:1000},999));assert.ok(!canEditSession({mode:'mock',deadline:1000},1000));assert.ok(!canEditSession({mode:'mock',deadline:1000},1001));assert.ok(canEditSession({mode:'diagnostic'},100000));assert.ok(!canEditSession(null));
});
test('daily duration changes an actual suggested allocation, not just a label',()=>{
  assert.equal(typeof engine.dailyPlan,'function');
  for(const minutes of [15,30,60]){const p=engine.dailyPlan(minutes);assert.equal(p.review+p.concept+p.practice,minutes);assert.ok(p.review>0&&p.concept>0&&p.practice>0);}
  assert.notDeepEqual(engine.dailyPlan(15),engine.dailyPlan(60));
});
