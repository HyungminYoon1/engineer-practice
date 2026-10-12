import { getQuestion } from './questions.js';
import { grade, scoreSession, CONFIDENCE, CAUSES } from './engine.js';
export const KEY='engineer-practice-v1', MAX_SIZE=1048576, MAX_ATTEMPTS=2048;
const exact=(item,keys)=>item&&typeof item==='object'&&!Array.isArray(item)&&Object.keys(item).every(key=>keys.includes(key))&&keys.every(key=>Object.hasOwn(item,key));
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const date=value=>typeof value==='string'&&value.length===24&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const calendarDate=value=>typeof value==='string'&&/^20\d\d-\d\d-\d\d$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const answer=value=>typeof value==='string'&&value.length<=1200;
export function emptyState(){return{version:1,settings:{minutes:30,target:'2026',examDate:''},attempts:[],bookmarks:[],sessions:[],active:null};}
export function validateState(value) {
  if(!exact(value,['version','settings','attempts','bookmarks','sessions','active'])||value.version!==1)throw new Error('지원하지 않는 기록 형식입니다. 백업을 확인하거나 기록을 삭제하세요.');
  if(!exact(value.settings,['minutes','target','examDate'])||![15,30,60].includes(value.settings.minutes)||value.settings.target!=='2026'||(value.settings.examDate!==''&&!calendarDate(value.settings.examDate)))throw new Error('학습 설정이 올바르지 않습니다.');
  if(!Array.isArray(value.attempts)||value.attempts.length>MAX_ATTEMPTS||!Array.isArray(value.bookmarks)||value.bookmarks.length>128||!Array.isArray(value.sessions)||value.sessions.length>20)throw new Error('기록 개수 제한을 초과했습니다.');
  const ids=new Set();
  for(const a of value.attempts){
    if(!exact(a,['id','code','answer','correct','hinted','confidence','elapsed','at','cause'])||!uuid(a.id)||ids.has(a.id)||!getQuestion(a.code)||!answer(a.answer)||typeof a.correct!=='boolean'||typeof a.hinted!=='boolean'||!CONFIDENCE.includes(a.confidence)||!Number.isInteger(a.elapsed)||a.elapsed<0||a.elapsed>86400000||!date(a.at)||!CAUSES.includes(a.cause)||grade(getQuestion(a.code),a.answer).correct!==a.correct)throw new Error('문제 풀이 기록이 올바르지 않습니다.');ids.add(a.id);
  }
  if(new Set(value.bookmarks).size!==value.bookmarks.length||value.bookmarks.some(code=>!getQuestion(code)))throw new Error('표시한 문제 목록이 올바르지 않습니다.');
  const sessionIds=new Set();
  function codesValid(s){return Array.isArray(s.codes)&&s.codes.length===20&&new Set(s.codes).size===20&&s.codes.every(code=>getQuestion(code))&&Array.isArray(s.answers)&&s.answers.length===20&&s.answers.every(answer);}
  for(const s of value.sessions){
    if(!exact(s,['id','mode','endedAt','codes','answers','score','seconds'])||!uuid(s.id)||sessionIds.has(s.id)||!['mock','diagnostic'].includes(s.mode)||!date(s.endedAt)||!codesValid(s)||!Number.isInteger(s.seconds)||s.seconds<0||s.seconds>86400||s.score!==scoreSession(s).score)throw new Error('시험 기록이 올바르지 않습니다.');sessionIds.add(s.id);
  }
  if(value.active!==null){const s=value.active;if(!exact(s,['id','mode','startedAt','deadline','codes','answers','flagged','index'])||!uuid(s.id)||sessionIds.has(s.id)||!['mock','diagnostic'].includes(s.mode)||!date(s.startedAt)||!codesValid(s)||!Number.isInteger(s.index)||s.index<0||s.index>=20||!Array.isArray(s.flagged)||s.flagged.length>20||new Set(s.flagged).size!==s.flagged.length||s.flagged.some(n=>!Number.isInteger(n)||n<0||n>=20)||(s.mode==='mock'?(s.deadline!==Date.parse(s.startedAt)+9000000):s.deadline!==null))throw new Error('진행 중 시험 기록이 올바르지 않습니다.');}
  return value;
}
export function parseState(raw){if(raw===null)return emptyState();if(typeof raw!=='string'||raw.length>MAX_SIZE)throw new Error('기록 파일 크기 제한을 초과했습니다.');return validateState(JSON.parse(raw));}
export function createStore(storage) {
  let state=emptyState(),available=true,error='';
  try{state=parseState(storage.getItem(KEY));}catch(e){available=false;error='기록을 읽지 못했습니다. 원본은 변경하지 않았습니다.';}
  function persist(next,replace=false){
    validateState(next);const raw=JSON.stringify(next);if(raw.length>MAX_SIZE)throw new Error('저장할 기록이 너무 큽니다.');
    state=next;
    if(!available&&!replace){error='이번 기록은 화면에만 유지됩니다. 저장을 복구하려면 백업 복원 또는 기록 삭제를 사용하세요.';return false;}
    try{storage.setItem(KEY,raw);if(storage.getItem(KEY)!==raw)throw new Error('write verification');available=true;error='';return true;}
    catch(e){available=false;error='브라우저에 저장하지 못했습니다. 이번 기록은 화면에만 유지됩니다.';return false;}
  }
  function mutate(update){let current=state;if(available)try{current=parseState(storage.getItem(KEY));}catch(e){available=false;error='기록이 변경되었거나 손상되어 덮어쓰지 않았습니다.';}const next=structuredClone(current);update(next);return persist(next);}
  return {
    get state(){return state;},get available(){return available;},get error(){return error;},
    append(a){return mutate(s=>{if(!s.attempts.some(item=>item.id===a.id))s.attempts.push(a);s.attempts=s.attempts.slice(-MAX_ATTEMPTS);});},
    classify(id,cause){if(!CAUSES.includes(cause))throw new TypeError('Invalid cause');return mutate(s=>{const a=s.attempts.find(a=>a.id===id);if(a)a.cause=cause;});},
    bookmark(code){if(!getQuestion(code))throw new TypeError('Invalid code');return mutate(s=>{s.bookmarks=s.bookmarks.includes(code)?s.bookmarks.filter(c=>c!==code):[...s.bookmarks,code].slice(-128);});},
    settings(values){return mutate(s=>{s.settings={...s.settings,...values};});},
    active(session){return mutate(s=>{s.active=session;});},
    finish(summary,attempts){return mutate(s=>{if(s.sessions.some(item=>item.id===summary.id)){s.active=null;return;}s.sessions=[...s.sessions,summary].slice(-20);s.attempts=[...s.attempts,...attempts].slice(-MAX_ATTEMPTS);s.active=null;});},
    export(){return JSON.stringify(state,null,2);},
    restore(raw){const next=parseState(raw);return persist(structuredClone(next),true);},
    clear(){try{storage.removeItem(KEY);if(storage.getItem(KEY)!==null)throw new Error('delete verification');state=emptyState();available=true;error='';return true;}catch{error='기록을 삭제하지 못했습니다. 브라우저 저장 설정을 확인하세요.';return false;}},
    refresh(){if(!available)return false;try{state=parseState(storage.getItem(KEY));error='';return true;}catch{available=false;error='변경된 기록을 읽지 못했습니다. 원본을 보존했습니다.';return false;}},
  };
}
