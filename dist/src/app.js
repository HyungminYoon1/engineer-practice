import { concepts, getConcept, groups, contentProfile } from './curriculum.js';
import { allFamilies, itemFamilies, questionCodes, getQuestion, selectCodes, familyChoices, nextFamilyCode } from './questions.js';
import { grade, shuffled, sessionCodes, scoreSession, conceptStatus, reviewConcepts, domainSummary, remainingSeconds, canEditSession, dailyPlan, nextVariant, DAY } from './engine.js';
import { createStore, KEY, MAX_BACKUP_SIZE } from './store.js';
import { coverageTopics, contentInventory, topicInventory } from './coverage.js';
import { studyGuides, getStudyGuide } from './study-guides.js';
import { el, button, questionBody, traceView, relatedConcepts, referenceLink, metric, emptyMessage } from './view.js';
const $=id=>document.getElementById(id), content=$('content');
const store=createStore({getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value),removeItem:key=>window.localStorage.removeItem(key)});
const names={home:'오늘 학습',guide:'학습 길잡이',concepts:'개념 학습',practice:'문제 풀이',review:'복습 노트',exam:'진단 · 모의시험',scope:'학습 범위',settings:'학습 기록 · 설정'};
let route='home',selectedGuide='code',selectedConcept='pointers',conceptQuery='',conceptGroup='all';
let filters={group:'all',language:'all',difficulty:'all',concept:null},practiceCode='C01.0',practice=null,finishedSession=null,timer=0;
const entropy=()=>crypto.getRandomValues(new Uint32Array(1))[0];
function notice(message=store.error){$('storage-notice').textContent=message;$('storage-notice').hidden=!message;}
function saveNotice(saved){notice(saved?'':store.error);}
function heading(title,description='',actions=null){return el('div',{class:'page-heading'},el('div',{},el('p',{class:'eyebrow'},'INFORMATION PROCESSING / PRACTICAL'),el('h1',{},title),description?el('p',{class:'muted small'},description):null),actions);}
function go(next){if(!Object.hasOwn(names,next))next='home';if(store.state.active&&['guide','concepts','practice','review','scope'].includes(next))next='exam';route=next;history.replaceState(null,'','#'+next);render();content.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function openConcept(id){if(!getConcept(id))return;selectedConcept=id;conceptQuery='';conceptGroup='all';go('concepts');}
function openQuestion(code){if(!getQuestion(code))return;practiceCode=code;practice=null;filters={group:'all',language:'all',difficulty:'all',concept:null};go('practice');}
function formatDate(at){return new Date(at).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function chip(group){const info=groups.find(g=>g.id===group);return el('span',{class:'group-chip '+info.color},info.name);}
function chooseSelect(id,label,values,value,onChange){return el('div',{class:'field'},el('label',{for:id},label),el('select',{id,value,onChange:event=>onChange(event.target.value)},values.map(([key,name])=>el('option',{value:key,selected:key===String(value)},name))));}
function preferredPractice(conceptId=null){const codes=conceptId?selectCodes({concept:conceptId}):questionCodes;const seen=new Set(store.state.attempts.map(a=>a.code));return shuffled(codes,entropy()).find(code=>!seen.has(code))??codes[0];}
function renderHome(){
  const attempts=store.state.attempts,due=reviewConcepts(attempts),summary=domainSummary(attempts),touched=concepts.filter(c=>conceptStatus(c.id,attempts).total).length,correct=attempts.filter(a=>a.correct&&!a.hinted).length;
  const next=due[0]??getConcept('pointers'),minutes=store.state.settings.minutes,plan=dailyPlan(minutes);
  content.append(heading('오늘 학습','개념을 이해하고, 답을 직접 쓰고, 틀린 과정을 다시 확인하세요.'));
  if(store.state.settings.examDate)content.append(el('p',{class:'small muted'},'시험 예정일 · '+store.state.settings.examDate));
  if(store.state.active){content.append(el('div',{class:'resume-bar'},el('div',{},el('strong',{},'진행 중인 '+(store.state.active.mode==='mock'?'모의시험':'진단평가')),el('p',{class:'small muted'},'작성한 답안을 이어서 풀 수 있습니다. 모의시험 시간은 계속 흐릅니다.')),button('이어서 풀기',()=>go('exam'))));return;}
  content.append(el('div',{class:'metrics'},metric('풀이 기록',attempts.length,'힌트·오답도 기록합니다'),metric('힌트 없이 정답',correct),metric('풀어본 개념',`${touched} / ${concepts.length}`),metric('복습할 개념',due.length)));
  content.append(el('div',{class:'two-columns'},el('section',{class:'daily-plan'},el('p',{class:'eyebrow'},`TODAY / ${minutes} MIN`),el('h2',{},next.title),el('p',{class:'muted'},next.rule),el('div',{class:'row'},button('추천 문제 풀기',()=>openQuestion(preferredPractice(next.id))),button('개념부터 보기',()=>openConcept(next.id),'button subtle')),el('div',{class:'plan-steps'},
    el('div',{class:'plan-step'},el('small',{},'01 / RETRIEVE'),el('strong',{},`복습 ${plan.review}분`),el('p',{},due.length?`${due.length}개 개념이 다시 풀 시점입니다.`:'이전에 읽은 내용을 먼저 떠올립니다.')),
    el('div',{class:'plan-step'},el('small',{},'02 / UNDERSTAND'),el('strong',{},`개념 ${plan.concept}분`),el('p',{},'규칙·예시·혼동하는 지점을 확인합니다.')),
    el('div',{class:'plan-step'},el('small',{},'03 / APPLY'),el('strong',{},`새 조건 ${plan.practice}분`),el('p',{},'다른 문제에서도 도움 없이 답을 써봅니다.')))),
    el('section',{class:'panel'},el('h3',{},'영역별 풀이'),el('div',{class:'domain-list'},summary.map(g=>el('div',{class:'domain-row'},el('div',{class:'row spread'},el('strong',{},g.name),el('small',{},`${g.unhinted} / ${g.total} 힌트 없이 정답`)),el('meter',{min:0,max:Math.max(1,g.total),value:g.unhinted,'aria-label':g.name+' 정답 기록'})))))));
  content.append(el('section',{class:'panel section-gap'},el('div',{class:'row spread'},el('div',{},el('h3',{},'어디서 시작할지 모르겠다면'),el('p',{class:'muted small'},'6개 학습 경로에서 풀이 순서와 예제를 익히거나, 20문항 진단평가로 현재 이해도를 확인하세요.')),el('div',{class:'row'},button('학습 길잡이',()=>go('guide')),button('진단평가 시작',()=>startSession('diagnostic'),'button subtle')))));
  const inventory=contentInventory();content.append(el('p',{class:'settings-note'},`${inventory.concepts}개 개념 · 코드 ${inventory.codeFamilies}·SQL ${inventory.sqlFamilies}·계산 ${inventory.calculationFamilies}·사례 ${inventory.scenarioFamilies}유형 · 단답 ${inventory.termItems}개. 총 ${inventory.items}문항은 고정 조건 변형을 포함합니다. 시간 배분은 권장 계획이며 강제 제한이 아닙니다.`),el('div',{class:'scope-warning'},el('p',{},'2026 출제기준의 12개 영역을 개념과 응용 문제로 연습합니다. 전체 기출이나 공식 채점 기준을 재현한 자료는 아닙니다.'),button('학습 범위별 문제 보기',()=>go('scope'),'link-button')));
}
function renderGuide(){
  const guide=getStudyGuide(selectedGuide)??studyGuides[0];
  content.append(heading('학습 길잡이','풀이 순서 → 예제 확인 → 직접 작성 순서로 연습합니다.'));
  content.append(chooseSelect('study-guide','학습할 주제',studyGuides.map(item=>[item.id,item.title]),guide.id,value=>{selectedGuide=value;render();}));
  content.append(el('section',{class:'guide-intro panel section-gap'},el('h2',{},guide.title),el('p',{class:'concept-rule'},guide.goal)));
  content.append(el('ol',{class:'guide-steps'},guide.steps.map((step,index)=>el('li',{class:'panel'},el('span',{class:'eyebrow'},`STEP ${index+1}`),el('h3',{},step.title),el('p',{},step.text),relatedConcepts(step.concepts,openConcept),button(getQuestion(step.question).title+' 풀기',()=>openQuestion(step.question),'button subtle section-gap')))));
  const q=getQuestion(guide.example),example=el('details',{class:'panel guide-example'},el('summary',{},'풀이 예제 · '+q.title));
  example.addEventListener('toggle',()=>{if(!example.open||example.dataset.loaded)return;example.dataset.loaded='true';example.append(questionBody(q,{showTitle:true}),el('h3',{class:'section-gap'},'정답과 근거'),el('pre',{class:'expected-answer'},q.expected),el('p',{},q.explanation),traceView(q));});
  content.append(example,el('section',{class:'panel section-gap guide-check'},el('h2',{},'설명할 수 있는지 확인하기'),el('p',{},guide.selfCheck),el('details',{},el('summary',{},'해설 확인'),el('p',{class:'section-gap'},guide.explanation)),el('div',{class:'row section-gap'},button('다른 조건으로 직접 풀기',()=>openQuestion(guide.practice))),referenceLink(guide.reference)));
}
function renderConcepts(){
  content.append(heading('개념 학습','선수 개념 → 핵심 규칙 → 예시 → 문제 풀이로 연결됩니다.',button('풀이 순서 보기',()=>go('guide'),'button subtle')));
  const list=el('div',{class:'concept-index'}),article=el('article',{class:'panel concept-article'});
  const search=el('input',{id:'concept-search',type:'search',placeholder:'개념 찾기',value:conceptQuery,maxlength:80,onInput:event=>{conceptQuery=event.target.value;updateList();}});
  content.append(el('div',{class:'filters'},chooseSelect('concept-group','영역',[['all','모든 영역'],...groups.map(g=>[g.id,g.name])],conceptGroup,value=>{conceptGroup=value;updateList();}),el('div',{class:'field'},el('label',{for:'concept-search'},'검색'),search)));
  content.append(el('div',{class:'concept-layout'},list,article));
  function updateList(){const entries=concepts.filter(c=>(conceptGroup==='all'||c.group===conceptGroup)&&[c.title,c.rule,c.id].join(' ').toLowerCase().includes(conceptQuery.toLowerCase()));article.hidden=!entries.length;if(entries.length&&!entries.some(c=>c.id===selectedConcept))selectedConcept=entries[0].id;list.replaceChildren(...entries.map(c=>button([el('span',{},c.title),el('small',{},conceptStatus(c.id,store.state.attempts).label)],()=>{selectedConcept=c.id;updateList();},c.id===selectedConcept?'selected':'')));if(!entries.length)list.append(el('p',{class:'muted small'},'조건에 맞는 개념이 없습니다.'));if(entries.length)updateArticle();}
  function updateArticle(){const c=getConcept(selectedConcept),status=conceptStatus(c.id,store.state.attempts);article.replaceChildren(el('div',{class:'row spread'},chip(c.group),el('span',{class:'status-chip'},status.label)),el('h2',{class:'section-gap'},c.title),el('p',{class:'concept-rule'},c.rule),el('div',{class:'example-block'},el('h3',{},'작은 예시'),el('p',{},c.example)),el('h3',{},'구별할 지점'),el('p',{},c.pitfall));if(c.prerequisites.length)article.append(el('h3',{class:'section-gap'},'먼저 익힐 개념'),relatedConcepts(c.prerequisites,id=>{selectedConcept=id;conceptQuery='';conceptGroup='all';search.value='';$('concept-group').value='all';updateList();}));article.append(el('div',{class:'row section-gap'},button('이 개념 문제 풀기',()=>{filters={group:'all',language:'all',difficulty:'all',concept:c.id};practiceCode=preferredPractice(c.id);practice=null;go('practice');})),referenceLink(c.reference));}
  updateList();updateArticle();
}
function renderPractice(){
  content.append(heading('문제 풀이','답안을 먼저 작성한 뒤 정답과 실행 과정을 확인합니다.',button('학습 길잡이',()=>go('guide'),'button subtle')));
  const values=[['all','모든 형식'],['c','C'],['java','Java'],['python','Python'],['sql','SQL'],['calculation','계산'],['scenario','사례 적용'],['term','개념 단답']];
  const leaveDraft=()=>!practice||practice.graded||!practice.answer.trim()||window.confirm('작성 중인 답안을 버리고 문제를 바꿀까요?');
  const change=(key,value)=>{if(!leaveDraft()){render();return;}filters[key]=value;filters.concept=null;practice=null;render();};
  const codes=selectCodes(filters);
  content.append(el('div',{class:'filters'},chooseSelect('practice-group','영역',[['all','모든 영역'],...groups.map(g=>[g.id,g.name])],filters.group,value=>change('group',value)),chooseSelect('practice-language','언어 · 형식',values,filters.language,value=>change('language',value)),chooseSelect('practice-difficulty','난이도',[['all','전체'],['1','기초'],['2','표준'],['3','응용']],filters.difficulty,value=>change('difficulty',value)),el('span',{class:'catalog-summary'},`${familyChoices(codes).length}유형 · ${codes.length}문항 (조건 변형 포함)${filters.concept?' · '+getConcept(filters.concept).title:''}`)));
  if(!codes.length){content.append(emptyMessage('문제가 없습니다','영역과 문제 유형의 조합을 바꿔주세요.',button('필터 초기화',()=>{filters={group:'all',language:'all',difficulty:'all',concept:null};render();},'button subtle')));return;}
  if(!codes.includes(practiceCode))practiceCode=codes[0];
  const q=getQuestion(practiceCode);
  const choices=familyChoices(codes),currentChoice=choices.find(item=>item.id===q.family);
  const switchQuestion=code=>{if(code===practiceCode)return;if(!leaveDraft()){render();return;}practiceCode=code;practice=null;render();};
  content.append(el('div',{class:'question-picker'},chooseSelect('practice-family','풀이 유형',choices.map((item,index)=>[item.id,item.language==='term'?`개념 단답 ${String(index+1).padStart(3,'0')}`:item.title]),q.family,value=>switchQuestion(choices.find(item=>item.id===value).codes[0])),chooseSelect('practice-variant','조건 선택',currentChoice.codes.map(code=>[code,`조건 ${getQuestion(code).variant+1} / ${currentChoice.codes.length}`]),q.code,switchQuestion),button('다른 유형',()=>switchQuestion(nextFamilyCode(q.code,codes)),'button subtle',{disabled:choices.length<2})));
  if(!practice||practice.code!==q.code)practice={code:q.code,answer:'',hinted:false,confidence:'unsure',started:performance.now(),graded:false,composing:false,attemptId:null};
  const ctx=practice,card=el('section',{class:'panel question-card'}),answerPanel=el('aside',{class:'panel answer-panel'});
  card.append(el('div',{class:'question-meta'},el('div',{class:'row'},chip(q.group),el('span',{}, {1:'기초',2:'표준',3:'응용'}[q.difficulty])),el('span',{class:'mono question-id'},ctx.graded?q.code+' · 자체 제작':'자체 제작')),questionBody(q,{showTitle:ctx.graded}));
  const bookmark=button(store.state.bookmarks.includes(q.code)?'표시 해제':'문제 표시',()=>{saveNotice(store.bookmark(q.code));bookmark.textContent=store.state.bookmarks.includes(q.code)?'표시 해제':'문제 표시';},'link-button');
  card.append(el('div',{class:'row spread'},bookmark));
  const form=el('form',{}),input=el('textarea',{id:'practice-answer',rows:q.kind==='tokens'?6:q.kind==='table'?5:3,maxlength:1200,value:ctx.answer,disabled:ctx.graded,'aria-describedby':'answer-help',spellcheck:'false'});
  input.addEventListener('input',()=>{ctx.answer=input.value;});input.addEventListener('compositionstart',()=>{ctx.composing=true;});input.addEventListener('compositionend',()=>{ctx.composing=false;ctx.answer=input.value;});
  const help={term:'허용 표기 목록으로 확인합니다. 영문 대소문자·공백 차이는 허용합니다.',identifier:'코드의 이름 한 개를 대소문자까지 정확히 입력하세요. 앞뒤 공백만 허용합니다.',number:'문제에서 요구한 단위의 정수를 입력하세요.',table:'각 행은 줄바꿈, 각 열은 |로 구분하세요. 예: 1|2|3',tokens:'문제에서 지정한 문장 형태를 사용하세요. 키워드 대소문자·줄바꿈·공백은 허용하지만 문자열 안의 값은 그대로 구분합니다.',output:'출력의 대소문자와 내부 공백을 그대로 입력하세요.'}[q.kind];
  const confidence=chooseSelect('practice-confidence','답에 대한 확신',[['guess','추측했어요'],['unsure','조금 헷갈려요'],['sure','확신해요']],ctx.confidence,value=>{ctx.confidence=value;});
  const submit=el('button',{type:'submit',class:'button answer-submit',disabled:ctx.graded},'정답 확인');
  const feedback=el('div',{}),hintBox=el('div',{class:'hint-box',hidden:!ctx.hinted},q.hint),hintButton=button('힌트 보기',()=>{if(ctx.graded)return;ctx.hinted=true;hintBox.hidden=false;hintButton.disabled=true;},'link-button hint-button',{disabled:ctx.graded||ctx.hinted});
  form.append(el('label',{for:'practice-answer'},'직접 답안 작성'),input,el('p',{id:'answer-help',class:'answer-help'},help),confidence,submit);
  form.addEventListener('submit',event=>{event.preventDefault();if(ctx.composing||ctx.graded)return;ctx.answer=input.value;const result=grade(q,ctx.answer);if(result.empty){notice('답안을 입력한 뒤 확인하세요.');input.focus();return;}
    ctx.graded=true;ctx.attemptId=crypto.randomUUID();ctx.result=result;
    const record={id:ctx.attemptId,code:q.code,answer:ctx.answer,correct:result.correct,hinted:ctx.hinted,confidence:ctx.confidence,elapsed:Math.min(86400000,Math.max(0,Math.round(performance.now()-ctx.started))),at:new Date().toISOString(),cause:'none'};
    saveNotice(store.append(record));input.disabled=true;submit.disabled=true;hintButton.disabled=true;confidence.querySelector('select').disabled=true;renderFeedback();
  });
  function renderFeedback(){feedback.replaceChildren();if(!ctx.graded)return;card.querySelector('.question-body').replaceWith(questionBody(q,{showTitle:true}));card.querySelector('.question-id').textContent=q.code+' · 자체 제작';const result=ctx.result??grade(q,ctx.answer);const panel=el('section',{class:'feedback '+(result.correct?'hit':'miss'),role:'status'},el('h3',{},result.correct?'✓ 정답':'다시 확인해보세요'),el('p',{class:'small muted'},ctx.hinted?'힌트를 사용한 풀이로 기록했습니다.':'힌트 없이 작성한 풀이입니다.'),el('pre',{class:'expected-answer'},q.expected),el('p',{},q.explanation),relatedConcepts(q.conceptIds,openConcept));
    if(!result.correct)panel.append(chooseSelect('error-cause','틀린 이유',[['none','아직 분류하지 않음'],['concept','개념을 몰랐어요'],['trace','실행 순서를 놓쳤어요'],['calculation','계산 실수'],['term','용어를 혼동했어요'],['format','답안 형식이 달랐어요']],store.state.attempts.find(a=>a.id===ctx.attemptId)?.cause??'none',cause=>saveNotice(store.classify(ctx.attemptId,cause))));
    panel.append(traceView(q),el('div',{class:'row section-gap'},button(nextVariant(q.code)===q.code?'다른 문제 풀기':'다른 조건으로 풀기',()=>{practiceCode=nextVariant(q.code)===q.code?shuffled(codes.filter(code=>code!==q.code),entropy())[0]??q.code:nextVariant(q.code);practice=null;render();window.scrollTo({top:0,behavior:'instant'});},'button subtle'),button('문제지 인쇄',()=>printQuestions([q.code],false),'link-button')));feedback.append(panel);
  }
  answerPanel.append(form,hintButton,hintBox,feedback);content.append(el('div',{class:'question-layout'},card,answerPanel));renderFeedback();
}
function renderReview(){
  content.append(heading('복습 노트','틀린 이유를 구분하고, 시간이 지난 뒤 다시 답을 떠올려 보세요.'));
  const due=reviewConcepts(store.state.attempts),wrong=store.state.attempts.filter(a=>!a.correct).slice(-25).reverse();
  if(!due.length)content.append(emptyMessage('지금 예정된 복습이 없습니다',store.state.attempts.length?'맞힌 문제도 시간이 지나면 복습 목록에 들어옵니다. 오답은 약 10분 뒤 다시 제시합니다.':'문제를 풀면 개념별 복습 일정이 만들어집니다.',button('문제 풀기',()=>go('practice'))));
  else content.append(el('div',{class:'review-list'},due.map(c=>el('article',{class:'review-item'},el('div',{},el('h3',{},c.title),el('p',{},`${c.status.label} · ${c.status.total}회 풀이 · 힌트 없이 정답 ${c.status.correct}회`)),el('div',{class:'row'},button('복습 문제',()=>openQuestion(preferredPractice(c.id)),'button subtle'),button('개념 확인',()=>openConcept(c.id),'link-button'))))));
  content.append(el('h2',{class:'section-gap'},'최근 오답'),el('div',{class:'review-list'},wrong.length?wrong.map(a=>{const q=getQuestion(a.code);return el('article',{class:'review-item'},el('div',{},el('h3',{},q.title),el('p',{},`${q.code} · ${formatDate(a.at)} · ${ {none:'분류 전',concept:'개념',trace:'실행 순서',calculation:'계산',term:'용어',format:'형식'}[a.cause]}`)),button('다시 풀기',()=>openQuestion(a.code),'button subtle'));}):el('p',{class:'muted'},'아직 오답 기록이 없습니다.')));
  if(store.state.bookmarks.length)content.append(el('h2',{class:'section-gap'},'표시한 문제'),el('div',{class:'review-list'},store.state.bookmarks.map(code=>el('div',{class:'review-item'},el('span',{},getQuestion(code).title+' · '+code),button('문제 열기',()=>openQuestion(code),'button subtle')))));
  content.append(el('p',{class:'settings-note'},'한 번 정답이면 연습 중, 하루 이상 지난 재시도는 지연 복습 확인으로 표시합니다. 다른 조건의 문제도 도움 없이 해결해야 새 문제 확인 상태가 됩니다. 반복한 단답만으로 응용 이해를 확정하지 않습니다.'));
}
function renderScope(){
  const inventory=contentInventory();content.append(heading('학습 범위','2026 실기 출제기준의 12개 영역별 개념과 응용 문제입니다.'));
  content.append(el('div',{class:'scope-warning'},el('strong',{},'이 앱을 다 푸는 것만으로 합격 준비가 끝나지는 않습니다.'),el('p',{},'큰 영역 12개에 관련 내용이 있지만 세부 항목 전체를 연습하지는 않습니다. 앱 점수는 자체 문항의 채점 결과이며 공식 합격 가능성을 뜻하지 않습니다.')));
  content.append(el('div',{class:'metrics'},metric('개념 단답',inventory.termItems),metric('코드 · SQL 유형',inventory.codeFamilies+inventory.sqlFamilies),metric('계산 · 사례 유형',inventory.calculationFamilies+inventory.scenarioFamilies),metric('전체 문항',inventory.items,'조건 변형 포함')));
  content.append(el('p',{class:'scope-summary'},`개념 ${inventory.concepts}개, 응용 풀이 ${inventory.reasoningFamilies}유형입니다. 같은 유형의 숫자 변형과 같은 답의 반복은 서로 다른 풀이 능력 ${inventory.items}개를 검증하는 것이 아닙니다. 아래 항목의 개념·문항은 서로 겹칠 수 있습니다.`));
  content.append(el('div',{class:'scope-grid'},coverageTopics.map((topic,i)=>{const n=topicInventory(topic);return el('article',{class:'panel'},el('div',{class:'row spread'},el('span',{class:'eyebrow'},String(i+1).padStart(2,'0')),el('span',{class:'status-chip'},topic.status)),el('h2',{},topic.name),el('p',{class:'small muted'},`연결 개념 ${n.concepts}개 · 응용 ${n.families}유형`),el('h3',{},'지금 연습할 내용'),el('p',{class:'small'},topic.provided),el('div',{class:'concept-links'},topic.practiceFamilies.map(id=>button(getQuestion(id+'.0').title,()=>openQuestion(id+'.0'),'button subtle'))),el('details',{class:'section-gap'},el('summary',{},'연결 개념 모두 보기'),relatedConcepts(topic.concepts,openConcept)),el('div',{class:'coverage-gap'},el('h3',{},'확장해서 연습할 조건'),el('p',{},topic.gap)),el('p',{class:'small'},topic.next));})));
  content.append(el('section',{class:'panel section-gap'},el('h2',{},'시험 준비에 활용하는 방법'),el('ol',{},el('li',{},'개념을 익힌 뒤 이 앱의 문제를 답안과 근거까지 직접 작성합니다.'),el('li',{},'연결된 개념을 하루 이상 지난 뒤 힌트 없이 다시 풀어봅니다.'),el('li',{},'위의 확장 조건은 2026 기준에 맞는 교재와 공개 자료의 다른 문제로 추가 연습합니다.'),el('li',{},'앱에서 보지 않은 구조의 문제를 제한 시간 안에 풀고 오답 원인을 확인합니다.')),referenceLink('exam')));
}
function startSession(mode){
  if(store.state.active){go('exam');return;}
  if(mode==='mock'&&!window.confirm('20문항 모의시험을 시작할까요? 제한 시간은 150분이며, 다른 화면으로 이동해도 시간이 계속 흐릅니다.'))return;
  const now=Date.now(),session={id:crypto.randomUUID(),mode,startedAt:new Date(now).toISOString(),deadline:mode==='mock'?now+9000000:null,codes:sessionCodes(mode,entropy()),answers:Array(20).fill(''),flagged:[],index:0};
  finishedSession=null;$('print-area').replaceChildren();saveNotice(store.active(session));go('exam');tick();
}
function finishSession(automatic=false){
  const current=store.state.active;if(!current)return;
  if(!automatic&&!window.confirm('시험을 제출할까요? 미응답 문항도 채점에 포함됩니다.'))return;
  const scored=scoreSession(current),endedAt=new Date().toISOString(),seconds=Math.min(86400,Math.max(0,Math.floor((Date.now()-Date.parse(current.startedAt))/1000)));
  const summary={id:current.id,mode:current.mode,endedAt,codes:[...current.codes],answers:[...current.answers],score:scored.score,seconds};
  const attempts=scored.items.map(item=>({id:crypto.randomUUID(),code:item.code,answer:item.answer,correct:item.correct,hinted:false,confidence:'unsure',elapsed:0,at:endedAt,cause:'none'}));
  saveNotice(store.finish(summary,attempts));finishedSession=store.state.sessions.find(s=>s.id===summary.id)??null;route='exam';render();
}
function renderExam(){
  const active=store.state.active;
  if(active){renderActive(active);return;}
  if(finishedSession){renderResult(finishedSession);return;}
  content.append(heading('진단 · 모의시험','학습 출발점과 실전 답안 작성 경험을 따로 확인합니다.'));
  content.append(el('div',{class:'exam-options'},el('section',{class:'panel exam-option'},el('p',{class:'eyebrow'},'DIAGNOSTIC'),el('h2',{},'학습 출발점 확인'),el('ul',{},el('li',{},'20문항 · 시간 제한 없음'),el('li',{},'네 영역을 균형 있게 확인'),el('li',{},'제출 후 문항별 해설과 취약 영역 확인')),button('진단평가 시작',()=>startSession('diagnostic'))),el('section',{class:'panel exam-option'},el('p',{class:'eyebrow'},'MOCK EXAM'),el('h2',{},'150분 실전 연습'),el('ul',{},el('li',{},'20문항 · 문항당 5점 · 100점'),el('li',{},'답안 자동 저장 · 문제 이동 · 나중에 다시 보기'),el('li',{},'제출·시간 종료 후에만 정답과 해설 공개')),button('모의시험 시작',()=>startSession('mock')))));
  content.append(el('p',{class:'settings-note'},'모의시험의 영역 배분은 앱의 연습 구성입니다. 공식 회차별 출제 비율이나 채점기준을 재현한다고 주장하지 않습니다.'));
  if(store.state.sessions.length)content.append(el('h2',{class:'section-gap'},'지난 시험'),sessionRows());
}
function sessionRows(){return el('div',{class:'session-list'},[...store.state.sessions].reverse().map(s=>el('div',{class:'session-row'},el('p',{},s.mode==='mock'?'모의시험':'진단평가',el('small',{},`${formatDate(s.endedAt)} · ${Math.floor(s.seconds/60)}분`)),el('strong',{class:'mono'},s.score+' / 100'),button('결과 보기',()=>{finishedSession=s;go('exam');},'button subtle'))));}
function renderActive(session){
  const q=getQuestion(session.codes[session.index]),answered=session.answers.filter(a=>a.trim()).length;
  content.append(heading(session.mode==='mock'?'모의시험 진행 중':'진단평가 진행 중',`문항 ${session.index+1} / 20 · 답안 작성 ${answered} / 20`));
  const card=el('section',{class:'panel question-card'},el('div',{class:'question-meta'},chip(q.group),el('span',{class:'mono'},`문항 ${session.index+1}`)),questionBody(q)),aside=el('aside',{class:'panel answer-panel'});
  const input=el('textarea',{id:'exam-answer',rows:5,maxlength:1200,value:session.answers[session.index],spellcheck:'false'}),saved=el('p',{class:'answer-help'},'답안은 입력할 때 자동 저장됩니다. 제출 전에는 채점하지 않습니다.');
  const editable=()=>{const current=store.state.active;if(!current||current.id!==session.id)return false;if(!canEditSession(current)){finishSession(true);return false;}return true;};
  input.addEventListener('input',()=>{if(!editable())return;const current=store.state.active;const next=structuredClone(current);next.answers[session.index]=input.value;const ok=store.active(next);saved.textContent=ok?'답안 저장됨':'화면에만 유지 · 저장 상태를 확인하세요.';saveNotice(ok);updateMap();});
  const map=el('div',{class:'exam-map'}),flag=el('input',{id:'exam-flag',type:'checkbox',checked:session.flagged.includes(session.index)});
  flag.addEventListener('change',()=>{if(!editable())return;const next=structuredClone(store.state.active);next.flagged=flag.checked?[...new Set([...next.flagged,session.index])]:next.flagged.filter(n=>n!==session.index);saveNotice(store.active(next));updateMap();});
  function move(index){if(!editable())return;const current=store.state.active;saveNotice(store.active({...structuredClone(current),index}));render();$('exam-answer')?.focus({preventScroll:true});}
  function updateMap(){const current=store.state.active;if(!current)return;map.replaceChildren(...current.codes.map((code,i)=>button(String(i+1).padStart(2,'0'),()=>move(i),(current.answers[i].trim()?'answered ':'')+(current.flagged.includes(i)?'flagged ':'')+(i===current.index?'current':''),{'aria-label':`${i+1}번 문제${current.answers[i].trim()?', 답안 있음':''}${current.flagged.includes(i)?', 다시 볼 문제':''}`})));}
  aside.append(el('label',{for:'exam-answer'},'답안 작성'),input,saved,el('label',{class:'flag-control',for:'exam-flag'},flag,'나중에 다시 보기'),el('h3',{class:'section-gap'},'문항 이동'),map,el('div',{class:'row'},button('← 이전',()=>move(session.index-1),'button subtle',{disabled:session.index===0}),button('다음 →',()=>move(session.index+1),'button subtle',{disabled:session.index===19})),el('div',{class:'exam-controls'},button('시험 제출',()=>finishSession()),button('문제지 인쇄',()=>printQuestions(session.codes,false),'link-button'),button('시험 중단',()=>{if(!editable()||!window.confirm('시험을 중단하고 작성한 답안을 버릴까요? 완료 기록은 남기지 않습니다.'))return;saveNotice(store.active(null));finishedSession=null;render();},'link-button')),el('p',{class:'small muted section-gap'},'파란 칸: 답안 있음 · 밑줄: 다시 볼 문제. 정답·힌트는 제출 후 확인합니다.'));
  content.append(el('div',{class:'question-layout'},card,aside));updateMap();
}
function renderResult(session){
  const result=scoreSession(session),stats=groups.map(g=>{const items=result.items.filter(item=>getQuestion(item.code).group===g.id);return {...g,count:items.length,correct:items.filter(item=>item.correct).length};});
  content.append(heading(session.mode==='mock'?'모의시험 결과':'진단평가 결과',`${formatDate(session.endedAt)} · 학습용 모의점수`,el('div',{class:'row'},button('새 시험 선택',()=>{finishedSession=null;render();},'button subtle'),button('문제지 인쇄',()=>printQuestions(session.codes,false),'button subtle'),button('해설지 인쇄',()=>printQuestions(session.codes,true),'button subtle'))));
  if(session.score!==result.score)content.append(el('p',{class:'grading-update muted'},`저장된 점수 ${session.score}점 · 현재 채점 기준 ${result.score}점. SQL 문자열·Java 메서드명 채점이 수정되어 차이가 생겼습니다. 원래 기록은 유지하며 아래 해설에는 현재 기준을 적용합니다.`));
  content.append(el('section',{class:'panel'},el('div',{class:'row spread'},el('div',{},el('strong',{class:'exam-result-score'},String(result.score)),el('span',{class:'muted'},' / 100')),el('p',{class:'muted'},`${result.correct}/20 정답 · 미응답 ${result.unanswered}개 · 실제 시험 합격·공식 부분점수 판정은 아닙니다.`)),el('div',{class:'metrics'},stats.map(g=>metric(g.name,`${g.correct} / ${g.count}`)))));
  content.append(el('h2',{class:'section-gap'},'문항별 확인'));
  for(const [i,item]of result.items.entries()){
    const q=getQuestion(item.code),detail=el('details',{class:'result-item'},el('summary',{},`${String(i+1).padStart(2,'0')} · ${item.empty?'미응답':item.correct?'정답':'오답'} · ${q.title}`));
    detail.addEventListener('toggle',()=>{if(!detail.open||detail.dataset.loaded)return;detail.dataset.loaded='true';detail.append(questionBody(q,{showTitle:true}),el('p',{class:'small muted'},'작성한 답안'),el('pre',{class:'expected-answer'},item.answer||'미응답'),el('p',{class:'small muted'},'정답'),el('pre',{class:'expected-answer'},q.expected),el('p',{},q.explanation),traceView(q),relatedConcepts(q.conceptIds,openConcept),button('이 문제 다시 풀기',()=>openQuestion(q.code),'link-button'));});content.append(detail);
  }
}
function renderSettings(){
  content.append(heading('학습 기록 · 설정','기록은 이 브라우저에만 저장됩니다. 백업 파일로 다른 기기에 옮길 수 있습니다.'));
  content.append(el('div',{class:'profile-box'},el('strong',{},'2026 대비'),el('p',{},'자체 제작 문제입니다. 2027~2029 출제기준 반영은 준비 중입니다.')));
  const settings=el('section',{class:'panel'},el('h2',{},'학습 계획'),chooseSelect('study-minutes','하루 학습 시간',[['15','15분'],['30','30분'],['60','60분']],store.state.settings.minutes,value=>saveNotice(store.settings({minutes:Number(value)}))));
  const examDate=el('input',{id:'exam-date',type:'date',min:'2000-01-01',max:'2099-12-31',value:store.state.settings.examDate,onChange:event=>{if(!event.target.checkValidity()){event.target.value=store.state.settings.examDate;notice('시험 예정일은 2000년부터 2099년까지 입력하세요.');return;}saveNotice(store.settings({examDate:event.target.value}));}});settings.append(el('div',{class:'field'},el('label',{for:'exam-date'},'시험 예정일 (선택)'),examDate),el('p',{class:'muted small'},'학습 시간은 오늘 계획의 길이를 선택하는 설정입니다. 복습 주기는 풀이 결과와 경과 시간을 기준으로 정합니다.'));
  const file=el('input',{id:'backup-file',type:'file',accept:'.json,application/json',class:'file-input'}),backup=el('section',{class:'panel'},el('h2',{},'기록 백업'),el('p',{},`최근 ${store.state.attempts.length}개 풀이, ${store.state.bookmarks.length}개 표시 문제, ${store.state.sessions.length}개 시험 기록.`),button('백업 내려받기',()=>downloadBackup(),'button subtle'),el('label',{for:'backup-file',class:'section-gap'},'백업 파일 복원'),file);
  file.addEventListener('change',async()=>{const picked=file.files?.[0];if(!picked)return;try{if(picked.size>MAX_BACKUP_SIZE)throw new Error('백업 파일이 너무 큽니다.');const bytes=await picked.arrayBuffer();if(!file.isConnected||file.files?.[0]!==picked)return;const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(!window.confirm('이 앱의 현재 기록을 백업 파일의 기록으로 바꿀까요? 다른 앱의 기록은 변경하지 않습니다.'))return;const ok=store.restore(raw);finishedSession=null;practice=null;saveNotice(ok);render();tick();}catch{if(file.isConnected&&file.files?.[0]===picked)notice('백업 형식이나 저장 상태를 확인하세요. 올바르지 않은 파일은 복원하지 않았습니다.');}finally{if(file.files?.[0]===picked)file.value='';}});
  backup.append(el('hr',{class:'divider'}),button('이 앱 기록 삭제',()=>{if(!window.confirm('정보처리기사 실기 학습실의 풀이·시험·설정 기록을 모두 삭제할까요? 다른 앱의 데이터는 삭제하지 않습니다.'))return;const ok=store.clear();if(ok){finishedSession=null;practice=null;}saveNotice(ok);render();},'button danger'));
  content.append(el('div',{class:'settings-grid'},settings,backup),el('p',{class:'settings-note'},'풀이 최대 2048개·표시 문제 128개·완료 시험 20개를 보관합니다. 기록 개수 또는 전체 1,048,576자 한도를 넘으면 오래된 풀이부터 제외하며 진행 중 답안은 유지합니다. 동시 탭의 저장은 충돌할 수 있습니다. 같은 GitHub Pages 출처의 다른 앱도 브라우저 저장 공간에 접근할 수 있으므로 공용 기기에서는 사용 후 기록을 삭제하세요. 저장 실패나 손상은 안내하고 원본을 임의로 덮어쓰지 않습니다.'));
  content.append(el('section',{class:'panel section-gap'},el('h3',{},'시험 안내와 제작 범위'),el('p',{class:'small muted'},'공식 실기는 필답형 150분이며 합격기준은 60/100입니다. 이 앱의 문제는 자체 제작 학습 자료이고 영역별 출제 비율·공식 채점표·합격확률을 예측하지 않습니다. 코드·SQL 변형은 배포 전 실제 실행 결과를 검사합니다. 브라우저 안에서는 임의의 사용자 코드를 실행하거나 AI에 답안을 보내지 않습니다.'),referenceLink('exam')));
  if(store.state.sessions.length)content.append(el('h2',{class:'section-gap'},'완료한 시험'),sessionRows());
}
function downloadBackup(){const url=URL.createObjectURL(new Blob([store.export()],{type:'application/json;charset=utf-8'})),a=el('a',{href:url,download:'engineer-practice-backup.json'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function buildPrintSheet(codes,answers){
  if(answers&&store.state.active)return;
  const sheet=el('div',{class:'print-sheet'},el('h1',{},answers?'정보처리기사 실기 학습실 · 정답과 해설':'정보처리기사 실기 학습실 · 문제지'),el('p',{class:'small'},'2026 대비 자체 제작 · '+codes.length+'문항'));
  for(const [i,code]of codes.entries()){const q=getQuestion(code),section=el('article',{class:'print-item'},el('h3',{},answers?`${i+1}. ${q.title} / ${code}`:`${i+1}. 문제`));if(answers)section.append(el('pre',{class:'expected-answer'},q.expected),el('p',{},q.explanation));else section.append(questionBody(q,{showTitle:false}),el('div',{class:'write-lines','aria-label':'답안 작성 공간'}));sheet.append(section);}
  $('print-area').replaceChildren(sheet);
}
function printQuestions(codes,answers){buildPrintSheet(codes,answers);window.print();}
window.addEventListener('beforeprint',()=>{if(store.state.active)buildPrintSheet(store.state.active.codes,false);});
function render(){
  if(store.state.active&&['guide','concepts','practice','review','scope'].includes(route))route='exam';
  content.replaceChildren();$('page-label').textContent=names[route];
  for(const nav of document.querySelectorAll('[data-route]')){if(nav.dataset.route===route)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');}
  ({home:renderHome,guide:renderGuide,concepts:renderConcepts,practice:renderPractice,review:renderReview,exam:renderExam,scope:renderScope,settings:renderSettings})[route]();notice();updateClock();
}
function updateClock(){const session=store.state.active;const seconds=session?remainingSeconds(session):null;$('session-clock').hidden=seconds===null;if(seconds!==null)$('session-clock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function tick(){updateClock();if(store.state.active?.mode==='mock'&&remainingSeconds(store.state.active)===0)finishSession(true);}
for(const nav of document.querySelectorAll('[data-route]'))nav.addEventListener('click',()=>go(nav.dataset.route));
window.addEventListener('hashchange',()=>{const value=location.hash.slice(1);if(Object.hasOwn(names,value)){route=value;render();}});
window.addEventListener('storage',event=>{if(event.key!==KEY)return;store.refresh();if(!practice?.composing)render();});
window.addEventListener('pagehide',()=>clearInterval(timer));
window.addEventListener('focus',tick);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
window.addEventListener('pageshow',()=>{clearInterval(timer);timer=setInterval(tick,1000);tick();});
route=Object.hasOwn(names,location.hash.slice(1))?location.hash.slice(1):'home';
render();timer=setInterval(tick,1000);tick();
