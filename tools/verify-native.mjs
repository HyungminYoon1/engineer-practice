import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import assert from 'node:assert/strict';
import { getQuestion, questionCodes } from '../dist/src/questions.js';
const root=resolve(mkdtempSync(join(tmpdir(),'engineer-practice-native-')));
assert(basename(root).startsWith('engineer-practice-native-'));
const run=(file,args,options={})=>execFileSync(file,args,{encoding:'utf8',timeout:20000,maxBuffer:1048576,...options}).replace(/\r\n?/g,'\n').trim();
const versions={c:run('gcc',['--version']).split('\n')[0],java:run('javac',['-version']),python:run('python',['--version'])};
const counts={c:0,java:0,python:0,sql:0};
for(const code of questionCodes){const q=getQuestion(code);if(!Object.hasOwn(counts,q.language))continue;
  const work=join(root,code.replace(/[^a-zA-Z0-9]/g,'_'));mkdirSync(work);let result;
  if(q.language==='c'){const file=join(work,'main.c'),exe=join(work,process.platform==='win32'?'main.exe':'main');writeFileSync(file,q.sourceCode,'utf8');run('gcc',['-std=c11','-Wall','-Wextra','-Werror','-O0',file,'-o',exe]);result=run(exe,[]);}
  if(q.language==='java'){const file=join(work,'Main.java');writeFileSync(file,q.sourceCode,'utf8');run('javac',['--release','17','-encoding','UTF-8','-d',work,file]);result=run('java',['-cp',work,'Main']);}
  if(q.language==='python')result=run('python',['-X','utf8','-c',q.sourceCode]);
  if(q.language==='sql')result=run('python',['-X','utf8','-c',"import sqlite3,json,sys\np=json.load(sys.stdin)\nc=sqlite3.connect(':memory:')\nc.executescript(p['schema'])\nrows=c.execute(p['query']).fetchall()\nprint('\\n'.join('|'.join('NULL' if x is None else str(x) for x in row) for row in rows))"],{input:JSON.stringify({schema:q.schema+(q.nativeSetup?'\n'+q.nativeSetup:''),query:q.nativeCode??q.sourceCode})});
  assert.equal(result,q.nativeExpected??q.expected,`Native mismatch ${code}`);counts[q.language]++;
}
const jdbc={valid:0,wrongCaseRejected:0};
for(let variant=0;variant<5;variant++){
  const q=getQuestion('X11.'+variant),work=join(root,'jdbc_'+variant);mkdirSync(work);
  const file=join(work,'Binding.java'),source=method=>'import java.sql.*;\nclass Binding { static void bind(Connection conn, String input) throws SQLException {\n'+q.sourceCode.replace('___',method)+'\n} }';
  const args=['--release','17','-encoding','UTF-8','-d',work,file];
  writeFileSync(file,source(q.expected),'utf8');run('javac',args);jdbc.valid++;
  writeFileSync(file,source('setstring'),'utf8');
  assert.throws(()=>run('javac',args,{stdio:['ignore','pipe','pipe']}),error=>error.status===1&&String(error.stderr).includes('setstring'),'Java must reject wrong-case method in '+q.code);jdbc.wrongCaseRejected++;
}
console.log(JSON.stringify({status:'PASS',counts,total:Object.values(counts).reduce((a,b)=>a+b,0),jdbc,versions,artifacts:root,scope:'All bounded original code/SQL variants execute. JDBC blanks additionally compile, and wrong-case method names must fail compilation; traces separately reviewed.'},null,2));
