// Explicit production check using disposable example.com identities only. Never runs in CI.
// --candidate serves reviewed dist bytes at the existing allowed Pages origin in the test browser.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,firefox,webkit} from 'playwright';
import {database,diagnostic} from './db-client.mjs';
import {AUTH_URL,DATA_URL} from '../dist/src/cloud/neon.js';
import {emptyState,KEY} from '../dist/src/store.js';
import {getQuestion} from '../dist/src/questions.js';
const origin='https://hyungminyoon1.github.io',engineer=origin+'/engineer-practice/',study=origin+'/internet-security-study/';
const run=randomBytes(8).toString('hex'),created=[],secrets=[],results=[];let db,browser,browser2;
const candidate=process.argv.includes('--candidate'),output=resolve('output/account-live');await mkdir(output,{recursive:true});
const scrub=v=>secrets.reduce((s,k)=>k?s.replaceAll(k,'[redacted]'):s,String(v)).replace(/eyJ[A-Za-z0-9_.-]+/g,'[redacted]').slice(0,600);
const pass=name=>{results.push({name,status:'PASS'});console.log('PASS',name);};
async function auth(path,body,jar=new Map()){
  const r=await fetch(AUTH_URL+path,{method:body?'POST':'GET',headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(jar.size?{Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});
  for(const line of r.headers.getSetCookie()){const first=line.split(';')[0],i=first.indexOf('=');jar.set(first.slice(0,i),first.slice(i+1));secrets.push(first.slice(i+1));}
  const data=await r.json().catch(()=>({})),jwt=r.headers.get('set-auth-jwt');if(jwt)secrets.push(jwt);return{status:r.status,data,jwt};
}
async function fixture(label){const f={email:`codex-weblab-${run}-${label}@example.com`,password:randomBytes(24).toString('base64url')+'!A7',id:null,jar:new Map()};secrets.push(f.email,f.password);created.push(f);
  const signup=await auth('/sign-up/email',{email:f.email,password:f.password,name:'학습자'},f.jar);assert.equal(signup.status,200,'Managed signup status');const row=await db.query('SELECT id,"emailVerified" FROM neon_auth."user" WHERE email=$1',[f.email]);assert.equal(row.rowCount,1);f.id=row.rows[0].id;assert.equal(row.rows[0].emailVerified,false);
  // Only this disposable identity receives controlled verification. No claim of inbox delivery.
  assert.equal((await db.query('UPDATE neon_auth."user" SET "emailVerified"=true WHERE id=$1 AND email=$2',[f.id,f.email])).rowCount,1);
  return f;
}
async function jwt(f){const login=await auth('/sign-in/email',{email:f.email,password:f.password},f.jar);assert.equal(login.status,200,'Managed sign-in status');const session=await auth('/get-session',null,f.jar);const token=session.jwt||session.data?.session?.token;assert.equal(typeof token,'string');assert.equal(token.split('.').length,3);secrets.push(token);return token;}
async function rpc(name,body,token){const r=await fetch(DATA_URL+'/rpc/'+name,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});return{status:r.status,data:await r.json().catch(()=>({}))};}
async function configure(context){if(candidate)for(const[app,root]of [['engineer-practice',resolve('dist')],['internet-security-study',resolve('../internet-security-study/dist')]])await context.route(origin+'/'+app+'/**',async route=>{const pathname=decodeURIComponent(new URL(route.request().url()).pathname).slice(app.length+2),file=resolve(root,pathname||'index.html');assert(file.startsWith(root+sep));const bytes=await readFile(file);await route.fulfill({status:200,contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'}[extname(file)]||'application/octet-stream',body:bytes});});}
async function login(page,base,f){await page.goto(base+'#account');await page.getByLabel('이메일',{exact:true}).fill(f.email);await page.getByLabel('비밀번호',{exact:true}).fill(f.password);await page.locator('.auth-form').getByRole('button',{name:'로그인',exact:true}).click();await page.getByRole('button',{name:'지금 동기화',exact:true}).waitFor({timeout:30000});}
async function engineerReady(p){await p.locator('#account-sync-state').filter({hasText:'동기화 완료'}).waitFor({timeout:35000});}
try{
  db=await database();const a=await fixture('a'),b=await fixture('b');pass('managed signup still requires email verification; controlled disposable identities only');
  const tokenA=await jwt(a),tokenB=await jwt(b);
  const payload=id=>({p_request:{appId:'engineer-practice',userId:id}});
  assert.notEqual((await rpc('engineer_pull',payload(a.id))).status,200);
  const ca=await rpc('engineer_pull',payload(a.id),tokenA);assert.equal(ca.status,200,'Engineer Data API migration discovered');assert.equal(ca.data.userId,a.id);
  assert.notEqual((await rpc('engineer_pull',payload(a.id),tokenB)).status,200);assert.equal((await rpc('engineer_pull',payload(b.id),tokenB)).data.state.attempts.length,0);
  assert.notEqual((await rpc('web_lab_study_pull',{p_user_id:a.id},tokenB)).status,200);
  assert.equal((await rpc('web_lab_study_pull',{p_user_id:a.id},tokenA)).data.userId,a.id);pass('real managed JWTs enforce anonymous denial, expected identity and app namespaces');
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'ko-KR'});await configure(context);const page=await context.newPage();page.setDefaultTimeout(15000);page.on('dialog',d=>d.accept());const errors=[];page.on('pageerror',e=>errors.push(scrub(e.message)));
  await page.goto(engineer);const guest=emptyState();guest.bookmarks=['C01.0'];await page.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,JSON.stringify(guest)]);const original=JSON.stringify(guest);
  await login(page,engineer,a);await engineerReady(page);await page.locator('[data-route="practice"]').click();await page.getByLabel('직접 답안 작성').fill(getQuestion('C01.0').expected);await page.getByRole('button',{name:'정답 확인',exact:true}).click();await page.locator('[data-route="account"]').first().click();await page.getByRole('button',{name:'지금 동기화',exact:true}).click();await engineerReady(page);
  assert.equal((await db.query('SELECT jsonb_array_length(body->\'attempts\') AS n FROM engineer_private.progress WHERE user_id=$1',[a.id])).rows[0].n,1);assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),original);pass('Chromium real UI saves an engineer attempt while preserving guest original');
  const studyPage=await context.newPage();await studyPage.goto(study+'#account');await studyPage.getByRole('button',{name:'기존 WEB LAB 로그인 연결',exact:true}).click();await studyPage.getByRole('button',{name:'지금 동기화',exact:true}).waitFor({timeout:30000});await studyPage.locator('#account-sync-state').filter({hasText:'마지막 동기화'}).waitFor({timeout:30000});
  assert.equal((await db.query('SELECT count(*)::int AS n FROM study_private.progress WHERE user_id=$1',[a.id])).rows[0].n,1);pass('one existing managed session connects both apps without a second registration');
  browser2=await firefox.launch({headless:true});const context2=await browser2.newContext({viewport:{width:390,height:844}});await configure(context2);const second=await context2.newPage();await login(second,engineer,a);await engineerReady(second);await second.locator('[data-route="home"]').click();assert.equal(await second.locator('.metrics .metric').first().innerText().then(t=>/1/.test(t)),true);pass('Firefox second device loads the same engineer account record');
  const studyBefore=(await db.query('SELECT md5(body::text) AS fingerprint FROM study_private.progress WHERE user_id=$1',[a.id])).rows[0].fingerprint;
  await page.locator('[data-route="settings"]').click();await page.getByRole('button',{name:'이 앱 기록 삭제',exact:true}).click();await page.locator('[data-route="account"]').first().click();await engineerReady(page);
  assert.equal((await db.query('SELECT jsonb_array_length(body->\'attempts\') AS n FROM engineer_private.progress WHERE user_id=$1',[a.id])).rows[0].n,0);assert.equal((await db.query('SELECT md5(body::text) AS fingerprint FROM study_private.progress WHERE user_id=$1',[a.id])).rows[0].fingerprint,studyBefore);assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),original);pass('engineer reset preserves study data, identity and guest original');
  await studyPage.getByRole('button',{name:'로그아웃',exact:true}).click();await page.getByLabel('이메일',{exact:true}).waitFor({timeout:20000});await page.locator('[data-route="home"]').click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),original);pass('shared logout invalidates the other app UI and returns to preserved guest state');
  const keys=await page.evaluate(()=>Object.keys(localStorage));assert(keys.every(k=>!/(?:token|password|jwt)/i.test(k)));assert.deepEqual(errors,[]);pass('application Web Storage has no password/JWT/token keys; no browser page errors');
  await context.close();await context2.close();
  if(process.argv.includes('--webkit')){const wk=await webkit.launch({headless:true});try{const ctx=await wk.newContext();await configure(ctx);const p=await ctx.newPage();await p.goto(engineer+'#account');await p.getByLabel('이메일',{exact:true}).fill(a.email);await p.getByLabel('비밀번호',{exact:true}).fill(a.password);await p.locator('.auth-form').getByRole('button',{name:'로그인',exact:true}).click();await p.waitForFunction(()=>document.body.textContent.includes('로그인 세션을 유지하지 못했습니다')||document.body.textContent.includes('동기화 완료'),{},{timeout:30000});const connected=await p.getByRole('button',{name:'지금 동기화',exact:true}).count()>0;results.push({name:'WebKit managed cookie session',status:connected?'PASS':'LIMITED: managed session cookie unavailable; guest and backup remain available'});console.log('WebKit managed session:',connected?'connected':'cookie-limited');await ctx.close();}finally{await wk.close();}}
}catch(e){console.error('Live verification failed:',scrub(e.message));results.push({name:'live run',status:'FAIL',message:scrub(e.message)});process.exitCode=1;}
finally{
  await browser?.close();await browser2?.close();
  if(db)for(const f of created){try{if(f.id)await db.query('DELETE FROM neon_auth."user" WHERE id=$1 AND email=$2',[f.id,f.email]);else await db.query('DELETE FROM neon_auth."user" WHERE email=$1',[f.email]);await db.query('DELETE FROM neon_auth.verification WHERE identifier IN($1,$2,$3)',[f.email,'email-verification-otp-'+f.email,'forget-password-otp-'+f.email]);assert.equal((await db.query('SELECT count(*)::int AS n FROM neon_auth."user" WHERE email=$1',[f.email])).rows[0].n,0);}catch(e){diagnostic(e);}}
  await db?.end();await writeFile(resolve(output,candidate?'candidate-live.json':'production-live.json'),JSON.stringify({mode:candidate?'candidate frontend; real production Auth/Data API':'deployed frontend; real production Auth/Data API',results,inboxDelivery:'not tested; only disposable controlled verification'},null,2));
}
