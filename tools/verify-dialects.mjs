import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { getQuestion } from '../dist/src/questions.js';

// Owned offline fixtures only: no published ports, host mounts, account or Neon access.
// Empty/trust authentication is confined to disposable containers with network=none.
const run=(args,input)=>execFileSync('docker',args,{input,encoding:'utf8',timeout:300000,maxBuffer:1048576,stdio:['pipe','pipe','pipe']}).replace(/\r\n?/g,'\n').trim();
const nonce=randomUUID(),owned=[];
async function start(engine,image,environment){
  try{run(['image','inspect',image,'--format','{{.Id}}']);}catch{console.log('Fetching test image: '+image);run(['pull',image]);}
  const name=`engineer-practice-verify-${engine}-${nonce}`,id=run(['run','-d','--rm','--network','none','--memory','512m','--cpus','2','--label',`engineer-practice-test=${nonce}`,'--name',name,...environment.flatMap(value=>['-e',value]),image]);
  assert.match(id,/^[a-f0-9]{64}$/);owned.push({id,name});
  for(let i=0;i<90;i++){
    // Initialization briefly starts a temporary server. A ping alone can race its shutdown.
    try{assert.equal(run(['exec',id,'cat','/proc/1/comm']),engine==='postgres'?'postgres':'mysqld');if(engine==='postgres')run(['exec',id,'pg_isready','-U','postgres']);else run(['exec',id,'mysqladmin','--protocol=socket','ping','--silent','-uroot']);return id;}catch{await new Promise(resolve=>setTimeout(resolve,1000));}
  }
  throw new Error(engine+' fixture did not become ready');
}
try{
  const pg=await start('postgres','postgres:18.4-alpine',['POSTGRES_HOST_AUTH_METHOD=trust']);
  const psql=sql=>run(['exec','-i',pg,'psql','-U','postgres','-d','postgres','-X','-v','ON_ERROR_STOP=1','-A','-t','-q'],sql);
  const pgVersion=psql('SHOW server_version;');
  assert.equal(psql('CREATE ROLE analyst NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;\nREVOKE ALL ON SCHEMA public FROM PUBLIC;\nGRANT USAGE ON SCHEMA public TO analyst;\nSELECT rolsuper FROM pg_roles WHERE rolname=\'analyst\';'),'f');
  for(let v=0;v<5;v++){
    const q=getQuestion('X17.'+v),match=/^(GRANT|REVOKE) (SELECT|UPDATE) ON TABLE ([a-z]+) (TO|FROM) analyst;$/.exec(q.expected);assert.ok(match);
    const [,command,privilege,table]=match;
    const sql=`CREATE TABLE ${table} (id INTEGER);\n${command==='REVOKE'?`GRANT ${privilege} ON TABLE ${table} TO analyst;`:''}\n${q.expected}\nSELECT has_table_privilege('analyst','${table}','${privilege}');`;
    assert.equal(psql(sql),command==='GRANT'?'t':'f',q.code);
  }
  const my=await start('mysql','mysql:8.4',['MYSQL_ALLOW_EMPTY_PASSWORD=yes']);
  const mysql=sql=>run(['exec','-i',my,'mysql','--protocol=socket','-uroot','--batch','--skip-column-names'],sql);
  const mysqlVersion=mysql('SELECT VERSION();');
  for(let v=0;v<5;v++){
    const q=getQuestion('X18.'+v),db='audit_procedure_'+v,completed=q.sourceCode.replace('___',q.expected);
    const calls=["CALL add_one(3,@result); SELECT @result;","CALL add_one(3,@result); SELECT @result;","SET @result=3; CALL increase(@result); SELECT @result;","CALL local_value(); SELECT 1;","CALL absolute_value(-3,@result); SELECT @result;"][v];
    const sql=`CREATE DATABASE ${db};\nUSE ${db};\nDELIMITER //\n${completed}//\nDELIMITER ;\n${calls}`;
    assert.equal(mysql(sql),['4','4','4','1','3'][v],q.code);
  }
  for(let v=0;v<5;v++){
    const q=getQuestion('X19.'+v),db='audit_function_'+v,completed=q.sourceCode.replace('___',q.expected),prefix=v<3?'':"CREATE FUNCTION plus_one(x INT) RETURNS INT DETERMINISTIC RETURN x+1;\nCREATE PROCEDURE add_one(IN x INT, OUT y INT) SET y=x+1;\n";
    const sql=`CREATE DATABASE ${db};\nUSE ${db};\n${prefix}${completed};\n${v<3?'SELECT plus_one(3);':v===3?'SELECT @result;':''}`;
    assert.equal(mysql(sql),'4',q.code);
  }
  console.log(JSON.stringify({status:'PASS',postgresDcl:5,mysqlProcedure:5,mysqlFunction:5,total:15,versions:{postgres:pgVersion,mysql:mysqlVersion},scope:'Canonical author-completed dialect cases, not arbitrary submitted SQL or a production DB.'},null,2));
}finally{
  for(const entry of owned.reverse()){
    const data=JSON.parse(run(['inspect',entry.id]))[0];assert.equal(data.Name,'/'+entry.name);assert.equal(data.Config.Labels['engineer-practice-test'],nonce);assert.equal(data.HostConfig.NetworkMode,'none');assert.ok(!(data.HostConfig.PortBindings&&Object.keys(data.HostConfig.PortBindings).length));assert.ok(!data.Mounts.some(mount=>mount.Type==='bind'));
    run(['rm','-f',entry.id]);
  }
  console.log('Owned test containers removed; no app DB or host bind mounts used.');
}
