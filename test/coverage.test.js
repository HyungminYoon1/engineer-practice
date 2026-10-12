import test from 'node:test';
import assert from 'node:assert/strict';
import { concepts } from '../dist/src/curriculum.js';
import { coverageTopics, contentInventory, topicInventory } from '../dist/src/coverage.js';
test('all major headings mapped without claiming complete criterion coverage',()=>{
  assert.equal(coverageTopics.length,12);assert.equal(new Set(coverageTopics.map(t=>t.id)).size,12);
  const known=new Set(concepts.map(c=>c.id)),mapped=new Set();for(const t of coverageTopics){assert.equal(t.status,'개념·문제 수록');assert.ok(t.gap&&t.next&&t.provided);for(const id of t.concepts){assert.ok(known.has(id));mapped.add(id);}assert.ok(topicInventory(t).items>=t.concepts.length);}
  assert.equal(mapped.size,known.size);
  assert.deepEqual(contentInventory(),{concepts:134,termItems:134,codeFamilies:23,sqlFamilies:13,calculationFamilies:15,scenarioFamilies:19,reasoningFamilies:70,items:583});
});
