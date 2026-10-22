import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {emptyState,KEY} from '../dist/src/store.js';
import {getQuestion} from '../dist/src/questions.js';
import {APP,merge,importGuest,envelope} from '../dist/src/cloud/sync.js';
import {createCloudSession,accountKey} from '../dist/src/cloud/session.js';
const user={id:randomUUID(),email:'fixture@example.invalid',emailVerified:true};
const attempt=(id=randomUUID())=>({id,code:'C01.0',answer:getQuestion('C01.0').expected,correct:true,hinted:false,confidence:'sure',elapsed:1,at:'2026-10-22T00:00:00.000Z',cause:'none'});
function fixture(){
  const values=new Map([[KEY,'guest sentinel'],['internet-security-study-v1','other app sentinel']]);let current=user,cloud={appId:APP,userId:user.id,epoch:randomUUID(),revision:0,serverNow:Date.now(),state:emptyState()},lost=false,fail=false,writes=0;const receipts=new Map();
  const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);}};
  const transport={session:async()=>current,rpc:async(name,r)=>{if(fail)throw new Error('OFFLINE');assert.equal(r.userId,current.id);if(name==='engineer_pull')return structuredClone(cloud);writes++;
    if(receipts.has(r.operationId))return{status:'ok',cloud:structuredClone(cloud)};
    if(r.epoch!==cloud.epoch)return{status:'epoch',cloud:structuredClone(cloud)};
    if(r.baseRevision!==cloud.revision)return{status:'conflict',cloud:structuredClone(cloud)};
    cloud={...cloud,revision:cloud.revision+1,...(name==='engineer_reset'?{epoch:randomUUID(),state:emptyState()}:{state:structuredClone(r.state)})};receipts.set(r.operationId,true);if(lost){lost=false;throw new Error('LOST_RESPONSE');}return{status:'ok',cloud:structuredClone(cloud)};}};
  const session=()=>createCloudSession({storage,user,transport,schedule:false});
  return{values,storage,session,transport,get cloud(){return cloud;},set cloud(v){cloud=v;},get writes(){return writes;},set current(v){current=v;},set lost(v){lost=v;},set fail(v){fail=v;}};
}
test('three-way merges preserve distinct attempts, independent settings and explicit conflicts',()=>{
  const base=emptyState(),local=emptyState(),remote=emptyState();local.attempts=[attempt()];remote.attempts=[attempt()];local.settings.minutes=15;remote.settings.examDate='2026-11-01';const result=merge(base,local,remote);assert.equal(result.state.attempts.length,2);assert.equal(result.state.settings.minutes,15);assert.equal(result.state.settings.examDate,'2026-11-01');assert.deepEqual(result.conflicts,[]);
  remote.settings.minutes=60;assert.deepEqual(merge(base,local,remote).conflicts,['학습 설정']);assert.equal(merge(base,local,remote,'remote').state.settings.minutes,60);
});
test('import is deliberate, bounded and preserves account settings and guest bytes',()=>{
  const a=emptyState(),g=emptyState();a.settings.minutes=60;g.attempts=[attempt()];const before=JSON.stringify(g);assert.equal(importGuest(a,g).settings.minutes,60);assert.equal(JSON.stringify(g),before);a.attempts=[{...g.attempts[0],hinted:true}];assert.throws(()=>importGuest(a,g));assert.throws(()=>envelope({appId:'internet-security-study'},user.id));
});
test('durable lost-response retry preserves edits made after the sent snapshot, including reload',async()=>{
  const f=fixture(),s=f.session();await s.start();const a=attempt(),b=attempt();s.append(a);f.lost=true;await s.flush();assert.equal(s.pendingCount,1);s.append(b);s.stop();const resumed=f.session();await resumed.start();assert.equal(f.cloud.state.attempts.length,2);assert.equal(resumed.pendingCount,0);assert.equal(f.values.get(KEY),'guest sentinel');assert.equal(f.values.get('internet-security-study-v1'),'other app sentinel');
});
test('concurrent changes merge, settings conflicts pause and require choice',async()=>{
  const f=fixture(),s=f.session();await s.start();s.append(attempt());f.cloud={...f.cloud,revision:1,state:{...emptyState(),attempts:[attempt()]}};await s.flush();assert.equal(f.cloud.state.attempts.length,2);
  s.settings({minutes:15});f.cloud={...f.cloud,revision:f.cloud.revision+1,state:{...f.cloud.state,settings:{...f.cloud.state.settings,minutes:60}}};await s.flush();assert.equal(s.blocked,'conflict');assert.equal(f.cloud.state.settings.minutes,60);await s.resolve('local');assert.equal(s.blocked,'');assert.equal(f.cloud.state.settings.minutes,15);
});
test('storage denial and stale tab stop sending without a fake saved state',async()=>{
  const f=fixture(),s=f.session();await s.start();f.storage.setItem=()=>{throw new Error('QUOTA');};assert.equal(s.append(attempt()),false);assert.equal(s.state.attempts.length,0);await s.flush();assert.equal(f.writes,0);
  const g=fixture(),t=g.session();await t.start();g.values.set(accountKey(user.id),'another tab');assert.equal(t.settings({minutes:15}),false);assert.equal(g.values.get(accountKey(user.id)),'another tab');
});
test('switched or expired managed identity cannot upload another account queue',async()=>{
  const f=fixture(),s=f.session();await s.start();s.append(attempt());f.current={...user,id:randomUUID()};await s.flush();assert.equal(s.blocked,'identity');assert.equal(f.writes,0);assert.equal(s.pendingCount,1);
});
test('reset epochs reject stale clients; reset lost acknowledgement is retryable and blocks edits',async()=>{
  const f=fixture(),s=f.session();await s.start();s.append(attempt());await s.flush();f.lost=true;assert.equal(await s.clear(),false);assert.equal(s.append(attempt()),false);await s.flush();assert.equal(s.pendingCount,0);assert.equal(s.state.attempts.length,0);
  s.append(attempt());f.cloud={...f.cloud,epoch:randomUUID(),revision:f.cloud.revision+1,state:emptyState()};await s.flush();assert.equal(s.blocked,'epoch');assert.equal(s.state.attempts.length,1);await s.recover();assert.equal(s.state.attempts.length,0);
});
test('stopped sessions ignore late pull responses',async()=>{
  const f=fixture();let release;const ready=new Promise(r=>release=r);f.transport.rpc=async()=>{await ready;return f.cloud;};const s=f.session(),starting=s.start();s.stop();release();await starting;assert.equal(f.values.has(accountKey(user.id)),false);
});
test('reset confirmation cannot discard remote work discovered after confirmation',async()=>{
  const f=fixture(),s=f.session();await s.start();f.cloud={...f.cloud,revision:1,state:{...emptyState(),attempts:[attempt()]}};
  assert.equal(await s.clear(),false);assert.equal(f.cloud.state.attempts.length,1);assert.equal(f.writes,0);
});
