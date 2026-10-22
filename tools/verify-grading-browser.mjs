import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { getQuestion } from '../dist/src/questions.js';
import { sessionCodes } from '../dist/src/engine.js';

const {chromium}=createRequire(resolve(process.argv[2]))('playwright');
const base=(process.argv[3]??'http://127.0.0.1:4174/').replace(/\/?$/,'/'),phase=process.argv[4]??'local';
assert.match(phase,/^[a-z0-9-]+$/);
const out=resolve('output/playwright/grading-20261022',phase);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
const blank=()=>({version:1,settings:{minutes:30,target:'2026',examDate:''},attempts:[],bookmarks:[],sessions:[],active:null});
function fixture(mode){const now=Date.now(),state=blank();state.active={id:crypto.randomUUID(),mode,startedAt:new Date(now).toISOString(),deadline:mode==='mock'?now+9000000:null,codes:['T-structs.0','X11.0',...sessionCodes(mode,17).filter(c=>!['T-structs.0','X11.0'].includes(c))].slice(0,20),answers:Array(20).fill(''),flagged:[],index:0};return state;}
async function check(name,run){const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());try{await page.goto(base);await page.locator('#content h1').waitFor();await page.evaluate(()=>{localStorage.removeItem('engineer-practice-v1');window.print=()=>{};});await run(page);checks.push({name,status:'PASS'});}catch(e){checks.push({name,status:'FAIL',message:e.message});}finally{await context.close();}}
async function seed(page,state,route='exam'){await page.evaluate(state=>localStorage.setItem('engineer-practice-v1',JSON.stringify(state)),state);await page.goto(base+'#'+route);await page.reload();await page.locator('#content h1').waitFor();await page.evaluate(()=>{window.print=()=>{};});}
async function hiddenQuestion(page,q){const card=page.locator('.question-card');assert.equal(await card.locator('h2').filter({hasText:q.title}).count(),0,'unsubmitted title exposes the answer');assert.equal(await card.locator('.concept-links,.reference-link').count(),0,'unsubmitted question exposes concept metadata');assert.equal((await card.textContent()).includes(q.code),false,'internal concept ID leaks through a visible question code');}
try{
  for(const mode of ['diagnostic','mock']){
    await check(mode+' hides answer metadata and preserves answers across reload',async page=>{
      const state=fixture(mode);await seed(page,state);await hiddenQuestion(page,getQuestion('T-structs.0'));
      await page.locator('#exam-answer').fill('구조체');await page.reload();await page.locator('#exam-answer').waitFor();assert.equal(await page.locator('#exam-answer').inputValue(),'구조체');await hiddenQuestion(page,getQuestion('T-structs.0'));
      await page.screenshot({path:resolve(out,mode+'-question.png')});
    });
    await check(mode+' print sheet excludes titles and submission reveals explanations',async page=>{
      const state=fixture(mode);await seed(page,state);await page.getByRole('button',{name:'문제지 인쇄',exact:true}).click();
      const headings=await page.locator('#print-area .print-item h3').allTextContents();assert.equal(headings.length,20);
      for(const [i,code]of state.active.codes.entries()){const q=getQuestion(code);assert.equal(headings[i].includes(q.title),false,'printed title leaks '+code);assert.equal(headings[i].includes(code),false,'printed code leaks '+code);}
      assert.equal(await page.locator('#print-area .reference-link').count(),0);
      await page.locator('#exam-answer').fill('구조체');await page.getByRole('button',{name:'다음 →',exact:true}).click();await page.locator('#exam-answer').fill('setstring');await page.getByRole('button',{name:'시험 제출',exact:true}).click();
      await page.locator('.exam-result-score').waitFor();assert.equal(await page.locator('.exam-result-score').textContent(),'5');
      await page.locator('.result-item').first().locator('summary').click();await page.locator('.result-item').first().locator('.concept-links button').first().waitFor();assert.equal(await page.locator('.result-item').first().locator('h2').textContent(),'구조체');
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('engineer-practice-v1')));assert.equal(saved.sessions[0].score,5);assert.equal(saved.attempts.find(a=>a.code==='X11.0').correct,false);
    });
  }
  await check('practice reveals term title and related concepts only after grading',async page=>{
    await page.goto(base+'#practice');await page.locator('#practice-family').selectOption('T-structs');await hiddenQuestion(page,getQuestion('T-structs.0'));
    assert.equal(await page.locator('#practice-family option:checked').textContent()==='구조체',false,'selected term family leaks the answer');
    await page.locator('#practice-answer').fill('구조체');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await page.locator('.feedback.hit').waitFor();assert.equal(await page.locator('.question-card h2').textContent(),'구조체');assert.equal(await page.locator('.feedback .concept-links button').count()>0,true);
  });
  await check('practice applies case-sensitive Java grading and explains the format',async page=>{
    await page.goto(base+'#practice');await page.locator('#practice-family').selectOption('X11');assert.match(await page.locator('#answer-help').textContent(),/대소문자/);
    await page.locator('#practice-answer').fill('setstring');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await page.locator('.feedback.miss').waitFor();
    await page.getByRole('button',{name:'다른 조건으로 풀기',exact:true}).click();await page.locator('#practice-answer').fill('setString');await page.getByRole('button',{name:'정답 확인',exact:true}).click();await page.locator('.feedback.hit').waitFor();
    const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('engineer-practice-v1')).attempts);assert.deepEqual(records.map(a=>a.correct),[false,true]);
  });
  await check('old JDBC score remains readable with a current-rubric explanation',async page=>{
    const state=fixture('diagnostic'),s=state.active;s.answers[1]='setstring';state.active=null;state.sessions=[{id:s.id,mode:s.mode,endedAt:new Date().toISOString(),codes:s.codes,answers:s.answers,score:5,seconds:1}];
    await seed(page,state);await page.getByRole('button',{name:'결과 보기',exact:true}).click();assert.match(await page.locator('.grading-update').textContent(),/저장된 점수 5점.*현재 채점 기준 0점/);assert.equal((await page.locator('.grading-update').textContent()).includes('Java'),true);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('engineer-practice-v1')).sessions[0].score),5);
  });
  await check('320px question and feedback fit without horizontal overflow',async page=>{
    await page.setViewportSize({width:320,height:900});await seed(page,fixture('diagnostic'));await hiddenQuestion(page,getQuestion('T-structs.0'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:resolve(out,'diagnostic-320.png')});
  });
  const report={status:checks.every(c=>c.status==='PASS')&&!errors.length?'PASS':'FAIL',base,phase,checks,errors};await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
}finally{await browser.close();}
