import {emptyState,validateState,MAX_SIZE} from '../store.js';
export const APP='engineer-practice';
export const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const canonical=v=>v===undefined?'undefined':JSON.stringify(v&&typeof v==='object'?(Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))]))):v);
export const same=(a,b)=>canonical(a)===canonical(b);
export function bounded(state){validateState(state);if(JSON.stringify(state).length>MAX_SIZE)throw new Error('합친 기록이 저장 한도를 넘습니다. 양쪽 기록을 백업한 뒤 정리해 주세요.');return state;}
export function envelope(value,userId){
  if(!value||value.appId!==APP||value.userId!==userId||!uuid(userId)||!uuid(value.epoch)||!Number.isSafeInteger(value.revision)||value.revision<0||!Number.isFinite(value.serverNow))throw new Error('계정 응답의 소유자나 형식이 다릅니다.');
  bounded(value.state);return structuredClone(value);
}
// Three-way comparison uses acknowledged values, never device clocks.
export function merge(base,local,remote,choice=null){
  const conflicts=[];
  function pick(b,l,r,path){if(same(l,r)||same(b,r))return l;if(same(b,l))return r;conflicts.push(path);return choice==='remote'?r:l;}
  function records(key){const maps=[base,local,remote].map(s=>new Map(s[key].map(x=>[x.id,x]))),ids=new Set(maps.flatMap(m=>[...m.keys()]));
    return [...ids].sort().map(id=>{const[b,l,r]=maps.map(m=>m.get(id));if(key==='attempts'&&l&&r&&same({...l,cause:''},{...r,cause:''}))return{...l,cause:pick(b?.cause,l.cause,r.cause,'오답 분류')};return pick(b,l,r,key==='attempts'?'같은 풀이의 내용':'완료 시험');}).filter(Boolean);
  }
  const state={version:1,settings:Object.fromEntries(Object.keys(base.settings).map(k=>[k,pick(base.settings[k],local.settings[k],remote.settings[k],'학습 설정')])),attempts:records('attempts'),sessions:records('sessions'),bookmarks:[],active:pick(base.active,local.active,remote.active,'진행 중 시험')};
  for(const code of new Set([...base.bookmarks,...local.bookmarks,...remote.bookmarks]))if(pick(base.bookmarks.includes(code),local.bookmarks.includes(code),remote.bookmarks.includes(code),'문제 표시'))state.bookmarks.push(code);
  // A completed result must not be silently turned back into an active draft.
  if(state.active&&state.sessions.some(s=>s.id===state.active.id)){conflicts.push('제출된 시험의 다른 답안');return{state:null,conflicts:[...new Set(conflicts)]};}
  // Keep each side's order; IDs resolve equal timestamps deterministically.
  state.attempts.sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id));state.sessions.sort((a,b)=>a.endedAt.localeCompare(b.endedAt)||a.id.localeCompare(b.id));
  try{bounded(state);}catch{conflicts.push('저장 한도 또는 기록 형식');return{state:null,conflicts:[...new Set(conflicts)]};}
  return{state,conflicts:[...new Set(conflicts)]};
}
export function importGuest(account,guest){
  bounded(guest);const incoming={...structuredClone(guest),settings:structuredClone(account.settings),active:structuredClone(account.active),bookmarks:[...new Set([...account.bookmarks,...guest.bookmarks])]};
  const base=emptyState();base.settings=structuredClone(account.settings);base.active=structuredClone(account.active);
  const result=merge(base,account,incoming);if(!result.state||result.conflicts.length)throw new Error('같은 ID의 기록이 다르거나 합친 기록이 한도를 넘습니다. 두 백업을 보관해 주세요.');return result.state;
}
