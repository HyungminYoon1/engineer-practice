import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {database,diagnostic} from './db-client.mjs';
import {questionCodes} from '../dist/src/questions.js';
let db;
try{
  db=await database();
  const exists=(await db.query("SELECT to_regclass('engineer_private.migrations') IS NOT NULL AS present")).rows[0].present;
  const done=exists?(await db.query('SELECT name,checksum FROM engineer_private.migrations')).rows:[];
  for(const name of ['001-account-sync.sql']){
    const sql=await readFile(new URL(`../database/${name}`,import.meta.url),'utf8'),checksum=createHash('sha256').update(sql.replaceAll('\r\n','\n')).digest('hex'),prior=done.find(x=>x.name===name);
    if(prior){if(prior.checksum!==checksum)throw new Error('MIGRATION_CHANGED');continue;}
    await db.query('BEGIN');try{
      await db.query(sql.replace(/^BEGIN;\s*/m,'').replace(/COMMIT;\s*$/,''));await db.query('RESET ROLE');
      await db.query('CREATE TABLE IF NOT EXISTS engineer_private.migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz DEFAULT now())');
      await db.query('INSERT INTO engineer_private.migrations(name,checksum) VALUES($1,$2)',[name,checksum]);
      await db.query('SET LOCAL ROLE engineer_service');
      for(const code of questionCodes)await db.query('INSERT INTO engineer_private.questions(code) VALUES($1) ON CONFLICT DO NOTHING',[code]);
      await db.query('COMMIT');console.log('Applied engineer migration and question-code catalog.');
    }catch(e){await db.query('ROLLBACK');throw e;}
  }
  await db.query("NOTIFY pgrst, 'reload schema'");
}catch(e){diagnostic(e);}finally{await db?.end();}
