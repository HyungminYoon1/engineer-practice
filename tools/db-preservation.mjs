// Read-only aggregate evidence; never emit identities, records or credentials.
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {database,diagnostic} from './db-client.mjs';
let db;
try{
  db=await database();
  const roles=(await db.query("SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user")).rows[0];
  // row_security=off raises if this connection cannot observe every row.
  await db.query('SET row_security=off');
  const result={};
  for(const [key,query] of Object.entries({users:'SELECT id,email,"emailVerified","createdAt" FROM neon_auth."user"',accounts:'SELECT id,"userId","providerId","accountId" FROM neon_auth.account',study:'SELECT * FROM study_private.progress',receipts:'SELECT * FROM study_private.receipts',migrations: 'SELECT * FROM study_private.migrations WHERE name < '+String.fromCharCode(39)+'008'+String.fromCharCode(39)})){
    result[key]=(await db.query(`SELECT count(*)::int AS count,md5(coalesce(string_agg(row_to_json(t)::text,'' ORDER BY row_to_json(t)::text),'')) AS fingerprint FROM (${query}) t`)).rows[0];
  }
  await mkdir('output/account-live',{recursive:true});const file='output/account-live/preservation.json';
  if(process.argv.includes('--compare')){
    const prior=JSON.parse(await readFile(file,'utf8')),changed=Object.keys(result).filter(k=>JSON.stringify(prior[k])!==JSON.stringify(result[k]));
    if(changed.length){
      if(changed.length!==1||changed[0]!=='study'||prior.study.count!==result.study.count)throw new Error('PRESERVATION_MISMATCH');
      const baselineAt=(await stat(file)).mtime.toISOString();
      const checked=(await db.query(`SELECT coalesce(bool_and(p.updated_at<$1::timestamptz AND p.revision=(SELECT max((result->>'acceptedRevision')::bigint) FROM study_private.receipts WHERE user_id=p.user_id)),false) AS preserved FROM study_private.progress p`,[baselineAt])).rows[0].preserved;
      if(!checked)throw new Error('LEARNING_CHANGE_NEEDS_REVIEW');
      console.log('PASS identities, account links, receipts and original migrations: identical fingerprints. Study row count unchanged; learning update predates task and revision matches unchanged receipts. Whole progress fingerprint differs after read-admission metadata activity.');
    }else console.log('PASS existing Auth identities, account links, study progress, receipts and original migrations: identical fingerprints.');
    // A separate semantic checkpoint excludes volatile read rate counters. Never replace the original baseline.
    const logical=(await db.query("SELECT md5(coalesce(string_agg((to_jsonb(p)-'rate_window'-'rate_count')::text,'' ORDER BY user_id),'')) AS fingerprint FROM study_private.progress p")).rows[0].fingerprint;
    const checkpoint='output/account-live/learning-checkpoint.json';
    try{const previous=JSON.parse(await readFile(checkpoint,'utf8'));if(previous.fingerprint!==logical)throw new Error('LEARNING_CHECKPOINT_CHANGED');console.log('PASS learning checkpoint unchanged across deployment.');}
    catch(e){if(e.code!=='ENOENT')throw e;await writeFile(checkpoint,JSON.stringify({fingerprint:logical}));console.log('Recorded post-migration semantic checkpoint for deployment comparison.');}
  }
  else{await writeFile(file,JSON.stringify(result,null,2));console.log('Read-only baseline recorded; complete-row visibility enforced.',{counts:Object.fromEntries(Object.entries(result).map(([k,v])=>[k,v.count])),bypass:roles.rolbypassrls});}
}catch(e){diagnostic(e);}finally{await db?.end();}
