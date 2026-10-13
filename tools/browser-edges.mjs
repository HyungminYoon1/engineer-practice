import assert from 'node:assert/strict';
import { sessionCodes } from '../dist/src/engine.js';
import { getQuestion } from '../dist/src/questions.js';
const KEY='engineer-practice-v1';
const blank=()=>({version:1,settings:{minutes:30,target:'2026',examDate:''},attempts:[],bookmarks:[],sessions:[],active:null});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export async function verifyEngineerHistoricGrade(browser,base){
  const context=await browser.newContext(),page=await context.newPage();
  try{
    const state=blank(),q=getQuestion('S13.0'),codes=sessionCodes('diagnostic',17);codes[0]=q.code;const answers=Array(20).fill('');answers[0]=q.expected.replace('A team','Ａ team');
    state.sessions=[{id:crypto.randomUUID(),mode:'diagnostic',endedAt:'2026-10-13T00:00:00.000Z',codes,answers,score:5,seconds:1}];
    await context.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:KEY,state});
    await page.goto(base+'/engineer-practice/#exam');await page.getByRole('button',{name:'결과 보기',exact:true}).click();
    assert.equal(await page.locator('.grading-update').count(),1,'historical/current grade difference needs an explicit explanation');
    assert.match(await page.locator('.grading-update').textContent(),/저장된 점수 5점.*현재 채점 기준 0점/);
    assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).sessions[0].score,KEY),5);return{historicalGradePreservedAndExplained:true};
  }finally{await context.close();}
}

export async function verifyEngineerStaleSubmit(browser,base){
  const context=await browser.newContext(),page=await context.newPage();
  try{page.on('dialog',d=>d.accept());await page.goto(base+'/engineer-practice/#exam');await page.getByRole('button',{name:'진단평가 시작',exact:true}).click();
    // Model a same-origin deletion before its delayed storage event is delivered.
    await page.evaluate(k=>localStorage.removeItem(k),KEY);await page.getByRole('button',{name:'시험 제출',exact:true}).click();
    assert.equal(await page.locator('.result-item').count(),0,'rejected stale submission must not display a completed result');
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),null);return{staleSubmission:true};
  }finally{await context.close();}
}

export async function verifyEngineerDate(page,base){
  const errors=[];const collect=e=>errors.push(e.message);page.on('pageerror',collect);
  try{await page.goto(base+'/engineer-practice/#settings');await page.locator('#exam-date').fill('2026-12-01');await page.locator('#study-minutes').focus();
    await page.locator('#exam-date').fill('2100-01-01');await page.locator('#study-minutes').focus();await pause(30);
    assert.deepEqual(errors,[],'out-of-range calendar input must not throw from its event callback');
    assert.equal(await page.locator('#exam-date').inputValue(),'2026-12-01');
    assert.match(await page.locator('#storage-notice').textContent(),/날짜|예정일/);return{calendarBoundary:true};
  }finally{page.off('pageerror',collect);}
}

export async function verifyEngineerLateBackup(browser,base){
  const context=await browser.newContext();const page=await context.newPage();
  try{
    await context.addInitScript(()=>{const original=File.prototype.arrayBuffer;File.prototype.arrayBuffer=function(){const content=original.call(this);if(this.name==='slow.json')return new Promise(resolve=>{window.releaseSlowBackup=()=>content.then(resolve);});return content;};});
    let confirms=0;page.on('dialog',async dialog=>{confirms++;await dialog.accept();});
    await page.goto(base+'/engineer-practice/#settings');const state=blank();state.settings.minutes=15;
    await page.locator('#backup-file').setInputFiles({name:'slow.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
    await page.locator('[data-route="practice"]').click();await page.locator('#practice-answer').fill('still editing');
    await page.evaluate(()=>window.releaseSlowBackup());await pause(50);
    assert.equal(confirms,0,'detached import must not reopen a replacement confirmation');assert.equal(await page.locator('#practice-answer').inputValue(),'still editing');
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),null);return{lateDetachedImport:true};
  }finally{await context.close();}
}

export async function verifyEngineerFlows(page,base,{capture}={}){
  const checks=[],errors=[];const collect=e=>errors.push(e.message);page.on('pageerror',collect);
  const check=(name,value)=>{assert.ok(value,name);checks.push(name);};let accept=true;const dialog=async d=>accept?d.accept():d.dismiss();page.on('dialog',dialog);
  try{
    await page.goto(base+'/engineer-practice/#practice');await page.locator('#practice-answer').fill('');await page.getByRole('button',{name:'정답 확인',exact:true}).click();check('blank answer is not graded',await page.locator('.feedback').count()===0);
    await page.locator('#practice-answer').fill('draft kept');accept=false;await page.getByRole('button',{name:'다른 유형',exact:true}).click();check('cancelled question switch preserves draft',await page.locator('#practice-answer').inputValue()==='draft kept');accept=true;
    await page.locator('#practice-answer').fill('wrong');await page.getByRole('button',{name:'정답 확인',exact:true}).click();
    check('first answer disables duplicate submit',await page.getByRole('button',{name:'정답 확인',exact:true}).isDisabled());
    check('one graded attempt only',await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).attempts.length,KEY)===1);
    await page.locator('[data-route="exam"]').click();accept=false;await page.getByRole('button',{name:'모의시험 시작',exact:true}).click();check('cancelled mock does not start',await page.locator('#exam-answer').count()===0);accept=true;
    await page.getByRole('button',{name:'진단평가 시작',exact:true}).click();await page.locator('#exam-answer').fill('draft 01');await page.locator('#exam-flag').check();await page.getByRole('button',{name:'다음 →',exact:true}).click();await page.reload();await page.getByRole('button',{name:'← 이전',exact:true}).click();
    check('exam draft and flag survive navigation and reload',await page.locator('#exam-answer').inputValue()==='draft 01'&&await page.locator('#exam-flag').isChecked());
    await page.locator('[data-route="guide"]').click();check('active exam blocks guide answers',await page.locator('#exam-answer').count()===1&&await page.locator('.guide-example').count()===0);
    accept=false;await page.getByRole('button',{name:'시험 중단',exact:true}).click();check('cancelled abandon retains active exam',await page.locator('#exam-answer').count()===1);accept=true;
    await page.getByRole('button',{name:'시험 제출',exact:true}).click();check('submitted diagnostic renders 20 reviewed items',await page.locator('.result-item').count()===20);
    await page.locator('[data-route="settings"]').click();const before=await page.evaluate(k=>localStorage.getItem(k),KEY);
    await page.locator('#backup-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await pause(30);
    check('invalid backup preserves existing bytes',await page.evaluate(k=>localStorage.getItem(k),KEY)===before);
    const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'백업 내려받기',exact:true}).click();const download=await downloadPromise;check('backup downloads a local JSON file',download.suggestedFilename()==='engineer-practice-backup.json');
    if(capture)await download.saveAs(capture+'/engineer-backup.json');
    accept=false;await page.getByRole('button',{name:'이 앱 기록 삭제',exact:true}).click();check('cancelled deletion preserves bytes',await page.evaluate(k=>localStorage.getItem(k),KEY)===before);accept=true;
    for(const width of [1440,390,320]){await page.setViewportSize({width,height:width===1440?1000:844});await page.locator('[data-route="guide"]').click();await page.locator('.guide-example summary').click();check('guide fits width '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(capture)await page.screenshot({path:capture+'/engineer-'+width+'.png',scale:'css'});}
    check('no page errors',errors.length===0);return{checks,errors};
  }finally{page.off('dialog',dialog);page.off('pageerror',collect);}
}
