import test from 'node:test';
import assert from 'node:assert/strict';
import { studyGuides, getStudyGuide } from '../dist/src/study-guides.js';
import { getConcept, references } from '../dist/src/curriculum.js';
import { getQuestion } from '../dist/src/questions.js';

test('every guided path resolves to concepts, a verified example and a different practice condition',()=>{
  const ids=new Set();
  for(const guide of studyGuides){
    assert.ok(!ids.has(guide.id));ids.add(guide.id);
    assert.equal(getStudyGuide(guide.id),guide);assert.ok(references[guide.reference]);
    const example=getQuestion(guide.example),practice=getQuestion(guide.practice);
    assert.ok(example&&practice);assert.equal(example.family,practice.family);assert.notEqual(example.code,practice.code);
    for(const step of guide.steps){assert.ok(getQuestion(step.question));for(const id of step.concepts)assert.ok(getConcept(id),id);}
  }
  assert.equal(getStudyGuide('__proto__'),null);assert.equal(getStudyGuide('unknown'),null);
});
