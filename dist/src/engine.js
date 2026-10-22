import { questionCodes, getQuestion } from './questions.js';
import { concepts, groups } from './curriculum.js';
export const DAY = 86400000;
export const CONFIDENCE = Object.freeze(['guess','unsure','sure']);
export const CAUSES = Object.freeze(['none','concept','trace','calculation','term','format']);
export function dailyPlan(minutes){const portions={15:[3,4,8],30:[5,8,17],60:[10,15,35]}[minutes]??[5,8,17];return{review:portions[0],concept:portions[1],practice:portions[2]};}
function sqlTokens(text){
  const pattern=/\s+|'(?:''|[^'])*'|"(?:""|[^"])*"|[A-Za-z_][A-Za-z_0-9]*|\d+|>=|<=|<>|!=|[(),;.+*=<>-]/y,tokens=[];let at=0;
  while(at<text.length){pattern.lastIndex=at;const match=pattern.exec(text);if(!match)return null;const value=match[0];at=pattern.lastIndex;if(/^\s+$/.test(value))continue;tokens.push(value.startsWith("'")||value.startsWith('"')?value:value.toLowerCase());}
  if(tokens.at(-1)===';')tokens.pop();return JSON.stringify(tokens);
}
export function grade(question, answer) {
  if (!question || typeof answer!=='string' || answer.length>1200) return {correct:false,empty:true};
  const clean=['tokens','identifier'].includes(question.kind)?answer.trim():answer.normalize('NFKC').replace(/\r\n?/g,'\n').trim();if(!clean)return {correct:false,empty:true};
  let correct=false;
  if(question.kind==='tokens'){
    const tokens=sqlTokens(clean);correct=tokens!==null&&(question.aliases??[question.expected]).some(value=>sqlTokens(value)===tokens);
  }else if(question.kind==='term'){
    const normalize=text=>text.normalize('NFKC').toLowerCase().replace(/[\s-]+/g,'');
    correct=(question.aliases??[question.expected]).some(value=>normalize(value)===normalize(clean));
  }else if(question.kind==='identifier') correct=(question.aliases??[question.expected]).includes(clean);
  else if(question.kind==='number') correct=/^[+-]?\d+(?:\.0+)?$/.test(clean)&&Number.isFinite(Number(clean))&&Number(clean)===Number(question.expected);
  else if(question.kind==='table'){
    const normalize=text=>text.trim().split('\n').map(line=>line.split('|').map(cell=>cell.trim()).join('|')).join('\n');
    correct=normalize(clean)===normalize(question.expected);
  }else correct=clean===question.expected;
  return {correct,empty:false};
}
export function shuffled(items,entropy) {
  let x=entropy>>>0;const result=[...items];
  for(let i=result.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=x%(i+1);[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function sessionCodes(mode,entropy=1) {
  if(!['diagnostic','mock'].includes(mode))throw new RangeError('Unknown session mode');
  const quotas=mode==='mock'?{code:8,db:4,systems:4,dev:4}:{code:5,db:5,systems:5,dev:5};
  const selected=[],used=new Set();
  for(const [group,count]of Object.entries(quotas)){
    const candidates=shuffled(questionCodes.filter(code=>getQuestion(code).group===group),entropy+selected.length*101);
    const preferred=candidates.filter(code=>getQuestion(code).language!=='term'),terms=candidates.filter(code=>getQuestion(code).language==='term');
    const take=(pool,limit)=>{let added=0;for(const code of pool){if(added>=limit)break;const family=getQuestion(code).family;if(used.has(family))continue;selected.push(code);used.add(family);added++;}};
    if(mode==='diagnostic'){take(terms,2);take(preferred,count-2);}else take(preferred,count);
    take([...preferred,...terms],count-selected.filter(c=>getQuestion(c).group===group).length);
  }
  if(selected.length!==20)throw new Error('Insufficient verified families');return shuffled(selected,entropy+19);
}
export function scoreSession(session) {
  const items=session.codes.map((code,i)=>{const question=getQuestion(code),answer=session.answers[i]??'';return{code,answer,...grade(question,answer)};});
  return {items,score:items.filter(item=>item.correct).length*5,correct:items.filter(item=>item.correct).length,unanswered:items.filter(item=>item.empty).length};
}
export function conceptStatus(id,attempts,now=Date.now()) {
  const records=attempts.filter(a=>getQuestion(a.code)?.conceptIds.includes(id)).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  if(!records.length)return {state:'new',label:'시작 전',due:true,dueAt:0,correct:0,total:0,priority:4};
  const last=records.at(-1),success=records.filter(a=>a.correct&&!a.hinted),distinct=new Set(success.map(a=>a.code));
  const streak=[];for(let i=records.length-1;i>=0&&records[i].correct&&!records[i].hinted;i--)streak.push(records[i]);
  const delayed=streak.some(a=>streak.some(b=>a.id!==b.id&&Date.parse(b.at)-Date.parse(a.at)>=DAY));
  const applied=streak.some(a=>streak.some(b=>a.code!==b.code&&Date.parse(b.at)-Date.parse(a.at)>=DAY));
  const interval=last.correct&&!last.hinted?[1,3,7,14][Math.min(3,Math.max(0,streak.length-1))]:0;
  const dueAt=Date.parse(last.at)+(interval?interval*DAY:10*60000),due=dueAt<=now;
  const state=applied&&last.correct&&!last.hinted?'applied':delayed&&last.correct&&!last.hinted?'reviewed':'learning';
  return {state,label:{applied:'새 문제 확인',reviewed:'지연 복습 확인',learning:'연습 중'}[state],due,dueAt,correct:success.length,total:records.length,distinct:distinct.size,priority:(last.correct?1:8)+(last.confidence==='sure'&&!last.correct?4:0)+(last.hinted?2:0)+(due?3:0)};
}
export function reviewConcepts(attempts,now=Date.now()) {
  return concepts.map(c=>({...c,status:conceptStatus(c.id,attempts,now)})).filter(c=>c.status.total&&c.status.due).sort((a,b)=>b.status.priority-a.status.priority||a.status.dueAt-b.status.dueAt);
}
export function domainSummary(attempts) {
  return groups.map(g=>{const records=attempts.filter(a=>getQuestion(a.code)?.group===g.id);return {...g,total:records.length,unhinted:records.filter(a=>a.correct&&!a.hinted).length,correct:records.filter(a=>a.correct).length};});
}
export function remainingSeconds(session,now=Date.now()) {return session.mode==='mock'?Math.max(0,Math.ceil((session.deadline-now)/1000)):null;}
export function canEditSession(session,now=Date.now()){return !!session&&(session.mode==='diagnostic'||session.mode==='mock'&&session.deadline>now);}
export function nextVariant(code) {const q=getQuestion(code);if(!q)return null;const variants=questionCodes.filter(c=>getQuestion(c).family===q.family);return variants[(variants.indexOf(code)+1)%variants.length];}
