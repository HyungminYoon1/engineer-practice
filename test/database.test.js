import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {emptyState} from '../dist/src/store.js';
import {questionCodes} from '../dist/src/questions.js';
const alice=randomUUID(),bob=randomUUID(),unverified=randomUUID();
test('engineer SQL ownership, concurrency, idempotency, schema bounds and app isolation',async t=>{
  const db=new PGlite();try{
    await db.exec(`CREATE ROLE authenticated;CREATE ROLE anonymous;CREATE SCHEMA auth;CREATE SCHEMA neon_auth;
      CREATE TABLE neon_auth."user"(id uuid PRIMARY KEY,"emailVerified" boolean NOT NULL);
      INSERT INTO neon_auth."user" VALUES('${alice}',true),('${bob}',true),('${unverified}',false);
      CREATE FUNCTION auth.user_id() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'') $$;
      GRANT USAGE ON SCHEMA auth TO PUBLIC;GRANT EXECUTE ON FUNCTION auth.user_id() TO PUBLIC;
      CREATE SCHEMA study_private;CREATE TABLE study_private.preservation(value text);INSERT INTO study_private.preservation VALUES('untouched');`);
    await db.exec(await readFile(new URL('../database/001-account-sync.sql',import.meta.url),'utf8'));
    await db.exec('SET ROLE engineer_service');for(const c of questionCodes)await db.query('INSERT INTO engineer_private.questions VALUES($1)',[c]);await db.exec('RESET ROLE;REVOKE USAGE ON SCHEMA auth FROM PUBLIC;SET ROLE authenticated');
    const user=async id=>db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id]);
    const rpc=async(name,r)=> (await db.query(`SELECT public.engineer_${name}($1::jsonb) AS value`,[JSON.stringify(r)])).rows[0].value;
    const pull=async(id=alice)=>rpc('pull',{appId:'engineer-practice',userId:id});
    const request=(base,state=emptyState())=>({appId:'engineer-practice',userId:base.userId,epoch:base.epoch,baseRevision:base.revision,operationId:randomUUID(),state});
    await user(alice);
    await t.test('unverified, forged identity, anonymous, table and helper access rejected',async()=>{
      await assert.rejects(pull(bob),/AUTH_REQUIRED/);await user(unverified);await assert.rejects(pull(unverified),/AUTH_REQUIRED/);await user(alice);
      await assert.rejects(db.query('SELECT * FROM engineer_private.progress'));await assert.rejects(db.query('SELECT engineer_private.empty_state()'));
      await db.exec('RESET ROLE;SET ROLE anonymous');await assert.rejects(pull());await db.exec('RESET ROLE;SET ROLE authenticated');
    });
    await t.test('CAS and retries cannot overwrite or impersonate another app',async()=>{
      const base=await pull(),state=emptyState();state.bookmarks=[questionCodes[0]];const req=request(base,state);const first=await rpc('push',req);assert.equal(first.status,'ok');assert.equal((await rpc('push',req)).cloud.revision,first.cloud.revision);
      await assert.rejects(rpc('push',{...req,state:emptyState()}),/OPERATION_REUSED/);assert.equal((await rpc('push',request(base))).status,'conflict');
      await assert.rejects(rpc('pull',{appId:'internet-security-study',userId:alice}),/INVALID_APP/);
      await user(bob);assert.deepEqual((await pull(bob)).state.bookmarks,[]);await assert.rejects(rpc('push',req),/AUTH_REQUIRED/);await user(alice);
    });
    await t.test('unknown fields, invalid dates/codes, duplicate records and limits rejected',async()=>{
      const base=await pull();for(const mutate of [s=>s.extra=true,s=>s.settings.examDate='2026-02-30',s=>s.settings.minutes=null,s=>s.bookmarks=['unknown'],s=>s.bookmarks=[questionCodes[0],questionCodes[0]],s=>s.bookmarks=Array(129).fill(questionCodes[0])]){const s=emptyState();mutate(s);await assert.rejects(rpc('push',request(base,s)));}
      const s=emptyState();s.active={id:randomUUID(),mode:'mock',startedAt:'2026-10-22T00:00:00.000Z',deadline:Date.parse('2026-10-22T00:00:00.000Z')+9000000,codes:questionCodes.slice(0,20),answers:Array(20).fill(''),flagged:[],index:0};const valid=await rpc('push',request(base,s));assert.equal(valid.status,'ok');s.active.deadline++;await assert.rejects(rpc('push',request(valid.cloud,s)),/INVALID_SESSION_TIME/);
    });
    await t.test('per-app reset preserves Auth, other app, other user; epoch blocks resurrection',async()=>{
      const old=await pull(),r=request(old);delete r.state;const reset=await rpc('reset',r);assert.notEqual(reset.cloud.epoch,old.epoch);assert.deepEqual(reset.cloud.state,emptyState());assert.equal((await rpc('reset',r)).cloud.epoch,reset.cloud.epoch);assert.equal((await rpc('push',request(old))).status,'epoch');
      await db.exec('RESET ROLE');assert.equal((await db.query('SELECT count(*) AS n FROM neon_auth."user"')).rows[0].n,3);assert.equal((await db.query('SELECT value FROM study_private.preservation')).rows[0].value,'untouched');
      const flags=(await db.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='engineer_private.progress'::regclass")).rows[0];assert.equal(flags.relrowsecurity,true);assert.equal(flags.relforcerowsecurity,true);
      await db.query('DELETE FROM neon_auth."user" WHERE id=$1',[alice]);assert.equal((await db.query('SELECT count(*) AS n FROM engineer_private.progress WHERE user_id=$1',[alice])).rows[0].n,0);
    });
  }finally{await db.close();}
});
