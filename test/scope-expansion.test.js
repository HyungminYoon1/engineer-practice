import test from 'node:test';
import assert from 'node:assert/strict';
import { concepts, references } from '../dist/src/curriculum.js';
import { getQuestion, itemFamilies, questionCodes, familyChoices } from '../dist/src/questions.js';
import { coverageTopics } from '../dist/src/coverage.js';
import { grade } from '../dist/src/engine.js';

test('every practical heading has reachable applied gap exercises',()=>{
  assert.equal(coverageTopics.length,12);
  for(const topic of coverageTopics){
    assert.ok(topic.practiceFamilies?.length,topic.name);
    for(const id of topic.practiceFamilies){const f=itemFamilies.find(f=>f.id===id);assert.ok(f,topic.name+' '+id);assert.notEqual(f.language,'term');assert.ok(f.conceptIds.some(id=>topic.concepts.includes(id)));}
  }
  for(const id of ['procedure','stored-function','mcdc','ssrf','lossless','baseline'])assert.ok(concepts.some(c=>c.id===id),id);
  assert.deepEqual(familyChoices(questionCodes).flatMap(f=>f.codes),questionCodes);
});
test('written SQL rubric accepts formatting but preserves literal content and token boundaries',()=>{
  const q=getQuestion('S11.0');assert.ok(q);assert.equal(q.kind,'tokens');
  assert.ok(grade(q,q.expected.toLowerCase().replaceAll(' ','\n')).correct);
  assert.ok(!grade(q,q.expected.replace('>=','>')).correct);
  assert.ok(!grade(q,q.expected+'; DELETE FROM scores;').correct);
  assert.ok(!grade(q,q.expected.replace('SELECT','SE LECT')).correct);
  const u=getQuestion('S13.0');assert.ok(grade(u,u.expected).correct);
  assert.ok(!grade(u,u.expected.replace("'A team'","'A  team'")).correct);
  assert.ok(!grade(u,u.expected.replace("'A team'","'a team'")).correct);
});
test('DB dialect cases are not mislabelled SQLite execution',()=>{
  for(const id of ['X17','X18','X19'])for(let v=0;v<5;v++){
    const q=getQuestion(id+'.'+v);assert.ok(q);assert.equal(q.language,'scenario');assert.ok(q.dialect);assert.equal(q.validation,'native-dialect');assert.ok(references[q.reference]);assert.ok(grade(q,q.expected).correct);
  }
});
test('new scheduling and logical coverage references have independent fixed answers',()=>{
  // Hand-drawn Gantt references: SRTF totals 6,4,8,2,4; RR totals 8,9,10,8,7.
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('N09.'+v)?.expected),['6','4','8','2','4']);
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('N10.'+v)?.expected),['8','9','10','8','7']);
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('X09.'+v)?.expected),['3','3','3','3','3']);
  assert.deepEqual(Array.from({length:5},(_,v)=>getQuestion('N11.'+v)?.expected),['안전','불안전','안전','불안전','안전']);
});
