import {createStore,KEY,parseBackup} from '../store.js';
import {APP,uuid,same,bounded,envelope,merge,importGuest} from './sync.js';
import {publicError} from './neon.js';
export const accountKey=id=>`engineer-practice-account-v1:${id}`;
export function createCloudSession({storage,user,transport,onChange=()=>{},schedule=true}){
  if(!uuid(user?.id)||!user.emailVerified)throw new TypeError('인증된 계정이 필요합니다.');
  const key=accountKey(user.id);let box=null,baseline=null,rawBackup=null,busy=false,closed=false,blocked='',error='',work=null,timer,lastSynced=0,needsLogin=false;
  const emit=(changed=false)=>{if(!closed)onChange(changed);};
  function validBox(b){if(b?.version!==1||b.appId!==APP||b.userId!==user.id)throw new Error('INVALID_BOX');envelope(b.base,user.id);bounded(b.local);if(b.pending){const p=b.pending;if(!['push','reset'].includes(p.kind)||p.request?.appId!==APP||p.request?.userId!==user.id||!uuid(p.request?.operationId)||!uuid(p.request?.epoch)||!Number.isSafeInteger(p.request?.baseRevision))throw new Error('INVALID_PENDING');if(p.kind==='push')bounded(p.request.state);}if(b.remote)envelope(b.remote,user.id);return b;}
  function persist(next,replace=false){
    try{validBox(next);const raw=JSON.stringify(next);if(raw.length>MAX_BOX)throw new Error('QUOTA');if(!replace&&storage.getItem(key)!==baseline)throw new Error('CHANGED');storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw new Error('UNCERTAIN');baseline=raw;rawBackup=raw;box=next;return true;}
    catch{blocked='storage';error='기기에 안전하게 저장하지 못했습니다. 현재 화면과 저장 원본을 백업한 뒤 계정 기록으로 다시 연결해 주세요.';emit();return false;}
  }
  const fresh=cloud=>({version:1,appId:APP,userId:user.id,base:cloud,local:structuredClone(cloud.state),pending:null,remote:null});
  async function identity(){const current=await transport.session();if(closed)return false;if(!current?.emailVerified||current.id!==user.id){needsLogin=true;blocked='identity';throw{code:'AUTH_REQUIRED'};}return true;}
  function later(delay=700){if(!schedule||closed||blocked||needsLogin)return;clearTimeout(timer);timer=setTimeout(()=>void api.flush(),delay);}
  function accept(cloud,base=box.base.state){
    if(cloud.epoch!==box.base.epoch){persist({...box,remote:cloud});blocked='epoch';error='다른 기기에서 정보처리기사 기록을 초기화했습니다. 이 기기 기록은 보존했습니다.';return false;}
    const result=merge(base,box.local,cloud.state);
    if(result.conflicts.length){persist({...box,pending:null,remote:cloud});blocked='conflict';error='두 기기의 변경을 함께 적용할 수 없습니다. 계정 화면에서 확인해 주세요.';return false;}
    return persist({...box,base:cloud,local:result.state,pending:null,remote:null});
  }
  async function execute(pull){
    if(closed||blocked||!box)return;busy=true;error='';emit();
    try{
      for(let n=0;n<8&&!closed&&!blocked;n++){
        if(!await identity())return;
        if(!box.pending){if(same(box.local,box.base.state))break;
          const request={appId:APP,userId:user.id,epoch:box.base.epoch,baseRevision:box.base.revision,operationId:crypto.randomUUID(),state:structuredClone(box.local)};
          if(!persist({...box,pending:{kind:'push',request}}))return;
        }
        const pending=box.pending,response=await transport.rpc(`engineer_${pending.kind}`,pending.request);if(closed||blocked)return;
        const before=box.local;
        const cloud=envelope(response.cloud,user.id);if(!['ok','conflict','epoch'].includes(response.status))throw new Error('INVALID_RESPONSE');
        if(pending.kind==='reset'){
          if(response.status==='ok'){if(!persist(fresh(cloud)))return;}
          else{persist({...box,remote:cloud});blocked='epoch';error='계정 기록이 바뀌어 초기화를 적용하지 않았습니다. 백업 후 다시 연결해 주세요.';}
        }else if(!accept(cloud,response.status==='ok'?pending.request.state:box.base.state))return;
        lastSynced=Date.now();emit(!same(before,box.local));
      }
      if(pull&&!closed&&!blocked&&!box.pending){if(!await identity())return;const cloud=envelope(await transport.rpc('engineer_pull',{appId:APP,userId:user.id}),user.id);if(closed||blocked)return;const prior=box.local;if(accept(cloud)){lastSynced=Date.now();emit(!same(prior,box.local));}}
    }catch(e){error=publicError(e);if(['AUTH_REQUIRED','28000'].includes(e?.code)||e?.status===401||e?.status===403){needsLogin=true;blocked='identity';}else if(['22023','23514','42501'].includes(e?.code))blocked='invalid';}
    finally{busy=false;emit();if(api.pendingCount&&!blocked)later(error?15000:700);}
  }
  const api={user,key,
    get state(){return box?.local??null;},get available(){return !!box&&!closed&&!blocked&&!needsLogin&&box.pending?.kind!=='reset';},get error(){return error;},get busy(){return busy;},get blocked(){return blocked;},get needsLogin(){return needsLogin;},get lastSynced(){return lastSynced;},
    get pendingCount(){return box&&(box.pending||!same(box.local,box.base.state))?1:0;},get conflicts(){return box?.remote?merge(box.base.state,box.local,box.remote.state).conflicts:[];},
    get remote(){return box?.remote?.state??null;},
    export(){return JSON.stringify(box?.local,null,2);},pendingBackup(){return JSON.stringify({memory:box,stored:rawBackup},null,2);},
    async start(){
      try{baseline=storage.getItem(key);rawBackup=baseline;if(baseline){if(baseline.length>MAX_BOX)throw new Error('SIZE');box=validBox(JSON.parse(baseline));if(box.remote){blocked=box.remote.epoch!==box.base.epoch?'epoch':'conflict';error='전송을 멈춘 기록이 있습니다. 백업 후 계정 화면에서 확인해 주세요.';}}}
      catch{blocked='storage';error='기기의 계정 기록을 읽지 못했습니다. 원본을 보존했습니다.';emit(true);return;}
      if(box){emit(true);await api.flush({pull:true});return;}
      busy=true;emit();try{if(!await identity())return;const cloud=envelope(await transport.rpc('engineer_pull',{appId:APP,userId:user.id}),user.id);if(closed)return;if(persist(fresh(cloud)))lastSynced=Date.now();}
      catch(e){error=publicError(e);if(e?.code==='AUTH_REQUIRED')needsLogin=true;}finally{busy=false;emit(true);}
    },
    change(next){if(!api.available){error=error||'계정 기록을 먼저 연결해 주세요.';emit();return false;}bounded(next);const ok=persist({...box,local:structuredClone(next)});if(ok){emit();later();}return ok;},
    flush({pull=false}={}){if(work)return work;clearTimeout(timer);work=execute(pull).finally(()=>{work=null;});return work;},
    importState(guest){return api.change(importGuest(box.local,guest));},
    restore(raw){return api.change(parseBackup(raw));},
    async resolve(choice){if(blocked!=='conflict'||!['local','remote'].includes(choice))return;const result=merge(box.base.state,box.local,box.remote.state,choice);if(!result.state)throw new Error('제출된 시험이나 저장 한도 충돌은 두 기록을 백업한 뒤 최신 계정 기록으로 다시 연결해 주세요.');if(persist({...box,base:box.remote,local:result.state,pending:null,remote:null})){blocked='';error='';emit(true);await api.flush();}},
    async recover(){if(closed||busy)return;busy=true;emit();try{if(!await identity())return;const cloud=envelope(await transport.rpc('engineer_pull',{appId:APP,userId:user.id}),user.id);if(closed)return;if(persist(fresh(cloud),true)){blocked='';error='';needsLogin=false;lastSynced=Date.now();emit(true);}}catch(e){error=publicError(e);}finally{busy=false;emit();}},
    async clear(){if(!api.available||busy)return false;const confirmed=structuredClone(box.local);await api.flush({pull:true});if(closed||blocked||api.pendingCount)return false;if(!same(confirmed,box.local)){error='확인 이후 계정 기록이 바뀌었습니다. 최신 기록을 확인한 뒤 초기화를 다시 선택해 주세요.';emit(true);return false;}const request={appId:APP,userId:user.id,epoch:box.base.epoch,baseRevision:box.base.revision,operationId:crypto.randomUUID()};if(!persist({...box,pending:{kind:'reset',request}}))return false;await api.flush();return !blocked&&!box.pending;},
    storageChanged(){blocked='storage';error='다른 탭에서 이 계정 기록을 변경했습니다. 현재 기록을 백업한 뒤 새로고침해 주세요.';clearTimeout(timer);emit();},
    stop(){closed=true;clearTimeout(timer);}
  };
  // Reuse the established version-1 domain mutations in an isolated memory adapter.
  for(const method of ['append','classify','bookmark','settings','active','finish'])api[method]=(...args)=>{
    if(!api.available){emit();return false;}let raw=JSON.stringify(box.local);const local=createStore({getItem:k=>k===KEY?raw:null,setItem:(k,v)=>{if(k===KEY)raw=v;},removeItem:()=>{}});local[method](...args);return api.change(local.state);
  };
  return api;
}
const MAX_BOX=8*1048576;
